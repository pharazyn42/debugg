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

## Last session handoff
- Branch / worktree: `main` (clean at 2026-10-05 e8cd235, PR #105 released daily 0.0.11 / Ltd 0.0.16 / Learn 0.0.17)
- Finished: the planning convention wired into the team — `/develop` now requires an idea-file path and reads that doc (plus its framing) before the code; roadmap cuts the idea into pieces or a phase ladder; plan-writer's header gained `**Idea:**`; the three workers flip the idea's status tag. Files: `.pi/prompts/develop.md`, `.claude/agents/{plan-writer,daily-worker,learn-worker,ltd-worker}.md`, this file
- In progress: nothing in code. `PLAN.md` still holds the **old** Draft (roadmap item 1, the Ltd engine seam) and has no `**Idea:**` line — it predates the convention
- Next: `/develop ideas/daily-learn-quality-ideas.md 12` (the doc's own top-ranked idea) to replace that Draft. The earlier attempt died at step 2 (roadmap aborted); Explore's findings from it are reusable
- Tests: not run — no code touched · Uncommitted changes: yes (`PLAN.md`, `TODO.md`, `NOTES.md`, `CLAUDE.md`, `ideas/roadmap.md`, `ideas/daily-learn-quality-ideas.md`, `.claude/`, `.pi/`)
