"""Game run endpoints. Thin layer: all rules live in app/engine."""

from fastapi import APIRouter, HTTPException

from app.engine.game_engine import GameRuleError
from app.schemas.run import (
    ChooseUpgradeRequest,
    CollectResponse,
    CreateRunRequest,
    ExplodeResponse,
    ItemRequest,
    LevelResult,
    RunState,
)
from app.services import game_service
from app.services.run_store import RunNotFoundError

router = APIRouter(prefix="/game", tags=["game"])


def _handle(fn, *args):
    try:
        return fn(*args)
    except RunNotFoundError:
        raise HTTPException(status_code=404, detail="Run not found") from None
    except GameRuleError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None


@router.post("/runs", response_model=RunState, status_code=201)
def create_run(body: CreateRunRequest | None = None) -> RunState:
    return game_service.create_run(body.seed if body else None)


@router.get("/runs/{run_id}", response_model=RunState)
def get_run(run_id: str) -> RunState:
    return _handle(game_service.get_run, run_id)


@router.post("/runs/{run_id}/collect", response_model=CollectResponse)
def collect(run_id: str, body: ItemRequest) -> CollectResponse:
    return _handle(game_service.collect, run_id, body.item_id)


@router.post("/runs/{run_id}/explode", response_model=ExplodeResponse)
def explode(run_id: str, body: ItemRequest) -> ExplodeResponse:
    return _handle(game_service.explode, run_id, body.item_id)


@router.post("/runs/{run_id}/finish-level", response_model=LevelResult)
def finish_level(run_id: str) -> LevelResult:
    return _handle(game_service.finish_level, run_id)


@router.post("/runs/{run_id}/upgrades", response_model=RunState)
def choose_upgrade(run_id: str, body: ChooseUpgradeRequest) -> RunState:
    return _handle(game_service.choose_upgrade, run_id, body.upgrade_id)
