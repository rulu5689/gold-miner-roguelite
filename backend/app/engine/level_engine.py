"""Seeded level generation. Pure functions, no FastAPI."""

import math
from collections.abc import Sequence
from dataclasses import dataclass
from random import Random

from app.core.rng import make_rng
from app.engine.difficulty_engine import item_count, level_quota
from app.schemas.mineral import Mineral
from app.schemas.run import FieldItem
from app.schemas.upgrade import HookModifiers

WORLD_WIDTH = 960
WORLD_HEIGHT = 540


@dataclass(frozen=True)
class FieldArea:
    left: float
    top: float
    right: float
    bottom: float


#: Underground area where items may be placed (below the miner).
FIELD_AREA = FieldArea(left=30, top=140, right=WORLD_WIDTH - 30, bottom=WORLD_HEIGHT - 20)

GAP = 6
PLACEMENT_TRIES = 60
#: Treasure on the field must be worth at least this multiple of the level quota.
VALUE_MARGIN = 2
FILLER_MINERAL = "gold_medium"
#: Items heavier than a hook without upgrades can lift don't count toward "winnable".
BASE_MAX_LIFT = HookModifiers().max_lift_weight


def generate_level(
    seed: int, level: int, minerals: Sequence[Mineral], area: FieldArea = FIELD_AREA
) -> list[FieldItem]:
    rng = make_rng(seed, level)
    pool = [m for m in minerals if m.min_level <= level]
    if not pool:
        return []

    items: list[FieldItem] = []
    for _ in range(item_count(level)):
        _place(items, _pick_weighted(pool, rng), rng, area)

    # Guarantee the level is winnable: add gold until enough value is on the field.
    filler = next((m for m in pool if m.id == FILLER_MINERAL), pool[0])
    needed = level_quota(level) * VALUE_MARGIN
    for _ in range(30):
        if sum(item.value for item in items if item.weight <= BASE_MAX_LIFT) >= needed:
            break
        _place(items, filler, rng, area)
    return items


def _pick_weighted(pool: Sequence[Mineral], rng: Random) -> Mineral:
    return rng.choices(pool, weights=[m.spawn_weight for m in pool], k=1)[0]


def _place(items: list[FieldItem], mineral: Mineral, rng: Random, area: FieldArea) -> None:
    r = mineral.radius
    for _ in range(PLACEMENT_TRIES):
        x = rng.uniform(area.left + r, area.right - r)
        y = rng.uniform(area.top + r, area.bottom - r)
        if all(math.hypot(o.x - x, o.y - y) >= o.radius + r + GAP for o in items):
            value = mineral.value if mineral.value_max is None else rng.randint(mineral.value, mineral.value_max)
            items.append(
                FieldItem(id=len(items), mineral_id=mineral.id, x=x, y=y, radius=r, weight=mineral.weight, value=value)
            )
            return
