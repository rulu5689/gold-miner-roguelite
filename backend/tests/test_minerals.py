from fastapi.testclient import TestClient

from app.main import app
from app.services.content import load_minerals

client = TestClient(app)


def test_minerals_file_is_valid():
    by_id = {m.id: m for m in load_minerals()}
    assert by_id["gold_large"].value == 400
    assert by_id["diamond"].value == 800
    assert by_id["tnt_barrel"].category == "explosive"
    assert by_id["gold_chest"].value_max is not None
    assert "mystery_bag" not in by_id
    assert by_id["ruby"].crit_bonus == 0.05
    assert by_id["gold_giant"].weight > 10 and by_id["boulder"].weight > 10


def test_get_minerals_endpoint():
    response = client.get("/config/minerals")
    assert response.status_code == 200
    assert len(response.json()) == len(load_minerals())
