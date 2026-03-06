PrepOpening — Postgres Schema

Design Principles

UUIDs everywhere (v7 — sortable, index-friendly)
updated_at maintained via trigger on all mutable tables
Soft deletes via deleted_at (nullable timestamp) where data has referential history
All ENUMs defined as Postgres native types for constraint enforcement
Versioning handled via snapshot isolation: a journey_version is an immutable published snapshot; user progress pins to a version; migrations copy progress forward on explicit user action


Enums
sqlCREATE TYPE auth_provider      AS ENUM ('google', 'apple', 'email');
CREATE TYPE color_side         AS ENUM ('white', 'black');
CREATE TYPE subscription_tier  AS ENUM ('free', 'pro', 'team');
CREATE TYPE node_state         AS ENUM ('unseen', 'seen', 'learned', 'mastered', 'fading');
CREATE TYPE drill_type         AS ENUM ('guided', 'recall', 'blinded', 'sparring', 'error', 'speed');
CREATE TYPE drill_result       AS ENUM ('correct', 'incorrect', 'skipped');
CREATE TYPE badge_type         AS ENUM ('conqueror_l1', 'conqueror_l2', 'conqueror_l3',
                                        'streak_7', 'streak_30', 'streak_100', 'streak_365',
                                        'accuracy_sharp', 'accuracy_tactician',
                                        'social_challenger', 'social_teacher',
                                        'speedrun');
CREATE TYPE friendship_status  AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE challenge_status   AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE opening_family     AS ENUM ('e4', 'd4', 'c4', 'flank', 'other');
CREATE TYPE version_status     AS ENUM ('draft', 'published', 'deprecated');

Core: Users & Profiles
sqlCREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL UNIQUE,
  username              TEXT NOT NULL UNIQUE
                          CHECK (length(username) BETWEEN 3 AND 30),
  auth_provider         auth_provider NOT NULL,
  auth_provider_sub     TEXT,                        -- OAuth subject identifier
  password_hash         TEXT,                        -- null for OAuth users
  subscription_tier     subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id    TEXT UNIQUE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,                 -- soft delete
  UNIQUE (auth_provider, auth_provider_sub)
);

CREATE TABLE user_profiles (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name          TEXT,
  avatar_url            TEXT,
  elo_self_reported     INT CHECK (elo_self_reported BETWEEN 100 AND 3500),
  lichess_username      TEXT,
  chesscom_username     TEXT,
  color_preference      color_side,                  -- null = both
  daily_goal_minutes    INT NOT NULL DEFAULT 10
                          CHECK (daily_goal_minutes IN (5, 10, 15, 20, 30)),
  timezone              TEXT NOT NULL DEFAULT 'UTC',
  current_streak        INT NOT NULL DEFAULT 0,
  longest_streak        INT NOT NULL DEFAULT 0,
  streak_freeze_tokens  INT NOT NULL DEFAULT 0
                          CHECK (streak_freeze_tokens BETWEEN 0 AND 2),
  xp_total              BIGINT NOT NULL DEFAULT 0,
  global_level          INT NOT NULL DEFAULT 1
                          CHECK (global_level BETWEEN 1 AND 100),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
Indexes:
sqlCREATE INDEX idx_users_email         ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username      ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_stripe        ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

Journeys & Versioning
sql-- The canonical journey definition (mutable metadata only)
CREATE TABLE journeys (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  color_side            color_side NOT NULL,
  opening_family        opening_family NOT NULL,
  eco_codes             TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {'C50','C51','C54'}
  description           TEXT,
  difficulty_rating     INT NOT NULL DEFAULT 3
                          CHECK (difficulty_rating BETWEEN 1 AND 5),
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  current_version_id    UUID,                           -- FK added after journey_versions
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable published snapshots of a journey's tree
-- A new version is created whenever a curator publishes tree changes.
-- Once published, a version is never mutated — only deprecated.
CREATE TABLE journey_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id            UUID NOT NULL REFERENCES journeys(id),
  version_number        INT NOT NULL,                   -- 1, 2, 3…
  status                version_status NOT NULL DEFAULT 'draft',
  changelog             TEXT,                           -- human-readable change notes
  required_node_count_l1 INT NOT NULL DEFAULT 0,
  required_node_count_l2 INT NOT NULL DEFAULT 0,
  required_node_count_l3 INT NOT NULL DEFAULT 0,
  published_at          TIMESTAMPTZ,
  deprecated_at         TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, version_number)
);

ALTER TABLE journeys
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES journey_versions(id);
Versioning note: journeys.current_version_id points to the live published version. User progress rows always carry a journey_version_id FK, so progress is forever anchored to the tree it was trained on. When a user opens a journey with a newer version available, a migration prompt appears: "This journey was updated. Carry your progress forward?" A stored procedure maps old node stable IDs to new ones and creates new user_node_states for truly new nodes; existing mastery is preserved where the node FEN hasn't changed.

