"""Deterministic, seed-based random number generation.

All game randomness must go through this module so that runs are reproducible
from a seed. Never use the global `random` module state in game logic.
"""

import random


def make_rng(*seed_parts: int | str) -> random.Random:
    """Return an isolated RNG. Combine parts, e.g. make_rng(run_seed, level)."""
    return random.Random(":".join(str(p) for p in seed_parts))
