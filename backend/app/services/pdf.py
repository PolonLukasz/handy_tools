import io
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

import pypdf
import pypdf.errors


class PdfServiceError(Exception):
    """Raised when a PDF operation fails."""


@dataclass(frozen=True, slots=True)
class PdfFile:
    content: BinaryIO
    filename: str


@dataclass(frozen=True, slots=True)
class PdfFileList:
    files: list[PdfFile] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class PdfMetadata:
    title: str | None = None
    author: str | None = None
    subject: str | None = None
    creator: str | None = None
    producer: str | None = None
    keywords: str | None = None
    creation_date: str | None = None
    modification_date: str | None = None


_METADATA_MAP: list[tuple[str, str]] = [
    ("title", "/Title"),
    ("author", "/Author"),
    ("subject", "/Subject"),
    ("creator", "/Creator"),
    ("producer", "/Producer"),
    ("keywords", "/Keywords"),
    ("creation_date", "/CreationDate"),
    ("modification_date", "/ModDate"),
]


class PdfService:
    def split(
        self,
        file: BinaryIO,
        *,
        base_name: str | None = None,
    ) -> PdfFileList:
        """Split a PDF into individual single-page files.

        Returns a PdfFileList where each PdfFile holds one page as an
        in-memory buffer and a generated name of the form
        ``{stem}-page-{n:04d}.pdf``.
        """
        stem = base_name or self._stem_from(file)
        reader = self._read(file)
        results: list[PdfFile] = []
        for page_number, page in enumerate(reader.pages, start=1):
            writer = pypdf.PdfWriter()
            writer.add_page(page)
            buf = self._flush(writer)
            results.append(
                PdfFile(
                    content=buf,
                    filename=f"{stem}-page-{page_number:04d}.pdf",
                )
            )
        return PdfFileList(files=results)

    def merge(
        self,
        files: Sequence[BinaryIO],
        *,
        output_name: str | None = None,
    ) -> PdfFile:
        """Merge multiple PDF files into a single PDF.

        Pages are appended in the order the files are given. The output
        filename defaults to ``merged-{timestamp}.pdf``.
        """
        writer = pypdf.PdfWriter()
        for source_file in files:
            reader = self._read(source_file)
            for page in reader.pages:
                writer.add_page(page)
        filename = output_name or f"merged-{self._timestamp()}.pdf"
        return PdfFile(content=self._flush(writer), filename=filename)

    def encrypt(
        self,
        file: BinaryIO,
        password: str,
        *,
        output_name: str | None = None,
    ) -> PdfFile:
        """Encrypt a PDF with AES-256 using the given password.

        The output filename defaults to ``{stem}-encrypted.pdf``.
        """
        stem = self._stem_from(file)
        reader = self._read(file)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(user_password=password, algorithm="AES-256")
        filename = output_name or f"{stem}-encrypted.pdf"
        return PdfFile(content=self._flush(writer), filename=filename)

    def get_metadata(self, file: BinaryIO) -> PdfMetadata:
        """Read metadata fields from a PDF file.

        Returns a PdfMetadata instance; any field absent in the PDF is None.
        Date fields are returned as raw PDF date strings (e.g. ``D:20240101``).
        """
        reader = self._read(file)
        raw_meta = reader.metadata or {}
        kwargs: dict[str, str | None] = {}
        for attr, key in _METADATA_MAP:
            raw_value = raw_meta.get(key)
            kwargs[attr] = str(raw_value) if raw_value is not None else None
        return PdfMetadata(**kwargs)

    def replace_metadata(
        self,
        file: BinaryIO,
        metadata: PdfMetadata,
        *,
        output_name: str | None = None,
    ) -> PdfFile:
        """Replace the metadata of a PDF with the values in the given PdfMetadata.

        Only non-None fields are written; existing metadata keys not covered by
        PdfMetadata are preserved. The output filename defaults to
        ``{stem}-metadata.pdf``.
        """
        stem = self._stem_from(file)
        reader = self._read(file)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        new_meta: dict[str, str] = {}
        for attr, key in _METADATA_MAP:
            value = getattr(metadata, attr)
            if value is not None:
                new_meta[key] = value
        if new_meta:
            writer.add_metadata(new_meta)
        filename = output_name or f"{stem}-metadata.pdf"
        return PdfFile(content=self._flush(writer), filename=filename)

    def _read(self, file: BinaryIO) -> pypdf.PdfReader:
        """Open a binary stream as a PdfReader, wrapping parse errors."""
        try:
            return pypdf.PdfReader(file)
        except pypdf.errors.PdfReadError as exc:
            raise PdfServiceError(str(exc)) from exc

    def _flush(self, writer: pypdf.PdfWriter) -> io.BytesIO:
        """Write a PdfWriter's content to a rewound in-memory buffer."""
        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)
        return buf

    def _stem_from(self, file: BinaryIO, fallback: str = "document") -> str:
        """Return the filename stem of file, or fallback if unavailable."""
        name = getattr(file, "name", None)
        if name:
            return Path(name).stem
        return fallback

    def _timestamp(self) -> str:
        """Return current UTC time as a compact timestamp string."""
        return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
