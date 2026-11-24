"""Difficulty curve: level targets, time limits and how full each level is."""

LEVEL_DURATION_SECONDS = 60


def target_for_level(level: int) -> int:
    """Cumulative money needed to pass a level: 650, 1400, 2350, 3500, ..."""
    target = 650
    for n in range(2, level + 1):
        target += 550 + 200 * (n - 1)
    return target


def level_quota(level: int) -> int:
    """Money that must be earned during this level alone."""
    return target_for_level(level) - (target_for_level(level - 1) if level > 1 else 0)


def item_count(level: int) -> int:
    return min(10 + 2 * level, 22)
