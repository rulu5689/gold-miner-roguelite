import math

from app.engine.difficulty_engine import level_quota, target_for_level
from app.engine.level_engine import FIELD_AREA, generate_level
from app.services.content import load_minerals

minerals = load_minerals()


def test_same_seed_same_level():
    assert generate_level(42, 1, minerals) == generate_level(42, 1, minerals)
    assert generate_level(42, 1, minerals) != generate_level(43, 1, minerals)
    assert generate_level(42, 1, minerals) != generate_level(42, 2, minerals)


def test_items_inside_area_without_overlap():
    for seed in range(10):
        items = generate_level(seed, 4, minerals)
        for a in items:
            assert FIELD_AREA.left <= a.x - a.radius and a.x + a.radius <= FIELD_AREA.right
            assert FIELD_AREA.top <= a.y - a.radius and a.y + a.radius <= FIELD_AREA.bottom
            for b in items:
                if a is not b:
                    assert math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius


def test_enough_value_to_pass():
    for level in range(1, 8):
        for seed in range(5):
            total = sum(i.value for i in generate_level(seed, level, minerals))
            assert total >= level_quota(level) * 2


def test_min_level_respected():
    for seed in range(20):
        ids = {i.mineral_id for i in generate_level(seed, 1, minerals)}
        assert "diamond" not in ids and "tnt_barrel" not in ids


def test_targets():
    assert [target_for_level(n) for n in range(1, 5)] == [650, 1400, 2350, 3500]
