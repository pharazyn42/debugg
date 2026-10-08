# Debuggit design reference

Moved out of `CLAUDE.md` to keep the always-loaded file small. Read the section you need (`grep -n "^\*\*" docs/design.md`), not the whole file.

**How the puzzle page and the studio connect.** Hardly at all, since September 2026 (the
player-owner's call: the daily is its own game). The studio reads puzzle XP through
`Debugg.readXp()` for the Director's skills and the founder's bonus, and its desk jobs reuse past
daily puzzles and Learn's questions (`ltd/desk.js`). The daily page never depends on the studio.
`index.html` still fires `debugg:puzzle-finished` (`{ lang, day, solved, guesses, hintLevel, xp,
streak }`) when a game ends, but nothing listens to it now.

**Two areas: the game and Learn** (split September 2026, the player-owner's call). The game is the
daily puzzle and Debuggit Ltd, with **Daily | Ltd** tabs on `index.html`. **Debuggit Learn** is its
own section at `learn/`; every page of the two areas shows the same top row of three buttons named for
the products, `debuggit.learn()`, `debuggit.daily()` (demo) and `debuggit.ltd()` (demo), so there are no product
links in the footers; it's the same site, so
saves, XP levels and the backup code are shared. The game links into Learn from the top row, the
Director's languages on the Ltd card (`a.learn-lang`, for courses that
exist), and, after a missed or revealed puzzle (not a first-guess solve), `#learnMore`: the unit
named by the puzzle's `learn` field (`learn/#python/strings`, which picks the unit out), or the
course from the start. `index.html` loads `learn/courses.js` to know which courses exist. The
checker fails a `learn` tag that isn't a written unit. The **sandbox** belongs to Learn too
(`learn/sandbox.html`, showing Learn's version); the game links to it from its footer and from a
finished puzzle's "Run it yourself", and lessons link to it from every step with code.

**Tabs and switching on.** The game's pages have **Daily | Ltd** tabs (inside the shared top row, which
also holds the Learn button; `.modes` in `base.css`). The
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


**The calendar.** The demo's Day 1 is Monday 5 October 2026 (`LAUNCH` in `shared.js`). Days
before it are preview days (0, -1, …), labelled "Preview", each with its
own puzzle and saves. Saves are keyed by day number, so **don't move Day 1
once players have real progress**. If it does move, `shared.js` notices
(it remembers the date in `debugg-epoch`) and clears per-day progress, the
streak and Debugg Ltd's `paid` ledger, keeping XP, the company and sandbox
drafts.

**The weekly rotation.** Each weekday has a difficulty (Monday 1 to Friday
5), and Saturday and Sunday share one weekend puzzle (a **Make it pass** code
challenge, its tests run on Pyodide by `daily/runner.js`; a hard 5 when none is left), saved under Saturday's day number: its
*slot* (`slotDay()`). The schedule is computed from Day 1 in every
browser: each slot's language (from the rotation) takes its first unused
puzzle of that difficulty, in its file's order, else the nearest difficulty
(easier first), and a puzzle is never served twice while its language has an unused one (the preview days' puzzles count as
served, `PREVIEW_DAYS`). Only when a language has used every puzzle does the schedule start again, as a last resort
(`firstRepeatDay()`); `tools/check-puzzles.js` fails when that day is less than 30 days away or two puzzles share code,
so more get written in time. Streaks run slot to slot, so the
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
