# TODO

<!-- One item per session. Each is checkable by a command. Prune Done often. -->
<!-- Source: PLAN.md (repo split, Approved 2026-10-08). Phase 1 first. -->

## Now
- [x] Key inventory: list every `debugg-*` key with its owner (daily / learn / ltd / shared) in `NOTES.md`, including the dynamic ones (`'debugg-' + …` in `shared.js`, the prefix scan in `backup.js`, `debugg-sandbox-<lang>`, `debugg-<lang>-day<N>`). Check: `grep -rhoE "debugg-[a-z0-9-]*" --include=*.js --include=*.html . | sort -u` shows nothing missing from the list. No code change.
- [x] Central key map: put every key name in one `KEYS` object per product (`shared.js` for now), so the rename is a one-line change each. Behaviour unchanged. Check: `npm test` green and the inventory grep still shows the same names.
- [ ] Rename Ltd's keys to `debuggit-ltd-*` (`debugg-ltd` and anything Ltd-only). Bump `SAVE_VERSION` for the demo wipe, no migration. Check: `npm test` green, `grep -rn "debugg-ltd" --include=*.js --include=*.html --include=*.md . ` finds only old-name mentions in docs. Ltd changelog line under `## Unreleased`.

## Next
- [ ] Rename Learn's keys to `debuggit-learn-*` (`debugg-learn*`, `debugg-sandbox-*`, `debugg-lang` if Learn-only). Check: `npm test` green. Learn changelog line.
- [ ] Rename the daily's keys to `debuggit-daily-*` (`debugg-xp`, `debugg-streak`, `debugg-day*`, `debugg-practice-*`, `debugg-demo-seen`, `debugg-seen-*`). Check: `npm test` green, and `grep -rn "debugg-xp" ltd/` finds nothing. Daily changelog line.
- [ ] Make `backup.js` collect all three prefixes (or each product backs up its own). Check: `tests/launch.spec.js` and the backup tests pass.
- [ ] Ltd stops reading daily/Learn state (`ltd/ltd.js` ~lines 1000 and 1793, `ltd/desk.js`): needs the languages decision below.
- [ ] Ltd's own XP scale in `ltd/`: needs the values decision below.
- [ ] Phase 2: split `shared.js` by owner (calendar/rotation/`FORMATS` to daily; `LANG_INFO` and the highlighter to learn; versions and `PRODUCTS` to each product). Check: no product file imports another product's folder.
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
- [ ] **Ltd XP scale values.** Levels and XP per action? Start from `tier.xpPerMin` in `ltd/ltd.js` and `ideas/ltd-pacing-targets.md`, check with `npm run sim`. Blocks "Ltd's own XP scale".
- [ ] **Ltd languages.** What replaces "languages you've earned daily-puzzle XP in"? All available, unlocked inside Ltd, or owner's pick. Blocks "Ltd stops reading daily/Learn state".
- [ ] Multi-product PRs: `tools/check-scope.js` allows them if each touched product gets a changelog line. Is that enough for the key renames, or relax the check for this series?
- [ ] Content tag cadence: pinned tag per new puzzle, or daily follows content `main`? (Phase 4)
- [ ] Hosting and domains: three Pages URLs or custom domains; share card, old links, GoatCounter. (Phase 5)
- [ ] History: `git filter-repo` per product, or clean start? (Phase 5)
- [ ] Shared test fixtures (`tests/helpers.js`, `serve.js`, `fixtures`, `release.spec.js`, `launch.spec.js`): copy or replace per repo? (Phase 5)
