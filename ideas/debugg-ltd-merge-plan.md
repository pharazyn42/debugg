# Merge plan: Debugg + Debugg Ltd

How to turn the two games into one. Debugg's daily puzzles become the
Director's desk, and a "Start your own company" option switches on Debugg
Ltd (the studio, team and contract board) around them.

This is the build plan for roadmap item 3c in `studio/CLAUDE.md`. It does
3c *before* the rest of 3b: the desk starts as the daily puzzles that
already exist (one per language per day, i.e. the Hotfix tier), and the
Patch / Minor / Major release tiers from 3b come later, on top of a game
that's already merged.

## The experience we're aiming for

**Studio off (the default).** The site is Debugg exactly as it is today:
daily puzzles in Python and JavaScript, XP and levels per language, the
streak, the sandbox. The only addition is a quiet "Start your own
company" link. Someone who only wants puzzles never sees anything else.

**Studio on.** The same page grows into Debugg Ltd:

- The stats bar (cash, reputation, payroll, headcount) sits across the
  top.
- The left column is **Your desk**: today's daily puzzle, with the same
  language tabs, guesses, hints and reveal as the plain game. It's the
  same puzzle, with the same progress: nothing is duplicated.
- The right column is the studio roster and hiring; the contract board,
  jobs and log sit below. On phones everything stacks in one column,
  desk first.
- Solving a desk puzzle pays the company cash and reputation, scaled by
  how well you did.
- Your per-language XP from the puzzles *is* the Director's language
  skill, so the roster card for "You" shows your real Python and
  JavaScript levels.

**Switching off** pauses the company: no salaries, no contract progress,
nothing lost. Switching back on resumes where it left off.

## Guiding rules

1. **The puzzle game never depends on the studio.** Studio code only
   loads when the studio is on. The puzzle page announces results; the
   studio listens and pays. Nothing flows the other way.
2. **One set of puzzle progress.** One record per language per day, one
   streak, one XP total per language, whichever mode you played in.
3. **Nobody loses a save.** Existing Debugg progress and existing Debugg
   Ltd companies both carry over.
4. **No half-merged state goes live.** The merged version is built behind
   a preview flag and only replaces `/studio/` once it's complete.

## How the desk changes

Today the studio's desk is unlimited, repeatable puzzle contracts (Quick
Fix / Sprint / Milestone / Full Delivery: 1, 3, 5 or 8 puzzles from a bank
of 6), and it's the main source of early cash. After the merge:

| | Today's studio desk | Merged desk |
|---|---|---|
| Puzzles | 6 Python puzzles, drawn at random | The daily puzzle bank (`puzzles.js`), one per language per day |
| How often | Unlimited | One per language per day (2 a day right now) |
| Contract lengths | 1 / 3 / 5 / 8 puzzles with multipliers | Gone; each puzzle stands alone |
| Checking answers | Its own `checkAnswer` with answer types | Debugg's matcher (`normalise`) |
| Hints | One hint, costs the "clean" bonus | Debugg's two hints, which lower XP and pay |
| Payout | ¤40 per puzzle × length multiplier × clean bonus | Based on the XP you earned (see below) |

**Payout.** Pay a fixed rate per XP earned, so the scoring players already
know carries straight over:

- **Cash:** ¤2 per XP. A first-guess, no-hint solve (100 XP) pays ¤200,
  and a failed or revealed puzzle (10 XP) pays ¤20.
- **Reputation:** 1 per 20 XP, so 5 for a perfect solve.
- **Streak bonus:** +10% cash per streak day, capped at +50%, to reward
  coming back daily.

¤200 is a real boost early on (three graduates cost ¤180), and it fades
into a daily bonus once a team is earning. These are starting numbers for
the balance pass (item 10), not final.

**The early game without an unlimited desk.** The staffed side already
pays for itself: a lone graduate on a Hotfix earns about ¤10 a minute
against a ¤2/minute salary, and the ¤150 starting cash hires two. So
removing the unlimited desk slows the start down rather than breaking it,
and the daily puzzles become the "come back tomorrow" hook instead. If the
first half hour feels too slow, raise the starting cash (e.g. to ¤300)
rather than bringing back unlimited desk contracts.

**The studio's 6 desk puzzles** move into `puzzles.js`. Two already
exist there (lambdas in a loop, and `True` / `1` / `1.0` as dict keys),
so that's four new Python puzzles (float rounding, string repetition,
slicing, comprehension scope), each needing a second hint and an "In the
wild" note.

## Technical plan

The studio is one 2,168-line file today. The plan splits it into a module
the main page can load, with the desk code removed.

### Files after the merge

| File | What it holds |
|---|---|
| `index.html` | The page: daily puzzle, plus empty slots for the studio |
| `puzzles.js`, `shared.js`, `base.css` | As today, shared by all pages |
| `ltd/ltd.js` | Debugg Ltd's game logic and UI, minus the old desk |
| `ltd/ltd.css` | Its styles |
| `sandbox.html` | Unchanged |
| `studio/index.html` | A redirect to `../?ltd` |

### The one-way link between them

When a puzzle game ends, `index.html` fires an event:

```js
document.dispatchEvent(new CustomEvent('debugg:puzzle-finished', {
  detail: { lang, day, solved, guesses, hintLevel, xp, streak }
}));
```