Move Tree Nodes
sql-- Nodes belong to a specific version snapshot.
-- Stable identity across versions is tracked via stable_id:
--   same stable_id = same logical position across versions.
--   If a curator re-orders or annotates a node, stable_id is preserved.
--   If a curator inserts a fundamentally new position, a new stable_id is minted.
CREATE TABLE nodes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_version_id    UUID NOT NULL REFERENCES journey_versions(id),
  stable_id             UUID NOT NULL,                  -- cross-version identity key
  parent_id             UUID REFERENCES nodes(id),      -- null = root node
  fen                   TEXT NOT NULL,                  -- full FEN string
  san                   TEXT NOT NULL,                  -- move that produced this position
  move_number           INT NOT NULL,                   -- full move number (1, 2, 3…)
  color_to_move         color_side NOT NULL,            -- side to move at this position
  depth_level           INT NOT NULL CHECK (depth_level IN (1, 2, 3)),
  is_required           BOOLEAN NOT NULL DEFAULT TRUE,  -- counts toward Conqueror badge
  difficulty            INT NOT NULL DEFAULT 3
                          CHECK (difficulty BETWEEN 1 AND 5),
  annotation            TEXT,                           -- curator explanation
  sort_order            INT NOT NULL DEFAULT 0,         -- ordering among siblings
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A FEN should appear at most once per version tree
  UNIQUE (journey_version_id, fen)
);
Indexes:
sql-- Tree traversal: find children of a node
CREATE INDEX idx_nodes_parent         ON nodes(parent_id) WHERE parent_id IS NOT NULL;
-- All nodes in a version (used for badge completion checks)
CREATE INDEX idx_nodes_version        ON nodes(journey_version_id);
-- Cross-version progress migration lookup
CREATE INDEX idx_nodes_stable_id      ON nodes(stable_id);
-- Required nodes by depth for badge gating
CREATE INDEX idx_nodes_required_depth ON nodes(journey_version_id, depth_level, is_required);

Drill Items
sql-- Drill items are question-level records attached to a node.
-- A node can have multiple drill types (guided, recall, blinded, sparring),
-- each representing a distinct testable unit.
CREATE TABLE drill_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id               UUID NOT NULL REFERENCES nodes(id),
  drill_type            drill_type NOT NULL,
  prompt_fen            TEXT NOT NULL,                  -- position shown to user
  correct_san           TEXT NOT NULL,                  -- expected response move
  distractor_sans       TEXT[] DEFAULT '{}',            -- wrong options for MCQ mode
  hint_text             TEXT,
  explanation           TEXT,                           -- shown after wrong answer
  sort_order            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (node_id, drill_type)
);
Index:
sqlCREATE INDEX idx_drill_items_node ON drill_items(node_id);

User Mastery & Spaced Repetition
sql-- One row per (user, node, journey_version).
-- Version-pinned so progress isn't corrupted by tree updates.
CREATE TABLE user_node_states (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id                   UUID NOT NULL REFERENCES nodes(id),
  journey_version_id        UUID NOT NULL REFERENCES journey_versions(id),
  state                     node_state NOT NULL DEFAULT 'unseen',
  drill_type_reached        drill_type NOT NULL DEFAULT 'guided',
  times_correct             INT NOT NULL DEFAULT 0,
  times_incorrect           INT NOT NULL DEFAULT 0,
  consecutive_correct       INT NOT NULL DEFAULT 0,    -- resets on any error
  ease_factor               NUMERIC(4,2) NOT NULL DEFAULT 2.50
                              CHECK (ease_factor >= 1.30),
  interval_days             INT NOT NULL DEFAULT 1,
  repetitions               INT NOT NULL DEFAULT 0,    -- SM-2 rep count
  next_review_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at          TIMESTAMPTZ,
  first_mastered_at         TIMESTAMPTZ,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, node_id)                            -- one state per user per node
);
Indexes:
sql-- Review queue: nodes due for a specific user, ordered by urgency
CREATE INDEX idx_uns_review_queue
  ON user_node_states(user_id, next_review_at)
  WHERE state IN ('learned', 'mastered', 'fading');

-- Badge completion check: mastered required nodes in a version
CREATE INDEX idx_uns_mastery_check
  ON user_node_states(user_id, journey_version_id, state)
  WHERE state = 'mastered';

-- Fading detection cron (runs nightly)
CREATE INDEX idx_uns_fading
  ON user_node_states(next_review_at)
  WHERE state IN ('mastered', 'learned');
