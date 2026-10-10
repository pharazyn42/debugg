# Debuggit (formerly Debugg), Debuggit Learn and Debuggit Ltd

**Read first, in this order:** `PLAN.md` (what & why) · `TODO.md` (one item at a time) · `NOTES.md` (decisions, gotchas, where the last session stopped). Then this file; `docs/design.md` or `docs/releases.md` only for the part a task names; `ltd/CLAUDE.md` when working under `ltd/`, and `ideas/roadmap.md` only when a roadmap item is named — it is 88 KB, never read it whole.

**Agent team** lives in `.claude/agents/`: `roadmap` `plan-writer` `todo-curator` (planning, no code) · `daily-worker` `ltd-worker` `learn-worker` (one product each, CI-enforced scope) · `verifier` (runs tests, changes nothing) · `ship-web` `ship-phone` (distribution). Drive them with `/develop`, `/implement`, `/review`, `/status`, `/distribute` from `.pi/prompts/` (mirrored in `.claude/commands/`); `PROCESS.md` has the stages, gates, check commands and token rules. Project agents load only for a trusted project.

The game is called **Debuggit** (September 2026; see item 2c).
The code, the repository and `window.Debugg` keep the old spelling (save keys are `debuggit-*`), and "Debugg" below means the
same game. Its wordmark is "debug it" as a line of code in the day's puzzle language
(`wordmarkFor()` in `shared.js`). Each app's header has its title beside the kiwi, the same as
its button at the top: `debuggit.daily()`, `debuggit.learn()`, `debuggit.ltd()`, and the sandbox's
`debuggit.run()` (the player-owner's call, October 2026, reversing an earlier one to drop them). The share text and picture start with
`debuggit.daily()`, the daily's button, so a shared result matches the page (October 2026, the player-owner's call).

