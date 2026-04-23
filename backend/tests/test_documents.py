from io import BytesIO
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.config import settings


def _file_payload(filename: str, content: bytes = b"dummy data") -> dict:
    return {"file": (filename, BytesIO(content), "application/octet-stream")}


async def test_upload_and_list(client: AsyncClient, storage_dir: Path) -> None:
    response = await client.post(
        "/api/v1/documents/", files=_file_payload("report.pdf", b"hello pdf")
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "report"
    assert body["extension"] == ".pdf"
    assert body["size_mb"] == pytest.approx(9 / 1_000_000)
    assert (storage_dir / "report.pdf").read_bytes() == b"hello pdf"

    listing = await client.get("/api/v1/documents/")
    assert listing.status_code == 200
    payload = listing.json()
    assert len(payload) == 1
    assert payload[0]["id"] == body["id"]


async def test_get_by_id(client: AsyncClient) -> None:
    created = (
        await client.post("/api/v1/documents/", files=_file_payload("note.txt", b"hi"))
    ).json()
    response = await client.get(f"/api/v1/documents/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


async def test_upload_invalid_extension(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/documents/", files=_file_payload("malware.exe")
    )
    assert response.status_code == 400


async def test_upload_duplicate(client: AsyncClient) -> None:
    first = await client.post(
        "/api/v1/documents/", files=_file_payload("same.pdf", b"a")
    )
    assert first.status_code == 201
    second = await client.post(
        "/api/v1/documents/", files=_file_payload("same.pdf", b"b")
    )
    assert second.status_code == 409


async def test_upload_too_large(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "max_upload_mb", 0.00001)  # 10 bytes
    response = await client.post(
        "/api/v1/documents/",
        files=_file_payload("big.pdf", b"this is more than ten bytes"),
    )
    assert response.status_code == 413


async def test_delete_removes_file_and_row(client: AsyncClient) -> None:
    created = (
        await client.post(
            "/api/v1/documents/", files=_file_payload("gone.pdf", b"data")
        )
    ).json()
    file_path = Path(created["path"])
    assert file_path.exists()

    response = await client.delete(f"/api/v1/documents/{created['id']}")
    assert response.status_code == 204
    assert not file_path.exists()

    missing = await client.get(f"/api/v1/documents/{created['id']}")
    assert missing.status_code == 404


async def test_delete_not_found(client: AsyncClient) -> None:
    response = await client.delete("/api/v1/documents/9999")
    assert response.status_code == 404
