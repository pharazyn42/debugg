# Debugg and Debugg Ltd

Context for continuing work on this repo. **Debugg** is the daily puzzle game:
read a short Python or JavaScript snippet and guess what it prints. **Debugg
Ltd** is the optional idle studio-management game around it, switched on with
"Start your own company". With it on, the daily puzzles are the Director's
desk and pay the company. The README covers the player-facing rules; this file
is the design and implementation notes, mostly for Debugg Ltd.

The merge of the two (item 3c) is done; `ideas/debugg-ltd-merge-plan.md` is
the plan it was built from. Original design brainstorm for the studio:
`ideas/contract-debugger-concept.md`. That doc is the source of the overall
vision; read it for the *why* behind mechanics that aren't built yet. This
file is the *current state* of the implementation, which has diverged and
simplified from that doc in places (noted below).

## Where things live

No build step and no runtime dependencies (besides Google Fonts, and Pyodide
from jsDelivr in the sandbox). GitHub Pages deploys `main` to
`https://pharazyn42.github.io/debugg/`.

| File | What it is |
|---|---|
| `index.html` | The daily puzzle page. It also holds the slots the studio renders into, and the loader that switches the studio on. |
| `puzzles.js` | The puzzle bank, one list per language. |
| `shared.js`, `base.css` | Shared by all pages: languages, the day calendar, XP levels, the highlighter, the base theme. |
| `sandbox.html` | Write and run Python (Pyodide) or JavaScript in Web Workers. |
| `ltd/ltd.js`, `ltd/ltd.css` | Debugg Ltd. Loaded only when the studio is on. CSS is scoped under `.ltd`. |
| `studio/index.html` | Redirect to `../index.html?ltd`, the studio's old address. |
| `tests/` | Playwright tests, run by `npm test` and GitHub Actions. |

**How the puzzle page and the studio connect.** One way only. When a daily
puzzle ends, `index.html` fires `debugg:puzzle-finished` with
`{ lang, day, solved, guesses, hintLevel, xp, streak }`, and `ltd.js` pays for
it (see "The desk" below). The studio reads puzzle XP through
`Debugg.readXp()` for the Director's skills. The puzzle page never depends on
the studio.

**Switching on.** The loader at the bottom of `index.html` loads `ltd/` when
the saved company is running, when an old pre-merge save exists, or when the
URL has `?ltd`. `DebuggLtd.start({ stats, studio, board })` renders into the
three slots and either resumes the saved company, imports an old one, or
founds a new one. `body.ltd-on` switches the page to the two-column layout.

**The calendar.** Day 1 is 1 October 2026 (`LAUNCH` in `shared.js`). Days
before it are preview days (0, -1, …), labelled "Preview", each with its
own puzzle and saves. Saves are keyed by day number, so **don't move Day 1
once players have real progress**. If it does move, `shared.js` notices
(it remembers the date in `debugg-epoch`) and clears per-day progress, the
streak and Debugg Ltd's `paid` ledger, keeping XP, the company and sandbox
drafts.

**Saves.** Puzzle progress is `debugg-day<N>` (Python) and
`debugg-<lang>-day<N>`, plus `debugg-xp`, `debugg-streak` and `debugg-lang`.
The company is `debugg-ltd`. Pre-merge studio saves
(`contract-debugger-state-v3`) are imported once into `debugg-ltd` (dropping
the old desk's `activeContract`), then removed. The boot sequence in
`ltd.js` also carries the older shape guards (tier renames, Assembly,
SLOC targets); add a similar guard if the state shape changes again.

## Data model (as currently implemented)

```js
// The desk
CASH_PER_XP = 2, XP_PER_REP = 20          // desk pay per puzzle XP earned
STREAK_BONUS_PER_DAY = 0.10, STREAK_BONUS_CAP = 0.50   // on solves, per streak day beyond the first
START_CASH = 150, FOUNDER_BONUS_CAP = 1000             // + ¤1 per puzzle XP at founding
DIRECTOR_BOOST_PER_LEVEL = 0.01, DIRECTOR_BOOST_CAP = 0.10   // success chance per puzzle level above 1

LANGS   = ['Python', 'C/C++', 'JavaScript', 'Rust']   // Assembly dropped; old saves fold it into C/C++
DOMAINS = ['Web Dev', 'Games', 'Embedded/Controls', 'Safety-Critical', 'Data/AI']
PAIRINGS = { <lang>: [domains it can be paired with on a contract] }
BAR_XP = [10, 50, 150, 400, 1000]   // cumulative XP for skill bars 1..5

ROLES = { Director, Manager, Graduate, Junior, Senior, Principal }  // sloc, salary/min, cost, reliability
PROMOTION = { Junior: {minutes:60, lang:1, dom:1}, Senior: {8h, 3, 2}, Principal: {3 days, 5, 5} }  // contract time only
RETRY_TIME = 0.5, RETRY_PAYOUT = 0.75
TIERS = [ hotfix ~5 SLOC / 1 dev, patch ~400 SLOC / 3-5 + senior,
          minor release ~2,700 SLOC / 5-10 + principal,
          major release ~22,500 SLOC / 10+ incl. manager, 2 principals, 3 seniors ]
// Renamed from quick fix / sprint / milestone / full delivery (same rules,
// same indices); TIERS_VERSION lets the boot sequence refresh old boards.
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
  enabled, pausedAt,                              // false / a time while the player has it paused
  paid: { 'python-5': true, … }                   // desk puzzles already paid for (last 14 days)
}
```

## What's implemented

- **The desk is the daily puzzles**, one per language per day (see 3b
  for the planned formats and weekly rotation). Each one finished while the company is running pays
  `CASH_PER_XP` per XP it earned (¤200 for a first-guess, no-hint solve,
  ¤20 for a reveal) and 1 reputation per 20 XP. Solves get +10% per streak
  day beyond the first, up to +50%. Only today's puzzles pay, each once
  (the `paid` ledger), and puzzles finished before the company existed
  don't pay. Replaced the old unlimited desk (1/3/5/8-puzzle contracts from
  a bank of 6), so the staffed side now carries the early economy; a lone
  grad on a hotfix already pays for itself.
