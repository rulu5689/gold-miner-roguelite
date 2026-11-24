"""Deterministic, seed-based random number generation.

All game randomness must go through this module so that runs are reproducible
from a seed. Never use the global `random` module state in game logic.
"""

import random


def make_rng(seed: int) -> random.Random:
    """Return an isolated RNG instance for the given seed."""
    return random.Random(seed)
