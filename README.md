# PrepOpening

A chess opening training platform with opening trees, spaced repetition, traps and puzzles, progress tracking, and conqueror badges.

## Overview

PrepOpening helps players learn and retain opening theory through structured journeys, position-based training, and gamification. It includes:

- **Opening trees** — Navigate branching lines by journey (e.g. Sicilian Defense, Italian Game).
- **Spaced repetition training** — Review queue of positions due for practice, with mastery levels.
- **Opening traps and puzzles** — Special node types (traps, puzzles, transitions) with explanations.
- **Progress tracking** — Per-node and per-journey progress, mastery levels, and review scheduling.
- **Conqueror badges** — Earn badges when you master all trainable positions in a journey.

The app consists of a Next.js frontend and a Node.js + Express API, with optional PostgreSQL for persistence.

## Project Structure

```
prepopening/
├── frontend/          # Next.js (TypeScript, Tailwind) — web app
├── backend/           # Express API (TypeScript) — auth, journeys, training, progress, badges
├── database/          # PostgreSQL schema and migrations
├── docs/              # Product and technical documentation
├── package.json       # Root scripts (dev:frontend, dev:backend)
└── README.md
```

## Setup

### Prerequisites

- **Node.js** 18+
- **npm** (or yarn)
- **PostgreSQL** 14+ (optional for current mock data; required for full schema)

### 1. Install dependencies

```bash
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

### 2. Environment files

Copy the example env files and set values as needed:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example   backend/.env
```

Edit `backend/.env` (e.g. `JWT_SECRET`, `PORT`) and optionally `frontend/.env.local` (e.g. `NEXT_PUBLIC_API_URL` if the API is not on `localhost:4000`).

### 3. Database (optional)

To use the full schema:

```bash
createdb prepopening
psql -d prepopening -f database/schema.sql
```

Then set `DATABASE_URL` in `backend/.env`. The API can run with in-memory stores without a database.

### 4. Run the app

From the repo root:

```bash
npm run dev:backend   # Terminal 1 — API on http://localhost:4000
npm run dev:frontend  # Terminal 2 — App on http://localhost:3000
```

Or run from each directory: `cd backend && npm run dev` and `cd frontend && npm run dev`.

## Frontend Development

- **Location:** `frontend/`
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, react-chessboard, chess.js
- **Start dev server:** `npm run dev` (or from root: `npm run dev:frontend`)
- **Build:** `npm run build`
- **Start production:** `npm run start`

Uses `NEXT_PUBLIC_API_URL` from `.env.local` to talk to the backend.

## Backend Development

- **Location:** `backend/`
- **Stack:** Node.js, Express, TypeScript, bcrypt, jsonwebtoken
- **Start dev server:** `npm run dev` (or from root: `npm run dev:backend`)
- **Build:** `npm run build`
- **Start production:** `npm start`

API base: `http://localhost:4000`. Health: `GET /health`. Routes under `/api/auth`, `/api/journeys`, `/api/progress`, `/api/badges`, etc.

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable               | Description                    | Example                |
|------------------------|--------------------------------|------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL           | `http://localhost:4000` |

### Backend (`backend/.env`)

| Variable       | Description              | Example     |
|----------------|--------------------------|-------------|
| `JWT_SECRET`   | Secret for signing JWTs  | `change-me` |
| `PORT`         | API server port          | `4000`     |

Additional backend variables (e.g. `DATABASE_URL`, `FRONTEND_URL`) can be added as needed; see `backend/.env.example` for reference.

## Development Workflow

1. **Start both servers** (from root: `npm run dev:backend` and `npm run dev:frontend`).
2. **Frontend** at http://localhost:3000; **API** at http://localhost:4000.
3. Use **Login / Register** to get a JWT; protected routes (e.g. Training, Journeys) require auth.
4. **Journeys** → pick a journey → **Start Training** to use the review queue and progress.
5. **Profile** shows user info and Conqueror badges.

## Deploying the backend to Railway

The backend lives in the `backend/` subfolder. Use **one** of these approaches.

### Option A: Root Directory + Dockerfile (recommended)

1. In the [Railway dashboard](https://railway.app), open your backend service.
2. **Settings** → **Source** → set **Root Directory** to `backend`.
3. Railway will detect `backend/Dockerfile` and use it to build and run the API (no need to set build/start commands manually).
4. **Variables**: set `JWT_SECRET`; leave `PORT` unset (Railway injects it).
5. Redeploy. Test `https://your-app.up.railway.app/health` and `https://your-app.up.railway.app/api/journeys`.

### Option B: Root Directory only (no Dockerfile)

1. Set **Root Directory** to `backend` as above.
2. In **Settings** → **Build**, ensure the build command is `npm run build` and start command is `npm start` (or `node dist/server.js`).
3. Set `JWT_SECRET` in Variables and redeploy.

### Troubleshooting: "Application failed to respond"

This usually means the **service that owns the URL** is not responding. Check the following:

1. **Which service has the domain?**  
   In Railway, open your **project** and look at the **services**. You may have:
   - A **frontend** service (Next.js from `frontend/`)
   - A **backend** service (Express API from `backend/`)  
   Click **prepopening-production** (or your custom domain) and see which **service** it belongs to.  
   - If the domain is on the **frontend** service: the frontend does **not** serve `/api/journeys`. That route lives on the **backend**. Create a public domain for the **backend** service (Settings → Networking → Generate Domain), then open `https://<backend-domain>/api/journeys`.
   - If the domain is on the **backend** service: the backend process may be crashing. Go to that service → **Deployments** → latest deploy → **View logs**. Look for `[PrepOpening] Starting server` and `[PrepOpening] API listening on 0.0.0.0:...`. If you see an error or neither line, the app is failing to start; copy that error to fix the cause.

2. **Backend service settings**  
   For the backend service only: **Settings** → **Source** → **Root Directory** must be `backend`, and (if not using the Dockerfile) build command `npm run build`, start command `npm start`. **Variables**: set `JWT_SECRET`; do **not** set `PORT` (Railway sets it).

3. **Port mismatch (app listens, proxy doesn’t)**  
   If logs show `[PrepOpening] API listening on 0.0.0.0:8080` but the site still says "Application failed to respond", the proxy may be targeting the wrong port. In the **backend** service: **Settings** → **Networking** (or the section for your public domain). If you see a **Port** or **Target port** set to e.g. `4000`, clear it or set it to match the port in the logs (e.g. `8080`). Do **not** add a custom `PORT` variable; let Railway inject `PORT` and use that for both the app and the proxy.

For schema and product details, see the `docs/` folder.
