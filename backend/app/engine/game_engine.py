"""Run rules: collecting items, crits, explosions, levels and upgrades. Pure, no FastAPI.

Functions take the current RunState and mutate it in place.
"""

import math
from collections.abc import Mapping, Sequence

from app.core.rng import make_rng
from app.engine.difficulty_engine import LEVEL_DURATION_SECONDS, target_for_level
from app.engine.level_engine import generate_level
from app.engine.upgrade_engine import hook_modifiers, offer_upgrades
from app.schemas.mineral import Mineral
from app.schemas.run import FieldItem, RunState
from app.schemas.upgrade import Upgrade


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


def collect_item(run: RunState, item_id: int, minerals: Mapping[str, Mineral]) -> tuple[int, bool]:
    """The hook brought an item back to the miner. Returns (money earned, was it a critical hit)."""
    item = _find_item(run, item_id)
    mineral = minerals[item.mineral_id]
    if mineral.category == "explosive":
        raise GameRuleError("Explosives cannot be collected")
    if item.weight > run.hook.max_lift_weight:
        raise GameRuleError("Item is too heavy to lift")
    run.items.remove(item)

    critical = make_rng(run.seed, run.level, "crit", item.id).random() < run.crit_chance
    value = item.value * 2 if critical else item.value
    run.money += value
    run.crit_chance = min(1.0, run.crit_chance + mineral.crit_bonus)
    return value, critical


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


def finish_level(run: RunState, minerals: Sequence[Mineral], upgrades: Sequence[Upgrade]) -> bool:
    """Time is up. If the target was reached, prepare the next level and offer upgrades; else end the run."""
    _require_playing(run)
    passed = run.money >= run.target
    if passed:
        run.level += 1
        run.target = target_for_level(run.level)
        run.items = generate_level(run.seed, run.level, minerals)
        run.upgrade_choices = offer_upgrades(run.seed, run.level, run.upgrades, upgrades)
        run.status = "choosing_upgrade" if run.upgrade_choices else "playing"
    else:
        run.status = "game_over"
        run.items = []
    return passed


def choose_upgrade(run: RunState, upgrade_id: str, upgrades_by_id: Mapping[str, Upgrade]) -> None:
    if run.status != "choosing_upgrade":
        raise GameRuleError("No upgrade to choose right now")
    if upgrade_id not in {u.id for u in run.upgrade_choices}:
        raise GameRuleError(f"Upgrade {upgrade_id} was not offered")
    run.upgrades[upgrade_id] = run.upgrades.get(upgrade_id, 0) + 1
    run.hook = hook_modifiers(run.upgrades, upgrades_by_id)
    run.upgrade_choices = []
    run.status = "playing"


def _require_playing(run: RunState) -> None:
    if run.status != "playing":
        raise GameRuleError(f"Run is not in play (status: {run.status})")


def _find_item(run: RunState, item_id: int) -> FieldItem:
    _require_playing(run)
    for item in run.items:
        if item.id == item_id:
            return item
    raise GameRuleError(f"Item {item_id} is not on the field")
