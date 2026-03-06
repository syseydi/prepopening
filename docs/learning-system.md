PrepOpening Spaced Repetition & Mastery Algorithm

Design Philosophy
Standard SM-2 was built for vocabulary flashcards — binary items with no structural relationships. Chess opening nodes violate three of its assumptions:

Nodes are not independent. Mastering e4 makes Nf3 easier. The algorithm must propagate confidence signals up and down the tree.
"Correct" is not binary. A user who plays Bc4 on move 3 after two hints is not equivalent to one who plays it instantly from a cold position.
Importance is not uniform. A required node on the main line deserves more aggressive scheduling than an optional sideline.

The algorithm below addresses all three.

Parameters (tunable per ELO tier)
PARAMS = {
  # SM-2 ease bounds
  EASE_MIN:              1.3,    # floor — prevents interval from collapsing
  EASE_MAX:              3.5,    # ceiling — prevents infinite drift
  EASE_DEFAULT:          2.5,

  # Ease deltas per answer quality (0–5 scale; see quality scoring below)
  EASE_DELTA: {
    5: +0.10,   # perfect
    4: +0.05,   # correct, slight hesitation
    3:  0.00,   # correct after hint
    2: -0.15,   # correct after 2nd attempt
    1: -0.20,   # incorrect, immediately shown answer
    0: -0.30,   # complete blank / gave up
  },

  # Interval multipliers
  INTERVAL_PASS_FACTOR:  ease_factor,  # SM-2 standard
  INTERVAL_FAIL_RESET:   1,            # days — restart from scratch
  INTERVAL_FIRST_PASS:   1,            # day 1 after first correct
  INTERVAL_SECOND_PASS:  3,            # day 3 after second correct
  MAX_INTERVAL:          180,          # days — cap for mastered nodes

  # Fading threshold
  FADING_MULTIPLIER:     2.0,  # if now > next_review * 2.0 → state = fading

  # Mastery gate thresholds (consecutive correct answers required)
  GATES: {
    "new"      → "learning":  1,   # any correct guided answer
    "learning" → "known":     3,   # 3 consecutive correct recalls
    "known"    → "mastered":  2,   # 2 correct sparring + 1 blinded pass
  },

  # Priority scoring weights
  W_OVERDUE:      0.40,   # how late the review is
  W_IMPORTANCE:   0.30,   # required node + popularity
  W_DIFFICULTY:   0.15,   # harder nodes prioritised slightly
  W_RECENCY:      0.15,   # prefer nodes not seen in current session

  # ELO tier modifiers (applied to interval output)
  ELO_INTERVAL_SCALE: {
    "beginner":     0.7,  # shorter intervals — more repetition needed
    "intermediate": 1.0,  # baseline
    "advanced":     1.3,  # longer intervals — less hand-holding
  },

  # Queue composition targets (out of 20 items)
  QUEUE_SLOTS: {
    "overdue_review":  8,   # items past next_review_at
    "new_nodes":       6,   # never seen before
    "learning_recall": 4,   # in-session reinforcement
    "fading":          2,   # state = fading, urgent
  },
}

State Machine
States:       new → learning → known → mastered
                                         ↓ (if missed review × 2)
                                       fading → known (re-review)
                                         ↓ (if missed review × 5)
                                       lapsed  (restart from learning)

Drill type unlocked per state:
  new       →  guided walkthrough only
  learning  →  recall quiz (3 attempts)
  known     →  blinded quiz + error drill
  mastered  →  sparring + speed round
  fading    →  recall quiz (treat as learning)
  lapsed    →  guided walkthrough (treat as new)