- **Founding**: a new company gets ¤150 plus a founder's bonus of ¤1 per
  puzzle XP already earned, up to ¤1,000.
- **The Director's languages are the player's puzzle levels** (read live
  from `debugg-xp`). Each level above 1 adds 1% success chance to contracts
  in that language, up to +10%, shown on the Director's card and in the
  team picker. Only languages with puzzles (Python, JavaScript) count.
- **Pause / Close**: pausing stores `pausedAt` and reloads without the
  studio; resuming shifts every clock in the save (`lastTick`, jobs,
  offers, `since`) forward by the paused time, so nothing happens while
  paused. Closing deletes `debugg-ltd`. The page's "reset puzzles" keeps
  the company.
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
  - **Skill rule**: a dev "knows the stack" for a contract if they have at
    least one bar in its language or its domain (`qualifiedFor()`; managers
    are exempt).
    - Solo hotfixes need someone who knows the stack.
    - On team contracts, devs who don't can join as **learners**. They
      write no code and each costs the team `LEARNER_DRAG` (10%) of its
      output in mentoring time. There must be at least one dev who knows
      the stack per learner. Learners earn XP as normal on delivery. This
      is the only way to gain a first bar in a new language or domain.
    - The picker labels learners (and greys out non-learners on quick
      fixes), and "Suggest a team" only adds learners when short-handed.
    - A board card warns when nobody on staff knows the stack.
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
    - a lone grad on a hotfix: ~1 min;
    - senior + 2 grads on a patch: ~10 min;
    - principal + 4 grads on a minor release: ~30 min;
    - 2 principals + 3 seniors + 4 grads + a manager on a major release:
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
  hotfixes. Repeats keep chaining while the page is closed, up to the
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

- **Reputation does nothing** beyond being tracked (roadmap item 12).
- **Skill gain is a placeholder**: a flat XP rate with no supervision
  effect (item 22).
- **No training spend, studio upgrades, or prestige** (items 14, 15, 19).
- **Balance is untuned** (item 10).

## Future development

Agreed direction, not built yet, in the planned implementation order.
Item numbers are for reference; re-prioritise freely.

### Phase 1 — Foundations

Do these first: every later feature touches the job engine, and changes currently ship untested straight to players.

#### 1. Tests
- **Done:** Playwright end-to-end tests in `tests/` cover the daily
  puzzles, the sandbox and Debugg Ltd (founding, desk pay, the Director's
  boost, hiring, offline contract resolution, pause/resume, close, save
  import, the `/studio/` redirect), and run in GitHub Actions on every PR.
  Tests fix the clock with `page.clock.setFixedTime` and fast-forward by
  editing the save. Still worth adding:
  - **Unit tests for the game logic.** This first needs the pure
    functions pulled out of `ltd/ltd.js` into a module the page and
    tests can both import (e.g. `ltd/engine.js`).
    That's plain ES modules, still no build step. Targets:
    - structure/capacity rules;
    - promotion status;
    - `evaluateTeam` (requirements, learners, SLOC/time, payout, chance);
    - `resolveDueJobs` (repeat, retry, offline chaining and cap);
    - skill-rule qualification;
    - offer expiry.
  - **Deterministic randomness**: inject a seeded RNG (and a clock) so
    tests can force success/failure and specific offers.
- Require the tests to pass before a release is cut or deployed (item 2).
- Pairs naturally with the "shared idle engine" idea in
  `ideas/bbq-idle-concept.md` — the same extraction serves both.

#### 2. Semantic versioning and proper releases
- Adopt semantic versioning (MAJOR.MINOR.PATCH):
  - MAJOR: save-breaking or big design changes, i.e. whenever the storage
    key has to be bumped;
  - MINOR: new mechanics;
  - PATCH: fixes and balance tweaks.
- **Show the version in the game** (e.g. the footer) and store it in the
  save, so a save can be migrated deliberately rather than by ad-hoc
  shape guards.
- **Keep a `CHANGELOG.md`** with a section per release; the per-commit
  notes so far could seed it.
- **Cut releases with git tags and GitHub Releases** (e.g.
  `v0.x.y`). Debugg and Debugg Ltd are becoming one product
  (item 3c), so one version, one changelog and one set of tags cover
  both; no `studio-` prefix needed.
