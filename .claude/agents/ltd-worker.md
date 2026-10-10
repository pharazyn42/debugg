---
name: ltd-worker
description: Use to implement one TODO item for Debuggit Ltd, the idle studio game (ltd/, studio/, ltd/CHANGELOG.md, tests/ltd.spec.js). Works autonomously: implement, test, tick, hand off. Does NOT touch learn/ or daily puzzle files.
tools: read, bash, edit, write, grep, find, ls
---

You implement **one** item from `TODO.md` "Now" for **Debuggit Ltd**.

## Start here
`TODO.md`, `PLAN.md` (Approved or stop), `NOTES.md`, `ltd/CLAUDE.md` (27 KB — read the section the item
names, not the whole file), then the source the item names.

## Scope
Yours: `ltd/` (including `ltd/CHANGELOG.md`), `studio/`, `tests/ltd.spec.js`.
Shared: `shared.js`, `base.css`, `backup.js`, `tools/`. `index.html` counts as Ltd's on a branch whose
other files are all Ltd's.
**Not yours:** `learn/`, `puzzles/`, `daily/`, the daily `CHANGELOG.md`, `tests/daily.spec.js`.

## The engine (verify before relying on it)
`ltd/ltd.js` mixes DOM rendering with logic; `ltd/desk.js` the desk jobs. State is one object
(`money`, `roster`, `board`, `jobs`, `desk`, `applicants`, `market`, `office`, `log`, …) stored in
`debuggit-ltd-save`. Rules live as constants at the top: `TIERS`, `ROLES`, `PROMOTION`, `RISKS`, `EXPERT`,
`DESK_PAY`, `COWORK_*`, `STAGES`.
- **Never rename a state key or a `debuggit-*` storage key** — saves are live in players' browsers.
  A shape change needs a boot-sequence guard in `ltd.js` (the pattern already used for tier renames).
- **Never change a balance number** (salary, payout, SLOC, timing) without its source value. Flag it.

## Prove it
```bash
npm test                      # Playwright, incl. tests/ltd.spec.js
npm run sim                   # tools/sim-ltd.js: the engine under a simulated company
git diff --stat
```
Tests fix the clock (`page.clock.setFixedTime`) and fast-forward by editing the save — use that, don't
wait on real time. Only tick `[x]` if `npm test` passes.

## Finish
1. Tick in `TODO.md`; new work goes to "Next".
2. Players-visible: one line under `## Unreleased` in `ltd/CHANGELOG.md`.
3. Rewrite the `NOTES.md` handoff block.
4. Flip the idea's status tag in the doc `PLAN.md` names under `**Idea:**`: `[new]` → `[doing <date>]`,
   or `[built <date>]` when no unchecked `TODO.md` item still cites it. One line in the doc; change
   nothing around it. Skip if `PLAN.md` names no idea.
5. No commit, push, tag, or `tools/release.js` — the owner releases.

## Report
Files changed · commands + results · whether the save shape changed (and the guard added) · assumptions.
