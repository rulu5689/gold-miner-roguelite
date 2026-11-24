# Gold Miner Roguelite

A browser-based, single-player Gold Miner game with roguelite upgrades.

**Status: MLP 0.4 — hook upgrades, critical hits and rubies.**

## How to play

- The hook swings back and forth. Press **SPACE**, **↓** or **click/tap** to fire it.
- Grab gold, diamonds and golden chests for money. Rocks are worth little and heavy items reel in slowly.
- Hooking a **TNT barrel** blows it up and destroys the rocks around it (gold and gems are not affected).
- **Giant gold** and **boulders** are too heavy to lift until you have **Heavy Duty**.
- After each level you pass, **choose 1 of 3 upgrades** (click a card or press 1/2/3). Upgrades stack.
- **Critical hits**: each item you bring back has a chance to be worth double. Every **ruby** you collect adds +5% crit chance for the rest of the run.

## Upgrades

| Upgrade | Effect per level | Max |
|---|---|---|
| Quick Reel | Reel speed +20% | 5 |
| Magnetic Hook | Small gold within 50 px of the hook is pulled in (+50 px per level) | 3 |
| Heavy Duty | Can lift extra-heavy items; heavy loads slow you less | 1 |
| Double Hook | After grabbing a small item the hook keeps going and can grab one more small item; a bigger item stops it | 1 |
| Precision | Hook shoots 15% slower, but grabs from 12 px further | 3 |

Upgrade data lives in `backend/app/data/upgrades.json`.
- Each level lasts **60 seconds**. Reach the (cumulative) target money to go to the next level; otherwise the run ends.

## Roadmap

| Milestone | Content |
|---|---|
| 0.1 | Project setup, `/health` check ✅ |
| 0.2 | Hook swing/shoot/reel, minerals, timer, target money ✅ |
| 0.3 | Backend: seeded level generation, scoring rules, run state; TNT barrels; golden chests ✅ |
| 0.4 | Hook upgrades (choose 1 of 3 after each level); critical hits; rubies; giant gold and boulders ✅ |
| 0.5 | Equipment; golden chests can drop equipment |
| 0.6 | Player save data (SQLite); fossils unlock special rewards |

## Items

| Item | Value | Notes |
|---|---|---|
| Small gold | $50 | Light, fast to reel in |
| Gold | $150 | Normal |
| Large gold | $400 | Heavy, slow |
| Giant gold | $1200 | Needs Heavy Duty, from level 2 |
| Diamond | $800 | Very valuable, from level 2 |
| Ruby | $500 | +5% crit chance for the run, from level 2 |
| Golden chest | $100–$700 | Random gold (equipment in 0.5) |
| Small / large rock | $20 / $60 | Heavy obstacles |
| Boulder | $150 | Needs Heavy Duty, from level 3 |
| TNT barrel | – | Explodes and destroys nearby rocks, from level 2 |

All item data lives in `backend/app/data/minerals.json`.

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

Endpoints (full list at `/docs`):

| Endpoint | Purpose |
|---|---|
| `GET /health` | Health check |
| `GET /config/minerals` | Item definitions |
| `GET /config/upgrades` | Upgrade definitions |
| `POST /game/runs` | Start a run (optional `{"seed": 123}`); returns the run with level 1 generated |
| `GET /game/runs/{id}` | Current run state |
| `POST /game/runs/{id}/collect` | Hook brought item `{"item_id"}` back; returns money earned and whether it was a critical hit |
| `POST /game/runs/{id}/explode` | Hook touched barrel `{"item_id"}`; returns destroyed rock ids |
| `POST /game/runs/{id}/finish-level` | Time is up; returns pass/fail, the next level and 3 upgrade choices |
| `POST /game/runs/{id}/upgrades` | Pick one of the offered upgrades `{"upgrade_id"}` |

Runs are kept in memory, so restarting the backend ends any run in progress.

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
