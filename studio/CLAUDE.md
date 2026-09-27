# Contract Debugger

Context for continuing work on this game. This directory (`studio/`) is a
separate, self-contained project from the rest of this repo — `../index.html`
is "Debugg," an unrelated daily Wordle-style puzzle game. Don't conflate the
two or wire them together.

## What this is

An idle/incremental game where the core "active" mechanic is a Debugg-style
puzzle (read a short Python snippet, guess what it prints). Sitting behind
that is a studio-management idle layer: grow a tiered team of programmers
and staff real-time contracts that keep running while you're not looking.

Original design brainstorm: `../ideas/contract-debugger-concept.md`. That
doc is the source of the overall vision — read it for the *why* behind
mechanics that aren't built yet. This file is the *current state* of the
actual implementation, which has diverged/simplified from that doc in a few
places (noted below).

## Everything lives in one file

`studio/index.html` — a single self-contained HTML/CSS/JS file, no build
step, no dependencies except a Google Fonts `@import`. Open it directly in
a browser to play, or serve via GitHub Pages (already configured — pushes
to `main` deploy automatically to `https://pharazyn42.github.io/debugg/studio/`).

State persists in `localStorage` under the key `contract-debugger-state-v3`.
The boot sequence has a small guard that drops an old-shaped
`activeContract`; bump the key or add a similar guard if you change the
state shape again.

## Data model (as currently implemented)

```js
PUZZLES = [{ file, html, type, answer, hint }, ...]   // 6 puzzles, Director's desk only
CONTRACT_LENGTHS = [...]   // desk contracts: 1/3/5/8 puzzles, 1x/1.8x/3.2x/6x

LANGS   = ['Python', 'C/C++', 'JavaScript', 'Rust', 'Assembly']
DOMAINS = ['Web Dev', 'Games', 'Embedded/Controls', 'Safety-Critical', 'Data/AI']
PAIRINGS = { <lang>: [domains it can be paired with on a contract] }
BAR_XP = [10, 50, 150, 400, 1000]   // cumulative XP for skill bars 1..5

ROLES = { Director, Manager, Graduate, Junior, Senior, Principal }  // sloc, salary/min, cost, reliability
PROMOTION = { Junior: {minutes:60, lang:1, dom:1}, Senior: {8h, 3, 2}, Principal: {3 days, 5, 5} }  // contract time only
RETRY_TIME = 0.5, RETRY_PAYOUT = 0.75
TIERS = [ quick fix ~5 SLOC / 1 dev, sprint ~400 SLOC / 3-5 + senior,
          milestone ~2,700 SLOC / 5-10 + principal,
          full delivery ~22,500 SLOC / 10+ incl. manager, 2 principals, 3 seniors ]
// each tier: minutes + refSloc (reference time for the cheapest valid team);
// an offer's SLOC target = refSloc × minutes ± SLOC_SPREAD (15%)
```

**Top-level state:**
```js
state = {
  money, reputation, lastTick,
  roster: [ { id, name, role, since, worked, lang: {name: xp}, dom: {name: xp} } ],  // Director is roster[0]; worked = ms on contracts at current level
  board:  [ { id, tier, lang, dom, sloc, expiresAt } ],  // 2 offers per tier; sloc = work target
  jobs:   [ { id, tier, lang, dom, sloc, teamSloc, team: [ids], startedAt, endsAt, chance, payout, repeat,
              status: 'running'|'failed', attempt: 1|2 } ],
  log:    [ { kind: 'ok'|'bad'|'info', text } ],
  collapsedLevels: [],                            // roster tree groups folded in the UI
  activeContract: null | { lengthIndex, puzzleIdxs, index, puzzles: [{ attempts, status, clean, hintUsed }] }
}
```

## What's implemented

- **Director's desk**: the player's own puzzle contracts. Pick a length and
  work through the queue with full navigation: click any dot, or use
  Prev/Next. A puzzle that runs out of guesses locks as "exhausted"; when
  everything is solved, a "Deliver contract" button appears. The clean
  bonus applies to first-try solves with no hint. This is the main source
  of cash early on.
- **Start-up**: you begin as the Director alone, and you double as the
  manager. The Director gives one slot at every level, one principal slot,
  and room for `DIRECTOR_SPAN` (4) devs, so you can hire a grad straight
  away. Growing beyond that needs real managers.
- **Tiered structure** (`capacity()` / `structureProblem()`):
  - Each dev supervises up to 3 people of the level directly below.
  - Each manager adds one slot per level, 3 principal slots, and room for
    12 devs.
  - Managers produce no SLOC.
  - Hiring, promoting and "Let go" are all blocked if they would break the
    structure, and the UI says why.
