# Plan: Split Daily, Learn and Ltd into separate repos
**Idea:** none yet (this came from a design discussion, October 2026). Add a short `ideas/repo-split.md` if the owner wants a roadmap ref.
**Requirement(s):** none named.
**Status:** Approved

*Replaces the "Phase 1 foundations" plan, which is still in git history (`git log -p PLAN.md`). Re-add it if that work is still wanted.*

## Goal
Daily, Learn and Ltd each live in their own repo, deploy on their own, and pass their own tests. They share
puzzle and Learn content through one pinned content package, and no product reads another's save keys.
Testable today (per phase): the Playwright suite is green in the repo it runs in, and `grep -r "debugg-xp"`
from `ltd/` finds nothing once Phase 1 is done.

## Approach

**Decisions already made (owner, October 2026):**
- Cross-product progress is dropped. There are no active players, so save keys can be renamed freely.
- Each product has its own save key prefix. Ltd gets its own XP scale, not tied to Learn or the daily.
- Products may live on separate origins. No single-origin deploy is needed.

**Target layout**

| Repo | Holds |
|---|---|
| `debuggit-daily` | `index.html`, `daily/`, daily tests and changelog |
| `debuggit-learn` | `learn/` (sandbox included), its tests and changelog |
| `debuggit-ltd` | `ltd/`, `studio/`, its tests, `tools/sim-ltd.js` and changelog |
| `debuggit-content` | `puzzles/*.js`, `learn/python/*` units and `learn/courses.js`, `tools/check-puzzles.js`, the trace tools |

Small shared files (`base.css`, `fonts/`, `backup.js`, `analytics.js`, the highlighter) are **copied** into each
product, not packaged. Revisit a `debuggit-ui` package only if they get edited in three places often.

**How content is shared:** each product pins a `debuggit-content` git tag and copies the files it needs at
build or deploy time. Runtime stays no-build, with plain scripts and modules. The content repo's CI runs the heavy
`check-puzzles` job (real python, gcc, rustc and so on). Product CI runs Playwright only.

**Phases** (one phase per PR or session; each leaves `main` green)

1. **Per-product save keys and Ltd XP** (in this repo, before anything moves)
   - Rename the shared `debugg-*` keys to `debuggit-daily-*`, `debuggit-learn-*`, `debuggit-ltd-*`.
     The key inventory comes from `grep` over `*.js` and `*.html`: `debugg-xp`, `debugg-streak`, `debugg-day*`,
     `debugg-practice-*`, `debugg-learn*`, `debugg-ltd`, `debugg-sandbox-*`, `debugg-lang`, `debugg-epoch`,
     `debugg-version`, `debugg-seen-*`, `debugg-demo-seen`.
   - **Ltd XP (decided with the owner, 2026-10-10).** Ltd's XP comes only from right answers to desk-job and
     intern-help questions, never from the daily or Learn. Stored per language in the Ltd save (`state.xp`, a
     boot-sequence guard `state.xp ||= {}`, no migration). **6 XP × the question's difficulty** per right answer
     (6 / 12 / 18 / 24 / 30; Learn questions count as difficulty 1; wrong answers 0, no penalty). One constant,
     `LTD_XP_PER_DIFFICULTY = 6`, in `ltd/ltd.js`. The level curve keeps its shape and is copied into `ltd/` so it does
     not depend on `shared.js`: level n starts at 50·n·(n−1) XP (0, 100, 300, 600, 1000 … 5500 at level 11). A level's
     effect is unchanged: +1% contract success per level above 1, capped at +10% (`DIRECTOR_BOOST_*`).
     Source for 6: `tools/sim-ltd.js` over 30 days, 2 seeds, 80% hit rate: a keen player answers about 20 questions
     right a day (average difficulty 1.47, about 180 XP a day), a casual one about 6 (about 53 XP a day). That puts a keen
     player at level 5 on day 6 and the +10% cap on day 31, and a casual one at level 5 on day 19. Re-check with
     `npm run sim` once built (the sim pool is 81% difficulty 1; the real pool is smaller).
   - **Ltd's languages (decided):** Python is always known; any other language becomes known once the Director has Ltd
     XP in it, which a right desk answer in that language gives. Nothing else unlocks languages.
   - **Founder's bonus goes** (¤1 per puzzle XP before founding, up to ¤1,000): there is no pre-company XP any more, so a
     new company starts on a flat ¤250, as the pacing doc already assumes.
   - Ltd stops reading daily and Learn state: `ltd/ltd.js` lines ~997, ~1004 and ~1396 (`D.readXp`) are the only
     reads of `shared.js` XP today (verify with `grep -nE "D\.(readXp|totalXp|levelFor|readState|isFinished)" ltd/`).
   - Because there are no players, skip migrations. Bump `SAVE_VERSION` and the demo wipe once so any stale saves are cleared.