SM-2 update logic (applied in application layer after each answer):
sql-- On correct answer:
--   new_interval = GREATEST(1, ROUND(interval_days * ease_factor))
--   new_ease     = LEAST(2.50, ease_factor + 0.10)   -- cap at 2.5
--   repetitions += 1
--   next_review_at = NOW() + new_interval * INTERVAL '1 day'

-- On incorrect answer:
--   new_interval = 1
--   new_ease     = GREATEST(1.30, ease_factor - 0.20)
--   consecutive_correct = 0
--   next_review_at = NOW() + INTERVAL '1 day'

Training Sessions
sqlCREATE TABLE sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id            UUID NOT NULL REFERENCES journeys(id),
  journey_version_id    UUID NOT NULL REFERENCES journey_versions(id),
  drill_mode            drill_type,                     -- null = mixed
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ,                    -- null = in progress
  moves_attempted       INT NOT NULL DEFAULT 0,
  moves_correct         INT NOT NULL DEFAULT 0,
  accuracy_pct          NUMERIC(5,2),                   -- computed on completion
  xp_earned             INT NOT NULL DEFAULT 0,
  is_perfect            BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE session_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  drill_item_id         UUID NOT NULL REFERENCES drill_items(id),
  node_id               UUID NOT NULL REFERENCES nodes(id),
  result                drill_result NOT NULL,
  played_san            TEXT,                           -- what the user actually played
  attempt_number        INT NOT NULL DEFAULT 1,         -- 1–3 within a single question
  time_ms               INT,                            -- response time
  answered_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
Indexes:
sqlCREATE INDEX idx_sessions_user        ON sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_in_progress ON sessions(user_id) WHERE is_completed = FALSE;
CREATE INDEX idx_answers_session      ON session_answers(session_id);
CREATE INDEX idx_answers_node         ON session_answers(node_id);  -- for error drill aggregation

Journey Progress & Badges
sqlCREATE TABLE user_journey_progress (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id                UUID NOT NULL REFERENCES journeys(id),
  journey_version_id        UUID NOT NULL REFERENCES journey_versions(id),
  is_active                 BOOLEAN NOT NULL DEFAULT FALSE,  -- in user's active 5
  current_level_achieved    INT NOT NULL DEFAULT 0
                              CHECK (current_level_achieved BETWEEN 0 AND 3),
  coverage_pct              NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  total_sessions            INT NOT NULL DEFAULT 0,
  total_xp_earned           INT NOT NULL DEFAULT 0,
  l1_badge_earned_at        TIMESTAMPTZ,
  l2_badge_earned_at        TIMESTAMPTZ,
  l3_badge_earned_at        TIMESTAMPTZ,
  version_migrated_from     UUID REFERENCES journey_versions(id),  -- audit trail
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, journey_id)
);

CREATE TABLE badges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type            badge_type NOT NULL,
  journey_id            UUID REFERENCES journeys(id),      -- null for non-journey badges
  journey_version_id    UUID REFERENCES journey_versions(id),
  metadata              JSONB DEFAULT '{}',                 -- e.g. {streak_length: 30}
  awarded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type, journey_id)                 -- one badge per type per journey
);
Indexes:
sqlCREATE INDEX idx_ujp_active    ON user_journey_progress(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_ujp_journey   ON user_journey_progress(journey_id);
CREATE INDEX idx_badges_user   ON badges(user_id, awarded_at DESC);

XP Ledger
sql-- Append-only event log. Never update rows. user_profiles.xp_total is a materialized sum.
CREATE TABLE xp_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount                INT NOT NULL,
  reason                TEXT NOT NULL,                  -- 'session_complete', 'badge_earned', etc.
  reference_id          UUID,                           -- session_id or badge_id
  reference_type        TEXT,                           -- 'session' | 'badge' | 'challenge'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
Index:
sqlCREATE INDEX idx_xp_user_time ON xp_events(user_id, created_at DESC);

Streak Tracking
sqlCREATE TABLE streak_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date              DATE NOT NULL,
  goal_met              BOOLEAN NOT NULL DEFAULT FALSE,
  freeze_used           BOOLEAN NOT NULL DEFAULT FALSE,
  minutes_trained       INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);
Index:
sqlCREATE INDEX idx_streak_user_date ON streak_logs(user_id, log_date DESC);

Daily Challenge
sqlCREATE TABLE daily_challenges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date        DATE NOT NULL UNIQUE,
  node_id               UUID NOT NULL REFERENCES nodes(id),
  title                 TEXT,
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_challenge_attempts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id          UUID NOT NULL REFERENCES daily_challenges(id),
  moves_played          TEXT[] NOT NULL DEFAULT '{}',
  accuracy_pct          NUMERIC(5,2),
  time_ms               INT,
  xp_earned             INT NOT NULL DEFAULT 0,
  completed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);