- **Separate "released" from "in progress".** Today every push to `main`
  deploys straight to GitHub Pages. Options:
  - deploy only on a tag or release, via a GitHub Actions Pages workflow
    instead of branch deploys;
  - or keep `main` as the released branch and do work on a `dev` branch.

#### 2b. Hosting, players and analytics
The site is static files on GitHub Pages, and everything a player does is
saved only in their own browser. So today there's no way to know how many
people play, how far they get, or where they drop off, and a player can't
move their progress to another device. This item decides how to host the
site and what to measure.

- **What we want to know.**
  - **Visitors:** daily and weekly visitors, new vs returning, where they
    came from (referrers), device and screen size, and which pages they
    use (daily puzzle, sandbox, the studio).
  - **Puzzles:** for each day and language, how many started, solved,
    failed or revealed; the guess distribution (like Wordle's share
    graph); hint use; and the most common wrong answers. Wrong answers
    show where a puzzle is ambiguous or the answer matching is too
    strict.
  - **Progression:** how many players reach each XP level per language,
    and how fast; streak lengths and where streaks break; day-1, day-7
    and day-30 return rates.
  - **Debugg Ltd:** how many players found a company (and when, relative
    to their first puzzle); time to the first hire, manager, senior and
    principal; how many pause or close; cash and headcount over time. The
    balance pass (item 10) needs exactly this.
- **Step 1, visitor analytics with no backend.** Add a privacy-friendly,
  cookie-free analytics script to the pages. Candidates (check current
  pricing and limits before choosing):
  - GoatCounter (free for non-commercial use, open source);
  - Cloudflare Web Analytics (free);
  - Plausible (paid, or self-hosted);
  - Umami (self-hosted).

  Most of these also record **custom events**, which would cover a lot of
  the puzzle and progression numbers above: fire one on
  `debugg:puzzle-finished` (language, day, solved, guesses, hints), on
  level-ups, on founding a company, and on the studio's milestones.
  GitHub Pages gives no visitor stats of its own, so this is the quickest
  win.
