from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    name: str
    extension: str
    created_at: datetime
    size_mb: float
    path: str

    model_config = ConfigDict(from_attributes=True)
