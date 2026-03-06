Mobile-first, text-only wireframes. All screens assume 390×844 (iPhone 14) as the base canvas. Measurements in px or descriptive units.

Global Shell
┌─────────────────────────────────┐
│  STATUS BAR (system — 44px)     │
├─────────────────────────────────┤
│                                 │
│  SCREEN CONTENT                 │
│  (scrollable within this area)  │
│                                 │
├─────────────────────────────────┤
│  BOTTOM NAV BAR (83px)          │
│  [Home] [Browse] [●] [Progress] [Profile]  │
│   house  compass  FAB  trophy    person    │
└─────────────────────────────────┘

FAB (●) = floating action button, 56px circle, accent color,
          always sits above nav bar, launches last active session
Nav bar labels: 11px, icon 24px. Active tab: accent color. Inactive: gray-400.

1. Home Screen
┌─────────────────────────────────┐
│ ≡  PrepOpening        🔔  [ava] │  ← top bar 56px: hamburger (hidden), logo, notif, avatar
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │  🔥 14-day streak         │  │  ← streak banner: amber bg, 56px tall
│  │  Keep it going!  [Freeze?]│  │    right: freeze token count if ≤2 remain
│  └───────────────────────────┘  │
│                                 │
│  DAILY GOAL                     │  ← section label 12px caps, gray-500
│  ┌───────────────────────────┐  │
│  │  ◯ ━━━━━━━━━━●━━━━━━ ◯   │  │  ← ring progress: 72px circle, left-aligned
│  │  [  72px ring  ] 6/10 min │  │    ring fill = goal %, center shows time done
│  │                           │  │
│  │  ████████░░  3 of 5 moves │  │  ← linear bar below ring: moves completed today
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📅  Daily Challenge      │  │  ← challenge card: full-width, 96px
│  │  "Find White's best move" │  │    left: calendar emoji + title
│  │  ⏱ Closes in 4h 22m  [→] │  │    right: chevron; bottom: timer
│  └───────────────────────────┘  │
│                                 │
│  MY JOURNEYS                    │  ← section label
│  ┌─────────────────────────────┐ │
│  │ ← swipe →                  │ │  ← horizontal scroll, snap-to-card
│  │ ┌─────────┐  ┌─────────┐   │ │
│  │ │[Italian]│  │[Ruy Lop]│   │ │  ← journey cards 160×200px
│  │ │  ♙ White│  │ ♟ Black │   │ │    top 80px: opening family color bg
│  │ │  L1 ★☆☆ │  │  L2 ★★☆ │   │ │    badge stars: earned gold, empty gray
│  │ │ ██░░ 42%│  │ ████ 78%│   │ │    progress bar 4px
│  │ │ [Train] │  │ [Train] │   │ │    primary button 36px, full card width
│  │ └─────────┘  └─────────┘   │ │
│  └─────────────────────────────┘ │
│  [+ Add Journey]                │  ← ghost button, centered, 44px
│                                 │
│  FRIENDS THIS WEEK              │  ← section label
│  ┌───────────────────────────┐  │
│  │ [av] kasparov77  1,340 XP │  │  ← friend row 56px: avatar 36px circle,
│  │ [av] anand_fan     980 XP │  │    username, weekly XP right-aligned
│  │ [av] you ▶        760 XP  │  │    "you" row subtly highlighted
│  └───────────────────────────┘  │
│  [See full leaderboard →]       │  ← 14px link, gray-500
│                                 │
└─────────────────────────────────┘
Behavior notes:

Journey cards horizontal-scroll, show 1.4 cards (peek of second signals swipeability)
Streak banner hides after 2 seconds if user has ≥7 day streak and no freeze needed
Daily challenge card pulses border if not yet attempted today
[Train] button on each card launches directly into that journey's last mode


