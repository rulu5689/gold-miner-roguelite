from typing import Literal

from pydantic import BaseModel, Field


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
    status: Literal["playing", "game_over"]
    items: list[FieldItem]


class CreateRunRequest(BaseModel):
    seed: int | None = Field(default=None, ge=0)


class ItemRequest(BaseModel):
    item_id: int


class CollectResponse(BaseModel):
    value: int
    money: int


class ExplodeResponse(BaseModel):
    destroyed_ids: list[int]


class LevelResult(BaseModel):
    passed: bool
    money: int
    target: int
    #: The run after the level: advanced to the next level if passed, game over otherwise.
    run: RunState
