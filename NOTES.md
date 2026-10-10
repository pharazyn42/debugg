# Notes

<!-- Pi forgets between sessions. This file doesn't. End every session by rewriting the handoff block. -->

## Decisions
- 2026-10-07: `/develop` always takes an **idea-file path** (`ideas/…` plus the doc's own numbering or
  heading, e.g. `ideas/daily-learn-quality-ideas.md 12`) — never free text. The idea file is what kicks
  the team off; no new file type and no template forced on the nine existing `ideas/` files. plan-writer
  records it as `**Idea:**` in `PLAN.md`; the workers flip that idea's status tag in the doc
  (`[new]` → `[doing <date>]` → `[built <date>]`). Big ideas get a phase ladder in Approach, one phase
  per plan, so the chain runs once per phase against the same idea file.
- 2026-10-07: kit added to this repo as the hub's worked example — `PLAN.md`/`TODO.md`/`NOTES.md` + a read-first line in `CLAUDE.md`. Copy this shape to the other projects.
- 2026-10-07: agent team in `.claude/agents/` (9 agents) + `/develop` `/implement` `/distribute` in `.pi/prompts/`. Chose `.claude/agents/` because `personal-trainer/` already uses that path, and pi-code reads both. Nothing is committed yet — `.claude/` and `.pi/` are untracked, not gitignored, so they ship with the repo once I commit.
- 2026-10-07: `PLAN.md` is **Draft**. It stays Draft until the owner edits it and marks it Approved. No code until then.
- 2026-10-01 (upstream, 33da087): `CLAUDE.md` split — roadmap to `ideas/roadmap.md`, Ltd notes to `ltd/CLAUDE.md`. This is why the root file is small enough to load.

- 2026-10-08: token diet. `CLAUDE.md` 24→9.7 KB and `ltd/CLAUDE.md` 27→5.9 KB; moved text (verbatim) is in `docs/design.md`, `docs/releases.md`, `docs/roadmap-index.md`, `ltd/implemented.md`. `CLAUDE.md` keeps a "Releases" heading because code comments cite it. Added `PROCESS.md`, `/review`, `/status`; prompts mirrored to `.claude/commands/`.

## Gotchas
- **Context files are big.** Root `CLAUDE.md` 23 KB, `ltd/CLAUDE.md` 27 KB — both auto-load when working in that folder. `ideas/roadmap.md` is **88 KB**: never read it whole, grep it or read with `limit`.
- No build step, no runtime deps. Don't add a bundler to make the engine importable — plain ES modules only.
- Save keys (`debugg-*`) are live in players' browsers. Code-only refactors; never rename a state key.
- `tools/check-scope.js` fails a PR that touches more than one product. This plan is Ltd + shared files.
- Playwright tests fake time by editing the save; that seam does not work for unit tests. Needs a real RNG/clock seam.

## Save-key inventory (2026-10-08, for PLAN.md Phase 1)
Owner = who should hold it after the split. "Where" = file:line where the name is written.