2. Browse / Journeys List + Filters
┌─────────────────────────────────┐
│  ← Browse Journeys      🔍      │  ← 56px top bar: back (if from Home), search icon
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🔍 Search openings...       │ │  ← search bar 44px, rounded-full, gray-100 bg
│  └─────────────────────────────┘ │
│                                 │
│  COLOR          FAMILY          │  ← filter row labels 11px caps
│  ┌──────────────────────────── ┐│
│  │[All][White][Black]          ││  ← pill toggle chips, 32px height
│  │[All][1.e4][1.d4][Flank]    ││    selected: accent bg + white text
│  └─────────────────────────────┘│
│                                 │
│  SORT ▾ Popularity              │  ← dropdown trigger, right-aligned, 14px
│                                 │
│  ─────────────────────────────  │  ← 1px divider
│                                 │
│  ┌───────────────────────────┐  │
│  │ [COLOR  │ Italian Game    │  │  ← list row 80px
│  │  CHIP]  │ White · C50–54 │  │    left: 48×48 color chip (white/black half-circle)
│  │         │ ★★★☆☆ · 1,240  │  │    title 16px bold, subtitle 13px gray
│  │         │ ██░░░░░  L1✓   │  │    star difficulty, user count
│  │         │                │  │    progress bar 4px if user has progress
│  │         │       [Start →]│  │    CTA 32px right-aligned
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [COLOR  │ Ruy López       │  │
│  │  CHIP]  │ White · C60–69 │  │
│  │         │ ★★★★☆ · 890    │  │
│  │         │ No progress    │  │
│  │         │       [Start →]│  │
│  └───────────────────────────┘  │
│                                 │
│  [ ... more rows ... ]          │
│                                 │
└─────────────────────────────────┘
Filter sheet (slides up from bottom when SORT ▾ tapped):
┌─────────────────────────────────┐
│  ▬  (drag handle)               │  ← 4px pill, centered
│  Sort & Filter                  │  ← 18px bold
│  ─────────────────────────────  │
│  SORT BY                        │
│  ○ Popularity    ● Name         │
│  ○ Difficulty    ○ Your progress│
│  ─────────────────────────────  │
│  LEVEL REQUIRED                 │
│  [☐ L1 only]  [☐ L2+]          │
│  ─────────────────────────────  │
│  [Reset]        [Apply filters] │
└─────────────────────────────────┘

3. Journey Detail (Tree View + Level Selector + Progress)
3a. Detail Header (above the tree)
┌─────────────────────────────────┐
│  ←  Italian Game — White    ⋮   │  ← back, title 18px, overflow menu
├─────────────────────────────────┤
│                                 │
│  ♙ White  ·  C50 – C54          │  ← color chip + ECO, 13px gray
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ L1  │ │ L2  │ │ L3  │        │  ← level selector tabs, 40px, pill shape
│  │ ★   │ │ ☆   │ │ ☆   │        │    ★ = earned, ☆ = not yet
│  │[sel]│ │     │ │     │        │    selected tab: solid accent bg
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│  Level 1 — 5 required lines     │  ← selected level description, 14px
│  ████████████░░░░  3 / 5 mastered│  ← progress bar 8px, label
│                                 │
│  ┌─────────────────────────────┐ │
│  │ 🏆 Level 1 Conqueror badge  │ │  ← badge preview card if not earned
│  │    2 more lines to unlock   │ │    or unlocked badge if earned (gold bg)
│  └─────────────────────────────┘ │
│                                 │
│  [Continue Training]            │  ← primary button, full width, 52px
│                                 │
├─────────────────────────────────┤
│  OPENING TREE ─────────────────  │  ← divider label
3b. Tree Visualization (scrollable canvas below header)
│                                 │
│           [e4]                  │  ← root node: 44px circle
│         ●─────●                 │    filled = mastered (gold)
│         │     │                 │    half-fill = learned (blue)
│        [e5]  [c5]               │    empty = unseen (gray)
│         │     │                 │
│   ┌─────┤     └──────┐          │
│  [Nf3] [f4]        [Nf3]        │  ← White branches go UPWARD
│   │                  │          │    (above center line)
│  [Nc6]             [d6]         │
│                                 │  ─────────── center line (horizon)
│   ↓ Black responses go DOWNWARD │
│                                 │
│  [Bc4]                          │
│   │                             │
│  [Nf6]  [Bc5]                   │
│                                 │
│  [L1 ring]  [L2 ring]           │  ← depth rings: dashed circles
│                                 │    overlaid on tree at L1/L2/L3 radii
│                                 │
└─────────────────────────────────┘
Node tap sheet (bottom sheet, 280px):
┌─────────────────────────────────┐
│  ▬                              │
│  e4 — King's Pawn Opening       │  ← move name 18px bold
│  Move 1 · Required · L1         │  ← metadata 13px
│  ─────────────────────────────  │
│  ● Mastered  ·  Next review: 12d│  ← state pill + SR info
│  ─────────────────────────────  │
│  "Controls the center and       │  ← annotation text, 14px, 3 lines max
│   opens diagonals for Bc4..."   │
│  ─────────────────────────────  │
│  [Drill this node]  [See games] │  ← two actions, ghost + primary
└─────────────────────────────────┘
Tree controls (floating, top-right of canvas):
┌────┐
│ +  │  ← zoom in
│ −  │  ← zoom out
│ ⌖  │  ← re-center
│ 👁 │  ← toggle: show all / required only
└────┘