Quality Score (replaces binary correct/incorrect)
This is the key improvement over raw SM-2. Every answer maps to a 0–5 quality score:
pythondef score_answer(result, attempt_number, time_ms, hint_used, node_difficulty):
    """
    result:         "correct" | "incorrect"
    attempt_number: 1, 2, or 3
    time_ms:        response time in milliseconds
    hint_used:      bool
    node_difficulty: 1–5
    """

    if result == "incorrect" and attempt_number == 3:
        return 0   # gave up entirely

    if result == "incorrect":
        return 1   # wrong but still trying

    # Correct answer — determine quality by speed and aids used
    if hint_used:
        return 3   # correct but needed a hint

    if attempt_number == 2:
        return 2   # correct on retry (self-corrected)

    # Attempt 1, no hint — score by response time relative to difficulty
    expected_ms = 2000 + (node_difficulty * 800)   # 2.8s for diff=1, 6s for diff=5
    speed_ratio = time_ms / expected_ms

    if speed_ratio < 0.5:
        return 5   # fast and confident — full ease bonus
    elif speed_ratio < 1.2:
        return 4   # normal speed — slight ease bonus
    else:
        return 3   # slow but correct — no ease change

SM-2 Update Function
pythondef update_node_after_answer(node_state, quality, elo_tier):
    """
    node_state: the UserNodeState record
    quality:    0–5 from score_answer()
    elo_tier:   "beginner" | "intermediate" | "advanced"

    Returns: updated node_state fields
    """

    scale = PARAMS.ELO_INTERVAL_SCALE[elo_tier]

    # ── 1. Update ease factor ──────────────────────────────────────────
    delta = PARAMS.EASE_DELTA[quality]
    new_ease = clamp(
        node_state.ease_factor + delta,
        PARAMS.EASE_MIN,
        PARAMS.EASE_MAX
    )

    # ── 2. Compute next interval ───────────────────────────────────────
    if quality < 2:
        # Failed — reset interval but don't fully restart yet
        new_interval = PARAMS.INTERVAL_FAIL_RESET
        node_state.consecutive_correct = 0
        node_state.times_incorrect += 1
    else:
        # Passed
        node_state.consecutive_correct += 1
        node_state.times_correct += 1

        if node_state.repetitions == 0:
            new_interval = PARAMS.INTERVAL_FIRST_PASS
        elif node_state.repetitions == 1:
            new_interval = PARAMS.INTERVAL_SECOND_PASS
        else:
            raw = round(node_state.interval_days * new_ease)
            new_interval = min(raw, PARAMS.MAX_INTERVAL)

        node_state.repetitions += 1

    # Apply ELO scaling
    new_interval = max(1, round(new_interval * scale))

    # ── 3. Apply importance boost ──────────────────────────────────────
    # Required nodes on the main line get slightly shorter intervals
    # so they surface more often until deeply mastered
    if node_state.node.is_required and node_state.state != "mastered":
        importance_factor = 1.0 - (node_state.node.popularity_score * 0.15)
        # popularity_score in [0,1]: 1.0 = played in 80%+ of games
        new_interval = max(1, round(new_interval * importance_factor))

    # ── 4. Persist ─────────────────────────────────────────────────────
    node_state.ease_factor    = new_ease
    node_state.interval_days  = new_interval
    node_state.next_review_at = now() + days(new_interval)
    node_state.last_reviewed_at = now()

    return node_state

State Transition Function
Called after update_node_after_answer, separately so transitions stay readable:
pythondef advance_state(node_state, quality, drill_type):
    """
    Applies mastery gate logic. Returns (new_state, badge_check_needed).
    """
    prev_state = node_state.state

    # ── Failure handling ───────────────────────────────────────────────
    if quality < 2:
        node_state.consecutive_correct = 0  # already done above, belt+suspenders

        if prev_state == "mastered":
            node_state.state = "known"       # one failure demotes mastered → known
        elif prev_state == "known":
            node_state.state = "learning"    # two failures in a row → learning
        # learning/new failures don't change state — just reset the interval

        return node_state, False

    # ── Forward transitions ────────────────────────────────────────────
    cc = node_state.consecutive_correct   # already incremented above
    gates = PARAMS.GATES

    if prev_state == "new" and cc >= gates["new→learning"]:
        node_state.state = "learning"

    elif prev_state == "learning" and cc >= gates["learning→known"]:
        # Additional gate: must have passed recall drill (not just guided)
        if drill_type in ("recall", "blinded", "sparring"):
            node_state.state = "known"
            node_state.consecutive_correct = 0  # reset counter for next gate

    elif prev_state == "known":
        # Gate: need blinded pass AND sparring wins tracked separately
        if drill_type == "blinded":
            node_state.blinded_passes = getattr(node_state, "blinded_passes", 0) + 1
        if drill_type == "sparring":
            node_state.sparring_wins = getattr(node_state, "sparring_wins", 0) + 1

        if node_state.blinded_passes >= 1 and node_state.sparring_wins >= 2:
            node_state.state = "mastered"
            node_state.first_mastered_at = node_state.first_mastered_at or now()
            node_state.consecutive_correct = 0
            return node_state, True   # trigger badge check

    elif prev_state == "fading":
        if cc >= 2:
            node_state.state = "known"   # recover fading without full re-mastery

    elif prev_state == "lapsed":
        if cc >= gates["new→learning"]:
            node_state.state = "learning"

    return node_state, False


