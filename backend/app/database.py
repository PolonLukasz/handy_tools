from contextlib import asynccontextmanager

from psycopg_pool import AsyncConnectionPool

from app.config import settings

pool: AsyncConnectionPool | None = None


@asynccontextmanager
async def lifespan(_app):
    global pool
    pool = AsyncConnectionPool(conninfo=settings.database_url, open=False)
    await pool.open()
    yield
    await pool.close()
