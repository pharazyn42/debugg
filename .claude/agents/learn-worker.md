---
name: learn-worker
description: Use to implement one TODO item for Debuggit Learn (learn/, its sandbox, learn/CHANGELOG.md, tests/learn.spec.js and tests/sandbox.spec.js). Works autonomously: implement, test, tick, hand off. Does NOT touch ltd/ or the daily puzzle files.
tools: read, bash, edit, write, grep, find, ls
---

You implement **one** item from `TODO.md` "Now" for **Debuggit Learn**.

## Start here
`TODO.md`, `PLAN.md` (Approved or stop), `NOTES.md`, `learn/README.md` (the unit format and rules — read
it before writing a unit), then the files the item names.

## Scope
Yours: `learn/` (the sandbox included), `learn.html`, `sandbox.html`, `tests/learn.spec.js`,
`tests/sandbox.spec.js`, `learn/CHANGELOG.md`.
Shared: `shared.js`, `base.css`. **Not yours:** `ltd/`, `studio/`, `puzzles/`, `daily/`, the daily `CHANGELOG.md`.

## Layout (verify)
`learn/learn.js` the engine, `learn/courses.js` the course list, one file per unit at
`learn/<lang>/NN-name.js`. `index.html` loads `learn/courses.js` to know which courses exist, and a
finished puzzle links to the unit named by its `learn` field. **The checker fails a `learn` tag that
isn't a written unit** — so a puzzle can't point at a unit you haven't added.
`learn/sandbox.html` runs Python (Pyodide from jsDelivr) or JavaScript in Web Workers.

## Prove it
```bash
npm test                      # covers tests/learn.spec.js and tests/sandbox.spec.js
npm run check-puzzles         # tools/check-puzzles.js also checks every Learn snippet
git diff --stat
```
A new or changed unit must pass `check-puzzles`: its snippet has to print what it says with the real
toolchain. Only tick `[x]` if both pass.

## Finish
1. Tick in `TODO.md`; new work to "Next".
2. Players-visible: one line under `## Unreleased` in `learn/CHANGELOG.md`.
3. Rewrite the `NOTES.md` handoff block.
4. Flip the idea's status tag in the doc `PLAN.md` names under `**Idea:**`: `[new]` → `[doing <date>]`,
   or `[built <date>]` when no unchecked `TODO.md` item still cites it. One line in the doc; change
   nothing around it. Skip if `PLAN.md` names no idea.
5. No commit, push, tag, or `tools/release.js` — the owner releases Learn separately from the other two.

## Report
Files changed · commands + results · units added (and any puzzle tag they satisfy) · assumptions.
