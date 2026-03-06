-- PrepOpening — PostgreSQL Schema (Initial)
-- Run this script to create the database schema.

-- Extensions (optional, for UUID)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE auth_provider AS ENUM ('google', 'apple', 'email');
CREATE TYPE color_side AS ENUM ('white', 'black');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team');
CREATE TYPE node_state AS ENUM ('unseen', 'seen', 'learned', 'mastered', 'fading');
CREATE TYPE drill_type AS ENUM ('guided', 'recall', 'blinded', 'sparring', 'error', 'speed');
CREATE TYPE badge_type AS ENUM (
  'conqueror_l1', 'conqueror_l2', 'conqueror_l3',
  'streak_7', 'streak_30', 'accuracy_sharp', 'social_challenger'
);

-- Users
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  username          TEXT NOT NULL UNIQUE CHECK (length(username) BETWEEN 3 AND 30),
  auth_provider     auth_provider NOT NULL,
  auth_provider_sub TEXT,
  password_hash     TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;

-- Profiles (extends users)
CREATE TABLE profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name        TEXT,
  avatar_url          TEXT,
  elo_self_reported   INT CHECK (elo_self_reported BETWEEN 100 AND 3500),
  color_preference    color_side,
  daily_goal_minutes  INT NOT NULL DEFAULT 10 CHECK (daily_goal_minutes IN (5, 10, 15, 20, 30)),
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  current_streak      INT NOT NULL DEFAULT 0,
  longest_streak      INT NOT NULL DEFAULT 0,
  xp_total            BIGINT NOT NULL DEFAULT 0,
  global_level        INT NOT NULL DEFAULT 1 CHECK (global_level BETWEEN 1 AND 100),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journeys (opening lines / courses)
CREATE TABLE journeys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  color_side          color_side NOT NULL,
  eco_codes           TEXT[] NOT NULL DEFAULT '{}',
  description         TEXT,
  difficulty_rating   INT NOT NULL DEFAULT 3 CHECK (difficulty_rating BETWEEN 1 AND 5),
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journeys_slug ON journeys(slug);
CREATE INDEX idx_journeys_published ON journeys(is_published) WHERE is_published = TRUE;

-- Nodes (positions in the opening tree)
CREATE TABLE nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES nodes(id),
  fen             TEXT NOT NULL,
  san             TEXT NOT NULL,
  move_number     INT NOT NULL,
  color_to_move   color_side NOT NULL,
  depth_level     INT NOT NULL CHECK (depth_level IN (1, 2, 3)),
  is_required     BOOLEAN NOT NULL DEFAULT TRUE,
  difficulty      INT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  annotation      TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, fen)
);

CREATE INDEX idx_nodes_journey ON nodes(journey_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id) WHERE parent_id IS NOT NULL;

-- Drills (drill items per node)
CREATE TABLE drills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  drill_type      drill_type NOT NULL,
  prompt_fen      TEXT NOT NULL,
  correct_san     TEXT NOT NULL,
  distractor_sans TEXT[] DEFAULT '{}',
  hint_text       TEXT,
  explanation     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (node_id, drill_type)
);

CREATE INDEX idx_drills_node ON drills(node_id);

-- Progress (user mastery per node)
CREATE TABLE progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id             UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  state               node_state NOT NULL DEFAULT 'unseen',
  times_correct       INT NOT NULL DEFAULT 0,
  times_incorrect     INT NOT NULL DEFAULT 0,
  consecutive_correct INT NOT NULL DEFAULT 0,
  ease_factor         NUMERIC(4,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days       INT NOT NULL DEFAULT 1,
  repetitions         INT NOT NULL DEFAULT 0,
  next_review_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at    TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, node_id)
);

CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_review ON progress(user_id, next_review_at) WHERE state IN ('learned', 'mastered', 'fading');

-- Badges
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type  badge_type NOT NULL,
  journey_id  UUID REFERENCES journeys(id),
  metadata    JSONB DEFAULT '{}',
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type, journey_id)
);

CREATE INDEX idx_badges_user ON badges(user_id, awarded_at DESC);

-- Sessions (training sessions) — optional but useful for API
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id          UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  moves_attempted     INT NOT NULL DEFAULT 0,
  moves_correct       INT NOT NULL DEFAULT 0,
  is_completed        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sessions_user ON sessions(user_id, started_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_journeys_updated_at
  BEFORE UPDATE ON journeys FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON progress FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
