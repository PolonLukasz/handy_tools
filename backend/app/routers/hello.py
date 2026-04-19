from fastapi import APIRouter

from app.schemas.hello import HelloWorldResponse

router = APIRouter(prefix="/hello", tags=["hello"])


@router.get("/world", response_model=HelloWorldResponse)
def hello_world() -> HelloWorldResponse:
    return HelloWorldResponse(message="Hello, World!")
