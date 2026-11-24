from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.upgrade import HookModifiers, Upgrade


class FieldItem(BaseModel):
    """A concrete object placed in a level. Coordinates are in world units (960 x 540)."""

    id: int
    mineral_id: str
    x: float
    y: float
    radius: float
    weight: float
    value: int


class RunState(BaseModel):
    """Full, serializable state of one run."""

    run_id: str
    seed: int
    level: int = Field(ge=1)
    money: int = Field(ge=0)
    target: int
    time_limit: int
    status: Literal["playing", "choosing_upgrade", "game_over"]
    items: list[FieldItem]
    #: Upgrade id -> number of stacks owned.
    upgrades: dict[str, int] = Field(default_factory=dict)
    #: Derived from `upgrades`; kept in the state so the frontend can use it directly.
    hook: HookModifiers = Field(default_factory=HookModifiers)
    #: Chance (0-1) that a collected item is worth double.
    crit_chance: float = 0
    #: Offered after passing a level, while status is "choosing_upgrade".
    upgrade_choices: list[Upgrade] = Field(default_factory=list)


class CreateRunRequest(BaseModel):
    seed: int | None = Field(default=None, ge=0)


class ItemRequest(BaseModel):
    item_id: int


class CollectResponse(BaseModel):
    value: int
    money: int
    critical: bool
    crit_chance: float


class ChooseUpgradeRequest(BaseModel):
    upgrade_id: str


class ExplodeResponse(BaseModel):
    destroyed_ids: list[int]


class LevelResult(BaseModel):
    passed: bool
    money: int
    target: int
    #: The run after the level: advanced to the next level if passed, game over otherwise.
    run: RunState