# Nightly cron: detect fading and lapsed nodes
def decay_stale_nodes(user_id):
    stale = query("""
        SELECT * FROM user_node_states
        WHERE user_id = $1
          AND state IN ('mastered', 'known', 'learning')
          AND next_review_at < NOW()
    """, user_id)

    for ns in stale:
        overdue_ratio = (now() - ns.next_review_at).days / max(ns.interval_days, 1)

        if overdue_ratio >= PARAMS.FADING_MULTIPLIER and ns.state == "mastered":
            ns.state = "fading"
        elif overdue_ratio >= 5.0:
            ns.state = "lapsed"
            ns.consecutive_correct = 0
            ns.repetitions = 0
            ns.interval_days = 1
            # ease_factor retained — long-term memory partially preserved

        save(ns)

Priority Scoring Function
Used to rank candidates when building the daily queue:
pythondef priority_score(node_state, node, session_node_ids):
    """
    Returns a float in [0, 1] for queue ranking.
    Higher = more urgent to review.
    session_node_ids: set of node IDs already in this session's queue
    """

    # ── Overdue score ──────────────────────────────────────────────────
    # 0.0 if not yet due; rises linearly up to 1.0 at 3× overdue
    days_overdue = max(0, (now() - node_state.next_review_at).days)
    overdue_score = min(1.0, days_overdue / (3.0 * node_state.interval_days))

    # ── Importance score ───────────────────────────────────────────────
    importance_score = (
        (0.6 if node.is_required else 0.2) +
        (node.popularity_score * 0.4)   # popularity_score in [0, 1]
    )
    importance_score = min(1.0, importance_score)

    # ── Difficulty score ───────────────────────────────────────────────
    # Normalise difficulty 1–5 to 0–1; prefer harder nodes slightly
    difficulty_score = (node.difficulty - 1) / 4.0

    # ── Recency score ─────────────────────────────────────────────────
    # Penalise nodes already queued in this session
    recency_score = 0.0 if node_state.node_id in session_node_ids else 1.0

    # ── Weighted sum ───────────────────────────────────────────────────
    W = PARAMS
    return (
        W.W_OVERDUE    * overdue_score    +
        W.W_IMPORTANCE * importance_score +
        W.W_DIFFICULTY * difficulty_score +
        W.W_RECENCY    * recency_score
    )

