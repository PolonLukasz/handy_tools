import logging
import os
import tempfile
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

logger = logging.getLogger(__name__)

_CHUNK_SIZE = 1024 * 1024


class DocumentError(Exception):
    """Base class for document service errors."""


class DocumentNotFoundError(DocumentError):
    def __init__(self, document_id: int) -> None:
        super().__init__(f"Document {document_id} not found")
        self.document_id = document_id


class InvalidExtensionError(DocumentError):
    def __init__(self, extension: str, allowed: frozenset[str]) -> None:
        allowed_list = ", ".join(sorted(allowed))
        super().__init__(
            f"Extension '{extension}' is not allowed. Allowed: {allowed_list}"
        )
        self.extension = extension


class FileTooLargeError(DocumentError):
    def __init__(self, max_size_bytes: int) -> None:
        super().__init__(f"File exceeds maximum size of {max_size_bytes} bytes")
        self.max_size_bytes = max_size_bytes


class DuplicateDocumentError(DocumentError):
    def __init__(self, name: str, extension: str) -> None:
        super().__init__(f"Document '{name}{extension}' already exists")
        self.name = name
        self.extension = extension


@dataclass(frozen=True, slots=True)
class _ParsedFilename:
    name: str
    extension: str


class DocumentService:
    def __init__(
        self,
        session: AsyncSession,
        storage_dir: Path,
        allowed_extensions: frozenset[str],
        max_size_bytes: int,
    ) -> None:
        self._session = session
        self._storage_dir = storage_dir
        self._allowed_extensions = allowed_extensions
        self._max_size_bytes = max_size_bytes

    async def list_all(self) -> Sequence[Document]:
        result = await self._session.execute(
            select(Document).order_by(Document.created_at.desc())
        )
        return result.scalars().all()

    async def get(self, document_id: int) -> Document:
        document = await self._session.get(Document, document_id)
        if document is None:
            raise DocumentNotFoundError(document_id)
        return document

    async def save(self, upload: UploadFile) -> Document:
        parsed = self._parse_filename(upload.filename)
        await self._ensure_unique(parsed)

        self._storage_dir.mkdir(parents=True, exist_ok=True)
        destination = self._storage_dir / f"{parsed.name}{parsed.extension}"

        bytes_written = await self._stream_to_disk(upload, destination)

        size_mb = bytes_written / 1_000_000
        document = Document(
            name=parsed.name,
            extension=parsed.extension,
            created_at=datetime.now(timezone.utc),
            size_mb=size_mb,
            path=f"{self._storage_dir.as_posix()}/{parsed.name}{parsed.extension}",
        )
        self._session.add(document)
        try:
            await self._session.flush()
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        await self._session.refresh(document)
        return document

    async def delete(self, document_id: int) -> None:
        document = await self.get(document_id)
        file_path = Path(document.path)
        await self._session.delete(document)
        await self._session.flush()
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Failed to unlink file %s", file_path)
            raise

    def _parse_filename(self, filename: str | None) -> _ParsedFilename:
        if not filename:
            raise InvalidExtensionError("", self._allowed_extensions)
        path = Path(filename)
        extension = path.suffix.lower()
        if extension not in self._allowed_extensions:
            raise InvalidExtensionError(extension, self._allowed_extensions)
        name = path.stem
        if not name:
            raise InvalidExtensionError(extension, self._allowed_extensions)
        return _ParsedFilename(name=name, extension=extension)

    async def _ensure_unique(self, parsed: _ParsedFilename) -> None:
        existing = await self._session.execute(
            select(Document.id).where(
                Document.name == parsed.name,
                Document.extension == parsed.extension,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise DuplicateDocumentError(parsed.name, parsed.extension)

    async def _stream_to_disk(self, upload: UploadFile, destination: Path) -> int:
        tmp_fd, tmp_name = tempfile.mkstemp(
            dir=self._storage_dir, prefix=".upload-", suffix=".tmp"
        )
        tmp_path = Path(tmp_name)
        os.close(tmp_fd)

        bytes_written = 0
        try:
            async with aiofiles.open(tmp_path, "wb") as out:
                while chunk := await upload.read(_CHUNK_SIZE):
                    bytes_written += len(chunk)
                    if bytes_written > self._max_size_bytes:
                        raise FileTooLargeError(self._max_size_bytes)
                    await out.write(chunk)
            tmp_path.replace(destination)
        except BaseException:
            tmp_path.unlink(missing_ok=True)
            raise
        return bytes_written
