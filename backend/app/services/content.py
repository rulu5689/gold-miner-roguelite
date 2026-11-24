"""Loads data-driven game content (JSON files in app/data)."""

import json
from functools import lru_cache
from pathlib import Path

from pydantic import TypeAdapter

from app.schemas.mineral import Mineral
from app.schemas.upgrade import Upgrade

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(filename: str, model):
    raw = json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))
    entries = TypeAdapter(list[model]).validate_python(raw)
    ids = [e.id for e in entries]
    if len(ids) != len(set(ids)):
        raise ValueError(f"Duplicate ids in {filename}")
    return tuple(entries)


@lru_cache
def load_minerals() -> tuple[Mineral, ...]:
    return _load("minerals.json", Mineral)


@lru_cache
def load_upgrades() -> tuple[Upgrade, ...]:
    return _load("upgrades.json", Upgrade)


@lru_cache
def upgrades_by_id() -> dict[str, Upgrade]:
    return {u.id: u for u in load_upgrades()}


@lru_cache
def minerals_by_id() -> dict[str, Mineral]:
    return {m.id: m for m in load_minerals()}