Build Daily Queue — Select Next 20 Items
pythondef build_review_queue(user, journey_id, session_node_ids=set()):
    """
    Returns ordered list of 20 DrillItem dicts for the session.
    Respects QUEUE_SLOTS composition targets.
    """

    slots = PARAMS.QUEUE_SLOTS   # {overdue_review:8, new_nodes:6, learning_recall:4, fading:2}
    elo   = user.elo_tier        # "beginner" | "intermediate" | "advanced"
    queue = []

    # ── Fetch candidates from DB ───────────────────────────────────────
    all_states = fetch_user_node_states(user.id, journey_id)
    # Separate by category
    overdue  = [ns for ns in all_states if ns.state in ("known","mastered")
                                        and ns.next_review_at <= now()]
    fading   = [ns for ns in all_states if ns.state == "fading"]
    lapsed   = [ns for ns in all_states if ns.state == "lapsed"]
    learning = [ns for ns in all_states if ns.state == "learning"]
    new_ns   = [ns for ns in all_states if ns.state == "new"]

    # ── Score and sort each pool ───────────────────────────────────────
    def scored(pool):
        return sorted(
            pool,
            key=lambda ns: priority_score(ns, ns.node, session_node_ids),
            reverse=True
        )

    # ── Fill slots ─────────────────────────────────────────────────────

    # 1. Fading — always service first (urgent, small pool)
    fading_picks = scored(fading + lapsed)[:slots["fading"]]
    queue.extend(to_drill_items(fading_picks, elo))

    # 2. Overdue reviews
    overdue_picks = scored(overdue)[:slots["overdue_review"]]
    queue.extend(to_drill_items(overdue_picks, elo))

    # 3. In-session learning reinforcement
    # Pick nodes seen earlier in session (or recently wrong) for immediate re-exposure
    learning_picks = scored(learning)[:slots["learning_recall"]]
    queue.extend(to_drill_items(learning_picks, elo))

    # 4. New nodes — prefer required nodes, then by tree order (parent before child)
    new_sorted = sorted(new_ns, key=lambda ns: (
        0 if ns.node.is_required else 1,
        -ns.node.popularity_score,
        ns.node.sort_order
    ))
    new_picks = new_sorted[:slots["new_nodes"]]
    queue.extend(to_drill_items(new_picks, elo, force_guided=True))

    # ── Pad to 20 if slots unfilled ────────────────────────────────────
    # (happens when new users or very small journeys)
    filled = len(queue)
    if filled < 20:
        remaining_new = new_sorted[len(new_picks):]
        remaining_overdue = scored(overdue)[len(overdue_picks):]
        pad_pool = remaining_new + remaining_overdue
        queue.extend(to_drill_items(pad_pool[:20 - filled], elo))

    # ── Interleave to avoid monotony ───────────────────────────────────
    # Don't run all new nodes in a block — shuffle within category boundaries
    queue = interleave(queue, chunk_size=3)
    # interleave: take 1 from each non-empty category every 3 items
    # so user sees: overdue, new, learning, overdue, new, learning...

    return queue[:20]


def to_drill_items(node_states, elo_tier, force_guided=False):
    """
    Converts node_states to DrillItem dicts with appropriate drill_type.
    """
    items = []
    for ns in node_states:
        drill_type = pick_drill_type(ns, elo_tier, force_guided)
        items.append({
            "drill_item_id":   ns.node.drill_items[drill_type].id,
            "node_id":         ns.node_id,
            "drill_type":      drill_type,
            "prompt_fen":      ns.node.fen,
            "move_number":     ns.node.move_number,
            "color_to_move":   ns.node.color_to_move,
            "hint_text":       ns.node.drill_items[drill_type].hint_text,
            "distractor_sans": ns.node.drill_items[drill_type].distractor_sans,
        })
    return items


def pick_drill_type(node_state, elo_tier, force_guided=False):
    """
    Selects the appropriate drill type for a node's current state.
    Advanced users skip guided on review; beginners stay on recall longer.
    """
    if force_guided or node_state.state == "new":
        return "guided"

    if node_state.state == "lapsed":
        return "guided"     # full re-exposure for lapsed nodes

    if node_state.state == "fading":
        return "recall"     # treat fading like learning

    if node_state.state == "learning":
        if elo_tier == "advanced" and node_state.consecutive_correct >= 2:
            return "blinded"   # advanced users skip to blinded faster
        return "recall"

    if node_state.state == "known":
        # Rotate between blinded and sparring to fill both gates
        if node_state.blinded_passes < 1:
            return "blinded"
        if node_state.sparring_wins < 2:
            return "sparring"
        return "blinded"   # already gated — keep reviewing

    if node_state.state == "mastered":
        # Mastered nodes: use speed round for rapid warm-up
        if elo_tier == "beginner":
            return "recall"    # beginners don't get speed rounds on mastered
        return "speed"