4. Training Session
4a. Session — Board View
┌─────────────────────────────────┐
│  ×   Italian Game — White   ⏸  │  ← 56px: close (X warns), title, pause
├─────────────────────────────────┤
│  Recall  ·  Move 3             │  ← drill type pill + move number, 13px
│  ████████████████░░░░  8/12    │  ← session progress bar 6px
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │  8 │ ♜  ♞  ♝  ♛  ♚  ♝  ♞  ♜ ││  ← chess board
│  │  7 │ ♟  ♟  ♟  ♟  ♟  ♟  ♟  ♟ ││    square size: (390 - 32px margin) / 8 = 44.75px
│  │  6 │ .  .  .  .  .  .  .  . ││    files a–h labeled bottom
│  │  5 │ .  .  .  .  .  .  .  . ││    ranks 1–8 labeled left
│  │  4 │ .  .  .  .  ♙  .  .  . ││
│  │  3 │ .  .  .  .  .  .  .  . ││
│  │  2 │ ♙  ♙  ♙  ♙  .  ♙  ♙  ♙ ││
│  │  1 │ ♖  ♘  ♗  ♕  ♔  ♗  ♘  ♖ ││
│  │    │  a  b  c  d  e  f  g  h ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│                                 │
│  White to move. What's next?    │  ← prompt label 16px, centered
│                                 │
│  ┌────────┐  ┌────────┐         │  ← hint + flip buttons row
│  │  💡    │  │   ⇅    │         │    hint: reveals first letter of SAN
│  │  Hint  │  │  Flip  │         │    flip: rotate board
│  └────────┘  └────────┘         │
│                                 │
│  [Move list below board]        │  ← 14px, gray, shows game so far
│  1. e4  e5  2. Nf3  ...         │
│                                 │
└─────────────────────────────────┘
4b. Answer Feedback Overlay (appears 600ms after move played)
┌─────────────────────────────────┐
│       [board — dimmed]          │
│                                 │
│  ┌───────────────────────────┐  │
│  │   ✓  Correct!             │  │  ← green bg if correct, red if wrong
│  │                           │  │    appears bottom-up, 200ms ease
│  │   +10 XP                  │  │
│  │                           │  │
│  │   Nf3 — Knights before    │  │  ← explanation text (always for wrong,
│  │   bishops in the Italian. │  │    only on first exposure if correct)
│  │                           │  │
│  │   State: Learning → Known ★│  │  ← state change badge if promoted
│  │                           │  │
│  │          [Next →]         │  │  ← tap anywhere or [Next] to continue
│  └───────────────────────────┘  │
└─────────────────────────────────┘
4c. Session Complete Screen
┌─────────────────────────────────┐
│                                 │
│         🎉                      │  ← large emoji, centered
│   Session Complete!             │  ← 24px bold
│                                 │
│  ┌───┬───┬───┬───┐              │
│  │11/│91%│14d│+170│             │  ← 4-stat row: moves correct / accuracy /
│  │12 │acc│🔥 │ XP │             │    streak / XP earned. 16px bold value,
│  └───┴───┴───┴───┘              │    11px label below
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🏆  Level 1 Conqueror!    │  │  ← badge unlock card (if earned)
│  │     Italian Game — White  │  │    gold gradient bg, full-width
│  │     [Share]  [View badge] │  │    two actions
│  └───────────────────────────┘  │
│                                 │
│  NODES UPDATED                  │  ← section label 12px caps
│  ┌───────────────────────────┐  │
│  │ ● Nf3   learning → known  │  │  ← state change list, 44px rows
│  │ ● Bc4   known → mastered  │  │    dot color = new state
│  │ ● d4    seen → learning   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Continue Reviewing]           │  ← if SR queue has more
│  [Back to Home]                 │  ← secondary
│                                 │
└─────────────────────────────────┘

