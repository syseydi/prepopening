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

For schema and product details, see the `docs/` folder.
