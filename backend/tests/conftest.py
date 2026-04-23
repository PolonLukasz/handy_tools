from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
import pytest_asyncio
from fastapi import Depends
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings
from app.database import Base, get_session
from app.dependencies import get_document_service
from app.main import app
from app.services.documents import DocumentService


@pytest_asyncio.fixture
async def async_engine(tmp_path_factory):
    db_file = tmp_path_factory.mktemp("db") / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
def storage_dir(tmp_path: Path) -> Path:
    d = tmp_path / "storage"
    d.mkdir()
    return d


@pytest_asyncio.fixture
async def client(async_engine, storage_dir: Path) -> AsyncGenerator[AsyncClient, None]:
    TestSessionLocal = async_sessionmaker(
        async_engine, expire_on_commit=False, class_=AsyncSession
    )

    async def _test_session() -> AsyncGenerator[AsyncSession, None]:
        async with TestSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def _test_service(
        session: AsyncSession = Depends(_test_session),
    ) -> DocumentService:
        return DocumentService(
            session=session,
            storage_dir=storage_dir,
            allowed_extensions=settings.allowed_extensions_set,
            max_size_bytes=settings.max_upload_bytes,
        )

    app.dependency_overrides[get_session] = _test_session
    app.dependency_overrides[get_document_service] = _test_service

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
