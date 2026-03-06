Stack B — Best Long-Term (Web + Mobile)
Philosophy: Separate concerns from day one. Shared API serves web, mobile, and future integrations. More setup upfront, far less rewriting later.
LayerChoiceWhyFrontend (Web)Next.js 14Same as above; best web DXFrontend (Mobile)Expo (React Native)~70% code reuse from web (hooks, API client, types); Expo Router mirrors Next.js structureBackendHono on Node.js (standalone)Ultra-lightweight, TypeScript-native, runs on Cloudflare Workers or Railway; purpose-built for APIsDatabaseNeon (serverless Postgres)Branching per PR for dev/staging, scales to zero, better latency than Supabase at scaleORMDrizzle ORMType-safe, zero magic, Neon-native, generates migrations cleanlyAuthClerkBest-in-class auth DX; handles Google/Apple/email, session management, works identically on web + mobilePaymentsStripeSame — no alternative at this quality levelJob QueueBullMQ on Upstash RedisSR recalculation, badge events, notifications run as proper async jobsHosting (API)RailwaySimple Docker deploys, persistent workers, cron jobs, proper logs — no Vercel function cold starts on long jobsHosting (Web)VercelStill best for Next.js frontendEmailResendSamePush NotificationsExpo Push + Web Push APIOne service handles both platforms
Total monthly cost at launch: ~$150–300 (Railway + Neon + Clerk + Upstash)
Tradeoffs:

More services to wire up initially (~2 weeks extra vs Stack A)
Clerk is paid from day one ($25+/mo), whereas Supabase Auth is free
But: adding mobile in Phase 5 becomes a 6-week sprint instead of a 3-month rewrite


Recommendation: Stack B — with a phased rollout
Here's why: PrepOpening's spec explicitly targets mobile in Phase 5, and the Expo + shared API architecture pays for itself within months. The extra 2 weeks of setup now saves 3+ months of painful backend refactoring when mobile ships. Clerk in particular removes an entire category of auth pain across two platforms.
The one exception: use Supabase Storage instead of Cloudflare R2 for MVP asset storage — one fewer service to configure early.

Implementation Plan
Milestone 0 — Foundation (Week 1–2)
Goal: Every developer can run the full stack locally and deploy to staging.

Init monorepo: apps/web (Next.js), apps/api (Hono), packages/db (Drizzle schema), packages/types (shared TypeScript types)
Set up Neon database + Drizzle migrations; define core schema (User, Journey, Node, UserNodeState, Session)
Wire Clerk auth into both web and API (middleware + JWT verification)
CI/CD: GitHub Actions → Vercel (web preview) + Railway (API staging auto-deploy)
Seed DB with Journey 1 (Italian Game — White) through L1 depth

Exit criteria: POST /auth → JWT → GET /users/me works end-to-end in staging.

Milestone 1 — Core Training Loop (Week 3–5)
Goal: A user can train through Journey 1, Italian Game White, through Level 1.

Build board component (react-chessboard + chess.js), confirm FEN rendering and move validation
Implement Guided Walkthrough drill type — system plays moves, user taps to confirm
Implement Recall Quiz drill type — user must play correct move; 3-attempt logic; correct/wrong feedback
Session API: POST /sessions/start, POST /sessions/:id/answer, POST /sessions/:id/complete
UserNodeState state machine: unseen → seen → learned transitions
XP award on session complete; store in DB; show on frontend after session ends
Streak logic: StreakLog table + daily goal check on session complete

Exit criteria: User completes a 10-move session, nodes transition states correctly, XP and streak update.

Milestone 2 — Journey Tree + Progress UI (Week 6–7)
Goal: Users can see their progress visually and navigate the app.

Journey Tree view: D3 force-directed or dagre layout; upward branches (White) / downward roots (Black)
Node coloring by state: gray/blue/gold; tap node to see annotation + drill options
Progress tab: XP bar, heatmap calendar, badge shelf (empty for now)
Home tab: active Journey card with coverage %, streak counter, daily goal ring
Browse tab: Journey catalog grid with filter chips (color side, opening family)
Journey Detail page: tree preview, Level 1/2/3 depth rings, Start CTA

Exit criteria: Full navigation works; tree reflects real node states from DB.

Milestone 3 — All 12 Journeys + Conqueror Badges (Week 8–10)
Goal: MVP content complete; badges earned for the first time.

Author all 12 Journey move trees in JSON seed format through L1 + L2 depth
Build content ingestion script: JSON → DB nodes with FEN validation via chess.js
Blinded Quiz drill type (board labels hidden)
UserJourneyProgress: level_achieved calculation; badge award event on mastery of all required L1/L2 nodes
Badge UI: unlock animation (Framer Motion), badge card on Profile, shareable image (html-to-image or Vercel OG)
Conqueror badge XP bonuses

Exit criteria: A user can earn a Level 1 Conqueror badge for the Italian Game.

Milestone 4 — Spaced Repetition + Daily Challenge (Week 11–12)
Goal: Retention hooks are live.

SM-2 implementation: interval/ease_factor update on every session answer; next_review_at written to UserNodeState
Review queue API + UI: "8 positions due for review" card on Home; dedicated review session type
Fading state: cron job (Railway Cron) runs nightly, marks overdue nodes as fading, updates tree color
Daily Challenge: content table seeded 30 days ahead; GET /daily-challenge/today; leaderboard by solve time
Daily Challenge streak tracked separately; shown on Home card

Exit criteria: SR queue populates correctly after 3 days of training; Daily Challenge leaderboard shows friends ranked.

Milestone 5 — Social + Payments (Week 13–15)
Goal: Growth loops and monetization live.

Stripe integration: Products (Free / Pro), Checkout Session, webhook handler for subscription events
Paywall enforcement: middleware checks subscription_tier on activate journey (max 5 free, unlimited Pro)
Friend system: invite by username/email, accept/decline, friends list, weekly XP leaderboard
Friend Challenges: send position, inbox, 24h window, result comparison
Referral: unique invite link per user; signup via link grants both users 7-day Pro trial
Resend emails: welcome, streak reminder (day 2 if no login), badge earned, friend challenge received

Exit criteria: Stripe checkout works; Pro user can have 6+ active journeys; friend challenge completes end-to-end.

Milestone 6 — Hardening + Launch (Week 16)
Goal: Production-ready.

Sentry error tracking wired to both web and API
PostHog events instrumented for all 25 analytics events in the spec
Load test API with k6: target 500 concurrent sessions without degradation
Accessibility audit (axe-core): board keyboard navigation, screen reader labels
Mobile-responsive QA across iOS Safari, Chrome Android, desktop
Soft launch: closed beta with 50 users, fix top bugs
Public launch: ProductHunt, chess subreddits, Chess.com/Lichess community posts

Exit criteria: p95 API latency < 200ms; zero P0 bugs in 48h beta; analytics dashboard live in PostHog.

Total calendar time: ~16 weeks (4 months) with 1–2 engineers. Mobile (Expo) slots in as Phase 5 per the product spec, estimated 6–8 weeks on top of this foundation.