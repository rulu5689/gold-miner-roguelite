"""Upgrade rules: which upgrades are offered, and what owned upgrades do. Pure, no FastAPI."""

from collections.abc import Mapping, Sequence

from app.core.rng import make_rng
from app.schemas.upgrade import HookModifiers, Upgrade

CHOICES_PER_LEVEL = 3


def offer_upgrades(seed: int, level: int, owned: Mapping[str, int], upgrades: Sequence[Upgrade]) -> list[Upgrade]:
    """Pick up to 3 distinct upgrades that are not maxed out. Deterministic per (seed, level)."""
    available = [u for u in upgrades if owned.get(u.id, 0) < u.max_stacks]
    rng = make_rng(seed, "upgrades", level)
    return rng.sample(available, k=min(CHOICES_PER_LEVEL, len(available)))


def hook_modifiers(owned: Mapping[str, int], upgrades_by_id: Mapping[str, Upgrade]) -> HookModifiers:
    mods = HookModifiers()
    for upgrade_id, stacks in owned.items():
        effects = upgrades_by_id[upgrade_id].effects
        for field in type(effects).model_fields:
            setattr(mods, field, getattr(mods, field) + getattr(effects, field) * stacks)
    return mods