5. Sparring Mode
5a. Sparring Setup Screen
┌─────────────────────────────────┐
│  ←  Sparring Mode               │  ← back to session
├─────────────────────────────────┤
│                                 │
│  Italian Game — White           │  ← journey name, 20px bold
│  You play White from move 3     │  ← context line, 14px gray
│                                 │
│  DIFFICULTY                     │  ← label 12px caps
│  ┌─────────────────────────────┐│
│  │ [Easy]  [●Normal]  [Hard]  ││  ← 3-way toggle, Normal selected
│  │                             ││
│  │ Engine plays book moves,    ││  ← description updates per selection
│  │ responds at human speed     ││
│  └─────────────────────────────┘│
│                                 │
│  TIME PRESSURE                  │
│  ┌─────────────────────────────┐│
│  │ [Off]  [●10s]  [5s]        ││  ← per-move timer toggle
│  └─────────────────────────────┘│
│                                 │
│  STARTING POSITION              │  ← shows position where sparring begins
│  ┌─────────────────────────────┐│
│  │ [mini board 160×160px]     ││
│  │  After: 1.e4 e5 2.Nf3 Nc6 ││
│  └─────────────────────────────┘│
│                                 │
│  [Start Sparring]               │  ← primary button, full width 52px
│                                 │
└─────────────────────────────────┘
5b. Sparring Board (live game)
┌─────────────────────────────────┐
│  ×   Sparring  ·  Nf3 Nc6 Bc4  │  ← move list in header, scrolls right
│  ┌────────────────────────────┐ │
│  │  ⏱  8s                    │ │  ← timer bar (if enabled): full width, shrinks
│  └────────────────────────────┘ │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││  ← board identical to training (§4a)
│  │     [chess board]           ││    NO hint button in sparring
│  │                             ││    NO move list shown (tests memory)
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│                                 │
│  Your turn · White to move      │  ← prompt, 16px
│                                 │
│  ┌────────┐  ┌────────┐         │
│  │  ⇅    │  │  ⚑     │         │    flip board | resign (ends sparring)
│  │ Flip   │  │ Resign │         │
│  └────────┘  └────────┘         │
│                                 │
└─────────────────────────────────┘
Engine response animation: piece slides to destination in 400ms after user plays. If user plays wrong move (off-theory):
┌─────────────────────────────────┐
│  [board]                        │
│  ┌───────────────────────────┐  │
│  │ ⚠ Off theory!             │  │  ← amber bottom sheet, 140px
│  │                           │  │
│  │ You played d4. Theory was │  │
│  │ Bc4 (Italian bishop move) │  │
│  │                           │  │
│  │ [Continue anyway] [Undo]  │  │  ← continue advances, undo reverts
│  └───────────────────────────┘  │
└─────────────────────────────────┘
5c. Sparring Complete
┌─────────────────────────────────┐
│                                 │
│  ⚔️   Sparring Complete         │  ← 22px bold
│       8 moves · 92% accuracy    │  ← subtitle
│                                 │
│  ┌───────────────────────────┐  │
│  │ MOVE    YOUR      THEORY  │  │  ← move comparison table
│  │ ──────────────────────── │  │    3 cols: move#, user SAN, correct SAN
│  │ 1.      e4   ✓   e4      │  │    ✓ green, ✗ red
│  │ 2.      Nf3  ✓   Nf3    │  │
│  │ 3.      d4   ✗   Bc4    │  │
│  │ 4.      Bc4  ✓   Bc4    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─────────┬─────────┐          │
│  │  Win #2 │ +25 XP  │          │  ← sparring win count toward mastery gate
│  │  of 2   │         │          │    XP for the round
│  └─────────┴─────────┘          │
│                                 │
│  ✨ 2 sparring wins reached!    │  ← mastery gate notification (if triggered)
│     Complete 1 blinded quiz     │  ← next step toward mastered state
│     to reach Mastered           │
│                                 │
│  [Spar Again]  [Back to Session]│
│                                 │
└─────────────────────────────────┘