Indexes:
sqlCREATE INDEX idx_dca_challenge_time ON daily_challenge_attempts(challenge_id, time_ms ASC);
-- Leaderboard query: today's challenge, ordered by time, friends first handled in app layer

Friendships, Leaderboard & Challenges
sqlCREATE TABLE friendships (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                friendship_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

-- Materialized weekly XP. Refreshed by cron every hour.
-- Avoids expensive SUM(xp_events) on every leaderboard render.
CREATE MATERIALIZED VIEW weekly_leaderboard AS
  SELECT
    u.id AS user_id,
    up.display_name,
    up.avatar_url,
    COALESCE(SUM(xe.amount), 0) AS weekly_xp,
    DATE_TRUNC('week', NOW()) AS week_start
  FROM users u
  JOIN user_profiles up ON up.user_id = u.id
  LEFT JOIN xp_events xe
    ON xe.user_id = u.id
    AND xe.created_at >= DATE_TRUNC('week', NOW())
  WHERE u.deleted_at IS NULL
  GROUP BY u.id, up.display_name, up.avatar_url;

CREATE UNIQUE INDEX idx_weekly_lb_user ON weekly_leaderboard(user_id);
CREATE INDEX        idx_weekly_lb_xp   ON weekly_leaderboard(weekly_xp DESC);

-- Refresh command (run via cron or BullMQ job):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_leaderboard;

CREATE TABLE friend_challenges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challengee_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id               UUID NOT NULL REFERENCES nodes(id),
  status                challenge_status NOT NULL DEFAULT 'pending',
  challenger_moves      TEXT[] DEFAULT '{}',
  challengee_moves      TEXT[] DEFAULT '{}',
  challenger_accuracy   NUMERIC(5,2),
  challengee_accuracy   NUMERIC(5,2),
  challenger_time_ms    INT,
  challengee_time_ms    INT,
  winner_id             UUID REFERENCES users(id),
  expires_at            TIMESTAMPTZ NOT NULL
                          DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (challenger_id <> challengee_id)
);
Indexes:
sql-- Friend graph traversal (both directions)
CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);

-- Challenge inbox
CREATE INDEX idx_challenges_inbox ON friend_challenges(challengee_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_challenges_expiry ON friend_challenges(expires_at)
  WHERE status = 'pending';

Housekeeping: updated_at Trigger
sqlCREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to every mutable table:
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- (repeat for: user_profiles, journeys, journey_versions,
--  user_node_states, user_journey_progress, friendships, friend_challenges)

Versioning Approach — Full Notes
The problem: if you fix a typo in a node annotation, nothing breaks. But if you restructure the tree — add a branch, change a FEN, remove a required node — users mid-training have progress pointing at nodes that may no longer exist or have changed meaning.
The solution: snapshot versioning with stable IDs.
Every published tree is a separate set of nodes rows attached to a journey_versions record. User progress (user_node_states, user_journey_progress) always carries a journey_version_id FK. This means:

A user on v1 and a user on v2 of the Italian Game can coexist with no interference.
You can deprecate v1 without deleting any data — their progress is intact forever.
nodes.stable_id is the cross-version identity key: same logical square on the board → same stable_id across versions. The migration proc uses this to copy mastery states.

Migration flow (user-initiated, not forced):
sql-- Pseudo-logic for the migration stored procedure:
INSERT INTO user_node_states (user_id, node_id, journey_version_id, state, ...)
SELECT
  old.user_id,
  new_nodes.id,                        -- new version's node
  new_version_id,
  old.state,                           -- carry mastery forward
  old.ease_factor,
  old.interval_days,
  old.next_review_at
FROM user_node_states old
JOIN nodes old_nodes ON old_nodes.id = old.node_id
JOIN nodes new_nodes
  ON new_nodes.stable_id = old_nodes.stable_id  -- match by stable identity
  AND new_nodes.journey_version_id = new_version_id
WHERE old.user_id = :user_id
  AND old.journey_version_id = old_version_id
ON CONFLICT (user_id, node_id) DO NOTHING;
-- Nodes in the new version with no matching stable_id get fresh 'unseen' rows automatically
-- (the app creates them on first encounter).

UPDATE user_journey_progress
SET journey_version_id = new_version_id,
    version_migrated_from = old_version_id
WHERE user_id = :user_id AND journey_id = :journey_id;
What counts as a breaking change vs. a safe change:
Change typeNew version required?Fix annotation textNo — update in placeChange difficulty rating on a nodeNo — update in placeAdd a new branch (new nodes)YesRemove a required nodeYesChange a node's FEN or SANYes (new stable_id)Reorder siblings (sort_order)No — update in placeChange is_required flagYes