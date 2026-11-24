"""Loads data-driven game content (JSON files in app/data)."""

import json
from functools import lru_cache
from pathlib import Path

from pydantic import TypeAdapter

from app.schemas.mineral import Mineral

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache
def load_minerals() -> tuple[Mineral, ...]:
    raw = json.loads((DATA_DIR / "minerals.json").read_text(encoding="utf-8"))
    minerals = TypeAdapter(list[Mineral]).validate_python(raw)
    ids = [m.id for m in minerals]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate mineral ids in minerals.json")
    return tuple(minerals)


@lru_cache
def minerals_by_id() -> dict[str, Mineral]:
    return {m.id: m for m in load_minerals()}