6. Profile (Badges + Stats)
┌─────────────────────────────────┐
│  Profile                    ⚙️  │  ← settings gear top-right
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │  [avatar 80px circle]       ││  ← hero card: full-width, navy bg
│  │  magnus99                   ││    avatar centered, name 20px bold
│  │  ♟ Bishop  ·  Level 18      ││    tier title + level
│  │                             ││
│  │  ┌──────────────────────── ┐││
│  │  │ ████████████░░  18/30  │││  ← XP bar toward next level
│  │  │ 12,400 XP remaining     │││    values 12px
│  │  └────────────────────────┘││
│  └─────────────────────────────┘│
│                                 │
│  STATS                          │  ← section label 12px caps
│  ┌──────┬──────┬──────┬──────┐  │
│  │  847 │  91% │  14  │   3  │  │  ← 4-stat grid, 80px each
│  │ moves│ acc  │streak│  L3s │  │    label 11px below value
│  └──────┴──────┴──────┴──────┘  │
│                                 │
│  CONQUEROR BADGES               │  ← section label
│  ┌─────────────────────────────┐│
│  │ ← swipe →                  ││  ← horizontal scroll, 120×120px cards
│  │ ┌──────┐  ┌──────┐  ┌────┐ ││    earned: gold gradient + name
│  │ │ ⭐L1 │  │ ⭐L2 │  │🔒L1│ ││    locked: gray + lock icon + "X lines to go"
│  │ │Italian│  │Italian│  │Ruy │ ││
│  │ │ Game │  │ Game  │  │Lop.│ ││
│  │ │Feb 10│  │Mar 01 │  │    │ ││
│  │ └──────┘  └──────┘  └────┘ ││
│  └─────────────────────────────┘│
│                                 │
│  ALL BADGES                     │  ← section label
│  ┌───────────────────────────┐  │
│  │ 🔥 14-day Flame    Feb 28 │  │  ← list rows 56px: icon, name, date right
│  │ ⚡ Sharp Accuracy  Feb 20 │  │
│  │ 🏆 Conq. L1 (ITA) Feb 10 │  │
│  │ [See all 8 badges →]      │  │  ← expands to full list
│  └───────────────────────────┘  │
│                                 │
│  ACTIVITY                       │  ← section label
│  ┌─────────────────────────────┐│  ← GitHub-style heatmap
│  │ J  F  M  A  M  J  J  A...  ││    7 rows (Mon–Sun), scrollable horizontally
│  │ ░  ░  ▒  ▓  ▓  █  ▓  ▒... ││    4 shades: none/light/medium/dark
│  └─────────────────────────────┘│
│                                 │
│  [Edit Profile]  [Share Profile]│  ← two equal-width buttons 44px, gray-100 bg
│                                 │
└─────────────────────────────────┘

