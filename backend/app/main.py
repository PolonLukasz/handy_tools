from fastapi import FastAPI

from app.config import settings
from app.routers import hello

app = FastAPI(title=settings.app_name)

app.include_router(hello.router, prefix="/api/v1")
