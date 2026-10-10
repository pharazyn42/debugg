# TODO

<!-- One item per session. Each is checkable by a command. Prune Done often. -->
<!-- Source: PLAN.md (repo split, Approved 2026-10-08). Phase 1 first. -->

## Now
- [x] Key inventory: list every `debugg-*` key with its owner (daily / learn / ltd / shared) in `NOTES.md`, including the dynamic ones (`'debugg-' + …` in `shared.js`, the prefix scan in `backup.js`, `debugg-sandbox-<lang>`, `debugg-<lang>-day<N>`). Check: `grep -rhoE "debugg-[a-z0-9-]*" --include=*.js --include=*.html . | sort -u` shows nothing missing from the list. No code change.
- [x] Central key map: put every key name in one `KEYS` object per product (`shared.js` for now), so the rename is a one-line change each. Behaviour unchanged. Check: `npm test` green and the inventory grep still shows the same names.
- [x] Rename Ltd's keys to `debuggit-ltd-*` (`debugg-ltd` and anything Ltd-only). Bump `SAVE_VERSION` for the demo wipe, no migration. Check: `npm test` green, `grep -rn "debugg-ltd" --include=*.js --include=*.html --include=*.md . ` finds only old-name mentions in docs. Ltd changelog line under `## Unreleased`.
- [x] Ltd XP, part 1: store and earn. Add `state.xp` (guard `||= {}`), `LTD_XP_PER_DIFFICULTY = 6`, and Ltd's own `levelStart`/`levelFor` (level n starts at 50·n·(n−1)) in `ltd/`. A right desk answer and a right intern-help answer add 6 × difficulty to the question's language (Learn = difficulty 1); wrong adds 0. `directorLevel()` and `directorKnows()` read `state.xp` (Python always known; other languages once XP > 0). Update the ~8 `tests/ltd.spec.js` spots that seed `debuggit-daily-xp` to seed the Ltd save, and add tests: right answer earns, wrong earns nothing, intern help earns, a JS answer unlocks JS. Check: `npx playwright test tests/ltd.spec.js` green. Ltd changelog line.

