# Debuggit Ltd: pacing targets

> **Status: a sketch to agree with the player-owner**, for the balance pass (roadmap item 10).
> Targets say how the game should *feel* over time; the constants in `ltd/ltd.js` are then tuned
> to hit them. Written so the same targets can later be pointed at the BBQ game
> (`ideas/bbq-idle-concept.md`) with its own constants.
>
> The "today" numbers below are worked out by hand from the constants in `ltd/ltd.js`
> (September 2026), not simulated or measured. A simulator (see the end) should replace them.

## 1. Two kinds of player

The offline cap (4 hours) means a company only moves while the page is open, or for up to 4 hours
after it was last open. So "a day" in the game depends on how often someone checks in. Targets
are set for two profiles:

| Profile | Checks in | Game time per real day |
|---|---|---|
| **Keen** | Every 2–4 hours while awake, plus sessions with the page open | ~16 h |
| **Casual** | Morning and evening | ~8 h |

A **Keen** player should never feel held back by the cap, and a **Casual** player should never
feel punished by it: coming back after a night should always show progress worth looking at.

## 2. Principles

1. **There's always a next goal within reach.** At any point, the next thing worth buying costs
   **2–6 hours of current net income**. Less and money means nothing; more and the game stalls.
2. **Each tier pays back more slowly than the one below.** A hire earns back its price in about
   **1 hour (grad), 2 hours (junior), 4 hours (senior), 8 hours (principal)** of contract work.
   That's the classic idle curve: growth is fast early and slows as you climb, so the gates
   (applicants, structure, desks) aren't the only brake.
3. **Growing your own is the cheap route, hiring the quick one** (already decided). A home-grown
   senior should arrive **days** after a hired one could, and save roughly their hire price.
4. **The desk matters most early.** In a start-up, desk jobs earn about **one grad's net**; by a
   large company, pocket money (already decided through the stage cut).
5. **Failure is felt but rare.** Standard contracts succeed **70–95%** of the time. Debt should
   be **recoverable within a session** unless the player ignores it.
6. **Coming back is always good news.** After a Casual player's night (4 hours simulated), net
   cash should be up, never down, for a company that was staffed when they left.

## 3. Milestones

When each should happen, in real time, for each profile. Demo milestones are marked; the rest are
for v0.1 onwards.

| Milestone | Keen | Casual | Today (est.) |
|---|---|---|---|
| First grad hired, hotfix on repeat (demo) | 5 min | 5 min | ✓ |
| Grad has paid for themselves (demo) | ~1 h | ~1 h | ~70 min ✓ |
| Director's span full: 4 devs (demo) | Session 1–2 | Day 1 | Probably day 1 ✓ |
| First junior hired from an applicant (demo) | ~3 h | Day 1 | ~3 h ✓ |
| First manager: **Small business** (demo) | Day 1 | Day 2 | Probably day 1 |
| First home-grown junior (12 h contract time) (demo) | Day 1 | Day 2 | ✓ (by the timer) |
| More than 10 staff: **patches** open (demo) | Day 2 | Day 3–4 | ? |
| First senior applicant (500 rep) | Day 1–2 | Day 3 | **~6 h** with 4 grads: early |
| First home-grown senior (+3 days contract time) | Day 5–6 | Day 10–11 | ✓ (by the timer) |
| **Mid-size**: 3 managers, 25 staff | Week 2 | Week 3–4 | ? |
| First principal applicant (3,000 rep) | Week 1–2 | Week 3 | ? |
| First minor release | Week 2 | Week 3–4 | ? |
| First home-grown principal (+14 days) | Week 3–4 | Week 6–7 | ✓ (by the timer) |
| **Large**: 6 managers, 60 staff | Month 1–2 | Month 2–3 | ? |
| First major release | Month 1 | Month 2 | ? |
| **Multinational**: 12 managers, 150 staff | Month 3+ | Month 5+ | ? |

"?" means it can't be worked out by hand; that's what the simulator is for.

## 4. Economy ratios

### 4.1 What each person earns

A dev's net per minute on the contracts they'd normally take, with retries (a failed contract
retried in half the time for 75%), at the market's founding prices. Worked out from `ROLES`,
`TIERS` and the skill speed and chance rules:

| Role, typical skill, contract | Gross ¤/min | Salary | Net ¤/min | Net ¤/h | Hire | Payback | Target payback |
|---|---|---|---|---|---|---|---|
| Grad, Lv 1, hotfix | ~4.5 | 2 | ~2.5 | ~150 | 180 | ~1.2 h | ~1 h ✓ |
| Junior, Lv 2, hotfix | ~14 | 5 | ~9 | ~560 | 750 | ~1.4 h | ~2 h: a bit quick |
| Senior, Lv 5, hotfix | ~58 | 12 | ~46 | ~2,700 | 3,000 | **~1.1 h** | ~4 h: **too quick** |
| Principal, Lv 8, hotfix | ~57 | 28 | ~29 | ~1,750 | 12,000 | ~6.9 h | ~8 h ✓ |

