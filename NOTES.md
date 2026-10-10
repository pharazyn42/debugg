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

## Last session handoff
- Branch: `claude/jolly-davinci-dfihk5` (repo-split plan, Phase 1).
- Finished: `backup.js` needed no code change. It goes through `isOurKey()`, which matches `KEYS.prefixes` (`['debuggit-']`), so it already covers the daily, Ltd and Learn. The backup test in `tests/launch.spec.js` now also checks Learn's save and a sandbox draft survive a backup and restore (before, it covered only the daily and Ltd).
- Tests: `tests/launch.spec.js` 6 passed. The last full run (148 passed) was before this test-only change.
- Next: nothing left that is unblocked in Phase 1. Both remaining Phase 1 items need an owner decision (`TODO.md` "Blocked"): Ltd languages, then Ltd XP scale values. Phase 2 (split `shared.js` by owner) needs neither, but Ltd still reads the shared XP and levels until those two land.
- Uncommitted changes: none after this commit.
