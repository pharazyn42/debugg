---
description: Do the next TODO item autonomously — pick the product worker, implement, verify
argument-hint: [product: daily | ltd | learn]
---

Work on the current project. Read `TODO.md`, `PLAN.md` and `NOTES.md` first.

If `PLAN.md` is Draft, stop and say so — the owner approves plans.

Otherwise take the first unchecked item under "Now" and pick the worker by the files it touches:
`ltd/` or `studio/` → **ltd-worker** · `learn/` or the sandbox → **learn-worker** ·
`index.html`, `daily/`, `puzzles/` → **daily-worker**. If the item is shared (`shared.js`, `base.css`,
CI), use the worker whose product the change serves, and say which.

Run that worker on exactly one item. Then run **verifier** on the result and report its verdict
verbatim. If the verdict is red, leave the item unchecked and fix only what the verdict named, once.

Finish by printing: files changed, the verdict, the `NOTES.md` handoff as it now reads, and
`git diff --stat`. Do not commit, push, tag, or release.

Arguments: $ARGUMENTS
