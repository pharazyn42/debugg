# Contract Debugger — idle game concept

> **Status: original brainstorm; a playable version now lives in `studio/`.**
> Direction has since changed: Debugg and Contract Debugger are to become
> one game on one site. It opens as the puzzle game (four release-tier
> puzzles), with an option to turn on the studio game around it. See `studio/CLAUDE.md` (roadmap items 3b and 3c) for the current
> plan; this doc is kept for the original reasoning.

An idle/incremental game built around a Debugg-style puzzle as the core
"active" mechanic, wrapped in a software-studio management/idle layer.

## 1. The contract structure (manual play)

A **contract** is a queue of Debugg-style puzzles, not a single one. Length
is a player choice and the main risk/reward lever:

| Length | Puzzles | Payout multiplier | Feel |
|---|---|---|---|
| Quick fix | 1 | 1.0x | safe, low reward |
| Sprint | 3 | 1.8x | |
| Milestone | 5 | 3.2x | |
| Full delivery | 8 | 6x | high risk |

- **All-or-nothing delivery**: every puzzle in the queue must be solved
  within its 4 guesses. Fail one and the contract fails — a small "partial
  delivery" consolation payout (~20% of base, no multiplier) plus a
  reputation ding, so a bad run isn't a total waste but is clearly worse
  than not attempting it.
- **Clean commit bonus**: solving a puzzle on guess 1 (or under a time
  threshold, e.g. 15s) flags it "clean." The contract's payout bonus scales
  with the fraction of puzzles solved clean — e.g. 100% clean = +50% on top
  of the length multiplier, tapering down. Rewards genuine skill/speed on
  top of just clearing the queue.
- **Hints still don't cost a guess**, but using a hint on a puzzle
  disqualifies that puzzle from counting toward "clean."

This is the "hero" loop — the thing the player is actively playing, and by
far the highest ¤/minute in the game if they're good at it.

## 2. The idle layer — the studio

While the player plays contracts, a roster of hired programmers works
**background contracts** automatically, in real time.

**Programmer model**
- **Level**: Graduate → Junior → Senior → Principal. Levels up
  automatically via accumulated XP (SLOC delivered), or can be rushed with
  a training-cost payment.
- **Skills**, two axes, each independently levelled 1–5:
  - **Language**: Python, C/C++, JavaScript, Rust, Assembly, SQL…
  - **Domain**: Web Dev, Games, Embedded/Controls, Safety-Critical,
    Data/AI, DevOps…
- **Output**: base SLOC/min scaled by level, multiplied further by how well
  their language+domain skills match the contract they're assigned to (a
  Principal embedded/C specialist crushes a controls contract, but is
  mediocre on a random web-dev job).
- **Upkeep**: salary drawn per minute — net idle income = production
  revenue − salaries, so overhiring badly-matched staff can be a net loss.

**Background contracts** resolve automatically: SLOC/min accumulates
against a target, and on completion pays out based on the team's average
skill match and level, with a **quality roll** — lower-level staff have a
chance of "shipping a bug," shrinking the payout or triggering rework. A
thematic echo of the core puzzle game without needing the player to
hand-solve idle puzzles at scale.

## 3. Progression & spend

Money buys, roughly in unlock order:
1. **More hires** — graduates are cheap, plentiful, low output
2. **Training** — level up existing staff faster than passive XP
3. **Certifications** — teach a programmer a second language or domain skill
4. **Studio upgrades** — more concurrent background-contract slots
5. **Tools** — passive quality-of-life, e.g. an auto-linter that shaves the
   idle "shipped a bug" chance, or a charge of free instant-hint for manual
   puzzles

Reputation (earned mainly from manual contracts, a little from idle ones)
gates which contract tiers appear on the board — so the player's personal
skill at the puzzle game directly unlocks the ceiling for the whole studio.

**Prestige**: "Acquisition" — cash out the studio for a permanent
multiplier and pick a specialization bonus for the next run (e.g. "Embedded
shop": controls/safety contracts pay more, but web/games pay less).

## 4. Skill/domain matrix (placeholder — TBD)

Just to make the shape concrete:

|  | Web Dev | Games | Embedded/Controls | Safety-Critical | Data/AI |
|---|---|---|---|---|---|
| Python | ● | ● | | | ● |
| C/C++ | | ● | ● | ● | |
| JavaScript | ● | ● | | | |
| Rust | ● | ● | ● | ● | |
| Assembly | | | ● | ● | |

Contracts get tagged with one language + one (sometimes two, for
"full-stack" contracts) domain; a programmer's payout multiplier on that
contract is a function of their level in both matching skills.

## 5. Screen layout sketch

- **Left panel — "Today's Contract"**: the puzzle queue being actively
  played, tile tracker per puzzle, running clean-streak indicator, live
  payout preview.
- **Right panel — "Studio"**: roster list (avatar, level, skills, current
  assignment, SLOC/min ticking up), money/reputation counters, contract
  board for background jobs, hire/train/certify buttons.

## Open questions / next steps

- Final skill list and how many domains/languages launch v1 with.
- Exact SLOC/min and cost curves per level (needs a balance pass).
- Whether background-contract completions ever need light player input, or
  stay fully passive.
- Whether this becomes its own repo or a page within this one once it's
  further along — for now it's a design note only.
