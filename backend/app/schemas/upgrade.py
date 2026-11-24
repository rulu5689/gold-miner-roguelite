from pydantic import BaseModel, Field


class UpgradeEffects(BaseModel):
    """Per-stack effects. Each value is added once per stack of the upgrade."""

    reel_speed_mult: float = 0
    shoot_speed_mult: float = 0
    grab_radius: float = 0
    magnet_radius: float = 0
    capacity: int = 0
    max_lift_weight: float = 0
    strength: float = 0


class Upgrade(BaseModel):
    id: str
    name: str
    description: str
    max_stacks: int = Field(ge=1)
    effects: UpgradeEffects


class HookModifiers(BaseModel):
    """How the run's upgrades change the hook. The frontend applies these to its base hook numbers."""

    reel_speed_mult: float = 1.0
    shoot_speed_mult: float = 1.0
    #: Extra grab distance in px.
    grab_radius: float = 0
    #: Small gold within this distance of the hook tip is pulled in (0 = off).
    magnet_radius: float = 0
    #: How many small items one throw can carry.
    capacity: int = 1
    #: Items heavier than this cannot be lifted.
    max_lift_weight: float = 10
    #: Extra strength: heavy loads slow the reel less.
    strength: float = 0
