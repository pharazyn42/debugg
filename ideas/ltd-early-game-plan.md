# Debuggit Ltd: everyday work, and contracts as events

A plan for reworking how a Debuggit Ltd company earns its money in the start-up, from the
player-owner's brief (October 2026). Read `ltd/CLAUDE.md` first for how the studio works now. Every
number is a placeholder for the balance pass (item 10) and `npm run sim`.

**Status:** agreed with the player-owner and built (October 2026). Decided at the go-ahead:
hotfixes stay the intern's alone, even with managers (no team hotfixes). Numbers are still
placeholders for the balance pass.

## The brief

1. Everyone earns a **base SLOC/min of everyday work** for the company, varying a little per
   person within their level's band. At their desks it shows as support tickets, bug fixes and the
   like. Decided: it pays from their SLOC/min, about **1.3–1.4× salary** on average.
2. **Contracts are rarer and more active**: no repeats and no retries, at least until there are
   managers. Decided: before managers, **a few offers at a time, each open for a while**.
3. Contracts **boost cash significantly**, but people on one earn **no everyday work** meanwhile.
4. The **first contract is a big deal**.
5. The team is junior, so **the Director helps and unblocks**. Decided: a stuck contract **runs at
   half speed** until the Director helps (not a stall).
6. **No contracts until the spare room is full**; until then, desk jobs pay cash and reputation.
   Decided: **the intern's hotfixes with the Director stay**, as the thing to do before contracts.

## Everyday work (replaces odd jobs)

- Each developer gets a **pace** when hired, between 0.9 and 1.1 (`p.pace`; older staff get one on
  load). Their everyday SLOC/min is their level's SLOC/min × pace, whatever their skills.
- It pays **`EVERYDAY_RATE` ¤0.54 per SLOC**. Every level's salary is about ¤0.40 per SLOC/min, so
  that's **1.35× salary on average** (1.22× to 1.49× by pace):

  | Level | SLOC/min | Salary | Everyday work (pace 0.9–1.1) |
  |---|---|---|---|
  | Graduate | 5 | ¤2/min | ¤2.40–¤2.97/min |
  | Junior | 12 | ¤5/min | ¤5.83–¤7.13/min |
  | Senior | 30 | ¤12/min | ¤14.58–¤17.82/min |
  | Principal | 70 | ¤28/min | ¤34.02–¤41.58/min |

- Who earns it: developers not on a contract and not away. Managers write no code, so none; the
  Director takes desk jobs instead; the intern earns their tiny share (0.2 SLOC/min) when not on a
  hotfix. No XP or promotion time, as with odd jobs. It's paid every second with payroll, offline
  too, not while paused. A pay rise eats into it (a kept grad on +¤0.5/min is barely ahead).
- **In the office**: a monitor shows a queue of small tickets ("#1042 · support", "bug fix",
  "hotfix"), one ticking off now and then. Roster cards read "Everyday work · support tickets ·
  +¤2.7/min" where they read "On the bench · odd jobs" today.

## Contracts in the start-up

- **None until the spare room is full**: you and 3 staff (`state.contractsOpen`, set once and kept,
  so a resignation doesn't take the board away). Until then the board says so ("Contracts start
  coming once your spare room is full: 2 of 4 desks"), and shows only **the intern's hotfixes**,
  which work as they do now (you and the intern, stuck until you help, always delivered).
- **A new contract type for a small team, the "feature"**: 1–3 developers, any level, a SLOC target
  of about 600 (about an hour for two grads; half an hour for three grads at Lv 1), paying ×1.5 per
  SLOC: about ¤900, against the ¤8/min those three grads earn on everyday work (about ¤270 in the
  same half hour). Learners allowed, as on team contracts now.
- **The board before managers**: up to 3 feature offers, a new one every 1–3 hours, each open for
  6 hours (`offerLife`). No hotfixes for the team; they come back with managers.
- **No repeats and no retries** before managers: Repeat isn't offered, and a failed contract is
  lost (with the usual reputation cost).
- **The first contract**: the first offer once the spare room is full is **"Your first client"**:
  a feature for the whole team (3 developers), paying double (about ¤1,800), announced in the log
  and a toast, and always with sticking points for you to help with.
- **The Director helps** (`job.slow`): a start-up contract can get stuck up to 3 times (each point
  40%), and a stuck one runs at **half speed** until you answer a puzzle in its language (Help, as
  with the intern). Right: it jumps 25% ahead and the help pays like a desk question, plus
  reputation. Wrong: it loses 25% of its progress. Ignored, it just finishes later. Only languages
  with puzzles (Python for now) get stuck.

## With managers (small business and up)

As now: managers put idle developers on contracts, Repeat and Retry come back, and contracts don't
get stuck. The board always has 3 features. Hotfixes stay the intern's (decided).

## What else changes

- **The guide**: the intern's hotfix and helping them; a desk job; hiring graduates until the
  spare room is full; your first client, and helping when they're stuck.
- **The simulator** (`tools/sim-ltd.js`): the player takes desk jobs, fills the spare room, and
  staffs features as they come; then re-check `ideas/ltd-pacing-targets.md`.
- **Saves**: a running company with 4 or more on staff has `contractsOpen`; its running hotfixes
  finish, and repeats stop until it has a manager. Old staff get a pace.
- **The office view**: tickets on everyday monitors; a stuck contract's monitor shows the "?" with
  the work carrying on slowly.

## Open questions

- The feature's numbers (size, pay ×1.5, offers every 1–3 hours) are a first guess for the sim.
- First sim run (keen, 3 seeds): contracts open on day 3, the first client is taken within
  hours, and income takes off with the first manager (day 4). Reputation now builds far slower
  (no stream of hotfixes), so seniors apply later; check against `ideas/ltd-pacing-targets.md`.