- **Hires' starting skills**:
  - Grads: one language at 1 bar, no domains.
  - Juniors: at most 1 bar in up to 2 domains.
  - Seniors: a language at 3–4 and a domain at 2–3.
  - Principals: a language and a domain at 5.
- **Promotions** need three things, and the player confirms with a
  "Promote" button:
  - **Contract time at the current level**: 1 hour for Junior, 8 hours for
    Senior, 3 days for Principal. Only time spent on contracts counts;
    time on the bench doesn't. It's credited when each contract finishes
    (`p.worked`) and resets on promotion.
  - **Skill bars**: as listed in `PROMOTION`.
  - **A free slot** at the next level.
- **Contract board**: offers are tagged with a random language + domain,
  shown on the card. Staff them via the team picker, which ticks off the
  requirements and shows success chance, payout and salary cost. It has a
  "Suggest a team" button. Each person can only be on one contract at a
  time.
  - **Skill rule**: a dev can only be put on a contract if they have at
    least one bar in its language or its domain (`qualifiedFor()`; managers
    are exempt). In the picker, unqualified people show greyed out, and a
    board card warns when nobody on staff qualifies.
  - **Offer expiry**: untaken offers are replaced after `offerLife`
    minutes (3 / 15 / 45 / 120 by tier), so the board keeps turning over;
    an offer open in the picker is never swapped out.
  - **SLOC drives time**: each offer is a SLOC target, shown on the card.
    Duration is the target divided by the team's combined SLOC/min
    (managers add none), with a 5-second floor.

    Each dev's SLOC/min on a contract is boosted by skill match:
    × (1 + `SKILL_SPEED` × (lang bars + domain bars) / 10) for that
    contract's language and domain. A full 5+5 match doubles their output.

    The reference team, with no matching skills, takes the nominal time:
    - a lone grad on a quick fix: ~1 min;
    - senior + 2 grads on a sprint: ~10 min;
    - principal + 4 grads on a milestone: ~30 min;
    - 2 principals + 3 seniors + 4 grads + a manager on a full delivery:
      ~90 min.

    More senior, bigger or better-matched teams finish sooner. The picker
    shows each person's SLOC/min on that contract, plus the team total with
    the skill-match boost and the resulting time.
  - Payout = SLOC target × `LINE_RATE` × tier multiplier × skill match. So
    a contract pays the same whoever does it; faster teams simply earn more
    per minute and pay less salary per contract.
  - Success chance = average reliability by level, plus a small bonus for
    skill match.
  - On delivery, everyone on the team gains the tier's XP in that
    language and domain. XP is per minute spent on it (`xpPerMin`: 1 /
    1.2 / 1.33 / 1.5 by tier), independent of team speed, so skill bars
    build at roughly the pace of the contract-time promotion timers. This is the placeholder skill-gain
    mechanic; it doesn't yet model supervision.
  - **Retry on failure**: a failed contract can be retried once, in half
    the time, for 75% of the payout. If the retry fails, the contract is
    lost. Non-repeating jobs wait in a "failed" state, with the team held,
    until the player picks Retry or Drop. Repeating jobs retry
    automatically, since it's the better deal per minute.
- **Repeat**: a job can be set to roll straight into a new contract of the
  same type with the same team when it finishes. The new contract is chosen
  so the whole team qualifies under the skill rule. This is on by default for
  quick fixes. Repeats keep chaining while the page is closed, up to the
  4-hour offline cap, and stop if the team no longer meets the
  requirements.
- **Roster UI**: the Director card, then a collapsible tree grouped by
  level. Each group header shows its headcount, how many are busy, SLOC/min
  and salary/min. Collapse state persists. Clicking a card opens the
  employee panel: all languages and domains as pip bars with XP to the next
  bar, current assignment, and a promotion checklist.
- **Payroll** is drawn every second, including offline (capped at 4 hours).
  Cash can go negative.

## Known gaps — not wired in yet

- **Reputation does nothing** beyond being tracked. Planned: gate contract
  tiers behind reputation.
- **Skill gain is a placeholder**: flat XP per delivered contract, with no
  supervision/mentoring effect yet.
- **No training/certification spend, studio upgrades, or prestige.**
- **Puzzle bank is only 6 entries** (desk contracts only).
- **Balance is untuned**: the `ROLES` stats, `LINE_RATE`, tier multipliers,
  and hire costs are first guesses.

## Future development

Agreed direction, not built yet. Roughly in no particular order.

### Training for language and domain skills
- Add a way to spend money (and/or time off contracts) to train a person's
  language or domain skills directly, alongside the XP earned from
  delivered contracts.
- Open questions:
  - Is training a one-off purchase per bar, a timed course during which
    the person is unavailable for contracts, or both?
  - Should cost scale with the target bar?
  - Should there be a cap so training can't replace real contract
    experience (e.g. training only up to bar 3)?

