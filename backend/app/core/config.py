"""Application settings (read from environment variables)."""

import os
from dataclasses import dataclass, field


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Gold Miner Roguelite API"
    version: str = "0.1.0"
    cors_origins: list[str] = field(
        default_factory=lambda: _split(
            os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        )
    )


settings = Settings()
