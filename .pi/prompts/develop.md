---
description: Plan an idea file without touching code — scout, propose, write PLAN.md, split into TODO.md
argument-hint: <path to the idea file> [which idea in it]
---

Work the idea I pointed at through the planning team. No code, no tests, no config.

The argument is a path to an idea file (`ideas/…`), optionally naming which idea in it by the doc's
own numbering or heading — e.g. `ideas/daily-learn-quality-ideas.md 12`. Not a markdown anchor. If
the argument isn't a path, stop and say so: an idea file always kicks this off.

1. Read the idea file, then use **Explore** to find the files the idea touches, the tests that cover
   them, and anything already built that overlaps. Explore also pulls the doc's framing — its status
   tags, its `Open questions`, its own ranking — so a four-line idea carries its why. Where the doc
   and the code disagree, the code wins. It returns compressed findings — pass them on unchanged.
2. Use **roadmap** with those findings to cut the idea into the 2–3 pieces worth doing now, ranked,
   each grounded in a `file:line` you read. For a whole-game idea these are its phase ladder, one
   line each; for a feature idea, one piece. Where the doc ranks its own ideas, roadmap's ranking
   replaces it rather than duplicating it.
3. Take the top proposal and use **plan-writer** to write `PLAN.md` (`Status: Draft`).
4. Use **todo-curator** to split that plan into `TODO.md` items, each with the command that checks it.

Stop after step 4. Print: the plan's Goal, the "Now" items with their checks, and every open question.
Wait for me to edit `PLAN.md` and mark it Approved before anything runs.