## Next
- [x] Rename Learn's keys to `debuggit-learn-*` (`debugg-learn*`, `debugg-sandbox-*`, `debugg-lang` if Learn-only). Check: `npm test` green. Learn changelog line.
- [x] Rename the daily's keys to `debuggit-daily-*` (`debugg-xp`, `debugg-streak`, `debugg-day*`, `debugg-practice-*`, `debugg-demo-seen`, `debugg-seen-*`). Check: `npm test` green, and `grep -rn "debugg-xp" ltd/` finds nothing. Daily changelog line.
- [x] Make `backup.js` collect all three prefixes (or each product backs up its own). Check: `tests/launch.spec.js` and the backup tests pass.
- [x] Ltd XP, part 2: cut the last daily links. Remove `founderBonus()` (a new company starts on ¤250) and every `D.readXp`/`D.totalXp`/`D.levelFor` use in `ltd/`; make `tools/sim-ltd.js --xp` seed Ltd XP. Check: `grep -nE "D\.(readXp|totalXp|levelFor|readState|isFinished)" ltd/` finds nothing, `npm test` green, and `npm run sim` keen/casual milestones match `ideas/ltd-pacing-targets.md` (flag any that move).
- [x] Ltd XP, part 3: wording. The Director card, team picker and welcome text still say "puzzle level"/"puzzle XP"; `README.md`, `ltd/implemented.md` and `docs/design.md` describe the old rule. Check: `grep -rn "puzzle XP\|puzzle level" ltd/ README.md docs/` shows only intended mentions.
- [ ] Phase 2a: Learn stops using the daily's XP curve and saves. Give `learn/` its own `levelStart`/`levelFor` (same shape, Learn's own XP); the sandbox stops reading `D.isFinished` (decided: the sandbox lists past days only, never today's). Verify why `index.html` loads `learn/courses.js` and remove it if unneeded. Check: `grep -nE "D\.(levelFor|levelStart|isFinished|readState|stateKey)" learn/` finds nothing and `npx playwright test tests/learn.spec.js tests/sandbox.spec.js` is green. Learn changelog line.
- [ ] Phase 2b-i: standalone Ltd page. Add `ltd/index.html` with the loader, slots, "Start your own company", pause/resume/close and welcome toast; `index.html?ltd` and `studio/index.html` redirect to it; remove the Ltd slots and tab switching from the daily's `index.html`. Check: `npx playwright test` green with `tests/ltd.spec.js` and `tests/launch.spec.js` opening the new page, and `tests/daily.spec.js` having no Ltd steps. Changelog lines in Ltd and the daily.
- [ ] Phase 2b-ii: cross-product navigation as links. Replace the three-tab bar with a small header snippet in each product page; one URL constant per product (relative today). Check: a test per product page that the other two links resolve; `grep -rn "ltdTab\|learnTab\|dailyTab" --include=*.html --include=*.js .` finds only the snippet.
- [ ] Phase 2c: per-product What's new and release tooling. One What's new page per product (decided) and `tools/release.js` working on one product with no product argument. Check: `tests/release.spec.js` green and a dry-run bump for each product.
- [ ] Phase 2d: split what is left of `shared.js` by owner (calendar/rotation/`FORMATS` to daily; `LANG_INFO` and the highlighter to learn; versions and `PRODUCTS` to each product). Check: no product file imports another product's folder.
- [ ] Phase 3: define the content boundary (question-pool file for Ltd's desk jobs, generator in `tools/`, test).
- [ ] Phase 4: create `debuggit-content` (puzzles, Learn units and courses, `check-puzzles`, trace tools), tag `v0.1.0`, copy step in each product.
- [ ] Phase 5: peel off Ltd, then Learn, then Daily (filter-repo, tests, workflows, Pages deploy, redirects, own `CLAUDE.md`).
- [ ] Phase 6: retire the umbrella repo; remove `tools/check-scope.js`; update `.claude/agents/` and `.pi/prompts/` per repo.

## Parked (old foundations plan, replaced 2026-10-08)
- [ ] Create `ltd/engine.js`: move `capacity()` and `structureProblem()` out of `ltd/ltd.js`; page still imports it
- [ ] Add `npm run unit` (`node --test tests/unit/`) and wire it into `.github/workflows/tests.yml`
- [ ] Unit tests for capacity/structure: each level supervises 3 below; managers add slots but no SLOC; hiring blocked when it breaks structure
- [ ] Extract `evaluateTeam()` (requirements, learners, SLOC/time, payout, chance) + its unit tests
- [ ] Extract `resolveDueJobs()` (repeat, retry, offline chaining, 4 h cap) + unit tests
- [ ] Seeded RNG seam so a test can force success/failure and a specific offer
- [ ] Extract offer expiry (`offerLife` 3/15/45/120 by tier) and skill-rule qualification (`qualifiedFor()`)
- [ ] Confirm `tools/check-scope.js` accepts `ltd/engine.js` + `tests/unit/` as Ltd scope

## Done
- [x] `CLAUDE.md` split: roadmap → `ideas/roadmap.md`, Ltd notes → `ltd/CLAUDE.md` (2026-10-01, 33da087)
- [x] Playwright suite on every PR; Release workflow gated on tests
- [x] Releases cut with `tools/release.js`, tags + GitHub Releases

## Blocked / questions
- [ ] Multi-product PRs: `tools/check-scope.js` allows them if each touched product gets a changelog line. Is that enough for the key renames, or relax the check for this series?
- [ ] Content tag cadence: pinned tag per new puzzle, or daily follows content `main`? (Phase 4)
- [ ] Hosting and domains: three Pages URLs or custom domains; share card, old links, GoatCounter. (Phase 5)
- [ ] History: `git filter-repo` per product, or clean start? (Phase 5)
- [ ] Shared test fixtures (`tests/helpers.js`, `serve.js`, `fixtures`, `release.spec.js`, `launch.spec.js`): copy or replace per repo? (Phase 5)
