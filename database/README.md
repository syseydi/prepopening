# Database

PostgreSQL schema for PrepOpening.

## Setup

1. Create a database:

   ```bash
   createdb prepopening
   ```

2. Run the schema:

   ```bash
   psql -d prepopening -f schema.sql
   ```

   Or with a connection URL:

   ```bash
   psql "postgresql://user:password@localhost:5432/prepopening" -f schema.sql
   ```

## Tables

- **users** — Accounts (email, username, auth provider, subscription)
- **profiles** — User profile (display name, streak, XP, level, goals)
- **journeys** — Opening journeys (name, color, ECO codes, difficulty)
- **nodes** — Positions in the tree (FEN, SAN, depth level, required flag)
- **drills** — Drill items per node (guided, recall, blinded, etc.)
- **progress** — User mastery per node (state, ease, interval, next review)
- **badges** — Earned badges (conqueror, streak, accuracy, social)
- **sessions** — Training sessions (optional, for session/answer tracking)

See `schema.sql` for enums, indexes, and triggers.
