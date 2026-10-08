# Plan: Phase 1 foundations — testable game logic

**Requirement(s):** roadmap item 1 (`ideas/roadmap.md` § "Phase 1 — Foundations" → "1. Tests")
**Status:** Draft — not approved

## Goal
The Ltd job engine can be tested without a browser, so a change to it can be proven before it ships to players.
Testable today: `npm run unit` passes, and every rule below has a named test.

## Approach
- **Extract, don't rewrite.** Move the pure functions out of `ltd/ltd.js` into `ltd/engine.js` (plain ES modules,
  no build step — the page and the tests both import it). Behaviour must not change; the Playwright suite is the guard.
- Targets to extract, in this order (each is one TODO item):
  `capacity()`/`structureProblem()` → `evaluateTeam()` → `resolveDueJobs()` → offer expiry → skill-rule qualification → promotion status.
- **Seeded RNG + injected clock** so tests can force a success, a failure, or a specific board offer.
  Today tests fake time by editing the save (`page.clock.setFixedTime`); unit tests get a real seam instead.
- **New runner:** `node --test` for the unit tests, so `npm test` (Playwright) and `npm run unit` stay separate
  and CI can run both.

## Out of scope
- Any new mechanic, balance change, or tuning number (item 10) — this plan changes no gameplay constant.
- Analytics, hosting, accounts (item 2b). The name/wordmark work (item 2c) is settled.
- Learn's lesson formats (3b) and the Embedded C track (3e).
- Releases: versions, changelogs, tags and the Release workflow are **done** — don't rework them.

## Risks / open questions
- `ltd/ltd.js` mixes DOM rendering with logic; a wrong cut drags UI in and makes the module browser-dependent.
  Check each extraction keeps `engine.js` free of `document`/`window`.
- Save shape must not change: `state` keys are live in players' browsers. Extraction is code-only.
- Does a unit test belong in CI's scope check (`tools/check-scope.js`)? `ltd/` files count as Ltd's, so
  `ltd/engine.js` and its tests are Ltd scope — confirm before the first PR.
- One product per branch still applies: this whole plan is an **Ltd** change, plus `package.json` and CI (shared).
