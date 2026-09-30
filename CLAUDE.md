# Debuggit (formerly Debugg), Debuggit Learn and Debuggit Ltd

The game is called **Debuggit** (September 2026; see item 2c). The code, the repository, the
`debugg-*` save keys and `window.Debugg` keep the old spelling, and "Debugg" below means the
same game. Its logo is a wordmark, "debug it" as a line of code in the day's puzzle language
(`renderWordmark()` in `shared.js`).

Context for continuing work on this repo. **Debugg** is the daily puzzle game:
read a short Python or JavaScript snippet and guess what it prints. **Debugg
Ltd** is the optional idle studio-management game around it, on the **Ltd** tab
next to Daily. Since September 2026 the two are separate: the daily puzzle pays the company
nothing, and the Director's desk is **desk jobs**, questions from past dailies and Learn that turn
up over time (see "The desk" below). The README covers the player-facing rules; this file
is the design and implementation notes, mostly for Debugg Ltd.

**The site is a demo** (Day 1 is Monday 5 October 2026) with no release
date yet. All demo progress is reset when v0.1 comes out, which players are
told on their first visit; see "The demo" below and item 2c.

The merge of the two (item 3c) is done; `ideas/debugg-ltd-merge-plan.md` is
the plan it was built from. Original design brainstorm for the studio:
`ideas/contract-debugger-concept.md`. That doc is the source of the overall
vision; read it for the *why* behind mechanics that aren't built yet. This
file is the *current state* of the implementation, which has diverged and
simplified from that doc in places (noted below).

## Where things live

No build step and no runtime dependencies (besides GoatCounter once switched on, and Pyodide
from jsDelivr in the sandbox). GitHub Pages deploys `main` to
`https://pharazyn42.github.io/debugg/`.

| File | What it is |
|---|---|
| `index.html` | The daily puzzle page. It also holds the slots the studio renders into, and the loader that switches the studio on. |
| `puzzles/` | The puzzle bank, one file per language (`python.js`, `javascript.js`, `c.js`, `rust.js`), and a README on the fields and scheduling. |
| `tools/check-puzzles.js` | Runs every puzzle and every Learn snippet with its real toolchain and checks it prints what it says (`npm run check-puzzles`; also a CI job). |
| `learn/` | Debugg Learn, its own section of the site (`/learn/`): the page (`learn/index.html`), the engine (`learn/learn.js`), the course list (`learn/courses.js`) and one file per unit (`learn/python/01-values.js`). `learn/README.md` has the format and rules. `learn.html` redirects to `learn/` (its old address). |
| `shared.js`, `base.css` | Shared by all pages: languages, the day calendar, XP levels, the highlighter, the base theme. |
| `learn/sandbox.html` | The sandbox, part of Debuggit Learn (moved there September 2026, the player-owner's call): write and run Python (Pyodide) or JavaScript in Web Workers, replay finished daily puzzles (`?lang=python&day=3`), or open a lesson's example (`?lang=python&code=…`). `sandbox.html` redirects there (its old address). |
| `backup.js` | The save backup window: all `debugg-*` storage as one code (`DEBUGG1.` + base64 JSON), and restoring from one. |
| `analytics.js` | GoatCounter page views and named events, to https://debugg.goatcounter.com. `SITE_COUNT_URL = ''` switches it off; tests switch it off via `window.DEBUGG_GOATCOUNTER`. |
| `privacy.html` | What's stored and sent, for players. Keep it in step with `analytics.js`. |
| `CHANGELOG.md`, `ltd/CHANGELOG.md`, `learn/CHANGELOG.md`, `whatsnew.html` | The lists of changes, by release, written for players: the daily puzzle's, Debuggit Ltd's and Debuggit Learn's. The What's new page shows the daily's, Ltd's with `?ltd`, or Learn's with `?learn` (without "Unreleased"). |
| `tools/release.js`, `tools/check-scope.js` | Cuts a release of the daily, Ltd or Learn (`[ltd|learn] bump|notes|check|tag|name <version>`), and the CI check that keeps each PR to one of them. See "Releases" below. |
| `fonts/` | Self-hosted Sora and JetBrains Mono (OFL), declared in `base.css`. |
| `img/` | The Debuggit duck: `duck.svg` (logo and favicon), `duck-180.png` (home-screen icon) and `share.png` (the 1200×630 link-preview card). The PNGs are rendered from the SVG; redo them if the duck changes. |
| `daily/` | The daily page's parts: `formats.js` (each puzzle format's question and answer text), `stats.js` (the stats panel), `sharecard.js` (the share picture), `archive.js` (past puzzles, played as practice at `index.html?day=N`) and `trace.js` (Step through it). |
| `tools/trace-puzzles.js`, `tools/trace.py`, `tools/probe.py` | `npm run traces` records every Python puzzle's step-by-step trace with real Python into `puzzles/traces-python.js`; `probe.py` counts line runs and tries line orders for the checker. |
| `ltd/ltd.js`, `ltd/ltd.css` | Debugg Ltd. Loaded only when the studio is on. CSS is scoped under `.ltd`. |
| `studio/index.html` | Redirect to `../index.html?ltd`, the studio's old address. |
| `tests/` | Playwright tests, run by `npm test` and GitHub Actions. |

