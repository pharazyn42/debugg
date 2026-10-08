# TODO

<!-- One item per session. Each is checkable by a command. Prune Done often. -->

## Now
- [ ] Create `ltd/engine.js`: move `capacity()` and `structureProblem()` out of `ltd/ltd.js`; page still imports it
- [ ] Add `npm run unit` (`node --test tests/unit/`) and wire it into `.github/workflows/tests.yml`
- [ ] Unit tests for capacity/structure: each level supervises 3 below; managers add slots but no SLOC; hiring blocked when it breaks structure

## Next
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
- [ ] Does a shared change to `package.json` need a changelog line in every product it touches? (ask before the first PR)
- [ ] Which product does `ltd/engine.js` belong to if a daily-only branch imports it? (Ltd today — verify)
