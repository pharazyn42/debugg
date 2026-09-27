# Contract Debugger

Context for continuing work on this game. This directory (`studio/`) is a
separate, self-contained project from the rest of this repo — `../index.html`
is "Debugg," an unrelated daily Wordle-style puzzle game. Don't conflate the
two or wire them together.

## What this is

An idle/incremental game where the core "active" mechanic is a Debugg-style
puzzle (read a short Python snippet, guess what it prints). Sitting behind
that is a studio-management idle layer: hire programmers, they passively
earn money and level up while you're not looking.

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

State persists in `localStorage` under the key `contract-debugger-state-v1`.
There's a small migration guard in the boot sequence that discards an
old-shaped `activeContract` from an earlier prototype version — bump this
key or add a similar guard if you change the state shape again.

## Data model (as currently implemented)

```js
PUZZLES = [{ file, html, type, answer, hint }, ...]   // 6 puzzles today
// type is one of 'number' | 'bool' | 'string' | 'list' — each has its own
// answer-normalization logic in checkAnswer(). html is pre-built syntax-
// highlighted markup (no client-side highlighter, just hand-written spans).

CONTRACT_LENGTHS = [
  { name: 'Quick Fix',     count: 1, multiplier: 1.0 },
  { name: 'Sprint',        count: 3, multiplier: 1.8 },
  { name: 'Milestone',     count: 5, multiplier: 3.2 },
  { name: 'Full Delivery', count: 8, multiplier: 6.0 }
]

LEVELS = ['Graduate', 'Junior', 'Senior', 'Principal']
LEVEL_STATS = { <level>: { sloc, salary, xpToNext } }   // per-minute figures

LANGUAGES = ['Python', 'C/C++', 'JavaScript', 'Rust', 'Assembly']
DOMAINS   = ['Web Dev', 'Games', 'Embedded/Controls', 'Safety-Critical', 'Data/AI']
```

**Top-level state:**
```js
state = {
  money, reputation,
  roster: [ { id, name, level, xp, skills: { languages, domains, primaryLang, primaryDom } }, ... ],
  lastTick,             // for offline-progress catch-up on load
  collapsedLevels: [],  // which roster level-groups are collapsed in the UI
  activeContract: null | {
    lengthIndex, puzzleIdxs: [...],
    index,               // which puzzle is currently being viewed
    puzzles: [ { attempts: [], status: 'open'|'solved'|'exhausted', clean, hintUsed }, ... ]
  }
}
```

## What's implemented

- **Contract flow**: pick a length, work through a queue of puzzles. Full
  navigation — click any dot in the queue strip to jump to that puzzle, or
  use Prev/Next. A puzzle that runs out of its 4 guesses locks as
  "exhausted" rather than failing the whole contract; you can skip it and
  work others. Once every puzzle is solved-or-exhausted with none left
  open, a banner explains full delivery is no longer possible and points at
  Bail. Once *all* are solved, a "Deliver contract" button appears.
- **Clean bonus**: solving a puzzle on your very first attempt with no hint
  used marks it "clean." Contract payout scales with the fraction of
  puzzles solved clean (50% base + up to 50% bonus). Reputation gain scales
  the same way.
- **Idle roster**: hired programmers passively earn `sloc * 0.5 − salary`
  money per minute (ticked every second), gain XP from SLOC output, and
  auto-promote through the 4 levels when XP crosses `xpToNext`. Closing and
  reopening the page grants offline earnings, capped at 4 hours.
- **Hiring**: cost scales `60 * 1.55^rosterSize`, always hires a fresh
  Graduate.
- **Roster UI**: grouped by level in a collapsible tree (click a level
  header to fold it), each group header shows summed SLOC/min and net
  ¤/min for that tier. Collapse state persists.
- **Employee skill panel**: click any employee card to open a modal showing
  their language/domain skills as pip bars (0–5), rolled at hire time —
  one primary language + one primary domain at level 2–3, small chance of
  a level-1 secondary in each.

## Known gaps — not wired in yet

These are deliberate, not bugs — flagging them so work doesn't duplicate or
assume they exist:

- **Reputation does nothing.** It's tracked and displayed (up on contract
  success, down by a flat 2 on failure/bail) but nothing reads it. Planned:
  gate which contract lengths/tiers are available behind a reputation
  threshold.
- **Skills don't affect payout.** The language/domain matrix exists and
  renders in the employee panel, but puzzles aren't tagged with a
  language/domain, and programmer skill level isn't multiplied into
  anything. This is the biggest gap vs. the original concept doc, which
  wanted contract payout to depend on skill match.
- **No "background contracts" board.** The concept doc describes idle
  income as programmers working actual background *contracts* with a
  target and a quality roll (chance of "shipping a bug"). What's actually
  implemented is simpler: flat passive SLOC/min → money conversion, no
  contract targets, no quality roll, no rework mechanic.
- **No training/certification spend.** Money currently only buys new
  hires. The concept doc's "Training," "Certifications," and "Studio
  upgrades" spend categories aren't implemented.
- **No prestige/reset mechanic.**
- **Puzzle bank is only 6 entries**, sampled randomly (no immediate
  repeat) — a Full Delivery contract (8 puzzles) will always repeat at
  least 2. Needs more puzzles or a generator.
- **Balance is untuned.** `BASE_PAY_PER_PUZZLE = 40`, `INCOME_PER_LINE =
  0.5`, the level stat table, and the hire-cost curve are all first-guess
  placeholder numbers, not the result of any playtesting/balancing pass.

## Testing notes

There's no test suite. When changing game logic, the fastest way to verify
correctness is a headless Playwright script driving the page directly
(`file://.../studio/index.html`) and asserting on DOM state/text — that's
how the puzzle-navigation and roster-tree features were verified during
development. Chromium is available; no `playwright install` needed if the
environment already has it configured.
