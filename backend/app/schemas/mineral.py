from typing import Literal

from pydantic import BaseModel, Field, model_validator

MineralCategory = Literal["gold", "gem", "chest", "rock", "explosive"]
#: "small" items can share a throw with Double Hook; small gold is magnetic. "huge" needs Heavy Duty (by weight).
MineralSize = Literal["small", "medium", "large", "huge"]


class Mineral(BaseModel):
    """A grabbable object type. `value_max` set means the value is random in [value, value_max]."""

    id: str
    name: str
    category: MineralCategory
    size: MineralSize
    shape: Literal["circle", "diamond", "ruby", "chest", "barrel"]
    radius: float = Field(gt=0)
    weight: float = Field(gt=0)
    value: int = Field(ge=0)
    value_max: int | None = None
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    spawn_weight: float = Field(gt=0)
    min_level: int = Field(ge=1)
    #: Explosives only: rocks within this distance of the barrel are destroyed.
    explosion_radius: float | None = Field(default=None, gt=0)
    #: Collecting this item raises the run's critical-hit chance by this much.
    crit_bonus: float = Field(default=0, ge=0, le=1)

    @model_validator(mode="after")
    def check_fields(self) -> "Mineral":
        if self.value_max is not None and self.value_max < self.value:
            raise ValueError("value_max must be >= value")
        if (self.category == "explosive") != (self.explosion_radius is not None):
            raise ValueError("explosion_radius is required for explosives and only for explosives")
        return self