- **Step 2, a small backend for what analytics can't do.**
  - Shared puzzle stats shown to players after a game ("62% solved this,
    most in 2 guesses").
  - Accounts or a sync code, so progress and companies move between
    devices and survive clearing the browser.
  - Later: leaderboards, or comparing companies.

  Options: a serverless function plus a small database (Cloudflare
  Workers + D1 or KV, Supabase, Firebase), which can sit alongside the
  static site. Hosting could stay on GitHub Pages with the backend on its
  own domain, or move to a host that does both (Cloudflare Pages, Netlify
  or Vercel).
- **Privacy.** Cookie-free, aggregate analytics usually needs no consent
  banner. Anything tied to a person (accounts, synced saves) needs a
  privacy notice and a way to delete your data. Never send wrong answers
  or code typed into the sandbox with anything that identifies the player.
- **Also:** a custom domain (GitHub Pages supports one), and keeping the
  game fully playable if analytics or the backend is blocked or down.
- **Open questions:**
  - Is the goal only to understand players, or also player-facing
    features (shared stats, sync, leaderboards)? The second needs step 2.
  - Is a small monthly cost acceptable, or should everything stay on
    free tiers?
  - Accounts, or an anonymous sync code? A sync code is lighter and
    avoids storing emails.

#### 3. Languages only for now; domains become a later-game unlock
- **Remove domain specialities from the early game.** Contracts, hires and
  skills use programming languages only. That means dropping the domain
  half of:
  - offers and the skill rule (`qualifiedFor()`);
  - skill-match speed and payout (`matchFit()`);
  - XP;
  - promotion requirements (`PROMOTION.dom`);
  - starting skills (`makeHire()`);
  - the employee panel.

  Promotion requirements then need re-stating in language bars only.
- **Hotfixes should cover every language**, so a lone dev always has
  something they can take. That avoids the deadlock where nobody on staff
  knows the language of either hotfix on the board. Offer expiry and
  repeat-picks-a-doable-contract currently paper over this. For example,
  keep one quick-fix offer per language on the board, or let the player
  pick the language when staffing a hotfix.
- **Domains come back later as an unlock**, further into the game (e.g.
  tied to reputation or a business tier):
  - Some team contracts (minor releases and up) are then tagged with a domain.
  - Domain **specialists** are a separate kind of hire.
  - A contract with a domain must have a specialist in that domain on the
    team.
  - Open questions: do specialists write code too, are they promotable,
    and does domain experience grow on regular devs or only specialists?
- Save migration: existing saves have `dom` skill maps and domain-tagged
  offers/jobs. Either strip them or bump the storage key.

#### 3b. Puzzle formats and the weekly rotation
Decided with the player-owner; replaces the earlier plan of Hotfix /
Patch / Minor / Major puzzle tiers on separate daily, twice-weekly,
weekly and monthly calendars. The contract board keeps those four names
for its contracts; they no longer name puzzles.

- **One puzzle a day, per language.** Its format and difficulty follow
  the weekday: Monday is the easiest, Friday the hardest, and the weekend
  is one bigger code challenge. One daily puzzle means one streak and one
  thing to do, as today. Everyone gets the same puzzle on the same date.
- **Every format is in the rotation.** The formats, grouped by how the
  answer is checked:

  | Format | How it plays | Checked by |
  |---|---|---|
  | **What does this output?** (built) | Type what the snippet prints. | Matching the typed text |
  | **Multiple choice output** | Pick what it prints from 4 options. | The option picked |
  | **Fill the blank** | One gap in the code; pick or type what goes there to get the target output. | The option or text |
  | **What's the value of `x`?** | The value of a variable at a marked line. | Matching the typed text |
  | **How many times does this run?** | Loop counts, calls. | A number |
  | **Will it error?** | "Runs fine", or which error it raises (`TypeError`, `IndexError`…). | The option picked |
  | **Order the lines** | Drag shuffled lines into a working program (a "Parsons problem"). | The order |
  | **Spot the bug** | Given the code, what it should print and what it does print: tap the line causing it. | The line tapped |
  | **Spot the difference** | Two near-identical snippets print different things: tap the difference that matters. | The part tapped |
  | **Fix it** | Edit the code so it prints the target. Locked lines or an edit limit stop `print("target")`. | Running it |
  | **Make it pass** | A function plus visible test cases: fix it until all pass. Hidden tests too. | Running it against tests |
  | **Write it** | Write code from scratch that prints the target. | Running it against hidden tests |
  | **Which is faster?** | Pick between two versions. Rare, and only where the answer is clear-cut. | The option picked |
  | **Code golf** | Produce the target in as few characters as possible. | Running it; best length |

- **The week** (a starting rotation; tune it with play data):

  | Day | Difficulty | Formats |
  |---|---|---|
  | Monday | 1, learn level | multiple choice output, fill the blank, what's the value of `x` |
  | Tuesday | 2 | what does this output, how many times does this run |
  | Wednesday | 3 | what does this output, will it error, order the lines |
  | Thursday | 4 | spot the bug, spot the difference, which is faster |
  | Friday | 5, hardest | hard output (several interacting quirks), fix it |
  | Weekend | challenge | make it pass, write it, occasionally code golf |

  The **weekend challenge** is one puzzle for Saturday and Sunday
  together: solving it on either day keeps the streak for both.
- **Guesses and hints vary by format.**
  - Typed and tap formats (output, value, count, spot the bug, spot the
    difference, fill the blank when typed): 4 guesses, 2 hints, as today.
  - Choice formats (multiple choice, will it error, which is faster, fill
    the blank from options): 2 guesses, 1 hint, so they aren't trial and
    error.
  - Order the lines: 3 checks, 1 hint (e.g. it fixes the first line).
  - Code formats (fix it, make it pass, write it, code golf): unlimited
    runs in the editor, but 4 submissions; hints are nudges ("look at the
    loop bounds"), up to 2.
- **XP follows difficulty**, and in Debugg Ltd desk pay follows XP (¤2 per
  XP, as now), so harder days are worth more to the company too. A
  starting scale for a first-attempt, no-hint solve: Monday 60, Tuesday
  80, Wednesday 100, Thursday 120, Friday 150, weekend 200. Extra guesses
  and hints scale it down by the same fractions as today, and a failed or
  revealed puzzle still gives 10.
- **Learn** is both:
  - the **Monday** puzzles, which are learn-level; and
  - a separate **Learn track**: lessons per language, played in order at
    any time, not tied to the calendar. Each lesson teaches one concept
    with a proper explanation and a "try this next" for the sandbox. Path:
    values and printing, strings, lists and arrays, loops, functions,
    dictionaries and objects, then the common traps the daily puzzles
    are about. Lessons use the easy formats (multiple choice, fill the
    blank, value of `x`, output).
  - Lessons earn **XP** in that language (less than a daily puzzle, e.g.
    20 each), so beginners level up, but **don't count towards the
    streak**: only the daily puzzle does. The track has its own progress
    (which lessons are done) and doesn't pay in Debugg Ltd, which stays
    daily.
- **Data and engine changes:**
  - Each puzzle gets `format` and `difficulty` (1–5, or `weekend`), plus
    the fields its format needs: `options`, the blank, `lines` (to
    shuffle), `bugLine`, `target`, `tests`, `locked` lines, an edit
    limit.
  - The calendar picks, for each date, the next unused puzzle in that
    weekday's pool, date-seeded so everyone matches, falling back to the
    nearest difficulty if a pool runs out. Today's day-number saves keep
    working; the weekend puzzle is saved once for both days.
  - The page shows the day and format, e.g. "Monday · warm-up · multiple
    choice" or "Friday · hard".
  - One renderer and answer checker per format. The code formats reuse
    the sandbox's workers (Pyodide for Python, a fresh Web Worker for
    JavaScript), pulled out of `sandbox.html` into a shared runner, and
    load Pyodide only when a code puzzle opens.
  - Rate the existing 29 puzzles (all "what does this output") by
    difficulty. Most are Tuesday to Thursday; Monday, Friday and the
    other formats need writing.
- **Content load**, per language: 52 of each weekday and 52 weekend
  challenges a year (about 310), plus the Learn track (around 40–60
  lessons to start). A generator for the simpler formats (value of `x`,
  how many times, output of small expressions) would help with volume.
- **Open questions:**
  - Build order: which formats first? Suggested: multiple choice and
    spot the bug (no code execution, quick to build), then fill the
    blank, value, count, will it error, order the lines, then the code
    formats.
  - Code golf needs shared leaderboards (item 2b) to be much fun, so it
    may wait for a backend.
  - Does a weekend challenge that's solved on Saturday leave anything
    for Sunday (e.g. a bonus golf round)?

#### 3c. One game: puzzles first, studio optional — done
- Built from `ideas/debugg-ltd-merge-plan.md`, ahead of 3b: the desk is
  the daily puzzles (today all "what does this output"), and the other
  formats in the weekly rotation are still to come. See "Where things live" and "What's
  implemented" for how it works.
- Decisions made along the way:
  - A founder's bonus rewards puzzle history (¤1 per XP, up to ¤1,000).
  - The Director's puzzle levels boost contract success in that language.
  - Past days' puzzles never pay; the desk stays daily.
  - Switching the studio off pauses it.
- When the other formats arrive they apply in both modes, with one record
  of progress. Desk pay follows XP, so harder days pay the company more.

### Phase 2 — Make the core loop feel right

Small-to-medium changes the player feels every session. Do the balance pass last, after the changes that shift the numbers.

#### 4a. Success chance scales with level and skill match
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
  via effective SLOC/min (see "SLOC drives time" under What's implemented).
- **Teams**: exact curves are TBD, as is how per-person chances combine for
  a team (average, weighted by SLOC, or weakest link).

#### 4b. Show what makes up the success chance
- When staffing a contract (team picker), break the success chance down
  into its contributing factors instead of only the final %, e.g.:
  - each person's base reliability for their level;
  - the skill-match bonus;
  - any cap.

  This ties in with the success-chance rework (4a).

#### 5. Per-hire speed multiplier
- Each new hire rolls a random, permanent speed multiplier that scales
  their SLOC/min (e.g. 0.7×–1.3×, range TBD). It's stored on the person
  and never changes, including on promotion; it stacks with the level's
  base SLOC and the skill-match boost.
- The point is that a slow hire stays slow forever, which gives the
  player a real reason to let people go and rehire.
- It needs to be visible on the roster card and employee panel. Maybe
  also on hire, e.g. "fast / average / slow". That could suggest hiring
  shows a candidate before you pay.

#### 6. Contract deadlines
- **Some contracts have a deadline:** a time limit to complete it once
  started, shown on the board card. This is separate from offer expiry,
  which is how long an offer waits to be accepted.
- **Not every contract has one.** Others have no time pressure, and any
  valid team can take as long as it needs. The mix is TBD: e.g. a share
  of offers per tier, more common on bigger contracts, or more common as
  reputation grows. Deadline contracts could pay a premium, so they're
  worth the tighter staffing.
- **Staffing becomes a real choice on deadline contracts.** Since
  duration = SLOC target ÷ team SLOC/min, you have to pick a team fast
  enough to finish in time. The team picker would show the estimate
  against the deadline, e.g. "takes 8:15 · deadline 10:00 ✓", or a red
  warning if it won't make it. That gives a reason to put more senior,
  bigger or better-matched people on a contract, beyond payout.
- **Deadlines vary by offer**, where there is one. Set them relative to
  the reference time, with a random tightness (e.g. 0.8×–1.5× of what the
  cheapest valid team would take). Some offers then need a
  stronger-than-minimum team; tight deadlines could pay a premium.
- **Missing the deadline**. Options to decide between:
  - the payout shrinks the later it is;
  - a flat late penalty;
  - a reputation hit;
  - the client cancels, so no payout.
- **Interactions to design:**
  - Retry: a failed contract retried in half the time may still blow the
    deadline. Does a retry get extra time, or is it only worth it if it
    fits?
  - Learners: their 10% drag now has a visible cost.
  - Repeat: a repeating team should only roll into contracts it can
    finish on time. Simplest: repeats only pick contracts without a
    deadline, or deadline ones that the team would meet.
  - Maintenance items (in-house products) already have deadlines, so both
    can use the same mechanic.

#### 7. Current contract in the employee panel
- Clicking an employee should show the contract they're working on.
  Today the panel only has a one-line "On Minor release (Rust / Web Dev) — 4:12
  left". It should show the full contract:
  - type, language and domain;
  - teammates;
  - progress (SLOC done / target, time left);
  - success chance and payout;
  - repeat status;
  - the failed/retry state.

#### 8. Total SLOC/min in the top stats bar
- Add a studio-wide SLOC/min stat next to Cash, Reputation, Payroll and
  Headcount. Open question: count only people currently on contracts,
  or show "active / potential"?

#### 9. Show what the desk pays
- Show what today's puzzles can pay before you play them, e.g. "up to ¤200
  (+20% streak)" next to the desk title, and which ones have been paid
  today.

#### 10. Balance pass
- Hire costs, salaries, `LINE_RATE`, tier multipliers, XP rates and
  promotion timers are all first guesses. Do a proper pass once the
  success-chance rework, speed multiplier and deadlines are in, since
  those shift the numbers. Known symptom: a grad on repeat now nets
  ~¤400/hour, which makes early hires cheap relative to income.

### Phase 3 — Retention and mid-game growth

The first progression layers beyond hiring. (Daily/weekly/monthly desk puzzles moved up to 3b; writing the puzzle bank is content work that can start in parallel with anything.)

#### 11. (Moved) Daily desk contracts
- Folded into item 3b (puzzle formats and the weekly rotation).

#### 12. Reputation gates contract tiers
- Reputation is tracked but does nothing yet. Gate the bigger contract
  types (and later unlocks) behind reputation thresholds, so the player's
  own desk performance opens up the studio's ceiling — as the original
  concept doc intended.

#### 13. Business tiers
- Show a business-tier label that grows with headcount: Start-up →
  Small business → … → something massive (e.g. Multinational).
- Thresholds and names are TBD. The current Director-as-manager phase is
  the "Start-up" tier.
- Moving up a tier could unlock things:
  - more contract-board slots;
  - bigger contract types;
  - new hire types;
  - later, multiple sites (item 18).

#### 14. Training for language (and later domain) skills
- Add a way to spend money (and/or time off contracts) to train a person's
  language or domain skills directly, alongside the XP earned from
  delivered contracts.
- Open questions:
  - Is training a one-off purchase per bar, a timed course during which
    the person is unavailable for contracts, or both?
  - Should cost scale with the target bar?
  - Should there be a cap so training can't replace real contract
    experience (e.g. training only up to bar 3)?

#### 15. Office space: desks, contractors, and buildings
- Another progression limiter. On-site staff need a desk. You start with
  one free room with a small number of desks (e.g. 4).
- **Contractors** work from home, so they need no desk, but cost more
  (higher salary and/or hire cost). They're a way past the desk cap
  before you can afford space.
- Over time you rent offices, buy rooms, then whole buildings, each adding
  desks. This fits with the business tiers (item 13) and multiple sites
  (item 18); sites could be where buildings live.
- Open questions:
  - Do contractors count towards the supervision structure and manager
    span?
  - Can they be promoted?
  - Do they gain XP at the same rate?

#### 15b. Shared event system
- One system for everything that randomly (or conditionally) happens to
  the studio, built before any individual event. Each event defines:
  - **trigger**: a random chance per tick, a condition (e.g. too many
    learners), or scheduled (e.g. a planned holiday);
  - **target**: the whole studio, a job, a person, a language or a
    product;
  - **effect**: pause, a SLOC/min penalty, extra SLOC, someone
    unavailable, or a cost;
  - **duration** and recovery.
- It also covers **presentation**: a log entry, a badge or banner with a
  countdown on whatever is affected, and the roster/panel status.
- It must work **offline**: events are simulated while the page is
  closed, within the offline cap, the same way repeats are.
- Randomness goes through the injectable seeded RNG from item 1, so tests
  can force events.
- Events built on it: absences (15c), Tech Debt (17b), Merge Conflict
  (17c), disruptive events (17d); later maybe good events too (a star
  hire applies, a client tips extra).

#### 15c. Absences: sick days and holidays
- Employees are sometimes unavailable. Chances, frequency and durations
  are to be decided later.
- **Off sick**: unplanned and random. The person drops out for a while,
  even mid-contract.
  - The team carries on without their SLOC/min, so the contract slows.
  - If they were the only one meeting a requirement (e.g. the only
    senior on a Patch), the contract could pause until they're back, or
    the player can swap someone in.
  - Sick pay: salary probably still paid.
- **On holiday**: planned. It's announced in advance (e.g. "Sam is off
  next Tuesday"), so the player can plan around it, e.g. not starting a
  Major release that would run into it.
  - Possibly an allowance per person, or requests the player approves
    or declines. Declining could hook into a future morale system.
- **Interactions**:
  - Repeats: skip or pause while someone's away.
  - Deadlines (item 6): an absence can make a team miss one.
  - Offline progress: absences should be simulated while the page is
    closed too.
  - The employee panel and roster card: show "Off sick" / "On holiday
    until …".
- The first event built on the shared event system (15b): a good,
  self-contained test of it before the late-game events.

#### 15d. Company stats and records
The company keeps almost no history: cash, reputation, and an 8-line log.
Track lifetime stats, show them on a **Stats** panel (a button next to
Pause / Close company), and use them later for achievements and prestige
(item 19). Stats go in the save under `state.stats`, counted as things
happen (not rebuilt from the log). Saves from before the stats existed
start at zero, apart from the numbers that can be worked out from the
roster.

- **Company overview:**
  - date founded and days since; days the company has been active (a
    tick or a desk puzzle that day); total time running, time paused,
    and time away (offline catch-up);
  - lifetime cash earned, split by source (desk puzzles, each contract
    tier, retries) and lifetime cash spent (salaries, hiring);
  - net profit, best day, worst day, and cash earned in the last 7 days;
  - peak cash, lowest cash (and how long it was negative), and peak
    reputation;
  - current and peak headcount, and headcount by level;
  - the founder's bonus received, and whether the company came from an
    import.
- **The desk (your puzzles):**
  - desk puzzles paid, by language; desk income, and its share of all
    income;
  - perfect solves, average guesses and hints, and reveals;
  - the streak bonus earned in total, and the longest streak while the
    company was running.
- **Contracts:**
  - offers taken, delivered, failed, retried, dropped, and lost after a
    failed retry, each by tier;
  - success rate by tier, language and domain, compared with the
    forecast chance, to show whether you're lucky or unlucky;
  - total SLOC delivered, by tier, language and domain;
  - the biggest payout, fastest delivery by tier, and longest job;
  - repeats: contracts started by repeat, the longest unbroken repeat
    chain, repeats stopped because the team no longer fitted, and
    offline repeats;
  - offers that expired untaken, by tier.
- **People:**
  - hired by role, let go, and promoted (to each level), plus the
    average time to each promotion;
  - total salaries paid, by level;
  - learners placed, and first bars gained through learning;
  - skill bars gained, by language and domain;
  - the longest-serving employee.
- **Per employee** (on the employee panel):
  - hired on, and roles held, with dates;
  - contracts delivered and failed, SLOC written, cash earned for the
    company, and salary paid to them;
  - time on contracts vs on the bench;
  - their favourite language and domain (most XP gained).
- **The Director:** puzzle levels over time, and the success boost from
  them in total (how many extra deliveries it probably caused).
- **Records and milestones:** the date of each first (first hire,
  manager, senior, principal, patch, minor release, major release,
  ¤10,000 in cash, 10 staff…). These become achievements later.
- **Charts** (later): cash, reputation and headcount over time, stored
  as one sample per hour or day so the save stays small.
- **Open questions:**
  - How much history to keep: all-time counters are small, but daily
    series grow, so cap them (e.g. the last 90 days) or bucket them.
  - Should any of this be shared (item 2b), e.g. comparing your company
    with others, or a leaderboard?
  - Does "Close company" keep a summary of past companies (a hall of
    fame), which prestige (item 19) could build on?

### Phase 4 — Late game

Big systems that depend on the earlier phases.

#### 16. Domains return as an unlock with specialist hires
- See item 3: the "Domains come back later as an unlock" part. Needs
  reputation gating (12) or business tiers (13) to unlock it.

#### 17. In-house software products and maintenance teams
- **Unlocks later in the game** (e.g. by business tier or reputation): the
  studio can develop and release its own software instead of only doing
  client contracts.
- **Building it is a big project.** It needs a full team (at least
  major-release sized) and a large amount of work, several major-release
  sized chunks of SLOC, before the first release. Possibly split into
  phases (prototype → beta → 1.0), each needing the team to deliver. That
  ties up a lot of staff for a long time, with no income from it until
  release.
- **Once released, it earns passive income** (sales or subscriptions),
  scaled by user count and user satisfaction.
- **It needs maintenance.** Now and then a released product raises work
  items, which appear on the contract board alongside client contracts:
  - bug fixes;
  - feature requests;
  - updates (e.g. a new platform or dependency version);
  - service/support requests.

  They're staffed like contracts (SLOC target, team requirements,
  language), but they don't pay. They cost salary and staff time, and
  they protect the product's income.
- **Maintenance items have a deadline.** If a bug or requested feature
  takes too long, the users get annoyed:
  - satisfaction drops;
  - income falls;
  - users leave;
  - reputation may take a hit.

  Fast fixes could give a small satisfaction boost. So products compete
  with client contracts for your team: neglect them and they decay.
- **Maintenance teams.** After release, you can assign a dedicated
  maintenance team to a product:
  - **It picks up work automatically.** Any maintenance item the product
    raises goes straight to the team, so the player doesn't staff each
    one.
  - **It's committed.** Its members join the product's core in-house team
    and can't be put on client contracts while assigned. It's a lasting
    trade-off, not a per-job choice.
  - **It can be a small "shell" team.** It can be much smaller than the
    original development team, as small as one person. The trade-off is
    speed: a small team works through items slowly (it's still
    SLOC-driven), so some may miss their deadline. A bigger team keeps
    users happier but ties up more staff.
  - Without a maintenance team, items appear on the contract board to
    staff by hand.
  - Open questions:
    - Does the team still need to meet each item's requirements (e.g. a
      senior for a bigger feature), or is a one-person team allowed to be
      slow at everything?
    - Do items queue for the team, or can it split to work several at
      once?
    - Can you add to or reassign the team freely, or is there a cost or
      lock-in period?
    - Do team members keep earning XP and contract time towards
      promotion?