### Business tiers and multiple sites
- Show a business-tier label that grows with headcount: Start-up →
  Small business → … → something massive (e.g. Multinational).
- Thresholds and names are TBD. The current Director-as-manager phase is
  the "Start-up" tier.
- Moving up a tier could unlock things: more contract-board slots, bigger
  contract types, new hire types.
- At larger tiers, add an option to expand to multiple sites (offices).
  Each site would plausibly have its own headcount capacity and managers,
  possibly a regional speciality (e.g. an embedded-heavy site). How sites
  interact with team staffing (can a team span sites?) is TBD.

### Daily desk contracts
- The puzzle contracts at the Director's desk should refresh once a day,
  with only one contract of each type (Quick Fix, Sprint, Milestone, Full
  Delivery) playable per day. The aim is to bring players back daily,
  like the main Debugg game.
- This needs:
  - a per-day seed so everyone gets the same puzzles that day;
  - tracking which types have been played today;
  - a "come back tomorrow" state;
  - a much bigger puzzle bank than 6.

### Success chance and speed scale with level and skill match
Replace the current flat reliability-by-level model:
- **Success chance** depends on both dev level and how well their skills
  suit the contract's language/domain. Reference point for a Graduate:
  - 25% when their skills don't match;
  - 50% base;
  - 75% when they do match.
- **Each level up** raises both the success chance and the delivery speed
  (a principal finishes faster and more reliably than a grad on the same
  job).
- **Speed**: done. Duration shrinks with dev level and with skill match,
  via effective SLOC/min (see "SLOC drives time" above).
- **Teams**: exact curves are TBD, as is how per-person chances combine for
  a team (average, weighted by SLOC, or weakest link).

### Show potential contract values on the desk
- The Director's desk contract picker should show what each contract could
  pay before you start it: e.g. the range from "all solved, none clean" to
  "all clean". Reputation gain could be shown the same way.

### Per-hire speed multiplier
- Each new hire rolls a random, permanent speed multiplier that scales
  their SLOC/min (e.g. 0.7×–1.3×, range TBD). It's stored on the person
  and never changes, including on promotion; it stacks with the level's
  base SLOC and the skill-match boost.
- The point is that a slow hire stays slow forever, which gives the
  player a real reason to let people go and rehire.
- It needs to be visible on the roster card and employee panel. Maybe
  also on hire, e.g. "fast / average / slow". That could suggest hiring
  shows a candidate before you pay.

### Show what makes up the success chance
- When staffing a contract (team picker), break the success chance down
  into its contributing factors instead of only the final %, e.g.:
  - each person's base reliability for their level;
  - the skill-match bonus;
  - any cap.

  This ties in with the planned level/skill success rework above.

### Current contract in the employee panel
- Clicking an employee should show the contract they're working on.
  Today the panel only has a one-line "On Sprint (Rust / Web Dev) — 4:12
  left". It should show the full contract:
  - type, language and domain;
  - teammates;
  - progress (SLOC done / target, time left);
  - success chance and payout;
  - repeat status;
  - the failed/retry state.

### Office space: desks, contractors, and buildings (later game)
- Another progression limiter. On-site staff need a desk. You start with
  one free room with a small number of desks (e.g. 4).
- **Contractors** work from home, so they need no desk, but cost more
  (higher salary and/or hire cost). They're a way past the desk cap
  before you can afford space.
- Over time you rent offices, buy rooms, then whole buildings, each adding
  desks. This fits with the business tiers and multiple sites in the
  section above; sites could be where buildings live.
- Open questions:
  - Do contractors count towards the supervision structure and manager
    span?
  - Can they be promoted?
  - Do they gain XP at the same rate?

### Visualise the team and the office
- Some visual representation of the studio: people at desks in
  rooms/buildings, grouped by team or level. It could show who's working
  on what and empty desks. It would pair naturally with the office-space
  mechanic.

### SLOC production animation
- Animate SLOC being produced, e.g. a running counter or lines of code
  ticking up on active contracts, or little bursts from each busy
  person, so the idle layer feels alive rather than just progress bars.

### Total SLOC/min in the top stats bar
- Add a studio-wide SLOC/min stat next to Cash, Reputation, Payroll and
  Headcount. Open question: count only people currently on contracts,
  or show "active / potential"?

## Testing notes

There's no test suite. When changing game logic, the fastest way to verify
correctness is a headless Playwright script driving the page directly
(`file://.../studio/index.html`) and asserting on DOM state/text — that's
how the puzzle-navigation and roster-tree features were verified during
development. Chromium is available; no `playwright install` needed if the
environment already has it configured.
