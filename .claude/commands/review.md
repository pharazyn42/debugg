---
description: Fresh-eyes review of the current diff against PLAN.md, before I commit
---

Review the uncommitted work. Change nothing.

1. `git diff --stat`, then read `PLAN.md` (Goal, Out of scope) and the `NOTES.md` handoff.
2. Run **verifier** and report its verdict verbatim.
3. Read only the diff hunks (not whole files) and list, each with `file:line`:
   - anything outside the plan's Goal (scope creep) or inside its Out of scope
   - a changed `debugg-*` key, state key or balance number with no source value or guard
   - a players-visible change with no `## Unreleased` line in that product's changelog
   - logic with no test touching it
4. End with one line: **ready to commit** or the single most important thing to fix first.

No style opinions, no refactors, no praise.
