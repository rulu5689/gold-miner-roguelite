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
    assert res.json()["value"] == treasure["value"] and res.json()["critical"] is False

    again = client.post(f"/game/runs/{run['run_id']}/collect", json={"item_id": treasure["id"]})
    assert again.status_code == 400

    result = client.post(f"/game/runs/{run['run_id']}/finish-level").json()
    assert result["passed"] is (treasure["value"] >= 650)


def test_unknown_run_returns_404():
    assert client.get("/game/runs/nope").status_code == 404
    assert client.post("/game/runs/nope/collect", json={"item_id": 0}).status_code == 404


def test_create_run_without_body():
    assert client.post("/game/runs").status_code == 201


def test_upgrade_flow():
    run = client.post("/game/runs", json={"seed": 5}).json()
    rid = run["run_id"]
    for it in run["items"]:
        client.post(f"/game/runs/{rid}/collect", json={"item_id": it["id"]})
    result = client.post(f"/game/runs/{rid}/finish-level").json()
    assert result["passed"] is True
    assert result["run"]["status"] == "choosing_upgrade"
    choice = result["run"]["upgrade_choices"][0]["id"]

    after = client.post(f"/game/runs/{rid}/upgrades", json={"upgrade_id": choice}).json()
    assert after["status"] == "playing" and after["upgrades"] == {choice: 1} and after["upgrade_choices"] == []
    assert client.post(f"/game/runs/{rid}/upgrades", json={"upgrade_id": choice}).status_code == 400


def test_get_upgrades_endpoint():
    assert {u["id"] for u in client.get("/config/upgrades").json()} == {
        "quick_reel", "magnetic_hook", "heavy_duty", "double_hook", "precision"
    }