Findings:
- **Seniors pay back almost as fast as grads.** With senior applicants from 500 reputation
  (about 6 hours of a 4-grad team), a lucky early senior roughly quadruples the company's income
  on day 1. Either raise the senior's price (≈ ¤8,000–10,000), lower their SLOC, or raise the
  reputation they need.
- **Hotfixes cap everyone at about 60 SLOC/min**, because of the 5-second floor (`MIN_JOB_MS`):
  a principal writing 150 SLOC/min still delivers 5 SLOC every 5 seconds. That's fine (it pushes
  principals onto team contracts), but in the demo, which only has hotfixes and patches, a
  principal is poor value. Worth a line in the picker ("wasted on hotfixes").
- **Team contracts** (patches and up) need the simulator: their pay depends on the team mix.
  Target: a patch team earns **at least 1.3×** what the same people would on hotfixes, or
  there's no reason to form one beyond the reputation.

### 4.2 Costs that aren't people

| Sink | Today | Target |
|---|---|---|
| A manager (¤900 + ¤8/min) | ~¤480/h, about 40% of a demo team's net | Pays back within **a day** through what the extra staff earn |
| A co-working desk (¤1/min) | ¤60/h: 40% of a grad's net | ≤ 25% of the net of whoever sits at it (✓ for a junior and up) |
| The hiring market | +2–4% every 12–36 h (roughly +5–15% a week) | Prices roughly **double over two months**, so late hires feel dear but not absurd |
| A raise to keep someone | 15–35% of their salary | Cheaper than hiring a replacement at today's price, most of the time |

### 4.3 The desk

- **Today:** a job every ~67 minutes, ~1.7 questions, about ¤60 a right answer → roughly **¤75
  an hour** for a player who answers everything: about **half** a grad's net.
- **Target:** about **one grad's net** (¤150/h) in a start-up, so the Director's work is the
  best "employee" for the first few hours. Options: `DESK_EVERY_MIN` [30, 60] or `DESK_PAY` ×1.5.
- **Casual players** can only hold 3 jobs (open 4 hours each), so they'll see less. That's fine:
  the desk is the active layer's reward.

## 5. Reputation

- **Today:** a grad on hotfixes earns about **20 reputation an hour** (0.5 per delivery), so a
  4-grad team reaches senior applicants (500) in ~6 hours and principal applicants (3,000) in
  ~1.5 days of game time.
- **Target:** senior applicants on **day 1–2 (Keen)**, principal applicants in **week 1–2**:
  after the first manager, roughly as the home-grown timers would get there. That's about **3×
  slower** than today: hotfix reputation 0.5 → ~0.15, or the applicant thresholds ×3.
- Risky and high-stakes failures cost 2× and 4× reputation; target: a player taking only
  high-stakes offers **loses** reputation over a day, and one taking only risky ones roughly
  breaks even.

## 6. Checks on the curve

A healthy idle curve, stated so a simulator can test it:

- **Net income per hour grows about 3–5× a week** in the first month (Keen), then slows to
  about 1.5–2× a week. Never flat for more than 2 days of play.
- **Cash never sits unspent** for more than ~6 hours of income for want of something to buy
  (principle 1). If it does, a money sink is missing; if the next goal is always > 6 hours away,
  a cost is too high.
- **Each business stage takes about twice as long as the last** to reach.
- **A Casual player reaches every milestone** at about half the Keen pace (by game time, it's the
  same game), not slower.
- **Nothing can be broken by one lucky roll**, e.g. an early senior applicant or a high-stakes
  run of successes shouldn't skip a stage.

## 7. How to use this

1. **Agree the targets** (the milestone table and the principles are the bits to argue over).
2. **Run the simulator** (built, see §8): `npm run sim -- --profile casual --days 14`.
3. **Tune the constants** until the table matches, re-running it with every balance change.
   Try a change first on a copy of the game (`--ltd my-copy.js`). Later, a CI job could fail a PR
   that moves a demo milestone by more than, say, 25%.
4. **Check against real players**: GoatCounter's `ltd/founded`, `ltd/hired/…`, `ltd/stage/…`
   and `ltd/paused` events give the real milestone times. Where players differ from the
   simulator, trust the players and fix the strategy.

