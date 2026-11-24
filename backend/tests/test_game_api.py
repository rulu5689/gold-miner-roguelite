from fastapi.testclient import TestClient

from app.main import app
from app.services.content import minerals_by_id

client = TestClient(app)


def test_full_run_flow():
    run = client.post("/game/runs", json={"seed": 123}).json()
    assert run["level"] == 1 and run["money"] == 0 and run["target"] == 650 and run["items"]
    assert client.post("/game/runs", json={"seed": 123}).json()["items"] == run["items"]

    by_id = minerals_by_id()
    treasure = next(i for i in run["items"] if by_id[i["mineral_id"]].category != "explosive")
    res = client.post(f"/game/runs/{run['run_id']}/collect", json={"item_id": treasure["id"]})
    assert res.status_code == 200
    assert res.json() == {"value": treasure["value"], "money": treasure["value"]}

    again = client.post(f"/game/runs/{run['run_id']}/collect", json={"item_id": treasure["id"]})
    assert again.status_code == 400

    result = client.post(f"/game/runs/{run['run_id']}/finish-level").json()
    assert result["passed"] is (treasure["value"] >= 650)


def test_unknown_run_returns_404():
    assert client.get("/game/runs/nope").status_code == 404
    assert client.post("/game/runs/nope/collect", json={"item_id": 0}).status_code == 404


def test_create_run_without_body():
    assert client.post("/game/runs").status_code == 201
