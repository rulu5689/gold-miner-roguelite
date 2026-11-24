"""Run rules: collecting items, explosions and finishing levels. Pure, no FastAPI.

Functions take the current RunState and mutate it in place.
"""

import math
from collections.abc import Mapping, Sequence

from app.engine.difficulty_engine import LEVEL_DURATION_SECONDS, target_for_level
from app.engine.level_engine import generate_level
from app.schemas.mineral import Mineral
from app.schemas.run import FieldItem, RunState


class GameRuleError(ValueError):
    """The requested action is not allowed by the game rules."""


def new_run(run_id: str, seed: int, minerals: Sequence[Mineral]) -> RunState:
    return RunState(
        run_id=run_id,
        seed=seed,
        level=1,
        money=0,
        target=target_for_level(1),
        time_limit=LEVEL_DURATION_SECONDS,
        status="playing",
        items=generate_level(seed, 1, minerals),
    )


def collect_item(run: RunState, item_id: int, minerals: Mapping[str, Mineral]) -> int:
    """The hook brought an item back to the miner. Returns the money earned."""
    item = _take_item(run, item_id)
    if minerals[item.mineral_id].category == "explosive":
        run.items.append(item)
        raise GameRuleError("Explosives cannot be collected")
    run.money += item.value
    return item.value


def explode(run: RunState, item_id: int, minerals: Mapping[str, Mineral]) -> list[int]:
    """The hook touched an explosive. Removes it and nearby rocks; returns destroyed rock ids."""
    barrel = _find_item(run, item_id)
    mineral = minerals[barrel.mineral_id]
    if mineral.category != "explosive" or mineral.explosion_radius is None:
        raise GameRuleError("Item is not an explosive")
    run.items.remove(barrel)

    destroyed = [
        item
        for item in run.items
        if minerals[item.mineral_id].category == "rock"
        and math.hypot(item.x - barrel.x, item.y - barrel.y) <= mineral.explosion_radius + item.radius
    ]
    run.items = [item for item in run.items if item not in destroyed]
    return [item.id for item in destroyed]


def finish_level(run: RunState, minerals: Sequence[Mineral]) -> bool:
    """Time is up. Advances to the next level if the target was reached, else ends the run."""
    _require_playing(run)
    passed = run.money >= run.target
    if passed:
        run.level += 1
        run.target = target_for_level(run.level)
        run.items = generate_level(run.seed, run.level, minerals)
    else:
        run.status = "game_over"
        run.items = []
    return passed


def _require_playing(run: RunState) -> None:
    if run.status != "playing":
        raise GameRuleError("Run is over")


def _find_item(run: RunState, item_id: int) -> FieldItem:
    _require_playing(run)
    for item in run.items:
        if item.id == item_id:
            return item
    raise GameRuleError(f"Item {item_id} is not on the field")


def _take_item(run: RunState, item_id: int) -> FieldItem:
    item = _find_item(run, item_id)
    run.items.remove(item)
    return item