Context for continuing work on this repo. **Debugg** is the daily puzzle game:
read a short Python or JavaScript snippet and guess what it prints. **Debugg
Ltd** is the optional idle studio-management game around it, on the **Ltd** tab
next to Daily. Since September 2026 the two are separate: the daily puzzle pays the company
nothing, and the Director's desk is **desk jobs**, questions from past dailies and Learn that turn
up over time (see "The desk" in `ltd/implemented.md`). The README covers the player-facing rules; this
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
| `shared.js`, `base.css` | The site kit, loaded by every page: save keys, the products' versions and footer link, the wordmark, the highlighter, answer matching, the base theme. Knows nothing about the calendar or puzzles. |
| `calendar.js` | The calendar and the puzzle bank's front door: day numbers, the language rotation, today's puzzle, puzzle formats. The daily uses all of it; Learn's sandbox and Ltd's desk borrow some (until Phase 3 of `PLAN.md`). Loads after `shared.js`. |
| `daily/core.js`, `daily/version.js`, `ltd/version.js`, `learn/version.js` | What only the daily owns (its saved days, XP and levels, the Day-1 reset), and each product's version (`tools/release.js` bumps these). |
| `learn/sandbox.html` | The sandbox, part of Debuggit Learn (moved there September 2026, the player-owner's call): write and run Python (Pyodide) or JavaScript in Web Workers, replay finished daily puzzles (`?lang=python&day=3`), or open a lesson's example (`?lang=python&code=…`). `sandbox.html` redirects there (its old address). |
| `backup.js` | The save backup window: all `debuggit-*` storage as one code (`DEBUGG1.` + base64 JSON), and restoring from one. |
| `analytics.js` | GoatCounter page views and named events, to https://debugg.goatcounter.com. `SITE_COUNT_URL = ''` switches it off; tests switch it off via `window.DEBUGG_GOATCOUNTER`. |
| `privacy.html` | What's stored and sent, for players. Keep it in step with `analytics.js`. |
| `CHANGELOG.md`, `ltd/CHANGELOG.md`, `learn/CHANGELOG.md`, `whatsnew.html`, `ltd/whatsnew.html`, `learn/whatsnew.html`, `whatsnew.js` | The lists of changes, by release, written for players: the daily puzzle's, Debuggit Ltd's and Debuggit Learn's. Each product has its own What's new page (the reader is `whatsnew.js`; the old `whatsnew.html?ltd` and `?learn` redirect), which shows its changelog without "Unreleased". |
| `tools/release.js`, `tools/check-scope.js` | Cuts a release of the daily, Ltd or Learn (`[ltd|learn] bump|notes|check|tag|name <version>`; with no product it is the daily, or the only product a repo has), and the CI check that keeps each PR to one of them. See "Releases" below. |
| `fonts/` | Self-hosted Sora and JetBrains Mono (OFL), declared in `base.css`. |
| `img/` | The Debuggit kiwi: `kiwi.svg` (logo and favicon), `kiwi-180.png` (home-screen icon) and `share.png` (the 1200×630 link-preview card, the kiwi beside the wordmark and the tagline; `index.html` asks for it as `share.png?v=2`, because apps cache link previews by URL, so bump the number when the card changes). The PNGs are rendered from the SVG and the page fonts; redo them if the kiwi changes. |
| `daily/` | The daily page's parts: `formats.js` (each puzzle format's question and answer text), `stats.js` (the stats panel), `sharecard.js` (the share picture), `archive.js` (past puzzles, played as practice at `index.html?day=N`), `trace.js` (Step through it) and `runner.js` (runs the weekend code challenges' tests on Pyodide). |
| `tools/trace-puzzles.js`, `tools/trace.py`, `tools/probe.py` | `npm run traces` records every Python puzzle's step-by-step trace with real Python into `puzzles/traces-python.js`; `probe.py` counts line runs and tries line orders for the checker. |
| `tools/sim-ltd.js` | `npm run sim`: the Debuggit Ltd pacing simulator. Plays the real `ltd/ltd.js` headless (fake clock, seeded randomness, a stand-in page) as a keen, casual or always-open player, and prints when the milestones in `ideas/ltd-pacing-targets.md` happen. `--ltd` plays a modified copy, to try a balance change. |
| `ltd/index.html`, `ltd/ltd.js`, `ltd/ltd.css` | Debugg Ltd: its own page (with the loader) and code. Loaded only when the studio is on. CSS is scoped under `.ltd`. |
| `ltd/office.js` | The office view (item 21b): the studio drawn on a canvas from a read-only snapshot `ltd.js` hands it. Optional: the studio plays the same without it. |
| `ltd/founding.js` | Founding a company: naming it and its Director, and choosing the Director's look (drawn by `office.js`). The loader opens it for a new company; tests skip it (`DEBUGG_FOUNDING`). |
| `ltd/CLAUDE.md` | Debugg Ltd's design notes: data model, what's implemented, known gaps. |
| `ideas/` | The roadmap (`roadmap.md`), detailed plans for some of its items, and separate game concepts. |
| `studio/index.html` | Redirect to `../ltd/`, the studio's old address. |
| `tests/` | Playwright tests, run by `npm test` and GitHub Actions. |

## Hard rules (the ones that break silently)
- **Saves are live.** Never rename a `debuggit-*` key or a state key; a shape change needs a boot-sequence guard in `ltd.js`. `SAVE_VERSION` only changes for the v0.1 reset.
- **Don't move Day 1** (`LAUNCH` in `calendar.js`) once players have progress; saves are keyed by day number.
- **One product per branch** (daily, Ltd, Learn). Shared files count for none. `tools/check-scope.js` fails a PR otherwise.
- **Every change players notice** adds a line under `## Unreleased` in that product's changelog, in the same PR.
- No build step, no runtime dependencies. Plain ES modules and scripts only.

## Design reference (read the section you need, never the whole file)
- `docs/design.md`: how the daily and the studio connect, the two areas, tabs and loader, languages and rotation, XP, the demo, save versions and the v0.1 reset, the calendar, the weekly rotation, saves.
- `docs/releases.md`: the full release routine and the one-product-per-branch rules.
- `docs/roadmap-index.md`: the roadmap item index by phase. Detail is in `ideas/roadmap.md`.
- `ltd/CLAUDE.md`: Ltd's data model and known gaps; `ltd/implemented.md`: everything built in Ltd.

## Releases
Three products, released separately, each with its own version (`daily/version.js`, `ltd/version.js`,
`learn/version.js`), changelog (`CHANGELOG.md`, `ltd/CHANGELOG.md`, `learn/CHANGELOG.md`),
What's new page and tags (`v…`, `ltd-v…`, `learn-v…`). The owner says **release** (optionally product and
version); then `node tools/release.js [ltd|learn] bump <version>`, a PR, merge, and the **Release** workflow
(`workflow_dispatch`). A minor version needs a player-facing `<!-- player -->` block approved by the owner
first. Full routine: `docs/releases.md`.

## Testing notes

`npm test` runs the Playwright suite in `tests/` against a small static
server (`tests/serve.js`). Tests fix the date with
`page.clock.setFixedTime` (the demo's Day 1 is Monday 5 October 2026, and Day 3, a Wednesday, is the default; `dayDate(n)` in `tests/helpers.js`, with 0 and below for preview days) and simulate time
passing by editing saves and moving the clock. The sandbox's Python tests
need Pyodide: from the CDN, or set `PYODIDE_DIR` to an unpacked `pyodide`
npm package when there's no internet. Switching language on the puzzle page
reloads it, so wait for the new puzzle (e.g. its filename) before acting.
