# Gold Miner Roguelite

A browser-based, single-player Gold Miner game with roguelite upgrades.

**Status: MLP 0.2 — classic core gameplay.**

## How to play

- The hook swings back and forth. Press **SPACE**, **↓** or **click/tap** to fire it.
- Grab gold, diamonds and mystery bags for money. Rocks are worth little and heavy items reel in slowly.
- Each level lasts **60 seconds**. Reach the (cumulative) target money to go to the next level; otherwise the run ends.

## Roadmap

| Milestone | Content |
|---|---|
| 0.1 | Project setup, `/health` check ✅ |
| 0.2 | Hook swing/shoot/reel, minerals, timer, target money ✅ |
| 0.3 | Backend: seeded level generation, scoring rules, run state |
| 0.4 | Hook upgrades (choose 1 of 3 after each level): Quick Reel, Magnetic Hook, Heavy Duty, Double Hook, Precision |

## Tech stack

| Part     | Stack                                        |
|----------|----------------------------------------------|
| Frontend | Phaser 3, TypeScript, Vite, Vitest           |
| Backend  | Python 3.11+, FastAPI, Pydantic, Pytest      |
| Database | SQLAlchemy + SQLite (planned, not yet added) |

## Architecture

The frontend and backend are independent applications that talk over HTTP.

- **Frontend** — rendering, hook movement, collision, animation, UI, audio.
- **Backend** — game rules, level generation, upgrade selection, run state.
  - `app/engine/` holds game rules, independent of FastAPI.
  - `app/api/` holds thin HTTP endpoints that only delegate to engines/services.
  - All randomness goes through `app/core/rng.py` (seeded, deterministic).
  - Game state must stay serializable; content (minerals, upgrades, levels) lives in JSON under `app/data/`.

```
gold-miner-roguelite/
├── frontend/
│   ├── src/        (scenes/, entities/, components/, api/, ui/)
│   ├── tests/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/        (game.py, player.py)
│   │   ├── core/       (config.py, rng.py)
│   │   ├── engine/     (game, hook, level, upgrade, difficulty engines — placeholders)
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── data/       (minerals.json, upgrades.json)
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
└── README.md
```

## Prerequisites

- Node.js 18+ (tested with 22) and npm
- Python 3.11+

## Backend setup and start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Endpoints: `GET /health`, `GET /config/minerals` (mineral data from `app/data/minerals.json`).

Check it: <http://localhost:8001/health> returns `{"status":"ok"}`. API docs: <http://localhost:8001/docs>.

CORS allows `http://localhost:5173` and `http://127.0.0.1:5173` by default.
Override with a comma-separated `CORS_ORIGINS` environment variable.

## Frontend setup and start

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. You should see **Gold Miner Roguelite**, **Frontend running**
and, when the backend is up, **Backend connected** (otherwise "Backend not connected").

The backend URL defaults to `http://localhost:8001`. To change it, copy
`frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.

## Tests

```bash
cd backend && source .venv/bin/activate && pytest
```

```bash
cd frontend && npm test
```

Production build of the frontend: `npm run build` (type-checks, then bundles to `dist/`).
