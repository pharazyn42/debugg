# Daily and Learn: ideas for a fuller, higher-quality experience

Summary and status live in `ideas/roadmap.md` (items 3b, 3d, 3f); this file is the detail.
Written 2026-10-07 against: `daily/` (`trace.js`, `archive.js`, `sharecard.js`, `formats.js`,
`runner.js`), `learn/` (`learn.js`, `courses.js`, `python/01…07`), `puzzles/README.md`,
`shared.js`, `tools/check-puzzles.js`, and roadmap items 3b/3d/3f/3g. Re-check before acting on
any of it — both products move quickly.

Nothing here is built. Each idea is tagged: **[new]** (not in the roadmap), **[3f]** (already an
item under "Daily puzzle: next features"), **[sketched]** (in the Learn sketch, and not in the
built list, so it is owed rather than new).

## Where the two products stand

- **Daily:** `output` plus a weekday format rotation (`WEEK_FORMATS` in `shared.js`); the weekend
  is **Make it pass** (2 challenges written, falls back to a hard output puzzle after); Step
  through it, archive/practice, stats, share card, hints, streaks; XP 60/80/100/120/150, weekend 200.
- **Learn:** Python course, 7 units (~250 steps); C as a "soon" tab. Step types: teaching,
  multiple choice (each wrong option explains itself), "what does this print?", fill the blank,
  tap the buggy line. Checkpoints, stars, the spaced-repetition review queue, practice and mixed
  practice, the Continue card, and "Run it yourself" sandbox links.

Already planned, so not re-pitched below: Fix it / Write it, hard mode, shared stats and common
wrong answers, reminders/PWA, the visual course path, a daily learning goal, badges, a placement
quiz, Python's Part 2 units, other languages.

## Daily puzzle — quality

1. **[new] An ambiguity report at authoring time.** 3f wants "62% solved this, most common wrong
   answers" from players, which needs 2b's backend. The same signal exists offline now: enumerate
   plausible answers per puzzle and flag any two that `normaliseAnswer` collapses to one. A warning
   tier in `tools/check-puzzles.js`, no privacy line, no backend.
2. **[new] A per-puzzle `strict` flag.** `normaliseAnswer` ignores case, spaces, quotes, commas and
   brackets, so `"1 2"` and `[1, 2]` read equal. When the type *is* the point, a wrong answer is
   marked right. Opt-in strictness, plus a checker warning for accepted-but-wrong.
3. **[new] Hints escalate from the trace.** `daily/trace.js` already knows the line you are on.
   Make hint *n* reveal the trace's current line rather than a generic nudge. Then 3f's hard mode
   becomes "no trace", a cleaner modifier than "one guess fewer".
4. **[new] Measure difficulty instead of picking it.** Stock is hand-tagged 1–5 and 3g needs about
   28 more puzzles banked. Score a candidate by trace length and distinct concepts, then re-bank,
   so the weekday ladder stays honest as the bank grows.
5. **[new] Spoiler-safe share card.** `daily/sharecard.js` should carry language, difficulty, guess
   count and the bug's line number, never the answer. Worth checking what it leaks today.

## Daily puzzle — fuller experience

6. **[new] A bite-size second daily, "Micro".** One line, about 30 seconds, no XP, no streak. The
   daily is a commitment and there is nothing easier to play; Micro's real reward is a **streak
   freeze**, which also softens a harsh break.
7. **[new] Practice with personal bests.** `daily/archive.js` practice currently means nothing.
   Store a best guess-count per past puzzle in `debugg-*` and add a "hardest for you" page. Local
   only: no leaderboard, no privacy cost.
8. **[new] Code golf on finished weekend challenges, local only.** 3f's golf wants shared
   leaderboards. Ship the no-backend half now: a byte count saved locally, shareable as a card.
   Leaderboards come with 2b.
