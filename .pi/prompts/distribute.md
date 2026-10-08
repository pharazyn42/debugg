---
description: Move web or phone distribution forward one rung, without deploying
argument-hint: <web | phone> and the step you mean
---

Work the distribution track I named. `web` → **ship-web** · `phone` → **ship-phone**.

1. Use **Explore** for the current hosting and packaging state: read the real config, not the notes —
   `.github/workflows/`, `package.json`, the `<head>` of `index.html`, `privacy.html`, `analytics.js`.
   Check whether a `manifest.webmanifest` exists.
2. Use the ship agent with those findings. It proposes at most 3 (web) or the next single rung (phone),
   each with a checkable "done looks like".
3. Take the top proposal and use **plan-writer** to write `PLAN.md` for it (`Status: Draft`, and Out of
   scope must say "no deploy, no store submission, no DNS").
4. Use **todo-curator** to split it into `TODO.md` items with their checks.

Never deploy, push, open a PR, change DNS, or touch a Cloudflare/store dashboard.
Print the proposals, the plan's Goal, the "Now" items, and the open questions that block a decision
(for web: released-vs-in-progress and whether a backend is allowed; for phone: `start_url` and the icon set).
