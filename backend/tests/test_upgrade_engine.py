import pytest

from app.engine.upgrade_engine import hook_modifiers, offer_upgrades
from app.services.content import load_upgrades, upgrades_by_id

upgrades = load_upgrades()


def test_offers_three_distinct_deterministic_choices():
    first = offer_upgrades(1, 2, {}, upgrades)
    assert len(first) == 3 and len({u.id for u in first}) == 3
    assert first == offer_upgrades(1, 2, {}, upgrades)
    seen = {tuple(u.id for u in offer_upgrades(seed, 2, {}, upgrades)) for seed in range(20)}
    assert len(seen) > 1


def test_maxed_upgrades_are_not_offered():
    owned = {"heavy_duty": 1, "double_hook": 1, "precision": 3}
    for seed in range(20):
        ids = {u.id for u in offer_upgrades(seed, 2, owned, upgrades)}
        assert ids == {"quick_reel", "magnetic_hook"}


def test_no_upgrades_owned_means_base_hook():
    mods = hook_modifiers({}, upgrades_by_id())
    assert (mods.reel_speed_mult, mods.capacity, mods.max_lift_weight, mods.magnet_radius) == (1.0, 1, 10, 0)


def test_upgrade_effects_stack():
    mods = hook_modifiers({"quick_reel": 2, "precision": 1, "double_hook": 1, "heavy_duty": 1, "magnetic_hook": 2}, upgrades_by_id())
    assert mods.reel_speed_mult == pytest.approx(1.4)
    assert mods.shoot_speed_mult == pytest.approx(0.85)
    assert mods.grab_radius == 12
    assert mods.capacity == 2
    assert mods.max_lift_weight == 30
    assert mods.magnet_radius == 100