Tree Propagation (parent-child confidence)
This is the piece SM-2 misses entirely:
pythondef propagate_mastery_signal(node_id, journey_version_id, user_id, direction="up"):
    """
    When a node's state changes, nudge ease_factor of related nodes.
    direction: "up" = ancestors, "down" = descendants, "both"
    """
    node = fetch_node(node_id)

    if direction in ("up", "both"):
        # Mastering a child provides mild confidence to its parent
        parent = fetch_parent(node, journey_version_id)
        while parent:
            parent_state = fetch_node_state(user_id, parent.id)
            if parent_state and parent_state.state in ("learning", "known"):
                # Slight ease boost — child mastery signals pattern recognition
                parent_state.ease_factor = min(
                    PARAMS.EASE_MAX,
                    parent_state.ease_factor + 0.05
                )
                save(parent_state)
            parent = fetch_parent(parent, journey_version_id)

    if direction in ("down", "both"):
        # When a node is lapsed/fading, flag immediate children for early review
        children = fetch_children(node, journey_version_id)
        for child in children:
            child_state = fetch_node_state(user_id, child.id)
            if child_state and child_state.state in ("known", "mastered"):
                # Pull forward the next review
                child_state.next_review_at = min(
                    child_state.next_review_at,
                    now() + days(2)
                )
                save(child_state)

Full Answer Pipeline (what POST /sessions/:id/answers calls)
pythondef handle_answer(session_id, drill_item_id, node_id, played_san,
                  attempt_number, time_ms, hint_used):

    # 1. Validate move
    correct_san  = fetch_correct_san(drill_item_id)
    result       = "correct" if played_san == correct_san else "incorrect"
    drill_type   = fetch_drill_type(drill_item_id)

    # 2. Score quality
    node         = fetch_node(node_id)
    quality      = score_answer(result, attempt_number, time_ms,
                                hint_used, node.difficulty)

    # 3. Load current state
    node_state   = fetch_or_create_node_state(session.user_id, node_id)
    prev_state   = node_state.state

    # ── DB transaction begins ──────────────────────────────────────────

    # 4. SM-2 update (interval, ease, repetitions)
    node_state   = update_node_after_answer(node_state, quality, user.elo_tier)

    # 5. State machine transition
    node_state, badge_check = advance_state(node_state, quality, drill_type)

    # 6. Tree propagation
    if node_state.state != prev_state:
        direction = "up" if node_state.state > prev_state else "down"
        propagate_mastery_signal(node_id, session.journey_version_id,
                                 session.user_id, direction)

    # 7. XP
    xp = compute_xp(quality, result, drill_type, node_state.state)
    award_xp(session.user_id, xp, reason="session_answer", ref=session_id)

    # 8. Badge check
    badges_earned = []
    if badge_check:
        badges_earned = check_and_award_badges(
            session.user_id, session.journey_id, session.journey_version_id
        )

    # 9. Persist session answer record
    save_session_answer(session_id, drill_item_id, node_id, result,
                        played_san, attempt_number, time_ms, quality)

    # ── DB transaction commits ─────────────────────────────────────────

    # 10. Build response
    return {
        "result":             result,
        "correct_san":        correct_san,
        "explanation":        node.drill_items[drill_type].explanation if result == "incorrect" else None,
        "node_state_update":  {...node_state fields...},
        "xp_earned":          xp,
        "badges_earned":      badges_earned,
        "session_stats":      fetch_session_stats(session_id),
    }

Tuning Cheat Sheet
ParameterRaise if…Lower if…EASE_DELTA[5]Users complain reviews come too soonMastered nodes fade too quicklyGATES learning→knownUsers feel they're promoted too fastQueue is clogged with "known" itemsFADING_MULTIPLIERToo many fading alertsUsers surprised by forgotten nodesW_OVERDUEOverdue items pile up unservicedNew content never surfacesW_IMPORTANCERequired lines being neglectedOptional sidelines never get reviewedELO_INTERVAL_SCALE beginnerBeginners are overwhelmed with reviewsBeginners are forgetting too fastMAX_INTERVALAdvanced users have stale reviewsLong-term mastered nodes resurface too oftenQUEUE_SLOTS new_nodesSessions feel repetitiveUsers feel buried in unfamiliar material
The most impactful single change you can make post-launch: instrument quality score distributions per ELO tier. If beginners are averaging quality 2.1 (borderline pass) and advanced users are averaging 4.3, your ELO_INTERVAL_SCALE is well-calibrated. If those numbers converge, the tier modifiers aren't doing enough work.