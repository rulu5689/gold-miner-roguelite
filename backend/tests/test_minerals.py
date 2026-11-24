from fastapi.testclient import TestClient

from app.main import app
from app.services.content import load_minerals

client = TestClient(app)


def test_minerals_file_is_valid():
    ids = {m.id for m in load_minerals()}
    assert {"gold_small", "gold_medium", "gold_large", "rock_small", "rock_large", "diamond", "mystery_bag"} <= ids


def test_get_minerals_endpoint():
    response = client.get("/config/minerals")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == len(load_minerals())
    bag = next(m for m in body if m["id"] == "mystery_bag")
    assert bag["value_max"] >= bag["value"]
