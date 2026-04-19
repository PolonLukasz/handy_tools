from fastapi.testclient import TestClient


def test_hello_world(client: TestClient) -> None:
    response = client.get("/api/v1/hello/world")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}