7. Friends + Challenge Screen
7a. Friends List
┌─────────────────────────────────┐
│  ←  Friends                 ➕  │  ← back, title, add friend icon
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🔍 Search friends...        ││  ← search bar 44px
│  └─────────────────────────────┘│
│                                 │
│  ┌───────────────────────────┐  │
│  │[WEEK] [ALL TIME] [JOURNEY]│  │  ← tab row 36px, switches leaderboard view
│  └───────────────────────────┘  │
│                                 │
│  THIS WEEK                      │  ← section label, updates per tab
│                                 │
│  ┌───────────────────────────┐  │
│  │ #1  [av]  kasparov77      │  │  ← leaderboard rows 64px
│  │          1,340 XP  🔥18d  │  │    rank left, avatar, name, XP + streak
│  │          ─────────────    │  │    subtle divider between rows
│  │ #2  [av]  anand_fan       │  │
│  │           980 XP  🔥 7d  │  │
│  │          ─────────────    │  │
│  │ #3  [av]  YOU             │  │  ← your row: accent-tinted bg
│  │           760 XP  🔥14d  │  │
│  │          ─────────────    │  │
│  │ #4  [av]  fischer88       │  │
│  │           540 XP  🔥 3d  │  │
│  └───────────────────────────┘  │
│                                 │
│  PENDING REQUESTS  (2)          │  ← collapsible section, count badge
│  ┌───────────────────────────┐  │
│  │ [av]  tal_attacker        │  │  ← request row 64px
│  │       Sent you a request  │  │    name, subtitle
│  │       [Accept]  [Decline] │  │    two inline buttons 32px
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
7b. Add Friend Sheet (slides up)
┌─────────────────────────────────┐
│  ▬  Add a Friend                │
│  ─────────────────────────────  │
│  ┌─────────────────────────────┐│
│  │ Enter username or email...  ││  ← text input 44px, auto-focus
│  └─────────────────────────────┘│
│                                 │
│  [Search]                       │  ← primary button full-width
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ┌───────────────────────────┐  │  ← result row (appears after search)
│  │ [av]  tal_attacker  Lv.9  │  │
│  │       Bishop · 3 journeys │  │
│  │                [Send ➕]  │  │
│  └───────────────────────────┘  │
│                                 │
│  OR SHARE YOUR LINK             │  ← section label
│  ┌─────────────────────────────┐│
│  │ prepopening.com/u/magnus99  ││  ← read-only input
│  │                    [Copy]   ││
│  └─────────────────────────────┘│
│  [Share via…]                   │  ← native share sheet trigger
└─────────────────────────────────┘
7c. Challenge Inbox + Send Challenge
┌─────────────────────────────────┐
│  ←  Challenges              ⚔️  │
├─────────────────────────────────┤
│                                 │
│  INCOMING  (1)                  │  ← section label + count
│  ┌───────────────────────────┐  │
│  │ ⚔️  kasparov77 challenged │  │  ← challenge card 96px
│  │     you!                  │  │    left: sword icon
│  │                           │  │
│  │ Italian Game · Move 4     │  │    opening name + move depth
│  │ ⏱ 18h 22m remaining       │  │    countdown timer
│  │                           │  │
│  │ [View Challenge]          │  │    primary CTA right-aligned
│  └───────────────────────────┘  │
│                                 │
│  SENT  (2)                      │  ← section label
│  ┌───────────────────────────┐  │
│  │ → anand_fan               │  │  ← sent card 72px
│  │   Ruy López · Move 5      │  │
│  │   ⏳ Awaiting response    │  │    status label gray-400
│  │   ⏱ 4h 10m left           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ → fischer88               │  │
│  │   Italian · Move 3        │  │
│  │   ✓ Completed · You won!  │  │  ← result row: green for win, red for loss
│  │   [See results →]         │  │
│  └───────────────────────────┘  │
│                                 │
│  [Send New Challenge]           │  ← full-width button, 52px
│                                 │
└─────────────────────────────────┘
7d. Send Challenge Flow (bottom sheet)
┌─────────────────────────────────┐
│  ▬  Send a Challenge            │
│  ─────────────────────────────  │
│                                 │
│  CHALLENGE WHO?                 │  ← label 12px caps
│  ┌─────────────────────────────┐│
│  │ [av] kasparov77  ✓ selected ││  ← friend picker list
│  │ [av] anand_fan              ││    tap to select, checkmark appears
│  │ [av] fischer88              ││
│  └─────────────────────────────┘│
│                                 │
│  PICK A POSITION                │  ← label 12px caps
│  ┌─────────────────────────────┐│
│  │ FROM JOURNEY:               ││  ← dropdown: picks from active journeys
│  │ Italian Game — White   ▾   ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ [mini board 120px]    3.Bc4 ││  ← position preview + move label
│  │ Italian · Move 3            ││
│  │ [← Prev position] [Next →] ││  ← step through journey nodes
│  └─────────────────────────────┘│
│                                 │
│  [Send Challenge ⚔️]            │  ← primary, full-width 52px
│                                 │
└─────────────────────────────────┘
7e. Challenge Attempt Screen
┌─────────────────────────────────┐
│  ⚔️  kasparov77 challenged you  │  ← 56px banner: challenger name
│  Italian Game · Move 4          │  ← position context
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │     [full chess board]     ││  ← same board component as sparring
│  │                             ││    no hints, no undo
│  └─────────────────────────────┘│
│                                 │
│  White to move. Play the best   │  ← prompt 16px centered
│  theoretical continuation.      │
│                                 │
│  ⏱  00:08.4  (running up)       │  ← timer counting UP (recorded for result)
│                                 │
│  [Resign Challenge]             │  ← ghost danger button, centered
│                                 │
└─────────────────────────────────┘
7f. Challenge Result Screen
┌─────────────────────────────────┐
│                                 │
│  ⚔️  Challenge Result           │  ← 22px bold, centered
│                                 │
│  ┌────────────┬────────────┐    │
│  │  YOU       │  kasparov  │    │  ← side-by-side comparison, full-width
│  │  magnus99  │  kasparov77│    │    name 13px
│  │            │            │    │
│  │  100% acc  │   66% acc  │    │    accuracy large, 28px bold
│  │   8.4s     │    5.1s    │    │    time below in 16px
│  │            │            │    │
│  │  🏆 WINNER │            │    │    trophy badge on winner side
│  └────────────┴────────────┘    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  MOVE BREAKDOWN                 │  ← label 12px caps
│  ┌───────────────────────────┐  │
│  │ Move  You      Kasparov   │  │
│  │  3.   Bc4 ✓    Bc4 ✓     │  │  ← move table as in sparring complete
│  │  4.   Nf6 ✓    d4  ✗     │  │
│  └───────────────────────────┘  │
│                                 │
│  Correct line: 3.Bc4 4.Nf3     │  ← 14px gray
│                                 │
│  +30 XP each                   │  ← XP awarded to both players
│                                 │
│  [Challenge Back]  [Done]       │
│                                 │
└─────────────────────────────────┘

Implementation Notes
Component reuse across screens: The chess board, session progress bar, and journey card are shared components. Build them once as self-contained units with clearly defined props — most screens are just compositions of these four or five primitives.
Bottom sheets appear on 14 of these screens. Use a single BottomSheet component with a snapPoints prop ([280, 420, '90%']) — react-native-bottom-sheet handles this cleanly across iOS and Android.
The tree view is the only screen requiring custom rendering. Use an SVG canvas with pan/zoom gesture handlers. Pre-compute node positions server-side or on first load and cache them; re-computing a 50-node Sugiyama layout on every render will drop frames.
Board size: always screenWidth - 32px (16px margin each side), constrained to a max-width: 500px on tablet. Derive everything from this single measurement — square size, piece scale, label font size.
Transitions that matter most: answer feedback overlay (must feel instant — 0ms delay, 150ms ease-in), badge unlock (600ms spring, haptic), sparring engine move (400ms slide — long enough to see, short enough not to feel slow).