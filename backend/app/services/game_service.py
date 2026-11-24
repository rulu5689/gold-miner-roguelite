"""Glue between the API, the game engine, content and storage."""

import secrets
import uuid

from app.engine import game_engine
from app.schemas.run import CollectResponse, ExplodeResponse, LevelResult, RunState
from app.services.content import load_minerals, load_upgrades, minerals_by_id, upgrades_by_id
from app.services.run_store import InMemoryRunStore

store = InMemoryRunStore()


def create_run(seed: int | None = None) -> RunState:
    run = game_engine.new_run(uuid.uuid4().hex, seed if seed is not None else secrets.randbelow(2**31), load_minerals())
    store.save(run)
    return run


def get_run(run_id: str) -> RunState:
    return store.get(run_id)


def collect(run_id: str, item_id: int) -> CollectResponse:
    run = store.get(run_id)
    value, critical = game_engine.collect_item(run, item_id, minerals_by_id())
    store.save(run)
    return CollectResponse(value=value, money=run.money, critical=critical, crit_chance=run.crit_chance)


def explode(run_id: str, item_id: int) -> ExplodeResponse:
    run = store.get(run_id)
    destroyed = game_engine.explode(run, item_id, minerals_by_id())
    store.save(run)
    return ExplodeResponse(destroyed_ids=destroyed)


def finish_level(run_id: str) -> LevelResult:
    run = store.get(run_id)
    money, target = run.money, run.target
    passed = game_engine.finish_level(run, load_minerals(), load_upgrades())
    store.save(run)
    return LevelResult(passed=passed, money=money, target=target, run=run)


def choose_upgrade(run_id: str, upgrade_id: str) -> RunState:
    run = store.get(run_id)
    game_engine.choose_upgrade(run, upgrade_id, upgrades_by_id())
    store.save(run)
    return run
