from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.services.documents import DocumentService


def get_document_service(
    session: AsyncSession = Depends(get_session),
) -> DocumentService:
    return DocumentService(
        session=session,
        storage_dir=settings.stored_documents_path,
        allowed_extensions=settings.allowed_extensions_set,
        max_size_bytes=settings.max_upload_bytes,
    )
