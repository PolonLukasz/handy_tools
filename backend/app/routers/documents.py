from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.config import settings
from app.dependencies import get_document_service
from app.schemas.documents import DocumentResponse, DocumentsConfigResponse
from app.services.documents import (
    DocumentNotFoundError,
    DocumentService,
    DuplicateDocumentError,
    FileTooLargeError,
    InvalidExtensionError,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    service: DocumentService = Depends(get_document_service),
) -> list[DocumentResponse]:
    documents = await service.list_all()
    return [DocumentResponse.model_validate(d) for d in documents]


@router.get("/config", response_model=DocumentsConfigResponse)
async def get_documents_config() -> DocumentsConfigResponse:
    return DocumentsConfigResponse(
        allowed_extensions=sorted(settings.allowed_extensions_set),
        max_upload_mb=settings.max_upload_mb,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    try:
        document = await service.get(document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return DocumentResponse.model_validate(document)


@router.post(
    "/",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile,
    service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    try:
        document = await service.save(file)
    except InvalidExtensionError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except DuplicateDocumentError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except FileTooLargeError as exc:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, str(exc)) from exc
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    service: DocumentService = Depends(get_document_service),
) -> None:
    try:
        await service.delete(document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
