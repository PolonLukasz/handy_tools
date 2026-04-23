from fastapi import FastAPI

from app.config import settings
from app.database import lifespan
from app.routers import documents, hello

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.include_router(hello.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
