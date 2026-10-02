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
up over time (see "The desk" in `ltd/CLAUDE.md`). The README covers the player-facing rules; this
file is the design and implementation notes for the whole site, `ltd/CLAUDE.md` has Debugg Ltd's,
and `ideas/roadmap.md` is the roadmap (item numbers refer to it).

**The site is a demo** (Day 1 is Monday 5 October 2026) with no release
date yet. All demo progress is reset when v0.1 comes out, which players are
told on their first visit; see "The demo" below and item 2c.

The merge of the two (item 3c) is done; `ideas/debugg-ltd-merge-plan.md` is
the plan it was built from. Original design brainstorm for the studio:
`ideas/contract-debugger-concept.md`. That doc is the source of the overall
vision; read it for the *why* behind mechanics that aren't built yet. These
notes are the *current state* of the implementation, which has diverged and
simplified from that doc in places.

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
| `img/` | The Debuggit kiwi: `kiwi.svg` (logo and favicon), `kiwi-180.png` (home-screen icon) and `share.png` (the 1200×630 link-preview card, the kiwi beside the wordmark and the tagline). The PNGs are rendered from the SVG and the page fonts; redo them if the kiwi changes. |
| `daily/` | The daily page's parts: `formats.js` (each puzzle format's question and answer text), `stats.js` (the stats panel), `sharecard.js` (the share picture), `archive.js` (past puzzles, played as practice at `index.html?day=N`) and `trace.js` (Step through it). |
| `tools/trace-puzzles.js`, `tools/trace.py`, `tools/probe.py` | `npm run traces` records every Python puzzle's step-by-step trace with real Python into `puzzles/traces-python.js`; `probe.py` counts line runs and tries line orders for the checker. |
| `tools/sim-ltd.js` | `npm run sim`: the Debuggit Ltd pacing simulator. Plays the real `ltd/ltd.js` headless (fake clock, seeded randomness, a stand-in page) as a keen, casual or always-open player, and prints when the milestones in `ideas/ltd-pacing-targets.md` happen. `--ltd` plays a modified copy, to try a balance change. |
| `ltd/ltd.js`, `ltd/ltd.css` | Debugg Ltd. Loaded only when the studio is on. CSS is scoped under `.ltd`. |
| `ltd/CLAUDE.md` | Debugg Ltd's design notes: data model, what's implemented, known gaps. |
| `ideas/` | The roadmap (`roadmap.md`), detailed plans for some of its items, and separate game concepts. |
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

## Debuggit Ltd's design notes

`ltd/CLAUDE.md` has the studio's data model, everything implemented in it and its known gaps.
Claude Code loads it when working on files in `ltd/`; read it before changing Debuggit Ltd from
elsewhere (`index.html`'s Ltd tab, `tools/sim-ltd.js`, `tests/ltd.spec.js`).

## Future development

The roadmap is in `ideas/roadmap.md`, by phase. Read an item there before working on it, and add
new ideas there. Index (status in brackets):

**Phase 1, foundations**
- 1 Tests (done; unit tests and seeded randomness still to do)
- 2 Semantic versioning and releases (done; 2d separates released from in progress)
- 2b Hosting, players and analytics (step 1, GoatCounter, live)
- 2c Direction: company-first, and the name Debuggit (decided; domain and trademark checks to do)
- 2d Private repo, a new host (Cloudflare Pages), dev and release sites (to do)
- 2e Separate pages: Learn done; Ltd's own page (to do, with 2d)
- 3 Languages only for now (done)
- 3b Puzzle formats and the weekly rotation (most formats built)
- 3c One game: puzzles first, studio optional (done)
- 3d Learn: courses, units, review queue, launch plan (Python units 1–6 built)
- 3e Embedded C track (planned; detail in `ideas/embedded-c-roadmap.md`)
- 3f Daily: weekend code challenges, hard mode, shared stats (next)
- 3g The daily's launch plan (0.1.0)

**Phase 2, the core loop**
- 4a Success chance scales with level and skill match
- 4b Show what makes up the success chance
- 4c The intern's hotfixes are puzzles (built differently: the intern gets stuck)
- 4d Graduates apply by reputation (built)
- 5 Per-hire speed and success chance
- 6 Contract deadlines
- 7 Current contract in the employee panel
- 8 Total SLOC/min in the stats bar
- 9 Show what the desk pays
- 10 Balance pass (first pass done)
- 10b Look and feel (a kiwi mascot idea, light theme, accessibility)

**Phase 3, retention and mid-game**
- 11 (Moved into 3b)
- 12 Reputation gates contract tiers
- 13 Business tiers (stages built; unlocks to do)
- 14 Training
- 15 Office space (superseded by 15e)
- 15b Shared event system
- 15c Absences: sick days and holidays
- 15d Company stats and records
- 15e Business units, property and rentals (phase 1 built; detail in `ideas/company-growth-roadmap.md`)

**Phase 4, late game**
- 16 Domains return with specialist hires
- 17 In-house products and maintenance teams
- 17b Tech Debt · 17c Merge Conflict · 17d Disruptive events
- 17e Multi-language contracts
- 17f AI agents
- 18 Multiple sites
- 19 Prestige

**Polish:** 20 SLOC animation · 21 Visualise the office · 22 Skill gain through supervision

## Testing notes

`npm test` runs the Playwright suite in `tests/` against a small static
server (`tests/serve.js`). Tests fix the date with
`page.clock.setFixedTime` (the demo's Day 1 is Monday 5 October 2026, and Day 3, a Wednesday, is the default; `dayDate(n)` in `tests/helpers.js`, with 0 and below for preview days) and simulate time
passing by editing saves and moving the clock. The sandbox's Python tests
need Pyodide: from the CDN, or set `PYODIDE_DIR` to an unpacked `pyodide`
npm package when there's no internet. Switching language on the puzzle page
reloads it, so wait for the new puzzle (e.g. its filename) before acting.
