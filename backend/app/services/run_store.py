"""In-memory run storage. Replaced by SQLite/SQLAlchemy in a later milestone."""

from app.schemas.run import RunState


class RunNotFoundError(KeyError):
    pass


class InMemoryRunStore:
    def __init__(self) -> None:
        self._runs: dict[str, RunState] = {}

    def get(self, run_id: str) -> RunState:
        try:
            return self._runs[run_id]
        except KeyError:
            raise RunNotFoundError(run_id) from None

    def save(self, run: RunState) -> None:
        self._runs[run.run_id] = run