9. **[new] Themed weeks that name themselves.** Puzzles already carry a `learn` tag. Show the week's
   theme on the page ("this week: dictionaries") and link it to the Learn unit that teaches it, so
   the daily becomes a curriculum teaser.
10. **[new] A filterable archive.** Browse past puzzles by language, format and difficulty, plus your
   own worst solves.

## Learn — quality

11. **[new] Make wrong options runnable.** Each wrong option explains itself in prose. `runLink()`
    and `sandbox.html?lang=python&code=…` already exist — pass the *mutated* code, so the mistake
    runs and prints its own wrong result. Seeing the error beats reading about it, and it is the
    same verb as the daily.
12. **[new] Test the teaching copy, not just the snippets.** `tools/check-puzzles.js` proves every
    snippet runs, but nothing proves the rule stated next to it. Sweep small inputs against each
    stated rule and flag counterexamples ("`int()` truncates" fails on negatives). In an educational
    product a wrong rule is the most expensive defect there is.
13. **[new] Typed review questions.** The review queue trains recognition only. Add "type the output"
    items reusing the daily's `normaliseAnswer`, so spaced repetition trains *production* — the skill
    that transfers.
14. **[new] End every unit with a "break it" step.** Predict the exception or the wrong output rather
    than the correct one. The sketch has "Learn by predicting"; predicting the failure is the daily's
    actual verb and is missing.
15. **[new] A 10-minute entry point.** Units run about 35 steps. A "sprint" that pulls the 5 highest-value
    due review questions gives a satisfying short sitting without a separate easy mode.

## Learn — fuller experience

16. **[new] A "fix the line" step type.** Pick the patch among three options. It teaches bug-finding
    explicitly, and its questions become daily-puzzle stock (idea 17).
17. **[new] Harvest Learn questions as daily stock.** Every Learn question's code is already a checked,
    difficulty-tagged snippet. That is a content pipeline: the ~28-puzzle gap for 12 weeks (3g) stops
    being an authoring bottleneck and becomes a harvesting pass.
18. **[new] A "weakest areas" card fed by the review queue.** The queue already holds what you keep
    missing; surface it on the course map as a study dashboard instead of only replaying it.
19. **[a decision to revisit] JavaScript units 1–2 before Python's Part 2.** The roadmap says add
    languages after Part 2, and C/Rust need in-browser compilers, but JavaScript already runs in the
    sandbox and has a puzzle bank (`puzzles/javascript.js`). Two JS units is the cheapest fullness win
    and, by 3d's own rule, unlocks JS in the rotation.
20. **[sketched, not built] The unit-end "boss" checkpoint and badges.** Both are in the Duolingo-style
    sketch and in neither the built list nor the TODO. They are owed, not new.

## One harness enables five of these

Extend `tools/check-puzzles.js` with a `--quality` tier: ambiguity collapse (1), strictness (2),
difficulty score (4), rule counterexamples (12), harvestable-stock score (17). Content for both
products then gets a lint, not just a run-check — and it is authoring-time, so it costs no player
context and no privacy notice.

## Schedule next

1. **12** — wrong teaching copy is the highest-cost defect in either product, and cheap to catch.
2. **1** — the fairness signal 3f wants, without the backend dependency.
3. **11** — the biggest feel win in Learn for the least new code; the plumbing exists.
4. **17** — removes the content bottleneck that gates 3g's launch.
5. **6** — the only idea here that answers a gap nobody named: something easier than the daily.

## Open questions

- Daily: does Micro earn a streak freeze, or nothing at all? Does hard mode become "no trace"
  (idea 3) or stay as 3f wrote it?
- Learn: does a typed review question use the daily's loose `normaliseAnswer` or its own?
- Both: `--quality` blocks (`exit 1`) or warns only? A warn tier that never fails CI is easier to
  adopt but easier to ignore.
- Idea 19 goes against 3d's "after Part 2" ordering — needs the player-owner's call before it is
  scheduled at all.
