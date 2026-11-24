"""Read-only game content endpoints."""

from fastapi import APIRouter

from app.schemas.mineral import Mineral
from app.schemas.upgrade import Upgrade
from app.services.content import load_minerals, load_upgrades

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/minerals", response_model=list[Mineral])
def get_minerals() -> list[Mineral]:
    return list(load_minerals())


@router.get("/upgrades", response_model=list[Upgrade])
def get_upgrades() -> list[Upgrade]:
    return list(load_upgrades())