| Key | Owner | Where |
|---|---|---|
| `debugg-xp` | daily | `index.html:527`, `shared.js:316` (read by the shared level code; Ltd's language rule also depends on it) |
| `debugg-streak` | daily | `index.html:526`, `daily/stats.js:24`, `shared.js:65` |
| `debugg-day<N>` (`stateKey()`) | daily | `shared.js:292`, `daily/stats.js:13` |
| `debugg-practice-day<N>` | daily | `index.html:541`, `daily/archive.js:41` |
| `debugg-demo-seen` | daily (page-level) | `index.html:1360` |
| `debugg-seen-version` | daily | `shared.js:31` |
| `debugg-seen-ltd-version` | ltd | `shared.js:33` |
| `debugg-seen-learn-version` | learn | `shared.js:35` |
| `debugg-ltd` | ltd | `ltd/ltd.js:465`, `index.html:1258`, `shared.js:34,66,69` |
| `debugg-learn` | learn | `learn/learn.js:16`, `shared.js:36` |
| `debugg-learn-session`, `debugg-learn-collapsed` | learn | `learn/learn.js:17,18` |
| `debugg-lang` | learn (sandbox language) | `learn/sandbox.html:305` |
| `debugg-sandbox-<lang>` | learn (sandbox drafts) | `learn/sandbox.html:306` |
| `debugg-version`, `debugg-epoch` | shared today; one pair per product after the split | `shared.js:13,39`, `backup.js:42` |
| `contract-debugger-state-v3`, `debugg-<lang>-day<N>` | legacy; delete with the rename (no players) | `shared.js:47,62,65`, `index.html:1258` |

Things that scan by the `debugg-` prefix and must change together with the rename:
`backup.js:10` (`isOurs`), `shared.js:47` (wipe), `shared.js:32,34,36` (`returning:` regexes),
`shared.js:62-69` (old epoch migration, touches Ltd's save: delete it), `index.html:1200` (reset list).

## Decisions
- 2026-10-10: Ltd XP is its own scale, earned only from right desk and intern-help answers: 6 XP × difficulty, per language, kept in the Ltd save. Languages unlock by earning XP in them (Python always known). The founder's bonus goes. Details and the sim numbers behind the 6 are in `PLAN.md` Phase 1.

- 2026-10-10: sandbox replays past days only (never today's), so Learn reads no daily saves; What's new is one page per product. Both written into `PLAN.md` Phase 2 and unblock Phases 2a and 2c.

## Last session handoff
- Branch: `claude/jolly-davinci-dfihk5` (repo-split plan). **Phase 2 is complete.**
- Finished: Phase 2d. `shared.js` (193 lines) is the site kit only; `calendar.js` is the calendar and puzzle front door (loads after the kit; used by all three products until Phase 3); `daily/core.js` has the daily's saves, XP/levels and the Day-1 reset (it no longer edits Ltd's save); `daily/version.js`, `ltd/version.js`, `learn/version.js` hold each version (`window.Debugg.PRODUCTS.<p>.version = '…'`), and `tools/release.js` reads and bumps those, so a release now touches one product's folder only. The daily page no longer loads `learn/courses.js` (own `LEARN_COURSES` list). Page script order everywhere: `shared.js`, the product's `version.js`, then `calendar.js` (daily also `daily/core.js`); `tools/load-game.js` and `tools/sim-ltd.js` load the same. Tests: `release.spec.js` reads the version files, the Day-1 test now checks Ltd's save is untouched, a new test that the daily page loads no Learn/Ltd script.
- Tests: `npx playwright test --workers=2` 156 passed; `node tools/check-puzzles.js` (Learn 390/390 steps) and `node tools/sim-ltd.js` run.
- Deviation from the plan: the calendar did not go to the daily (see `PLAN.md` Phase 2 note); it is shared by the daily, Learn's sandbox and Ltd's desk, so it joins the content package.
- Next: Phase 3, the content boundary. The cross-product code imports left are all Ltd's: `ltd/desk.js` and `ltd/index.html` load `../learn/courses.js` and Learn's unit files; `ltd/ltd.js` ~1950 reads `DEBUGG_LEARN.courses`; Ltd and Learn's sandbox call `calendar.js`. Design (from `PLAN.md`): a derived question-pool file (`prompt`, `answer`, `language`, `difficulty`) generated by a tool in `tools/`, with a test; Ltd's desk reads only that. Decide first what the pool must carry for each question kind (choice, typed, tap-the-line) since `desk.js` plays them (`kind`, `options`, `line`, `explain`, `lang`, `display`).
- Still open for later phases: navigation URLs (hosting), content tag cadence, git history, shared test fixtures. The kit's `KEYS` table still lists every product's keys; prune per repo in Phase 5.
- Uncommitted changes: none after this commit.