- Design questions:
  - Is the product's language fixed at the start (so its maintenance
    always needs that language)?
  - Do satisfaction and user count recover over time?
  - Can a product be sunset or sold?
  - How many products can you run at once?
- Fits with: offer expiry (maintenance items are expiring offers with
  consequences), the business tiers, and the later domain unlock (a
  product could have a domain too).

#### 17b. Tech Debt (event)
- Built on the shared event system (15b).
- A later-game complication that adds cost or time. It's named after the
  developer in-joke.
- **How it builds up** (ideas): from cutting corners, e.g.:
  - delivering with lots of learners or low-skill teams;
  - retried contracts;
  - missed deadlines (item 6);
  - neglected in-house product maintenance (item 17).

  It could also be triggered at random by an event ("a legacy module
  nobody understands").
- **What it does**: a studio-wide (or per-product) Tech Debt level that
  slows work (a SLOC/min penalty) and/or raises failure chance until
  paid down.
- **Paying it down**: "Refactor" jobs appear on the board. They don't pay,
  but they clear debt: a time-and-staff cost, like maintenance items.
- Open questions: a studio-wide meter vs. per in-house product; does it
  decay on its own; how visible is it before it bites?

#### 17c. Merge Conflict (event)
- Built on the shared event system (15b).
- A later-game event that adds time to a contract in progress. It's
  named after the developer in-joke.
- **Trigger**: random, with better odds of hitting when more people are
  touching the same code:
  - bigger teams;
  - more learners;
  - several teams working in the same language, or on the same in-house
    product, at the same time.
- **Effect**: the contract gains extra SLOC (e.g. +10–25%) or is paused
  briefly. The job card shows a "Merge conflict!" badge and a log entry.
  A senior or principal on the team could resolve it faster or reduce
  the extra work.
- Open questions: can the player intervene (e.g. pull someone in to
  resolve it), or is it purely automatic? How often should it happen so
  it's flavour, not frustration?

#### 17d. Disruptive events (server offline and others)
- Random studio-wide or targeted events that disrupt work for a while.
  How often, how long and how severe are to be decided later. Examples:
  - **Server offline**: all (or some) contracts pause until it's back.
  - **Internet or power outage**: a short pause for everyone on site.
    Work-from-home contractors (item 15) could be immune.
  - **Broken build / CI down**: contracts can't finish; they sit at
    100% until it's fixed.
  - **Breaking dependency update**: contracts in one language gain
    extra SLOC.
  - **Client changes the requirements** (scope creep): a contract in
    progress gains extra SLOC, maybe with a small payout bump.
  - **Laptop dies**: one person is out briefly.
- **Mitigation as a money sink**: upgrades that reduce the chance or
  impact of these, e.g. backup servers, cloud hosting, better
  hardware, a DevOps hire. That ties in with studio upgrades.
- **Presentation**: events appear in the log, and as a banner or badge on
  affected jobs, with a countdown to recovery.
- Built on the shared event system (15b), like absences (15c), Tech
  Debt (17b) and Merge Conflict (17c).

#### 17e. Multi-language contracts
- Later in the game, some contracts need more than one language, e.g. a
  Python back end with a JavaScript front end, or a Rust service with
  Python tooling. Hotfixes stay single-language; multi-language contracts
  start at Patch or Minor release and are likelier on bigger contracts.
- **The work is split by language**: the offer shows each language's
  share of the SLOC target, e.g. "2,700 SLOC: 60% Python, 40%
  JavaScript".
- **Staffing**: someone on the team must know each language (the skill
  rule applies per language), so these contracts push towards broader
  teams or multi-skilled people. Learners can learn any of the languages
  from a teammate who knows it.
- **Speed**, with two ways to model it:
  - *Simple*: each dev contributes to the language(s) they know, and the
    contract takes as long as the slowest language's share. A team
    strong in Python but with one JavaScript junior is held up by the
    JavaScript half.
  - *Richer*: the player (or "Suggest a team") assigns each dev to a
    language. More control, more UI.
- **XP**: each dev earns XP in the language(s) they actually worked on.
- **Payout**: a premium over single-language contracts of the same size,
  to reward covering the spread.
- **Unlock**: tied to reputation or business tier. It fits alongside
  domains returning (item 16); a contract could end up with several
  languages and a domain.
- Open questions: how many languages at most (2? 3?), and which pairings
  make sense (reuse or extend `PAIRINGS`)?

#### 18. Multiple sites, rooms and buildings
- At larger business tiers (item 13), add an option to expand to
  multiple sites (offices).
  - Each site would plausibly have its own headcount capacity and
    managers, and possibly a regional speciality (e.g. an embedded-heavy
    site).
  - How sites interact with team staffing (can a team span sites?) is
    TBD.
- Builds on office space (item 15): sites are where rooms and buildings
  live, each adding desks.

#### 19. Prestige
- "Acquisition": cash out the studio for a permanent multiplier and pick
  a specialisation for the next run (see the original concept doc). Only
  worth building once there's a long game to reset.

### Polish — slot in whenever there is slack

#### 20. SLOC production animation
- Animate SLOC being produced, e.g. a running counter or lines of code
  ticking up on active contracts, or little bursts from each busy
  person, so the idle layer feels alive rather than just progress bars.

#### 21. Visualise the team and the office
- Some visual representation of the studio: people at desks in
  rooms/buildings, grouped by team or level. It could show who's working
  on what and empty desks. It would pair naturally with the office-space
  mechanic.

#### 22. Skill gain through supervision
- XP is currently a flat rate per contract minute. The design intent is
  that skills grow "under supervision", so e.g. XP could scale with how
  much more skilled the rest of the team is in that language, and/or
  with the ratio of learners to experienced devs. Revisit after the
  learner rule, training and languages-only changes have settled.

## Testing notes

`npm test` runs the Playwright suite in `tests/` against a small static
server (`tests/serve.js`). Tests fix the date with
`page.clock.setFixedTime` (Day 1 is 1 October 2026; `dayDate(n)` in `tests/helpers.js`, with 0 and below for preview days) and simulate time
passing by editing saves and moving the clock. The sandbox's Python tests
need Pyodide: from the CDN, or set `PYODIDE_DIR` to an unpacked `pyodide`
npm package when there's no internet. Switching language on the puzzle page
reloads it, so wait for the new puzzle (e.g. its filename) before acting.
