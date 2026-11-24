from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Mineral(BaseModel):
    """A grabbable object type. `value_max` set means the value is random in [value, value_max]."""

    id: str
    name: str
    shape: Literal["circle", "diamond", "bag"]
    radius: float = Field(gt=0)
    weight: float = Field(gt=0)
    value: int = Field(ge=0)
    value_max: int | None = None
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    spawn_weight: float = Field(gt=0)
    min_level: int = Field(ge=1)

    @model_validator(mode="after")
    def check_value_range(self) -> "Mineral":
        if self.value_max is not None and self.value_max < self.value:
            raise ValueError("value_max must be >= value")
        return self
