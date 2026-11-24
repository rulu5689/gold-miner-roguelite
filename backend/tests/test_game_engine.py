import pytest

from app.engine import game_engine
from app.engine.game_engine import GameRuleError
from app.schemas.run import FieldItem
from app.services.content import load_minerals, minerals_by_id

minerals = load_minerals()
by_id = minerals_by_id()


def item(id: int, mineral_id: str, x: float, y: float) -> FieldItem:
    m = by_id[mineral_id]
    return FieldItem(id=id, mineral_id=mineral_id, x=x, y=y, radius=m.radius, weight=m.weight, value=m.value)


def make_run(items):
    run = game_engine.new_run("r", 1, minerals)
    run.items = items
    return run


def test_collect_adds_money_once():
    run = make_run([item(0, "gold_large", 100, 200)])
    assert game_engine.collect_item(run, 0, by_id) == 400
    assert run.money == 400 and run.items == []
    with pytest.raises(GameRuleError):
        game_engine.collect_item(run, 0, by_id)


def test_explosion_destroys_only_nearby_rocks():
    run = make_run(
        [
            item(0, "tnt_barrel", 300, 300),
            item(1, "rock_small", 360, 300),  # near: destroyed
            item(2, "gold_small", 320, 340),  # near but gold: kept
            item(3, "rock_large", 800, 300),  # far: kept
        ]
    )
    assert game_engine.explode(run, 0, by_id) == [1]
    assert [i.id for i in run.items] == [2, 3]


def test_cannot_collect_barrel_or_explode_gold():
    run = make_run([item(0, "tnt_barrel", 300, 300), item(1, "gold_small", 500, 300)])
    with pytest.raises(GameRuleError):
        game_engine.collect_item(run, 0, by_id)
    assert len(run.items) == 2
    with pytest.raises(GameRuleError):
        game_engine.explode(run, 1, by_id)


def test_finish_level_pass_and_fail():
    run = make_run([])
    run.money = 700
    assert game_engine.finish_level(run, minerals) is True
    assert run.level == 2 and run.target == 1400 and run.items

    assert game_engine.finish_level(run, minerals) is False
    assert run.status == "game_over"
    with pytest.raises(GameRuleError):
        game_engine.finish_level(run, minerals)