The studio listens for it and pays. It keeps a ledger of what it has paid
(`paid: { 'python-5': true, … }`), so reloading, finishing on another tab
or the event firing twice can never pay twice. That also handles the
"solved before the studio was switched on" case: those days simply aren't
in the ledger and never get paid (see open questions).

The Director's language skill is read from Debugg's XP store
(`debugg-xp`) rather than copied, so it's always in sync.

### Saves

| Key | Holds | Change |
|---|---|---|
| `debugg-day*`, `debugg-<lang>-day*` | Puzzle progress per day | None |
| `debugg-xp`, `debugg-streak`, `debugg-lang` | XP, streak, language | None |
| `debugg-sandbox-*` | Sandbox drafts | None |
| `contract-debugger-state-v3` | Existing studio saves | Imported once into `debugg-ltd`, then removed |
| `debugg-ltd` | The company (new) | New; includes `enabled`, `pausedAt` and the payout ledger |

- **Importing an old company:** keep cash, reputation, roster, board,
  jobs and log, and drop the old desk contract (`activeContract`). Anyone
  with an old save gets the studio switched on automatically.
- **Resetting:** today, Debugg's "reset" link deletes every `debugg-*`
  key, which would now include the company. Split it: "Reset puzzles"
  keeps the company, and the studio gets its own "Close company" (with a
  confirmation) that deletes only `debugg-ltd`.

### Pausing

Switching the studio off records `pausedAt`. Switching it on moves
`lastTick` and every running job's timers forward by the paused time, so
nothing happens while it's off. That reuses the existing offline code
path, and it means turning the studio off is never a trap.

## Build order

Each step ends with the site working and the tests passing. Steps 2–6 go
live only behind `?ltd=preview` until step 7.

1. **Tests first.** Add the headless-browser tests used so far (puzzles in
   both languages, streak, XP, sandbox) to the repo under `tests/`, and
   write the studio tests the roadmap already asks for (item 1): hiring,
   staffing, contract resolution, offline catch-up. Run them in GitHub
   Actions on every PR. The merge touches both games, so this is what
   catches regressions.
2. **Puzzle events.** Fire `debugg:puzzle-finished` from `index.html`. No
   visible change.
3. **Extract the studio.** Move the studio into `ltd/ltd.js` and
   `ltd/ltd.css` with a `mount()` that renders into slots it's given.
   Remove the old desk (puzzle bank, contract lengths, answer checking,
   `activeContract`). Keep `studio/index.html` working by mounting it
   there, so the live studio is unaffected during the work.
4. **Layout.** Give `index.html` the slots and a wide two-column layout
   (`body.ltd-on`), with the puzzle as the desk column and the phone
   layout stacked. The puzzle UI itself doesn't change.
5. **Pay for puzzles.** Hook the event to cash, reputation and the streak
   bonus; show a toast ("+¤200 from today's Python hotfix"); show the
   Director's skills from `debugg-xp`.
6. **Switching on and off.** "Start your own company" in the footer, and
   as a small card after a finished puzzle. Pause/resume. Import old
   studio saves. The split reset.
7. **Go live.** Remove the preview flag. Turn `studio/index.html` into a
   redirect to `../?ltd`. Update the README and `studio/CLAUDE.md` (which
   should move to a root `CLAUDE.md` now that it's one game). Tag it as
   the first release (roadmap item 2).
8. **Afterwards: release tiers (item 3b).** Add Patch (spot the bug),
   Minor release (modify the code) and Major release (write the code) on
   their weekly and monthly calendars, for both modes. Minor and Major can
   reuse the sandbox's in-browser runners. In the studio, bigger tiers
   pay more.

Steps 1–2 are small. Step 3 is the bulk of the work. Steps 4–6 are medium.

## Risks

- **Double payment:** covered by the payout ledger, which the tests should
  check (reload, two tabs, finishing before switching on).
- **Save import bugs:** test against a real old save; keep the old key
  until the import has succeeded.
- **The early game feels slow:** the balance pass tunes starting cash and
  pay rates; the numbers above are a starting point.
- **Phone layout:** the studio is a wide dashboard. Stacking desk first
  keeps the daily puzzle usable, but the roster and board need a proper
  look at 375px width.
- **Scope creep from 3b:** keep the release tiers out of this merge. The
  merge is already the biggest change either game has had.

## Open questions

1. **Founder's bonus.** Should someone who starts a company after weeks of
   puzzles get something for it, e.g. starting cash of ¤1 per lifetime XP,
   capped at ¤1,000? My recommendation is yes: it rewards loyal players
   and softens the slower start.
2. **Does the Director's language level do anything?** The Director
   doesn't write code, so today it would only be shown. One option is a
   small success bonus (e.g. +1% per level) on contracts in languages you
   know, so playing the puzzles makes your company better at that
   language.
3. **Languages without puzzles.** The studio also has C/C++ and Rust
   contracts. The Director can only level up in languages that have
   puzzles, which is fine for now. Adding puzzles for those languages
   later fills the gap.
4. **Replaying past puzzles.** Past days (via the sandbox, or a future
   archive) should pay nothing, so the desk stays a daily thing. Agreed?
5. **Pause, or keep running when off?** This plan pauses, which is simple
   and fair. The alternative is that it runs unseen and you come back to
   a changed company, which is more "idle game" but can feel like a trap.