For the BBQ game, sections 1–3 and 6 carry over as they are; section 4's numbers are re-derived
from its own constants (fixed cook times, meat costs), and it gets targets of its own for cash
flow (a big booking should never be unaffordable for more than a few hours once it's worth
taking).

## 8. The simulator, and its first results

`tools/sim-ltd.js` (`npm run sim`) plays the **real game**, not a model of it. Every check-in
"opens the page": a fresh VM runs `shared.js` and `ltd/ltd.js` unchanged against a stand-in page,
a fake clock and a seeded random number generator, and resumes the save, so time away is caught
up exactly as it is for players. While the page is open it runs the game's own tick once a game
minute, and a simple player clicks the game's own buttons. The player: answers desk jobs (80%
right), keeps anyone who hands in their notice, retries failures, promotes whoever's ready, hires
applicants and then grads while keeping half an hour's payroll in hand, hires a manager when the
developers are at the span limit, rents a co-working desk when needed, and (in a start-up) puts
idle developers on standard hotfixes on repeat. Options: `--profile keen|casual|always`,
`--days`, `--seeds`, `--full` (the whole game, not the demo), `--hit`, `--xp`, `--step`, `--ltd`,
`--json`. Per seed, a simulated week takes well under a second for casual, a few seconds for keen
and about half a minute for always (`--step 5` speeds that up).

It doesn't yet replace roadmap item 1's engine extraction and unit tests; it would run on
`ltd/engine.js` just as well once that exists.

### First results (September 2026, 3 seeds each)

The keen column is a `--full` run, which plays like the demo while the desks cap the company (below).

| | Keen, 14 days | Casual, 14 days | Casual, offline fix (below) |
|---|---|---|---|
| First grad | 2.5 h | 10.5 h | 10.5 h |
| Small business | day 1, 7pm | **never** | day 3 |
| More than 10 staff | day 1–2 | never | day 3 |
| First patch | day 4–5 | never | never |
| Staff on day 14 | 13 (the most desks allow) | **2** | 13 |
| Cash on day 14 | ~¤1,300,000 | **−¤4,600** | ~¤300,000 |
| Reputation on day 14 | ~65,000 | 135 | ~46,000 |

What it found:

1. **A game bug: repeats die when the page is closed for more than 4 hours.** Offline catch-up
   charges 4 hours of payroll, but a repeating contract only restarts if it finished within the
   last 4 hours (`resolveDueJobs`), so after a longer absence the chain stops a minute after the
   page closed. A grad left overnight costs about ¤480 and earns nothing. A **casual** player goes
   backwards every night and never gets past one grad; keen players lose a night's payroll every
   day. Starting the chain again at the start of the capped window (the "offline fix" column)
   makes casual players reach Small business on day 3. **Fix this before any balancing** (an Ltd
   PR of its own).
2. **The first grad isn't affordable at founding.** ¤150 start cash against a ¤180 grad (costs
   went ×3 in the first balance pass; start cash didn't), so a new player without puzzle XP can't
   follow the guide's first step until they've done a desk job. Start cash ¤250?
3. **Desks cap the company at 13, and cash then piles up.** 4 spare-room desks plus 8 co-working
   desks is 12 staff and the Director, reached on day 2 by keen players. After that there's
   nothing to buy: ¤1.3 million by day 14, in the demo and the full game alike. Mid-size (25
   staff) can't be reached until business units exist (phase 2 of item 15e). Principle 1 fails
   from day 2.
4. **Reputation builds about 10–20× faster than §5's targets.** Every delivered hotfix gives 0.5,
   and a small business delivers thousands a day: ~5,000 by day 2 (keen), 65,000 by day 14. The
   applicant thresholds (500 seniors, 3,000 principals) stop meaning anything on day 1–2, and a
   principal can be hired before any senior.
5. **Managers never form patch teams from people on repeating hotfixes.** `managersStaff()` only
   staffs developers who are idle, and a repeat never ends, so a patch only starts when a newly
   hired senior happens to arrive while two others are free. Casual players never saw one.
   Managers (or the player) need a reason and a way to take people off hotfixes for bigger work.

## Open questions

- Are the two profiles right, or is there a third, **weekly**, player worth designing for? (With
  a 4-hour cap, a weekly player barely moves; maybe that's fine.)
- Should the offline cap grow as the company grows (an upgrade, or with a manager), so late-game
  Casual players aren't twice as far behind in absolute terms?
- Is the principal's slow payback on hotfixes intended, or should the demo, with no minor
  releases, not offer principals at all?
- Is a month to a Large company the right length for v0.1, or should the whole curve be shorter
  so a player sees Multinational within their first month?
