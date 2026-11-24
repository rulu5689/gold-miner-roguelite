"""Read-only game content endpoints."""

from fastapi import APIRouter

from app.schemas.mineral import Mineral
from app.services.content import load_minerals

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/minerals", response_model=list[Mineral])
def get_minerals() -> list[Mineral]:
    return list(load_minerals())