2. **Split `shared.js` by owner** (still one repo). Move what is product-specific into that product's folder:
   the calendar, rotation and `FORMATS` to daily; `LANG_INFO` and the highlighter to learn (copied where
   daily needs them); `APP_VERSION`, `LTD_VERSION`, `LEARN_VERSION` and `PRODUCTS` to each product's own
   version file. Verify: no product file imports another product's folder.
3. **Define the content boundary.** Decide the interface Ltd's desk jobs use (`ltd/desk.js` loads Learn
   unit files on demand and reads past dailies). Prefer a derived question-pool file (`prompt`, `answer`,
   `language`, `difficulty`) over the full puzzle format. Add a generator in `tools/` and a test that checks it.
4. **Create `debuggit-content`.** Copy `puzzles/`, the Learn units and courses, `check-puzzles.js` and the trace
   tools with history (`git filter-repo` on a fresh clone). Add its CI, tag `v0.1.0`, and add a copy step to
   each product that fetches the pinned tag.
5. **Peel off Ltd**, then **Learn**, then **Daily**, in that order. Ltd is the most self-contained. Each peel: filter-repo
   with history, move its tests and workflows, set up its own Pages deploy, update links and redirects (`studio/`,
   `learn.html`, `sandbox.html`), and give it its own `CLAUDE.md`, changelog and release workflow.
6. **Retire the umbrella repo.** Leave a README with links, or archive it. Remove `tools/check-scope.js` and the
   one-product-per-branch rule, which the repos now enforce. Update `.claude/agents/` and `.pi/prompts/` per repo.

**Files touched by phase.** Phases 1–2 touch `shared.js`, `ltd/ltd.js`, `index.html`, `learn/*`, `backup.js`, `tests/*`
and `tools/release.js`. Phase 3 touches `ltd/desk.js` and `tools/`. Phases 4–6 are mostly moves plus per-repo CI.

**Players' notice.** Phase 1 and the Ltd XP change are player-visible, so each product gets a line under
`## Unreleased` in its changelog in the same PR (Ltd's for the XP and language change, the daily's and Learn's for
anything their screens show).

## Out of scope
- Any gameplay, balance or puzzle-content change other than Ltd's new XP scale.
- A shared UI package, a monorepo with workspaces, and submodules (rejected in discussion).
- Cross-product progress, accounts, sync, and the single-origin deploy (dropped by decision).
- Releases: versions, changelogs and tags keep working per product; only their home changes.
- `Day 1` (`LAUNCH`) stays where it is for the daily. No date change is planned.

## Risks / open questions
- **One product per branch.** This plan is multi-product by nature (shared `shared.js`, `tests/`, `tools/`), so
  Phases 1–2 will fail `tools/check-scope.js`. Decide: relax the check for this series, or order the work so each PR is
  one product (Ltd's key and XP change first, then Learn, then daily, then shared).
- **Content tag cadence.** Pinned copies mean a new puzzle needs a content tag and a bump in each consumer. Is
  that acceptable, or should the daily consume `main` of the content repo on a schedule?
- **Heavy CI.** `check-puzzles` needs python, gcc, clang and rustc, so it lives in the content repo only. Confirm
  products don't need it (Learn's snippets are checked there too).
- **Test fixtures that cross products.** `tests/helpers.js`, `tests/serve.js` and `tests/fixtures` are shared and
  need copying or replacing per repo. `tests/release.spec.js` and `launch.spec.js` need a per-repo decision.
- **Hosting and domains.** One Pages site per repo means three URLs, or a custom domain per product. The existing
  `pharazyn42.github.io/debugg/` links, the share card and the analytics (`debugg.goatcounter.com`) need a plan.
- **History rewriting.** `git filter-repo` keeps history per product but needs fresh clones. Confirm the owner wants
  history preserved rather than a clean start.
