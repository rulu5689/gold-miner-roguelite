import pytest

from app.engine import game_engine, upgrade_engine
from app.engine.game_engine import GameRuleError
from app.schemas.run import FieldItem
from app.services.content import load_minerals, load_upgrades, minerals_by_id, upgrades_by_id

minerals = load_minerals()
upgrades = load_upgrades()
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
    assert game_engine.collect_item(run, 0, by_id) == (400, False)
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
    assert game_engine.finish_level(run, minerals, upgrades) is True
    assert run.level == 2 and run.target == 1400 and run.items
    assert run.status == "choosing_upgrade" and len(run.upgrade_choices) == 3
    with pytest.raises(GameRuleError):  # must pick an upgrade before playing on
        game_engine.finish_level(run, minerals, upgrades)

    game_engine.choose_upgrade(run, run.upgrade_choices[0].id, upgrades_by_id())
    assert game_engine.finish_level(run, minerals, upgrades) is False
    assert run.status == "game_over"
    with pytest.raises(GameRuleError):
        game_engine.finish_level(run, minerals, upgrades)


def test_ruby_raises_crit_chance_and_crits_double_value():
    run = make_run([item(i, "ruby", 100 + 40 * i, 300) for i in range(20)])
    values = [game_engine.collect_item(run, i, by_id) for i in range(20)]
    assert run.crit_chance == pytest.approx(1.0)  # 20 x 5%
    assert values[0] == (500, False)  # first ruby: crit chance was still 0
    assert all(value == 1000 for value, crit in values if crit)
    assert any(crit for _, crit in values)


def test_crits_are_deterministic():
    def play():
        run = make_run([item(i, "gold_small", 50 + 40 * i, 300) for i in range(20)])
        run.crit_chance = 0.5
        return [game_engine.collect_item(run, i, by_id) for i in range(20)]

    assert play() == play()


def test_huge_items_need_heavy_duty():
    run = make_run([item(0, "gold_giant", 300, 300)])
    with pytest.raises(GameRuleError):
        game_engine.collect_item(run, 0, by_id)
    run.upgrades = {"heavy_duty": 1}
    run.hook = upgrade_engine.hook_modifiers(run.upgrades, upgrades_by_id())
    assert game_engine.collect_item(run, 0, by_id) == (1200, False)


def test_choose_upgrade_rejects_unoffered():
    run = make_run([])
    run.money = 700
    game_engine.finish_level(run, minerals, upgrades)
    not_offered = next(u.id for u in upgrades if u not in run.upgrade_choices)
    with pytest.raises(GameRuleError):
        game_engine.choose_upgrade(run, not_offered, upgrades_by_id())