**How the puzzle page and the studio connect.** Hardly at all, since September 2026 (the
player-owner's call: the daily is its own game). The studio reads puzzle XP through
`Debugg.readXp()` for the Director's skills and the founder's bonus, and its desk jobs reuse past
daily puzzles and Learn's questions (`ltd/desk.js`). The daily page never depends on the studio.
`index.html` still fires `debugg:puzzle-finished` (`{ lang, day, solved, guesses, hintLevel, xp,
streak }`) when a game ends, but nothing listens to it now.

**Two areas: the game and Learn** (split September 2026, the player-owner's call). The game is the
daily puzzle and Debuggit Ltd, with **Daily | Ltd** tabs on `index.html`. **Debuggit Learn** is its
own section at `learn/`, with its own header and a "← Debuggit" link back; it's the same site, so
saves, XP levels and the backup code are shared. The game links into Learn without a tab: a "learn
to code" footer link, the Director's languages on the Ltd card (`a.learn-lang`, for courses that
exist), and, after a missed or revealed puzzle (not a first-guess solve), `#learnMore`: the unit
named by the puzzle's `learn` field (`learn/#python/strings`, which picks the unit out), or the
course from the start. `index.html` loads `learn/courses.js` to know which courses exist. The
checker fails a `learn` tag that isn't a written unit. The **sandbox** belongs to Learn too
(`learn/sandbox.html`, showing Learn's version); the game links to it from its footer and from a
finished puzzle's "Run it yourself", and lessons link to it from every step with code.

**Tabs and switching on.** The game's pages have **Daily | Ltd** tabs. The
Ltd tab is `index.html?ltd` (`body.ltd-view`; the `?ltd` stays in the address so reloads stay
there): the company, with its desk beside the studio and no daily puzzle (`main.desk` is hidden),
or, with no running company, a card (`#ltdIntro`) to start or resume one. Opening the tab never
founds a company by itself. The loader at the bottom of `index.html` loads `ltd/desk.js` and then
`ltd/ltd.js` only on the Ltd tab (for a running company, or one being started or resumed, from the
card on the Ltd tab or the one under a finished puzzle, which moves to the Ltd tab), or when an
old pre-merge save exists (which opens the Ltd tab). On the Daily tab a running company isn't
loaded; a one-line note says how many desk jobs are waiting (read from the save) and links to Ltd.
`DebuggLtd.start({ stats, studio, board, desk })` renders into the four slots and either resumes
the saved company, imports an old one, or founds a new one. `body.ltd-on` shows the desk and the
studio in the two-column layout. The Ltd tab's header reads **Debuggit Ltd** (and the page title).
The desk used to be the daily puzzle itself, which folded to its tiles once done; that went with
the separation.

**Languages and the rotation.** There's one puzzle a day, and the
languages take turns. `LANG_INFO` in `shared.js` describes every language
with puzzles (Python, JavaScript, C, Rust: name, extension, whether the
sandbox can run it, its Debugg Ltd name, e.g. C is the studio's `C/C++`,
and a playground link for Rust). `ROTATION` lists the languages in play and
the day each joins (`from`); it's Python only for the demo. The week's six
slots (Monday to Friday, then the weekend) go to the settled languages in
turn, shifting one slot each week (`weekLangs()`), so each language gets
every difficulty. A language in its first `NEW_LANG_WEEKS` (2) weeks only
gets Monday and Tuesday. `LANGS` is the languages that have joined by today
(the sandbox shows the runnable ones; the Director's skills show them all).
Tests set the rotation with `openAt(page, path, day, { rotation })`
(`window.DEBUGG_ROTATION`); left out, tests see what players see.

**XP.** Kept per language in `debugg-xp` (`{ python: 120, rust: 40 }`);
the overall XP is their total (`totalXp()`), shown as an "Overall" row
above the languages, with the same level curve. Level-ups fire
`level/<lang>/<n>` and `level/overall/<n>` analytics events.

**The demo.** `DEMO` in `shared.js` is on. It shows a notice on the first
visit (again from the **demo** badge in the header; tests switch the
automatic one off with `window.DEBUGG_DEMO_NOTICE = false`), and cuts Debugg
Ltd down to hotfixes and patches (`DEMO_TIERS` in `ltd.js`; `DEMO_LOCKED_ROLES` is empty
since managers came to the demo in September 2026, with desks, as its money sink). The locked
types, and premises beyond co-working desks, show as "coming in v0.1". Patches need more than
10 staff (see the contract board), so a manager and co-working desks. Old saves keep any staff
and running jobs they have, but their bigger offers go and their repeats stop.

**Save versions and the v0.1 reset.** Every save is marked with
`debugg-version` (`SAVE_VERSION`, `'demo'` now). On load, a save whose
version is in `WIPED_VERSIONS` loses everything under `debugg-*` (and the
pre-merge studio save) except sandbox drafts, and backup codes from those
versions are refused. For v0.1: set `DEMO` to false, `SAVE_VERSION` to
`'0.1'`, `WIPED_VERSIONS` to `['demo', '']` (`''` = saved before the
marker existed), and `LAUNCH` to the real Day 1. Tests fake a reset with
`window.DEBUGG_WIPED_VERSIONS`.

**Releases.** Three products, released separately (the player-owner's calls, September 2026: Learn
first, since the Ltd game changes far more often than Learn, then the daily and Ltd): **Debuggit**,
the daily puzzle; **Debuggit Ltd**, the studio game; and **Debuggit Learn**. Each has:
- **Its own semantic version:** `APP_VERSION` (the daily), `LTD_VERSION` or `LEARN_VERSION` in
  `shared.js`. All are separate from `SAVE_VERSION`, which only changes to reset saves. The daily
  and Ltd shared one version up to 0.0.4, where Ltd's starts (its notes from 0.0.1 to 0.0.4 were
  moved into its own changelog); Learn split off at 0.0.2. They run 0.0.x through the demo;
  **0.1.0 is the launch** for each, since the v0.1 reset clears everything. After that, the middle
  number is for new things to play (Learn: new units or courses) and the last for fixes and balance.
- **Its own changelog:** `CHANGELOG.md` for the daily, `ltd/CHANGELOG.md` for Ltd,
  `learn/CHANGELOG.md` for Learn.
- **Its own What's new:** `whatsnew.html`, `whatsnew.html?ltd` or `whatsnew.html?learn`
  (`PRODUCTS` in `shared.js` says which changelog each reads). The Daily tab's footer (and the
  privacy page's) shows "v0.0.4 demo", the Ltd tab's "Ltd v0.0.4 demo" and Learn's "Learn v0.0.5
  demo", each linking to its own What's new. Each has its own "· new" until the player has looked
  (`debugg-seen-version`, `debugg-seen-ltd-version`, `debugg-seen-learn-version`).
- **Its own tags and GitHub Releases:** `v0.0.5` / "Debuggit v0.0.5", `ltd-v0.0.5` / "Debuggit Ltd
  v0.0.5", and `learn-v0.0.5` / "Debuggit Learn v0.0.5". Only the daily's releases are marked the
  repository's "latest".

**One product per branch (decided with the player-owner).** A branch, and so a PR, changes one
product, never more. The exception is a change that really affects more than one: then each
changelog it touches gets notes in that PR, and those products are released together.
- The **scope** CI job (`tools/check-scope.js`) enforces this on every PR. Learn files are
  `learn/` (the sandbox included), `learn.html`, `sandbox.html`, `tests/learn.spec.js` and
  `tests/sandbox.spec.js`. Ltd files are `ltd/` (its changelog included), `studio/` and
  `tests/ltd.spec.js`. Daily files are `index.html`, `daily/`, `puzzles/`, `CHANGELOG.md` and
  `tests/daily.spec.js`. `index.html` also holds the Ltd tab, so on a branch whose other files are
  all Ltd's it counts as Ltd's. A PR touching more than one fails unless it changes each one's
  changelog.
- Everything else is shared (`shared.js`, `base.css`, `backup.js`, tools, docs, CI) and counts for
  none. A shared change players will notice still needs a line in the changelog of each product it
  affects.
- This session works from one designated branch, so each PR from it is kept to one product, and
  the branch is re-synced with `main` after every merge.

The routine:
- **Every change players will notice adds a line under `## Unreleased`** in its product's
  changelog, in the same PR, written for players.
- The player-owner says **release**, optionally with the product and version ("release Learn",
  "release 0.1.0").
  - Which product: whichever they name. If they don't name one, release every product with
    something under Unreleased.
  - Which version: the one they give, otherwise the next patch number.
  - Bump with `node tools/release.js bump <version>` for the daily,
    `node tools/release.js ltd bump <version>` for Ltd, or `node tools/release.js learn bump <version>`
    for Learn. That dates the Unreleased notes and
    sets the version. Then commit, PR (its scope check passes, since a release only touches
    `shared.js` and that product's changelog) and merge.
  - Then run the **Release** workflow on `main` with that product and version
    (`workflow_dispatch`). Claude starts it through the GitHub connection, since this session
    can't push tags, or the player-owner can from the Actions tab. Pushing a `v<version>`,
    `ltd-v<version>` or `learn-v<version>` tag also starts it.
- `.github/workflows/release.yml` runs every test (it calls `tests.yml`), checks that `shared.js`
  and that product's changelog agree with the version, then creates the tag and a GitHub
  Release with that version's notes. Tests failing means no release.
- Until item 2d, `main` still deploys straight to GitHub Pages, so a release is a label and a
  changelog entry; with 2d the public site will follow releases and `main` will go to a dev site.

**The calendar.** The demo's Day 1 is Monday 5 October 2026 (`LAUNCH` in `shared.js`). Days
before it are preview days (0, -1, …), labelled "Preview", each with its
own puzzle and saves. Saves are keyed by day number, so **don't move Day 1
once players have real progress**. If it does move, `shared.js` notices
(it remembers the date in `debugg-epoch`) and clears per-day progress, the
streak and Debugg Ltd's `paid` ledger, keeping XP, the company and sandbox
drafts.

**The weekly rotation.** Each weekday has a difficulty (Monday 1 to Friday
5), and Saturday and Sunday share one weekend puzzle (a stand-in 5 until
the code challenges exist), saved under Saturday's day number: its
*slot* (`slotDay()`). The schedule is computed from Day 1 in every
browser: each slot's language (from the rotation) takes its first unused
puzzle of that difficulty, in its file's order, else the nearest difficulty
(easier first), and a language's puzzles are reused once all are used. Streaks run slot to slot, so the
weekend counts once. XP for a perfect solve follows the day (`BASE_XP`:
60, 80, 100, 120, 150, weekend 200), and so does desk pay. Adding puzzles
to the end only changes future days (and days that had fallen back), so
it's safe to add them before they're due.

**Saves.** Puzzle progress is `debugg-day<N>` (one per day, whatever
the language), plus `debugg-xp`, `debugg-streak` and the sandbox's
`debugg-lang` and `debugg-sandbox-<lang>` drafts.
The company is `debugg-ltd`. Pre-merge studio saves
(`contract-debugger-state-v3`) are imported once into `debugg-ltd` (dropping
the old desk's `activeContract`), then removed. The boot sequence in
`ltd.js` also carries the older shape guards (tier renames, Assembly,
SLOC targets); add a similar guard if the state shape changes again.

## Data model (as currently implemented)

```js
// The desk: desk jobs (ltd/desk.js for the questions)
DESK_EVERY_MIN = [45, 90], DESK_MAX = 3, DESK_LIFE_H = 4   // a job every 45–90 min, 3 waiting at most, open 4h
DESK_SIZES = 1 (50%), 2 (33%), 3 (17%) questions
DESK_PAY = { 1: 40, 2: 55, 3: 70, 4: 85, 5: 100 }         // ¤ per right answer, by difficulty (Learn = 1)
DESK_BOOST = { 1: ×1, 2: ×1.25, 3: ×1.5 }                 // when every answer in the job is right
DESK_REP = 1, DESK_SEEN = 40                               // reputation per right answer; recent questions kept out
START_CASH = 150, FOUNDER_BONUS_CAP = 1000             // + ¤1 per puzzle XP at founding
DIRECTOR_BOOST_PER_LEVEL = 0.01, DIRECTOR_BOOST_CAP = 0.10   // success chance per puzzle level above 1

LANGS   = ['Python', 'C/C++', 'JavaScript', 'Rust']   // Assembly dropped; old saves fold it into C/C++
// Languages only: domains were removed (item 3) and are planned to return later (item 16).
SKILL_XP = [10, 50, 150, 400, 1000] // total XP for skill levels 1..5; no top level: each later gap is
                                    // 800 longer (6 at 1,800, 7 at 3,400, 8 at 5,800…; skillXp())
SKILL_FULL = 5                      // skill's effects stop growing at level 5

ROLES = { Director, Manager, Graduate, Junior, Senior, Principal }  // sloc, salary/min, cost, reliability
// costs: Manager 900, Graduate 180, Junior 750, Senior 3000, Principal 12000 (× the market's prices)
PROMOTION = { Junior: {12h, lang:3}, Senior: {3 days, 5}, Principal: {14 days, 8} }  // contract time + a skill level
SKILL_SPEED_BEYOND = 0.05                // +5% base SLOC/min per skill level past 5
EXPERT = [Lv 3 ×1.3 (14), Lv 5 ×1.6 (7), Lv 8 ×2.2 (3)], none 76, EXPERT_HOTFIXES = 1   // expert contracts
LINE_RATE = 1                            // ¤ per SLOC delivered, × tier multiplier (skill doesn't raise pay)
MARKET_EVERY_H = [12, 36], INFLATION = [2%, 4%] (every role), COMPETITION = [6%, 15%] (one role),
COMPETITION_CHANCE = 0.4                 // hiring prices only go up
SKILL_SPEED = 1.0, SKILL_CHANCE = 0.05   // level 5+ in the contract's language: 2× SLOC/min, +5% success
RETRY_TIME = 0.5, RETRY_PAYOUT = 0.75
BENCH_MARGIN = 0.05                      // odd jobs on the bench pay salary + 5%
TIERS = [ hotfix ~5 SLOC / 1 dev, patch ~400 SLOC / 3-5 + senior,
          minor release ~2,700 SLOC / 5-10 + principal,
          major release ~22,500 SLOC / 10+ incl. manager, 2 principals, 3 seniors ]
// Renamed from quick fix / sprint / milestone / full delivery (same rules,
// same indices); TIERS_VERSION lets the boot sequence refresh old boards.
// The board holds one hotfix per language, plus OFFERS_PER_TIER (2) of each
// other type; BOARD_VERSION 2 = languages only (older saves are converted).
// each tier: minutes + refSloc (reference time for the cheapest valid team);
// an offer's SLOC target = refSloc × minutes ± SLOC_SPREAD (15%)
```

**Top-level state:**
```js
state = {
  money, reputation, lastTick,
  roster: [ { id, name, role, since, worked, lang: {name: xp}, away?, notice?, raise? } ],  // Director is roster[0]; worked = ms on contracts at current level;
                                                                        // away = { kind: 'training'|'holiday'|'sick'…, until } (no odd jobs meanwhile)
  board:  [ { id, tier, lang, sloc, risk, expert, expiresAt } ],  // a hotfix per language + an expert hotfix + 2 of each other type; sloc = work target;
                                                          // risk = 'standard'|'risky'|'high'; expert = skill level needed (0 = none)
  jobs:   [ { id, tier, lang, sloc, teamSloc, team: [ids], startedAt, endsAt, chance, payout, repeat,
              status: 'running'|'failed', attempt: 1|2 } ],
  log:    [ { kind: 'ok'|'bad'|'info', text } ],
  collapsedLevels: [],                            // roster tree groups folded in the UI
  collapsedTiers: [],                             // contract board groups folded in the UI ('hotfix', …)
  tiersVersion, boardVersion,                     // save-shape markers for the boot migrations
  enabled, pausedAt,                              // false / a time while the player has it paused
  desk: { jobs: [ { id, size, questions: [ids], answered: [bools], expiresAt } ], nextAt, seen, done },  // desk jobs
  applicants: [ { id, role, person, cost, expiresAt } ], nextApplicantAt,
  guideDone, showUnknownOffers,                   // the first-steps guide is over; the board shows every offer
  stage,                                          // the business stage last announced ('startup', 'small', …)
  market: { prices: { Graduate: 1.08, … }, nextAt }, // hire-cost multipliers, and when the market next moves
  office: { cowork },                             // co-working desks rented beyond the spare room's 4
  nextNoticeAt                                    // when the next hourly notice roll is due
}
```

## What's implemented

- **The desk is desk jobs** (the player-owner's call, September 2026, when the daily was separated
  from the game; `moveDesk()`, `state.desk`, `ltd/desk.js`). A job turns up every 45–90 minutes
  (the first straight away), while the page is closed too (not while paused), at most 3 waiting,
  each open for 4 hours. It's 1, 2 or 3 questions (50/33/17%), drawn from:
  - **past daily puzzles** (the last 40 slots, never today's), in their own format; "order the
    lines" is asked as "what does this print?";
  - **Debuggit Learn's questions** from any written unit (decided: Learn stays open to everyone),
    whose unit files `desk.js` loads on demand.

  Each question gets one answer. **Pay is per right answer** (`DESK_PAY` by difficulty, Learn
  questions as 1: ¤40–¤100), and a job with every answer right is boosted (×1.25 for 2, ×1.5 for 3);
  1 reputation per right answer. Answers are saved as they're given, so a reload carries on rather
  than retrying. Questions asked lately (`seen`) and ones in other waiting jobs are kept out of new
  jobs. Desk pay shrinks by business stage, as before. The Director card reads "Taking desk jobs".
  Before this the desk was today's daily puzzle (¤2 per puzzle XP, a streak bonus, the `paid`
  ledger, which old saves drop), and before that an unlimited set of desk contracts; a lone grad
  on a hotfix still pays for itself.
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
- **Hires' starting skills** (languages only):
  - Grads: one language at level 1.
  - Juniors: a language at level 1–2, sometimes a second at 1.
  - Seniors: a language at 4–5, and a second at 1–3.
  - Principals: a language at 7–8, plus two more lower down (3–5 and 1–3).
- **Promotions** need three things, and the player confirms with a
  "Promote" button:
  - **Contract time at the current level**: 12 hours for Junior, 3 days for
    Senior, 14 days for Principal. Deliberately slow (September 2026, after a playtest
    where the first promotion came an hour in): hiring at a level is the quick route,
    growing your own people the cheap one. Only time spent on contracts counts;
    time on the bench doesn't. It's credited when each contract finishes
    (`p.worked`) and resets on promotion.
  - **A skill level** in their best language: 3 for Junior, 5 for Senior, 8
    for Principal (`PROMOTION`; 1 / 3 / 5 until September 2026, when levels lost their top and
    the player-owner asked for higher barriers). Set so someone who sticks to one language gets
    there about when the contract time is up (Lv 3 after about 7 hours on hotfixes, Lv 5 about 3
    days later, Lv 8 after about 14 days on patches); spreading across languages takes longer.
  - **A free slot** at the next level.
- **Contract board**: shown as a tree like the roster, one foldable group
  per contract type (Hotfixes, Patches, Minor releases, Major releases),
  each header showing how many offers and how many are running. Folded
  groups are remembered (`collapsedTiers`). There's **always a hotfix in
  every language**: a taken or expired hotfix is replaced in the same
  language, and the board fills in any language that's missing, so a lone
  dev always has something they can take (these everyday hotfixes are never expert work), plus
  `EXPERT_HOTFIXES` (1) **expert hotfix** in any language, replaced by another expert one. The other types have 2 offers
  each, in random languages, but only once the company has **more than 10 staff**, the
  Director included (`PATCH_HEADCOUNT`, `tierLock()`); until then they show locked as
  "unlocks above 10 staff", and dropping back to 10 takes their offers off the board (running
  contracts finish; repeats stop). Each offer shows its language and SLOC
  target. Staff them via the team picker, which ticks off the
  requirements and shows success chance, payout and salary cost. It has a
  "Suggest a team" button. Each person can only be on one contract at a
  time.
  - **Skill rule**: a dev "knows the stack" for a contract if they have at
    least one bar in its language (`qualifiedFor()`; managers are exempt).
    - Solo hotfixes need someone who knows the stack.
    - On team contracts, devs who don't can join as **learners**. They
      write no code and each costs the team `LEARNER_DRAG` (10%) of its
      output in mentoring time. There must be at least one dev who knows
      the stack per learner. Learners earn XP as normal on delivery. This
      is the only way to gain a first bar in a new language.
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
    × (1 + `SKILL_SPEED` × level / 5) in that contract's language, up to level 5 (double
    output), then +`SKILL_SPEED_BEYOND` (5%) per level after (a principal at Lv 8: 70 × 2.15
    = 150.5 SLOC/min; `speedFor()`). Success chance stops growing at level 5.

    The reference team, with no matching skills, takes the nominal time:
    - a lone grad on a hotfix: ~1 min;
    - senior + 2 grads on a patch: ~10 min;
    - principal + 4 grads on a minor release: ~30 min;
    - 2 principals + 3 seniors + 4 grads + a manager on a major release:
      ~90 min.

    More senior, bigger or better-matched teams finish sooner. The picker
    shows each person's SLOC/min on that contract, plus the team total with
    the skill-match boost and the resulting time.
  - Payout = SLOC target × `LINE_RATE` × tier multiplier. So a contract pays the same
    whoever does it; faster (more skilled) teams simply earn more per minute and pay less
    salary per contract. Skill used to raise the payout too, which squared its effect.
  - Success chance = average reliability by level, plus up to
    `SKILL_CHANCE` (+5%) scaled by the team's average bars in the
    language (a grad with 1 bar adds +1%), plus the Director's boost.
  - On delivery, everyone on the team gains the tier's XP in that
    language. XP is per minute spent on it (`xpPerMin`: 0.33 /
    0.4 / 0.45 / 0.5 by tier), independent of team speed, so skill bars
    build at roughly the pace of the contract-time promotion timers. This is the placeholder skill-gain
    mechanic; it doesn't yet model supervision.
  - **Risk** (the player-owner's idea, September 2026; `RISKS`, `offer.risk`, copied to the
    job): each offer rolls **Standard** (70%), **Risky** (22%: pay ×1.4, −15% success, failing
    costs 2× the usual reputation) or **High stakes** (8%: pay ×2, −30% success, 4× reputation).
    Success never drops below `MIN_CHANCE` (5%). A repeat keeps its contract's risk; managers
    staff any risk. Per attempt, risk is roughly break-even or better for a grad (71% × 1 vs
    41% × 2) and clearly better for strong teams, with the reputation cost as the catch. Offers,
    the picker and jobs show it ("High stakes · pays ×2 · −30% success"); older offers count as
    Standard.
  - **Expert contracts** (the player-owner's idea, September 2026; `EXPERT`, `offer.expert`,
    copied to the job): an offer can need someone on the team at a skill level in its
    language, **Lv 3** (14%, pay ×1.3), **Lv 5** (7%, ×1.6) or **Lv 8** (3%, ×2.2), rolled per
    offer on patches and up (76% need none) and always on the expert hotfix. It's a check in
    `evaluateTeam()` ("someone at Python Lv 5+ (expert)"); a solo hotfix needs its one dev at
    the level (`meetsExpert()`), and "Suggest a team" takes the best-matched qualifying dev
    first. The pay stacks with risk. A repeat keeps its contract's level; managers staff them.
    Cards show "Expert · needs Lv 5 Python · pays ×1.6", and warn when nobody on staff is at
    the level yet; jobs show a "Lv 5" tag. Older offers have none.
  - **Retry on failure**: a failed contract can be retried once, in half
    the time, for 75% of the payout. If the retry fails, the contract is
    lost. Non-repeating jobs wait in a "failed" state, with the team held,
    until the player picks Retry or Drop. Repeating jobs retry
    automatically, since it's the better deal per minute.
- **Repeat**: a job can be set to roll straight into a new contract of the
  same type with the same team when it finishes. The new contract is chosen
  so the whole team qualifies under the skill rule. This is on by default for
  hotfixes. Repeats keep chaining while the page is closed, through the last
  4 hours (the offline cap: time away beyond it is skipped, and a repeat or retry due before it
  picks up from it; until October 2026 a repeat finished before the cap stopped, so an overnight
  company paid 4 hours' salary for no work), and stop if the team no longer meets the
  requirements.
- **Roster UI**: the Director card, then a collapsible tree grouped by
  level. Each group header shows its headcount, how many are busy, SLOC/min
  and salary/min. Collapse state persists. Clicking a card opens the
  employee panel: every language as a level ("Lv 6", with no top; the best in amber) and a bar
  of XP towards the next level ("2600/3400 xp"), current assignment, and a promotion checklist.
  Roster cards show a dev's two best languages ("Python Lv 6 · Rust Lv 2"). Skill levels were
  five pips until September 2026 (the player-owner's call); levels 1–5 need the same XP as the
  five pips did, so nothing changed for existing staff, and levels above 5 don't yet add speed or
  success (`SKILL_FULL`).
- **Payroll** is drawn every second, including offline (capped at 4 hours).
  Cash can go negative.
- **Odd jobs** (the player-owner's call, September 2026): developers on no contract earn their
  salary plus `BENCH_MARGIN` (5%), netted against payroll every second (and offline, by who was
  busy at the start), so a benched team grows the company slowly: a grad ¤2.10 vs ¤2/min, a
  senior ¤12.60 vs ¤12. No XP or promotion time, so contracts stay far better. Managers earn
  none. Cards read "On the bench · odd jobs · +¤0.1/min". **Only the bench earns it**
  (`onBench()`): anyone doing something else earns none, whether on a contract (including a failed
  one waiting for Retry or Drop) or away. Anything that takes someone away (training, holiday, off
  sick, events) must set `p.away = { kind, until }`, which `onBench()` already respects.
- **Business stages** (`STAGES`, `stageIndex()`, shown in a stage bar above the stats, with a
  step track and what the next stage needs): **Start-up** (no managers), **Small business** (1
  manager), **Mid-size company** (3 managers, 25 staff), **Large company** (6, 60),
  **Multinational** (12, 150); headcount includes the Director. Decided with the player-owner:
  a start-up is run by hand and lives on the daily puzzle; from a small business on,
  **managers staff idle developers** (`managersStaff()`, every tick and on load: the biggest
  team contracts a free team can take, by "Suggest a team", then hotfixes; all on repeat, and
  never the offer open in the picker), and **desk pay shrinks** by stage (`desk`: 100%, 50%,
  25%, 10%, 5%; reputation from puzzles doesn't). A change of stage is logged, announced and
  tracked (`ltd/stage/<key>`); `state.stage` remembers the last one. Managers are in the demo
  (they were locked until September 2026), so a demo company can become a small business. This is the
  start of item 13.
- **First steps and warnings** (`guideStep()`, `renderGuide()`): a "Next step" card at the
  top of the Studio panel walks a new company through hiring a grad, putting them on a hotfix
  they can take (the button pulses, `.guide-target`) with repeat on, and solving today's puzzle.
  It ends (`state.guideDone`) once those are done, or when dismissed. After that, notes stay:
  devs on the bench doing odd jobs (which barely cover their salary; a contract earns far more),
  and cash below zero. The welcome message can be dismissed. Added after a playtest where an unstaffed
  grad left the company ¤315 in debt three hours in.
- **Slot counts** explain themselves: when a level is full but there's room for more devs, a
  note under the counts says why (everyone needs someone a level up) and what makes room. Hire
  buttons say e.g. "grads full — a junior makes room for 3 more".
- **The board folds offers nobody can take**: offers in languages nobody on staff knows sit
  behind a "Show 3 in languages nobody on staff knows" toggle (`state.showUnknownOffers`), unless
  nobody's been hired yet.
- **Applicants** (`moveApplicants()`, `state.applicants`, `state.nextApplicantAt`): only
  graduates and managers have hire buttons. Juniors, seniors and principals *apply*: one
  every 8–24 hours (the first 2 hours after founding), at most 3 waiting, each asking the
  market price × 0.9–1.2, with the offer open for 12 hours ("took a job elsewhere" after).
  Reputation decides who applies (`APPLICANT_REP`): juniors from the start, seniors from
  500, principals from 3,000, weighted 6 : 3 : 1 among those open. A competition move on a
  level also hires away a waiting applicant at it. Arrivals and expiries happen while the
  page is closed (not while paused). Decided with the player-owner: promotion is the steady,
  cheap way to grow seniority; applicants are the pricey chance to get ahead. This is
  reputation's first use (item 12).
- **The hiring market** (`moveMarket()`): hire costs only go up. Every 12–36 hours (at
  random), either inflation raises every role's cost by 2–4%, or a rival studio competing
  for one level raises that one by 6–15%. Each move is logged, and hire buttons show the
  rise since founding ("¤270 ↑50%"). Moves happen while the page is closed (not while
  paused), and are kept in `state.market`.
- **The office** (phase 1 of item 15e, September 2026; `SPARE_ROOM_DESKS`, `COWORK_*`,
  `state.office`): everyone on staff needs a desk, except the Director, who works from home at
  their own desk jobs. The spare room has 4 desks, free, matching the Director's span of 4 devs, so
  the first manager needs the first **co-working desk**: ¤1/min each (`COWORK_RATE`), up to 8
  (`COWORK_MAX`, so 12 staff and the Director, enough for patches), rented and given up from the
  **Office** line in the Studio panel (a desk can only be given up while one is free). Rent is
  drawn with payroll every second (`paySalaries()`), offline too, not while paused; the stats bar
  then reads "Payroll + rent". The structure line shows "Desks 5/6". Saves from before desks get
  co-working desks for everyone they have. Business units, WFH applicants and bigger premises are
  the next phases.
- **A cramped office** (the player-owner's call, September 2026; `CRAM_MAX`, `CRAMPED`,
  `cramLevel()`): a full office is cramped, and up to 2 more people can be squeezed in without
  desks. Everyone writes 5% less code with every desk taken, 15% with one squeezed in and 30% with
  two (applied in `devSlocOn()`, so to contracts started while it's cramped), and notices are
  likelier. Past that, `deskProblem()` blocks hiring ("no room to squeeze anyone else in"); hire
  buttons and applicants warn first ("no desk: squeezed in, everyone −15% speed"), and the Office
  line says how cramped it is. A co-working desk can be given up as long as nobody more than
  `CRAM_MAX` ends up without one.
- **Notice** (the player-owner's idea, September 2026; `moveNotices()`, `p.notice = { reason,
  until, ask }`): every hour (`state.nextNoticeAt`) each person but the Director hands in their
  notice with `NOTICE_PER_DAY` (1.5%) / 24 chance, × `NOTICE_CRAMPED` (1, 3, 5, 7 by cramp
  level); a cramped office gives the reason "the office is too cramped", otherwise "has a better
  offer". They stay `NOTICE_H` (24) hours, then leave once off any running contract (a repeat
  stops for them; a failed contract loses them). Turned around by a free desk (cramped notices
  are withdrawn) or by the **Keep** button on their card, a pay rise of `ask` ¤/min (15–35% of
  their level's salary, `RAISE`), kept in `p.raise`; `salaryOf(p)` is their pay everywhere. A
  "handed in their notice" alert shows in the Studio panel. Only the last 4 hours roll while the
  page is closed; paused time doesn't count. Leaving can break the supervision structure, which
  then blocks hiring until it's fixed.

## Known gaps — not wired in yet

- **Reputation only decides which applicants turn up** (roadmap item 12 has more for it).
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
- **Done** (September 2026): versions, the footer version and What's new page, `CHANGELOG.md`,
  `tools/release.js`, and tag-triggered GitHub Releases gated on the tests (see "Releases"
  above). v0.0.1 is the demo as it stood. Still to do: separating "released" from "in
  progress", which is item 2d (the public site following release tags, `main` on a dev site),
  and migrating saves deliberately by version rather than by shape guards.
- Adopt semantic versioning (MAJOR.MINOR.PATCH):
  - MAJOR: save-breaking or big design changes, i.e. whenever the storage
    key has to be bumped;
  - MINOR: new mechanics;
  - PATCH: fixes and balance tweaks.
- **Show the version in the game** (e.g. the footer) and store it in the
  save (started: saves carry `debugg-version`, `'demo'` for now, and v0.1
  resets demo saves; see "Save versions" above), so a save can be migrated deliberately rather than by ad-hoc
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
- **Step 1 is done and live** (`analytics.js`, GoatCounter at
  https://debugg.goatcounter.com, events listed in `privacy.html`). The
  notes below are the reasoning behind it.
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

#### 2c. Direction: company-first, and the name Debuggit
Decided with the player-owner after the naming search (September 2026).

- **Why change direction.** "Guess what this prints, daily" is easy to
  copy, and others already exist: What's the Output?
  (https://whatstheoutput.online, one JavaScript snippet a day) and Debug
  Challenge (https://debugger-zeta.vercel.app). What nobody else has is
  the studio: a software company you grow, where your own daily puzzle is
  the Director's desk. So that's what to lead with.
- **The target shape:**
  - **Debugg Ltd is the game.** The company is founded on the first visit
    rather than behind "Start your own company", and the page is framed
    as the studio, with today's puzzle as its desk panel.
  - **The daily stays, as the desk.** It still pays the company, levels
    the Director and keeps the Wordle-style share card, since that's how
    dailies spread. Keep it playable without a company too, quietly: it
    costs nothing and some people only want the puzzle.
  - **Learn is its own lane** (item 3d), for beginners at their own pace.
    It feeds the company through the Director's language levels.
- **Decide from the demo.** The demo (Day 1: Monday 5 October 2026, no
  release date for v0.1 yet) runs as the daily with a cut-down studio one
  click away, and all its progress is reset at v0.1. After two or three weeks,
  GoatCounter's `ltd/founded`, `ltd/hired/…` and `ltd/paused` events
  show how many puzzle players start a company and keep it running. If a
  good share do, v0.1 goes company-first.
- **What company-first needs** (worth building either way):
  - the balance pass (item 10) and reputation gating (item 12): an idle
    game lives or dies on depth, and today it's beta and untuned;
  - a first-time walkthrough: hire a grad, staff a hotfix, solve today's
    puzzle to pay the studio (item 10b);
  - founding on first visit, and the studio-first layout.
- **Risks:** idle games are a narrower taste than "guess what this
  prints", and a big screen of numbers is a harder first impression
  than one snippet. The walkthrough and keeping the puzzle up front are
  the answer to both.
- **The name is now Debuggit** ("debug it"), decided with the player-owner
  after the checks below. Players see Debuggit, Debuggit Learn and
  Debuggit Ltd; the logo is a **wordmark**, "debug it" written as a line of
  code in the day's puzzle language, so it changes with the rotation:
  `debugg(it)` (Python), `debugg.it()` (JavaScript, and the default),
  `debugg!(it)` (Rust), `debugg(&it);` (C), plus `debugg.learn()`,
  `debugg.run()` (sandbox) and `debugg.ltd()` (the studio, when it's on).
  It's drawn by `renderWordmark()` in `shared.js` with the puzzle
  highlighter. The typed name stays plain "Debuggit", since `<>`, `()` and
  `.` can't go in app titles, handles or domains.
  - **Clashes found:** no exact "Debuggit"; the nearest is DEBUGIT
    International (debugit.net), a games QA company, which sounds the
    same. debugg.ai is still one letter-pattern away in writing.
  - **Still to do before spending money on it:** check domains
    (`debugg.it` matches the `debugg.it()` wordmark, but `.it` has
    residency rules; also `debuggit.com`, `.game`, `.dev`), a proper
    trademark search (USPTO, UK IPO, EUIPO) for Debuggit and Debugit, the
    GitHub name, and a GoatCounter site under the new name. Renaming the
    repository (the Pages address) can wait for a custom domain.
  - Other names checked and dropped along the way: Buggit (a project
    management app and a testing company), Squashit (a bug-squashing app
    game), Printle (two daily word games), Tracebug (an AI bug tool);
    Gitcha and Stepthru looked free but were liked less.
- **Before that, the plan was to keep Debugg.** debugg.ai (an AI testing
  tool, with a VS Code extension and the `debugg-ai` GitHub organisation)
  is the clash that started the search.
  Ideas from then that still apply: a duck mascot (rubber-duck debugging)
  on the logo and share card, and a share card like "debugg.it() #14 ·
  Python · debugged in 2".
- **Names checked and ruled out:** dbugg (DBUGG Studios, dbugg.com and
  the `dbugg` GitHub name are taken, and it sounds like Debugg anyway);
  Heisenbug (a trademarked Norwegian tech company and a QA conference);
  names of people in general (the player-owner's preference); and the
  obvious duck names (Rubberduck is a VBA debugging tool, QuackStack Ltd
  is a web studio, DuckType is a dictation app). Unchecked duck ideas
  for later, e.g. a default company name: Duck Test Ltd, Bathtub Labs,
  Waddle, Quacked It.
- **Keep the internals** whatever the product is called: the `debugg-*`
  storage keys, the `debugg:puzzle-finished` event and `window.Debugg`
  are invisible to players, and renaming them would break every save.

#### 2d. Private repo, a new host, and dev / release sites (to do, when the player-owner says)
Discussed September 2026; not started. The goal: make the repository private, start inviting
people to try Debuggit, and test new features on a dev site before they reach players.

- **Why move off GitHub Pages:** on a free account, Pages stops when the repository goes
  private (GitHub Pro, about $4/month, keeps it, but the site stays public with no access
  control). Saves live in the browser per web address, so moving host means players start
  again (backup codes carry progress over); the demo resets at v0.1 anyway, so the move is
  cheapest before then. A custom domain (e.g. `debuggit.com`) makes later host moves painless.
- **Options compared** (September 2026 pricing):
  - **Cloudflare Pages (recommended):** free, private repos, unlimited bandwidth, 500
    deploys/month; every branch gets its own address (so its own saves); **Cloudflare
    Access** makes a site invite-only for up to 50 emails free (one-time PIN by email).
  - **Netlify:** free 300 credits/month as a hard cap (roughly 20 deploys; sites pause when
    it runs out); branch previews free; password protection is $20/month for new accounts.
  - **Vercel Hobby:** free but non-commercial only; its deployment protection is for your
    own Vercel team, not outside testers.
- **The plan with Cloudflare Pages:**
  - **Public site** (`debugg.pages.dev` or the custom domain) builds from a `release` branch
    and only changes on "release": merge `main` into `release`, tag a version (`v0.x.y`), add
    a `CHANGELOG.md` entry (item 2). Optionally invite-only via Cloudflare Access.
  - **Dev site** builds from `main`, so every merge lands there first; Access-locked to the
    player-owner; a "DEV" badge in the header; analytics off.
  - Leave a redirect at the old address: a separate tiny public repository (e.g. the
    `pharazyn42.github.io` user site with `debugg/index.html`), since this repo's Pages turns
    off when it goes private.
  - GoatCounter: add the new address in its settings. GitHub Actions tests keep running on a
    private repo (the free minutes are plenty).
- **Player-owner's part:** create the Cloudflare account, connect GitHub, create the two
  projects (public from `release`, dev from `main`, no build command, output = the repo
  root), set up Access, then make the repo private. **Claude's part:** the `release` branch,
  the dev badge and analytics switch, the release routine and changelog, the redirect page.
- **If staying on GitHub Pages instead:** public from `release`, dev at `/debugg/dev/` via an
  Actions workflow; both share one address, so dev needs its own save keys (7 files touch
  `localStorage`).

#### 2e. Separate pages: Learn done; Ltd's own page (to do, with 2d)
The player-owner wants the ideas split out, all linking to each other. **Learn is done**
(September 2026): it's its own section at `learn/`, out of the game's tabs, linked from the
footer, the Director's languages and missed puzzles (see "Two areas" above). The game keeps
**Daily | Ltd** tabs for now. Still to do, with the hosting move: Ltd lives inside `index.html`
(the `?ltd` tab and the studio slots), so the work is mostly giving Ltd its own page. Things to
settle then:
- **The desk: settled** (September 2026). The daily no longer pays the company and the Ltd tab no
  longer shows it (desk jobs took its place), so the Daily page already doesn't load `ltd/`. Giving
  Ltd its own page is now mostly moving the Ltd tab's slots and loader to it.
- **Addresses:** separate pages on one site (e.g. `/`, `/learn`, `/ltd`), or separate
  sites/subdomains. Separate addresses split the browser saves, so one site with three pages
  is much simpler (the pages share saves, XP and the backup code).
- Keep `?ltd` (and `/studio/`) redirecting to the new Ltd page.

#### 3. Languages only for now — done
- Domains are gone from offers, the skill rule, skill match (speed,
  payout and success chance), XP, promotions (Junior 1 / Senior 3 /
  Principal 5 bars in a language), starting skills and every display.
- The board always has a hotfix in every language.
- The contract board is a foldable tree by contract type, like the roster.
- Saves with domains are converted on load (`BOARD_VERSION` 2): `dom` is
  stripped from staff and running contracts, and the board is rebuilt.
- Side effect, decided: the skill-match success bonus used to need a bar
  in both the language and the domain, so grads never got it. It now
  scales with language bars (up to +5%), so a lone grad on a hotfix is
  71% rather than a flat 70% or 75%. Item 4a replaces this model anyway.
- Bringing domains back later is item 16.

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
- **Learn** is both (the Learn track is now its own item, 3d):
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
- **Formats built** (September 2026, the player-owner's pick): `choice`, `value`, `count`, `error`,
  `order` and `bug`, alongside `output` (`FORMATS` and `WEEK_FORMATS` in `shared.js`,
  `daily/formats.js`, the engine in `index.html`; fields and checks in `puzzles/README.md`). From
  Day 1 each weekday takes turns with its formats a week at a time (Monday choice / output / value,
  Tuesday output / count, Wednesday error / output / order, Thursday bug / output); a missing format
  falls back to output. Guesses and hints follow the table above (choice and error 2 / 1, order 3 /
  1). The checker proves each with real Python, including that no other order of an `order`
  puzzle's lines prints the target. 24 Python puzzles, 4 per format; preview days stay output-only.
  Tests switch formats off by default (`openAt(…, { formats: true })` turns them on; `solve()` and
  `miss()` in `tests/helpers.js` answer any format). Still to come: fill the blank, spot the
  difference, which is faster, and the weekend code formats.
- Also built with them: **Step through it** (a trace of every Python puzzle, played back after the
  game), **stats** (played, win rate, streaks, guess distribution), a **share picture**, and **past
  puzzles** as practice (saved as `debugg-practice-day<N>`; no XP, streak, share or desk pay).
- **Built so far:** every puzzle has a `difficulty`; the calendar,
  weekend slot, day labels ("Day 8 · Thursday · tricky · Python") and XP by
  day are live (see "The weekly rotation" above). Every day still uses
  "what does this output", and the weekend uses a hard one.
- **Changed since:** it's now one puzzle a day across all languages, not
  one per language, with the languages rotating through the week (see
  "Languages and the rotation" above). Puzzles are hand-written and
  run-checked (`tools/check-puzzles.js`). Stock: Python 44 (8 each at
  difficulties 1–4, 12 at 5), C 14, Rust 15 and JavaScript 11, so C and Rust
  are ready to join the rotation. Each language needs its own pools topped
  up as it's used: on its own, a language uses one each of difficulties
  1–4 a week and two 5s.
- **Data and engine changes still to do:**
  - Each puzzle gets a `format`, plus
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

#### 3f. Daily puzzle: next features (on the roadmap, September 2026)
After the formats, stats, share picture, past puzzles and Step through it (3b), the player-owner
put these on the roadmap, in this order:
- **Weekend code challenges** (next): the weekend becomes a coding challenge, replacing the hard
  stand-in. **Fix it** (edit the code until it prints the target; locked lines or an edit limit
  stop `print("target")`), **Make it pass** (fix a function until its tests pass, with hidden
  tests too) and **Write it** (from scratch, against hidden tests). Python runs in the browser on
  Pyodide, loaded only when a challenge opens (about 13 MB the first time), by pulling the
  sandbox's worker out into a shared runner. Unlimited runs, 4 submissions, up to 2 nudge hints
  (3b). The checker proves each has a working solution and that the hidden tests reject the
  obvious wrong ones (hard-coded output, off-by-one). Open: whether the weekend earns more than
  200 XP, whether solving on Saturday leaves a bonus round for Sunday (e.g. code golf, which
  wants shared leaderboards, below), and whether "fix it" limits edits or locks lines.
- **Hard mode**: no hints and one guess fewer, for more XP (e.g. +25%) and a mark on the share
  card. Open: chosen per game, or a setting that stays on.
- **Shared stats and common wrong answers**: after a game, "62% solved this, most in 2 guesses",
  and the most common wrong answers, which show where a puzzle is unfair or the matching too
  strict. Needs a small backend (item 2b step 2; Cloudflare Workers and a small database would sit
  well with the Cloudflare Pages move in 2d), and a line in `privacy.html`: answers sent
  anonymously, never with anything that identifies the player.
- **Maybe, far future: reminders.** Installable as a phone app (a web app manifest and an offline
  service worker, possible without a backend), with a daily nudge; reliable push needs the
  backend above.

#### 3g. The daily's launch plan (0.1.0)
Decided with the player-owner, September 2026.
- **When:** a week or two after Learn's 0.1.0 (item 3d), on a Monday so Day 1 is a warm-up.
  Debuggit Ltd launches separately, later; it stays a demo meanwhile.
- **Features: as it is.** Today's formats, stats, share picture, past puzzles and Step through it.
  The item 3f features (weekend code challenges, hard mode, shared stats) come after, as 0.2+.
- **Languages: Python only.** Others join the rotation later, each once it has its first Learn
  units (item 3d).
- **Puzzle stock: 12 weeks banked.** Python-only uses one each of difficulties 1–4 and two 5s a
  week, so about 12 each at 1–4 and 24 at 5 (from 8 each and 12: roughly 28 more, mostly 5s).
- **Shared with Learn's launch, done first:** a per-product demo flag and reset (so the daily's
  launch clears only the daily's saves), the move to Cloudflare Pages (item 2d) and the custom
  domain (after the checks in 2c).
- **Check:** a phone and desktop play-through on the new site.
- **Then:** the daily's demo off, its save version `'0.1'`, `LAUNCH` set to the launch Monday,
  `node tools/release.js bump 0.1.0`, a PR, and the Release workflow.

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

#### 3d. Learn channel: learn languages in a fun way

**Built so far** (September 2026): Debuggit Learn at `learn/`, its own section of the site
(see "Two areas" near the top; it started as a Learn tab beside Daily), with the Python course's Unit 1, *Values and printing* (3 lessons and
a checkpoint, 35 steps), Unit 2, *Strings* (`learn/python/02-strings.js`: indexing and
`len`, slices, methods and immutability, f-strings and `str`/`int`; 4 lessons and a checkpoint,
37 steps), and Unit 3, *Lists* (`learn/python/03-lists.js`: indexing and `len`, changing lists,
`append`/`pop`/`remove`/`in`, slices, `+` and `*`, aliasing and copies, `sort()` vs `sorted()`,
`sum`/`min`/`max`; 4 lessons and a checkpoint, 36 steps), and Unit 4, *Conditions*
(`learn/python/04-conditions.js`: comparisons, `if`/`else`, `elif` and the first match winning,
`and`/`or`/`not`, truthiness and the `x == 1 or 2` slip; 4 lessons and a checkpoint, 34 steps), and
Unit 5, *Loops* (`learn/python/05-loops.js`: `for` over lists and strings, running totals, `range`
and its stop, `while` and ending it, `break`/`continue`, building lists; 4 lessons and a
checkpoint, 37 steps), and Unit 6, *Functions* (`learn/python/06-functions.js`: `def` and calling,
parameters, `return` vs `print` and `None`, defaults and keyword arguments, local variables and
lists passed in; 4 lessons and a checkpoint, 37 steps). Decided with the player-owner, replacing parts of the sketch below:

- **Structure:** course → units → lessons (6–10 steps) + a checkpoint per unit. Units are
  modular, one file each; the course lists them in order and names the planned ones. A course
  with `soon: true` and no files (C, for now) shows as a "soon" tab with only its planned units.
  A course's `sections` are later parts of it under their own heading: C's is Embedded C
  (item 3e), decided as a section of the C course rather than a course or tab of its own.
- **Steps:** teaching points, multiple choice (each wrong option explains itself), "what does
  this print?", fill the blank (pick the missing piece) and "tap the line with the bug".
- **Progress:** lessons unlock in order; a wrong answer is explained, shows the right answer,
  and comes back at the end of the lesson, which ends once every question is right. Stars by
  mistakes (0 → 3, 1–2 → 2, more → 1). Checkpoints: pass mark out of 8, retry any time, and
  can be taken first to test out of a unit; passing unlocks the next unit.
- **XP and streak are separate from the daily puzzles** (not shared, as the sketch below
  said): Learn XP per language (10 per new lesson, 5 per new star, 30 per checkpoint) with its
  own levels, and a Learn streak of days with a lesson finished. Learn doesn't pay Debugg Ltd
  or boost the Director. Saved as `debugg-learn`; "reset puzzles" keeps it.
- **Checked like the puzzles:** `tools/check-puzzles.js` runs every lesson snippet, and
  checks right and wrong options and "tap the line" errors against the real output.
- **Continue card** (September 2026, the first of the player-owner's Learn experience items):
  the top of the course map shows the next thing to do (`nextStep()`, `continueHTML()`): the first
  unit not yet passed and, in it, the first lesson not done, or its checkpoint once every lesson
  is. A unit passed by testing out counts as done. "Start here" on a first visit, "Continue" after;
  "All caught up" (with the next planned unit) once every written unit is passed. No card on a
  coming-soon course.
- **Review queue** (September 2026, the second experience item): every question missed, in a lesson
  or checkpoint, goes into `save.review` (`{ lang, unit, lesson, q, box, due }`, `lesson` null for a
  checkpoint, `q` the question's text and code) and comes back in a **Review** round in the Continue
  card from the next day: up to 8, oldest first, wrong answers repeated before the end. Right first
  time moves it on (1, 3, then 7 days; `REVIEW_DAYS`); right three times running, it leaves the queue;
  missed again, it starts over. 2 XP per question right first time, and a round counts for the Learn
  streak. The checker fails two questions with the same text and code in one lesson or checkpoint.
- **Lesson feel** (the third experience item): keys 1–9 pick an option or a line and Enter continues
  (hints on the options, hidden on touch screens); the duck hops or wobbles in each answer's
  feedback; the progress and XP bars slide from where they were (`grow()`); the summary pops its
  stars in, shows "Level up!" on a new Learn level and "+1 today" when the streak went up, and
  focuses its main button. Steps with code have a **"Run it yourself ↗"** link (teaching steps
  under the code, questions in the feedback once answered; `runLink()`), opening
  `sandbox.html?lang=python&code=…` in a new tab, with a blank filled in. Only for languages the
  sandbox runs.
- **Open to everyone from day one** (decided with the player-owner, September 2026): Learn is
  never locked behind daily puzzles or anything else.
- **Every course starts from zero** (the player-owner's call, September 2026): any course can be
  someone's first, so none assumes another language. No Rosetta-style "second language" lessons;
  each course is written fresh for its language, not translated from Python.
- **The launch plan (0.1.0),** decided with the player-owner, September 2026. Learn launches first
  (see "Releases"), and needs:
  - **Content:** all five planned Python units, one PR each, in order: Conditions (done), Loops
    (done), Functions (done), Dictionaries, The classic traps (4 lessons and a checkpoint each), each released
    to demo players as it's done (the player-owner's call). After each, a
    separate Daily PR tags past puzzles with the new unit's `learn` field.
  - **Experience:** the visual course path. The daily goal and the phone and accessibility passes
    can follow the launch.
  - **A per-product demo and reset:** each product gets its own demo flag and reset, so Learn's
    launch clears only Learn's saves (`debugg-learn`) and the daily and Ltd stay demos until
    theirs. Today there's one `DEMO` and one `SAVE_VERSION`, so this comes before the launch.
  - **Hosting first:** the move to Cloudflare Pages (item 2d, with the dev site, `release` branch,
    DEV badge and redirect page) and a **custom domain** (after the domain and trademark checks
    in 2c) both happen before the launch, so launch progress is never lost to a later move.
  - Then a phone and desktop check on the new site, and `node tools/release.js learn bump 0.1.0`.
- **After the launch, Python's next parts** (proposed): Part 2, intermediate (tuples and sets;
  `enumerate`/`zip`/`for…else`; comprehensions; `*args`, `**kwargs`, `lambda` and keys; string
  formatting and `split`/`join`; errors and exceptions) as Learn 0.2; then Part 3, objects
  (classes, class vs instance attributes, inheritance, special methods) and Part 4, advanced
  (generators, closures and decorators, copying and identity, `collections`/`itertools`).
- **When to add languages** (proposed): after Python's Part 2, rather than going deeper. A language
  gets its first 3–4 units before, or when, it joins the daily rotation, so missed puzzles have
  somewhere to link. JavaScript next (it runs in the sandbox and has puzzles; its own traps unit:
  `==` vs `===`, `"5" + 1`, `var`/`let`, `this`, `NaN`), then C (with Embedded C, item 3e), then
  Rust. GoatCounter's lesson events decide the balance after that: many finishing Python's later
  units means more depth; early drop-off means polish first.
- **Still to do otherwise:** the daily goal, a phone and accessibility pass, other languages'
  courses, and badges.

The original sketch:
This is the idea that started Debugg: a fun way to learn different
programming languages. The daily puzzle tests what you know; the Learn
channel teaches it. It sits alongside the daily puzzles as its own
channel (e.g. **Daily** | **Learn** tabs at the top), played any time,
at your own pace. It expands the "Learn track" sketched in 3b.

- **Courses per language.** A path of short units for each language:
  - values and printing;
  - strings;
  - lists and arrays;
  - loops;
  - functions;
  - dictionaries and objects;
  - then the traps the daily puzzles are about.

  Each lesson is 2–3 minutes: a short explanation, then a few quick
  puzzles.
- **Learn by predicting.** Debugg's core idea works for teaching too:
  show a snippet, ask what it prints before explaining, then explain.
  Lessons use the easy formats from 3b (multiple choice, fill the blank,
  value of `x`, what does this output), plus "run it yourself" in the
  sandbox for every example.
- **Learning a second language from the first.** A "Rosetta" style for
  people who already know one language: show a Python snippet and ask
  which JavaScript (or Rust, or C++) version does the same thing, or
  what's different about how each handles it (integer division, string
  immutability, equality, scoping). Once you know one language, this is
  the fast, fun way into the next. **Dropped** (September 2026): every course starts from zero.
- **Game feel, Duolingo-style:**
  - a visual path per language, with units, checkpoints and a "boss"
    puzzle at the end of each unit;
  - a daily learning goal (e.g. one lesson);
  - XP per language, level-ups and badges;
  - a placement quiz to skip ahead if you already know the basics;
  - review: questions you got wrong come back later (spaced
    repetition).
- **How it connects to the rest of Debugg:**
  - Lessons earn XP in that language (less than a daily puzzle, e.g. 20),
    so they feed the same levels.
  - In Debugg Ltd, puzzle levels already boost contracts, so learning a
    language makes your company better at it.
  - Finishing a language's beginner course could suggest switching on its
    daily puzzle.
  - The studio already has C/C++ and Rust, so Learn could be where those
    languages first appear, before they have daily puzzles.
- **Running code.** Python (Pyodide) and JavaScript (Web Worker) already
  run in the sandbox. C/C++ and Rust would need in-browser compilers
  (WebAssembly toolchains, large downloads), so their lessons could start
  with formats that don't run code.
- **Content load.** Roughly 40–60 lessons per language to start. It's
  the biggest cost, so start with one language (Python), make the lesson
  format data-driven like `puzzles.js`, and add languages one course at a
  time.
- Open questions:
  - Does learning count towards the daily streak, or have its own
    learning streak? 3b currently says lessons don't count, so the daily
    puzzle stays the one thing to do each day.
  - Which languages after Python: JavaScript first (already built), or go
    straight for something new like Rust? (Proposed since: JavaScript, then C, then Rust.)
  - Order against the other Phase 1 work: the lesson formats overlap with
    3b's multiple choice and fill-the-blank, so building those formats
    first serves both.

#### 3e. Embedded C track
Planned in detail in `ideas/embedded-c-roadmap.md`. The C that runs on microcontrollers
(bits, registers, fixed-width types, interrupts, timing) as puzzles, a Learn course and,
later, Debuggit Ltd's Embedded/Controls contracts.

- **Checking stays honest:** hardware is simulated with plain variables and made-up register
  names; fixed-width types by default; new C checker modes such as `target: 'arm'` (also
  compiles with `-funsigned-char`, ARM's default: `char c = 200; c > 127` prints 0 on x86
  and 1 on ARM) and captured `-Wall -Wextra -Wconversion` warnings for explanations.
- **New question types:** register value (hex/binary/decimal accepted, shown as bit
  boxes), flip the bits (build a mask), which line needs `volatile` / spot the race, trace the
  pins (a virtual board of LEDs replaying a trace the checker records), and timelines for
  wrapping tick counters.
- **Learn course, 10 units:** fixed-width types, bits and masks, registers, data layout
  (padding, endianness), integer maths and fixed point, time, interrupts, structure (state
  machines, ring buffers, no heap), robust firmware, and the classic traps.
- **Daily puzzles:** embedded-tagged C puzzles (`topic: 'embedded'`); about 30 before C joins
  the rotation. Maybe later "Embedded" as its own rotation language with its own XP.
- **Phases:** (1) puzzles and checker modes on today's engine; (2) course Units 1–3 with the
  register viewer and bit flipper; (3) the virtual board, Units 4–7; (4) Ltd's
  Embedded/Controls domain (with item 16); (5) maybe C in the browser (picoc/TinyCC in
  WebAssembly, or an emulator like avr8js).
- **Decided:** C99 as the baseline; in Learn, Embedded C is a section of the C course (its
  10 units after the plain C ones), not a separate course or tab. Also decided with the
  player-owner (September 2026):
  - the audience is **hobbyists** (Arduino and Pico makers: LEDs, buttons, sensors);
  - registers are **generic**, made up and vendor-neutral, not a named chip family;
  - the course stays pure C, and **Embedded C++** (for Arduino code) can be a separate extension
    later.
- **Open question:** separate Embedded XP, or count it as C XP.

### Phase 2 — Make the core loop feel right

Small-to-medium changes the player feels every session. Do the balance pass last, after the changes that shift the numbers.

#### 4a. Success chance scales with level and skill match
Replace the current flat reliability-by-level model:
- **Success chance** depends on both dev level and how well their skills
  suit the contract's language. Reference point for a Graduate:
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
  Today the panel only has a one-line "On Minor release (Rust) — 4:12
  left". It should show the full contract:
  - type and language;
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
  those shift the numbers.
- **First pass done** (September 2026), from a playtest of the demo's first hours. Before:
  the first promotion came at 61 minutes and 4 devs had ¤14,000 after 4 hours. Changes:
  `LINE_RATE` 2 → 1, hire costs ×3, promotions 1h/8h/3d → 12h/3d/14d, XP a third as fast,
  skill no longer raises pay, and the hiring market. After: a grad nets about ¤160/hour,
  the first junior is affordable after about 3 hours, and a demo-sized team (a junior and
  3 grads) nets about ¤1,150/hour.
- **Still to do:** the demo's money sink is now managers and co-working desks (September 2026);
  check with play data whether it's enough, or whether training (item 14) is needed too.
  Reputation builds fast (0.5 a hotfix) for when it gates anything (item 12).

#### 10b. Look and feel
A design pass over the whole site: the daily puzzles, Debugg Ltd, the
sandbox and the privacy page. Today it's a functional prototype look:
dark theme only, mostly text, and Debugg Ltd in particular is dense.

- **Start with an audit.** Screenshot every screen at desktop and phone
  width (puzzle before and after a game, the sandbox, founding the
  company, the studio with a few staff, the team picker, the employee
  panel, the board), list what feels off, and agree a direction before
  changing anything.
- **A kiwi instead of the duck, and "Find the bugs, feed the kiwi"** (the player-owner's idea,
  September 2026; on the roadmap, not started). The mascot becomes a **kiwi**, which eats bugs
  (insects), so every bug you find feeds it: a better fit than the rubber duck, and a distinctive
  New Zealand one. The tagline would be **"Find the bugs, feed the kiwi."** Things to settle when
  it's built:
  - **Everything the duck is now:**
    - the logo beside the wordmark, the favicon and home-screen icon (`img/duck.svg`,
      `img/duck-180.png`);
    - the link-preview card (`img/share.png`) and the share picture (`daily/sharecard.js`);
    - its reactions after puzzles, Learn lessons and desk jobs (a hop, a wobble);
    - its lines ("Quack! First try, no hints.", "Even the duck gets stuck", the share text's 🦆);
    - the demo notice.
  - **Feeding as a game idea,** not just a slogan: e.g. the kiwi visibly fed or growing with your
    streak or bugs found, fitting the kiwi's own reactions (pecking, a happy trill).
  - **Rubber-duck debugging** was the duck's reason to exist; the kiwi's is the bugs, so the copy
    changes rather than just the picture.
  - **Naming:** "Duckling, by Debuggit" (the Learn name idea, item 2c) would need rethinking
    (e.g. a kiwi chick), and the "Quack" in reactions goes.
  - Draw it as one SVG like the duck, recolour-able for a light theme, and redo the PNGs from it.
- **Visual identity.** Started: the Debuggit duck (a rubber duck, for
  rubber-duck debugging) is the logo, favicon and home-screen icon, beside
  the language wordmark; it has a link-preview card (`img/share.png`,
  with Open Graph tags on the puzzle page) and reacts after each puzzle
  and Learn lesson. Still to do: a duck on the share card itself, more
  expressions, and the duck as the hint voice and Learn guide. Settle the colour palette, type scale, spacing
  and icon style as design tokens in `base.css`, and have `ltd/ltd.css`
  and the sandbox use them rather than their own values.
- **The daily puzzle.** The first impression and the end-of-game screen
  matter most:
  - a clear result summary;
  - a Wordle-style share card (guesses and hints as squares, no
    spoilers). **Done** (September 2026): "Share your result" under the duck copies (or, on
    phones, opens the share sheet with) e.g. `debugg(it) Day 3 · Python`, `🟥🟩⬛⬛ · 1 hint`,
    `Debugged it in 2` and the link, and "Share as a picture" makes a 1200×630 card
    (`daily/sharecard.js`);
  - the streak and XP level-ups made to feel like rewards.
- **Debugg Ltd.** Less wall-of-text and more at-a-glance:
  - icons or colour for roles and languages;
  - visual progress for promotions and skill bars;
  - clearer hierarchy in the stats bar, roster and contract board;
  - a better-balanced two-column layout next to the puzzle;
  - a first-time walkthrough of hiring and staffing a hotfix.
- **Light theme.** Follow the device's light/dark setting, with a toggle.
- **Motion.** Subtle transitions (tiles, level-ups, contracts
  completing), respecting "reduce motion". Pairs with items 20 and 21.
- **Accessibility.**
  - colour contrast;
  - visible keyboard focus and full keyboard play;
  - screen-reader labels (especially the tiles, hint dots and pip
    bars);
  - not relying on colour alone (red/green tiles need their ✓/✕).
- **Phone.** Tap-target sizes, and how the studio sits under the puzzle
  on a narrow screen.
- Open questions:
  - What specifically feels off today, and are there games or sites whose
    look you'd like to be closer to?
  - Keep the "code editor / terminal" flavour, or go friendlier and more
    playful?
  - Before or after the soft launch? A quick pass on the daily puzzle's
    first impression and share card could come first; Debugg Ltd can
    follow.

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
- **Started** (September 2026): the stages, the stage bar, managers staffing idle developers
  and desk pay shrinking by stage are built (see "Business stages" above). Still to do: stages
  unlocking things (below). Managers are in the demo since September 2026.
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
- Someone training is away (`p.away = { kind: 'training', until }`), so they earn no odd jobs
  (see "Odd jobs").
- Open questions:
  - Is training a one-off purchase per bar, a timed course during which
    the person is unavailable for contracts, or both?
  - Should cost scale with the target bar?
  - Should there be a cap so training can't replace real contract
    experience (e.g. training only up to bar 3)?

#### 15. Office space: desks, contractors, and buildings
- **Now planned together with business units and rentals** in `ideas/company-growth-roadmap.md`
  (item 15e); that doc's property ladder, leases and phases supersede the sketch below where
  they differ.
- Another progression limiter. On-site staff need a desk.
- **The first office caps headcount.** You start in one free room with 3
  or 4 desks. Hiring is blocked once it's full ("no free desk — get a
  bigger office") until you take on the next office. This sits alongside
  the supervision limits: the Director can already only look after 4 devs
  (`DIRECTOR_SPAN`), so a 4-desk first office lines up with the point
  where you'd hire your first manager anyway. With 3 desks, the office
  becomes the first wall instead.
- **Show the cap against current headcount**, so players can see space
  running out before hiring is blocked:
  - the stats bar's **Headcount** becomes "3 / 4" (people / desks), turning
    amber when full or nearly full; work-from-home contractors are listed
    separately (e.g. "3 / 4 + 2 remote");
  - an **Office** panel (or a line at the top of the Studio panel) showing
    the current office, desks used and free, rent, and lease end date,
    with a button to see the next office options;
  - hire buttons say why they're blocked ("no free desk — get a bigger
    office"), as they already do for supervision limits.

  Keep this visibly separate from the existing structure line
  ("Devs 3/4", which is the supervision limit from managers). Two
  different caps, both shown, and the lower one is what stops hiring.
- **Tiered office options**, each with its own pricing and lease terms.
  A starting ladder (names, desk counts and prices are placeholders for
  the balance pass):

  | Office | Desks | How you pay |
  |---|---|---|
  | Spare room (start) | 3–4 | Free |
  | Co-working hot desks | ~8 | Rent per desk, no deposit, leave any time. Flexible but the priciest per desk. |
  | Small office | ~15 | Lease: a deposit, then rent. Short lease = higher rent, long lease = cheaper but an early-exit fee. |
  | Office floor | ~40 | Longer lease, bigger deposit, lowest rent per desk. |
  | Building | 100+ | Buy outright (big one-off cost, no rent), or lease. Late game; ties into multiple sites (item 18). |

  - **Rent is an ongoing cost like payroll**: drawn every second, shown
    next to Payroll in the stats bar, and paid while offline (within the
    offline cap). It stops while the company is paused.
  - **Leases**: the deposit comes back when a lease ends normally; ending
    it early costs a fee. Taking a bigger office while on a lease means
    paying off or subletting the old one (to decide).
  - You can't move to an office smaller than your on-site headcount.
- **Contracts are hidden until your office can hold the team.** A
  contract type only appears on the board once your desks (plus
  work-from-home contractors) can fit its minimum team. Today that's:
  - Hotfix: 1 dev;
  - Patch: 3;
  - Minor release: 5;
  - Major release: 10+, including a manager.

  In the starting room, only Hotfixes (and Patches, with 3+ desks) show.
  Hidden groups could appear on the board as locked placeholders
  ("Minor releases: needs an office for 5") so players can see what's
  coming, rather than vanishing entirely. Decide how this combines with
  reputation gating (item 12): perhaps a contract type needs both the
  space and the reputation.
- **Contractors** work from home, so they need no desk, but cost more
  (higher salary and/or hire cost). They're a way past the desk cap
  before you can afford space.
- Over time you rent offices, buy rooms, then whole buildings, each adding
  desks. This fits with the business tiers (item 13) and multiple sites
  (item 18); sites could be where buildings live.
- Open questions:
  - Does the Director take a desk? Do managers?
  - First office: 3 or 4 desks?
  - Do contractors count towards the supervision structure and manager
    span?
  - Can they be promoted?
  - Do they gain XP at the same rate?
  - Save migration: companies that already have more staff than the first
    office holds need a sensible starting office (e.g. the smallest one
    that fits, free for a grace period).

#### 15e. Business units, property and rentals (planned)
Sketched September 2026 in `ideas/company-growth-roadmap.md`: where the company works as it
grows, and what it does with space, tied to the business stages (item 13). A **business unit**
here means commercial premises, a small office unit like one on a business park (the
player-owner's meaning), not a division of the company.
- **Desks** cap on-site headcount alongside supervision ("Devs 5/16 · Desks 5/8"); an Office
  line in the Studio panel.
- **Working from home** (the player-owner's idea): about 1 in 4 applicants are **WFH** and need
  no desk ("Desks 5/8 · +2 WFH"); they keep working when the office is closed, but, decided,
  they learn a little slower (−25% XP) and can't be learners, so WFH stays a trade-off. They still count towards supervision. They
  replace item 15's separate contractors.
- **Renting:** the free spare room (4 desks), co-working desks by the minute, then **business
  units** (small 8 desks, large 16) on leases (longer is cheaper; deposit; early-exit fee; moving
  takes 10 minutes; up to 3 units side by side), then office floors. Rent is a running cost like
  payroll. A premises panel lists the units available now, which come and go; a property market
  nudges rents and prices.
- **Buying** (from Large): business units, office buildings and campuses; upkeep instead of rent;
  a value that moves; sell at value.
- **Rental units:** sublet spare desks while renting (Mid-size); let units or floors you own to
  tenants on leases (Large); rent depends on quality and reputation; upgrades as a money sink;
  tenant events via 15b.
- **Phase 1 is built** (September 2026): desks, co-working and managers in the demo (see "The
  office" above). Decided then: the Director takes no desk; a full office is cramped (slower,
  and people hand in their notice) and takes up to 2 more squeezed in, rather than blocking
  hiring. WFH applicants weren't in it and are still to come.
- **Phases:** (1) desks and co-working, with managers in the demo, as the demo's money sink;
  (2) business units on leases; (3) office floors and subletting; (4) buying property;
  (5) rental units; (6) sites (item 18).
- **Open questions** are in the doc: desks for the Director and managers, how harsh a full
  office is, random listings or any size on demand, named tenants, buying purely to let.

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
- Someone off sick or on holiday is away (`p.away = { kind, until }`), so they earn no odd jobs
  (see "Odd jobs").
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
  - success rate by tier and language, compared with the
    forecast chance, to show whether you're lucky or unlucky;
  - total SLOC delivered, by tier and language;
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
  - skill bars gained, by language;
  - the longest-serving employee.
- **Per employee** (on the employee panel):
  - hired on, and roles held, with dates;
  - contracts delivered and failed, SLOC written, cash earned for the
    company, and salary paid to them;
  - time on contracts vs on the bench;
  - their favourite language (most XP gained).
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
- Domains (Web Dev, Games, Embedded/Controls, Safety-Critical, Data/AI)
  were removed in item 3 and come back further into the game, unlocked by
  reputation gating (12) or business tiers (13):
  - Some team contracts (minor releases and up) are then tagged with a
    domain.
  - Domain **specialists** are a separate kind of hire.
  - A contract with a domain must have a specialist in that domain on the
    team.
  - Open questions: do specialists write code too, are they promotable,
    and does domain experience grow on regular devs or only specialists?

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

#### 17f. AI agents (the player-owner's idea, September 2026; not started)
- **AI agents do the coding, and a developer looks after them.** The studio can put AI agents
  on a contract. They write code like a team does (SLOC/min towards the target), but they
  can't work on their own: **at least one dev must be assigned to look after them**. That dev is
  on the contract like any teammate: tied up, earning XP and contract time, and never on the
  bench.
- **The supervising dev must be senior enough (decided).** They must be at the level of the
  most senior dev the contract requires: a senior for a patch, a principal for a minor or major
  release. Any level can supervise on a hotfix. They must also **know the contract's language
  to the level it needs** (the skill rule, and the level on expert contracts), because the AI
  itself isn't limited.
- **Any language (decided).** Models can work on a contract in any language; the language
  limit comes only from the supervising dev.
- **A licence acts as a number of people (decided).** On early models it counts as **2 people**;
  later models raise that, up to a **team of 10**. One person plus a licence can take on any
  contract its size allows, so a patch could run as "1 senior + AI (acting as 2)", and only
  late models reach the size of a full team.
- **More people still help on big contracts (decided).** Success chance rises with the number
  of people on the team. One supervisor plus agents is enough to take a big contract on, but a
  bigger team makes it likelier to succeed. The size of the boost per extra person, by tier, is
  to be decided in the balance pass.
- **Licences (decided).** Each AI licence runs **at most one contract at a time**. More
  contracts at once need more licences.
- **Models are per licence, bought and sold freely (decided).** Each licence runs one model,
  bought for that licence. Any model that has arrived can be bought, older ones included, and a
  licence's model can be dropped at any time (not mid-contract). Dropping returns no cash: it
  only stops the model's running fee. So a studio can run a mix, such as
  a cheap old model on hotfixes and the newest on a major release.
- **Models unlock over time and must be bought (decided).** New models arrive **very slowly**
  (days to weeks apart), each better than the last:
  - **speed:** the first models are **very slow**, and each one writes more SLOC/min;
  - **accuracy:** the first models are **very inaccurate** (success well below a person's), and
    later ones are better;
  - **size:** each model acts as more people (from 2 up to 10, above).

  Upgrading means buying the new model. **Cost rises steeply:** the first models are cheap, and
  the last ones cost as much to run as the full team a major release needs, or more. So AI is a
  cheap, weak helper early and a costly, powerful option late, never a free win. Use made-up
  model names, never real ones.
- **News announces them (decided).** A news item comes before each new model, saying when it
  arrives and what it does: how many people it acts as, its speed, success chance and price.
  The player can then plan and save up for it. The news could also be the start of a wider news
  feed (market moves, rival studios, events from 15b).
- **Managers can assign AI (decided).** From a small business on, managers staff contracts with
  licences as well as people.
- **Running costs.** A licence costs a subscription per minute, drawn like payroll and rent,
  rising with the model (see above). It's a money sink all the way through, and by the late
  models it costs about as much as the people it replaces.
- **Interactions with other systems:**
  - Agents need no desks (item 15e), which lets a studio grow its output past its office.
  - They earn no XP and are never promoted. The supervising dev still learns.
  - They could raise Tech Debt (17b) or Merge Conflicts (17c) on early models, and Disruptive
    events (17d) could take them offline ("the AI service is down").
  - Offline, they're simulated like repeats.
- **Where it sits:** Phase 4, once the office phases and bigger contracts are open. An early,
  weak model could appear sooner as a taste.
- **Still open:**
  - The actual numbers: how many models, how many days apart, and each one's speed, success,
    size, price and running cost. That's for the balance pass.
  - How the picker shows it, e.g. "AI model 3 (acts as 4) · supervised by Grace (principal) ·
    −8% success".

#### 18. Multiple sites, rooms and buildings
- Phase 6 of `ideas/company-growth-roadmap.md` (item 15e): campuses, and premises in more than
  one place.
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
`page.clock.setFixedTime` (the demo's Day 1 is Monday 5 October 2026, and Day 3, a Wednesday, is the default; `dayDate(n)` in `tests/helpers.js`, with 0 and below for preview days) and simulate time
passing by editing saves and moving the clock. The sandbox's Python tests
need Pyodide: from the CDN, or set `PYODIDE_DIR` to an unpacked `pyodide`
npm package when there's no internet. Switching language on the puzzle page
reloads it, so wait for the new puzzle (e.g. its filename) before acting.
