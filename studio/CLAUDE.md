# Contract Debugger

Context for continuing work on this game. This directory (`studio/`) is a
separate, self-contained project from the rest of this repo — `../index.html`
is "Debugg," an unrelated daily Wordle-style puzzle game. Don't conflate the
two or wire them together.

## What this is

An idle/incremental game where the core "active" mechanic is a Debugg-style
puzzle (read a short Python snippet, guess what it prints). Sitting behind
that is a studio-management idle layer: grow a tiered team of programmers
and staff real-time contracts that keep running while you're not looking.

Original design brainstorm: `../ideas/contract-debugger-concept.md`. That
doc is the source of the overall vision — read it for the *why* behind
mechanics that aren't built yet. This file is the *current state* of the
actual implementation, which has diverged/simplified from that doc in a few
places (noted below).

## Everything lives in one file

`studio/index.html` — a single self-contained HTML/CSS/JS file, no build
step, no dependencies except a Google Fonts `@import`. Open it directly in
a browser to play, or serve via GitHub Pages (already configured — pushes
to `main` deploy automatically to `https://pharazyn42.github.io/debugg/studio/`).

State persists in `localStorage` under the key `contract-debugger-state-v3`.
The boot sequence has a small guard that drops an old-shaped
`activeContract`; bump the key or add a similar guard if you change the
state shape again.

## Data model (as currently implemented)

```js
PUZZLES = [{ file, html, type, answer, hint }, ...]   // 6 puzzles, Director's desk only
CONTRACT_LENGTHS = [...]   // desk contracts: 1/3/5/8 puzzles, 1x/1.8x/3.2x/6x

LANGS   = ['Python', 'C/C++', 'JavaScript', 'Rust', 'Assembly']
DOMAINS = ['Web Dev', 'Games', 'Embedded/Controls', 'Safety-Critical', 'Data/AI']
PAIRINGS = { <lang>: [domains it can be paired with on a contract] }
BAR_XP = [10, 50, 150, 400, 1000]   // cumulative XP for skill bars 1..5

ROLES = { Director, Manager, Graduate, Junior, Senior, Principal }  // sloc, salary/min, cost, reliability
PROMOTION = { Junior: {minutes:60, lang:1, dom:1}, Senior: {8h, 3, 2}, Principal: {3 days, 5, 5} }  // contract time only
RETRY_TIME = 0.5, RETRY_PAYOUT = 0.75
TIERS = [ quick fix ~5 SLOC / 1 dev, sprint ~400 SLOC / 3-5 + senior,
          milestone ~2,700 SLOC / 5-10 + principal,
          full delivery ~22,500 SLOC / 10+ incl. manager, 2 principals, 3 seniors ]
// each tier: minutes + refSloc (reference time for the cheapest valid team);
// an offer's SLOC target = refSloc × minutes ± SLOC_SPREAD (15%)
```

**Top-level state:**
```js
state = {
  money, reputation, lastTick,
  roster: [ { id, name, role, since, worked, lang: {name: xp}, dom: {name: xp} } ],  // Director is roster[0]; worked = ms on contracts at current level
  board:  [ { id, tier, lang, dom, sloc, expiresAt } ],  // 2 offers per tier; sloc = work target
  jobs:   [ { id, tier, lang, dom, sloc, teamSloc, team: [ids], startedAt, endsAt, chance, payout, repeat,
              status: 'running'|'failed', attempt: 1|2 } ],
  log:    [ { kind: 'ok'|'bad'|'info', text } ],
  collapsedLevels: [],                            // roster tree groups folded in the UI
  activeContract: null | { lengthIndex, puzzleIdxs, index, puzzles: [{ attempts, status, clean, hintUsed }] }
}
```

## What's implemented

- **Director's desk**: the player's own puzzle contracts. Pick a length and
  work through the queue with full navigation: click any dot, or use
  Prev/Next. A puzzle that runs out of guesses locks as "exhausted"; when
  everything is solved, a "Deliver contract" button appears. The clean
  bonus applies to first-try solves with no hint. This is the main source
  of cash early on.
- **Start-up**: you begin as the Director alone, and you double as the
  manager. The Director gives one slot at every level, one principal slot,
  and room for `DIRECTOR_SPAN` (4) devs, so you can hire a grad straight
  away. Growing beyond that needs real managers.
- **Tiered structure** (`capacity()` / `structureProblem()`):
  - Each dev supervises up to 3 people of the level directly below.
  - Each manager adds one slot per level, 3 principal slots, and room for
    12 devs.
  - Managers produce no SLOC.
  - Hiring, promoting and "Let go" are all blocked if they would break the
    structure, and the UI says why.
- **Hires' starting skills**:
  - Grads: one language at 1 bar, no domains.
  - Juniors: at most 1 bar in up to 2 domains.
  - Seniors: a language at 3–4 and a domain at 2–3.
  - Principals: a language and a domain at 5.
- **Promotions** need three things, and the player confirms with a
  "Promote" button:
  - **Contract time at the current level**: 1 hour for Junior, 8 hours for
    Senior, 3 days for Principal. Only time spent on contracts counts;
    time on the bench doesn't. It's credited when each contract finishes
    (`p.worked`) and resets on promotion.
  - **Skill bars**: as listed in `PROMOTION`.
  - **A free slot** at the next level.
- **Contract board**: offers are tagged with a random language + domain,
  shown on the card. Staff them via the team picker, which ticks off the
  requirements and shows success chance, payout and salary cost. It has a
  "Suggest a team" button. Each person can only be on one contract at a
  time.
  - **Skill rule**: a dev "knows the stack" for a contract if they have at
    least one bar in its language or its domain (`qualifiedFor()`; managers
    are exempt).
    - Solo quick fixes need someone who knows the stack.
    - On team contracts, devs who don't can join as **learners**. They
      write no code and each costs the team `LEARNER_DRAG` (10%) of its
      output in mentoring time. There must be at least one dev who knows
      the stack per learner. Learners earn XP as normal on delivery. This
      is the only way to gain a first bar in a new language or domain.
    - The picker labels learners (and greys out non-learners on quick
      fixes), and "Suggest a team" only adds learners when short-handed.
    - A board card warns when nobody on staff knows the stack.
  - **Offer expiry**: untaken offers are replaced after `offerLife`
    minutes (3 / 15 / 45 / 120 by tier), so the board keeps turning over;
    an offer open in the picker is never swapped out.
  - **SLOC drives time**: each offer is a SLOC target, shown on the card.
    Duration is the target divided by the team's combined SLOC/min
    (managers add none), with a 5-second floor.

    Each dev's SLOC/min on a contract is boosted by skill match:
    × (1 + `SKILL_SPEED` × (lang bars + domain bars) / 10) for that
    contract's language and domain. A full 5+5 match doubles their output.

    The reference team, with no matching skills, takes the nominal time:
    - a lone grad on a quick fix: ~1 min;
    - senior + 2 grads on a sprint: ~10 min;
    - principal + 4 grads on a milestone: ~30 min;
    - 2 principals + 3 seniors + 4 grads + a manager on a full delivery:
      ~90 min.

    More senior, bigger or better-matched teams finish sooner. The picker
    shows each person's SLOC/min on that contract, plus the team total with
    the skill-match boost and the resulting time.
  - Payout = SLOC target × `LINE_RATE` × tier multiplier × skill match. So
    a contract pays the same whoever does it; faster teams simply earn more
    per minute and pay less salary per contract.
  - Success chance = average reliability by level, plus a small bonus for
    skill match.
  - On delivery, everyone on the team gains the tier's XP in that
    language and domain. XP is per minute spent on it (`xpPerMin`: 1 /
    1.2 / 1.33 / 1.5 by tier), independent of team speed, so skill bars
    build at roughly the pace of the contract-time promotion timers. This is the placeholder skill-gain
    mechanic; it doesn't yet model supervision.
  - **Retry on failure**: a failed contract can be retried once, in half
    the time, for 75% of the payout. If the retry fails, the contract is
    lost. Non-repeating jobs wait in a "failed" state, with the team held,
    until the player picks Retry or Drop. Repeating jobs retry
    automatically, since it's the better deal per minute.
- **Repeat**: a job can be set to roll straight into a new contract of the
  same type with the same team when it finishes. The new contract is chosen
  so the whole team qualifies under the skill rule. This is on by default for
  quick fixes. Repeats keep chaining while the page is closed, up to the
  4-hour offline cap, and stop if the team no longer meets the
  requirements.
- **Roster UI**: the Director card, then a collapsible tree grouped by
  level. Each group header shows its headcount, how many are busy, SLOC/min
  and salary/min. Collapse state persists. Clicking a card opens the
  employee panel: all languages and domains as pip bars with XP to the next
  bar, current assignment, and a promotion checklist.
- **Payroll** is drawn every second, including offline (capped at 4 hours).
  Cash can go negative.

## Known gaps — not wired in yet

- **Reputation does nothing** beyond being tracked. Planned: gate contract
  tiers behind reputation.
- **Skill gain is a placeholder**: flat XP per delivered contract, with no
  supervision/mentoring effect yet.
- **No training/certification spend, studio upgrades, or prestige.**
- **Puzzle bank is only 6 entries** (desk contracts only).
- **Balance is untuned**: the `ROLES` stats, `LINE_RATE`, tier multipliers,
  and hire costs are first guesses.

## Future development

Agreed direction, not built yet. Roughly in no particular order.

### Training for language and domain skills
- Add a way to spend money (and/or time off contracts) to train a person's
  language or domain skills directly, alongside the XP earned from
  delivered contracts.
- Open questions:
  - Is training a one-off purchase per bar, a timed course during which
    the person is unavailable for contracts, or both?
  - Should cost scale with the target bar?
  - Should there be a cap so training can't replace real contract
    experience (e.g. training only up to bar 3)?

### Business tiers and multiple sites
- Show a business-tier label that grows with headcount: Start-up →
  Small business → … → something massive (e.g. Multinational).
- Thresholds and names are TBD. The current Director-as-manager phase is
  the "Start-up" tier.
- Moving up a tier could unlock things: more contract-board slots, bigger
  contract types, new hire types.
- At larger tiers, add an option to expand to multiple sites (offices).
  Each site would plausibly have its own headcount capacity and managers,
  possibly a regional speciality (e.g. an embedded-heavy site). How sites
  interact with team staffing (can a team span sites?) is TBD.

### Daily desk contracts
- The puzzle contracts at the Director's desk should refresh once a day,
  with only one contract of each type (Quick Fix, Sprint, Milestone, Full
  Delivery) playable per day. The aim is to bring players back daily,
  like the main Debugg game.
- This needs:
  - a per-day seed so everyone gets the same puzzles that day;
  - tracking which types have been played today;
  - a "come back tomorrow" state;
  - a much bigger puzzle bank than 6.

### Success chance and speed scale with level and skill match
Replace the current flat reliability-by-level model:
- **Success chance** depends on both dev level and how well their skills
  suit the contract's language/domain. Reference point for a Graduate:
  - 25% when their skills don't match;
  - 50% base;
  - 75% when they do match.
- **Each level up** raises both the success chance and the delivery speed
  (a principal finishes faster and more reliably than a grad on the same
  job).
- **Speed**: done. Duration shrinks with dev level and with skill match,
  via effective SLOC/min (see "SLOC drives time" above).
- **Teams**: exact curves are TBD, as is how per-person chances combine for
  a team (average, weighted by SLOC, or weakest link).

### Show potential contract values on the desk
- The Director's desk contract picker should show what each contract could
  pay before you start it: e.g. the range from "all solved, none clean" to
  "all clean". Reputation gain could be shown the same way.

### Contract deadlines
- **Some contracts have a deadline:** a time limit to complete it once
  started, shown on the board card. This is separate from offer expiry,
  which is how long an offer waits to be accepted.
- **Not every contract has one.** Others have no time pressure, and any
  valid team can take as long as it needs. The mix is TBD: e.g. a share
  of offers per tier, more common on bigger contracts, or more common as
  reputation grows. Deadline contracts could pay a premium, so they're
  worth the tighter staffing.
- **Staffing becomes a real choice on deadline contracts.** Since
  duration = SLOC target ÷ team SLOC/min, you have to pick a team fast
  enough to finish in time. The team picker would show the estimate
  against the deadline, e.g. "takes 8:15 · deadline 10:00 ✓", or a red
  warning if it won't make it. That gives a reason to put more senior,
  bigger or better-matched people on a contract, beyond payout.
- **Deadlines vary by offer**, where there is one. Set them relative to
  the reference time, with a random tightness (e.g. 0.8×–1.5× of what the
  cheapest valid team would take). Some offers then need a
  stronger-than-minimum team; tight deadlines could pay a premium.
- **Missing the deadline**. Options to decide between:
  - the payout shrinks the later it is;
  - a flat late penalty;
  - a reputation hit;
  - the client cancels, so no payout.
- **Interactions to design:**
  - Retry: a failed contract retried in half the time may still blow the
    deadline. Does a retry get extra time, or is it only worth it if it
    fits?
  - Learners: their 10% drag now has a visible cost.
  - Repeat: a repeating team should only roll into contracts it can
    finish on time. Simplest: repeats only pick contracts without a
    deadline, or deadline ones that the team would meet.
  - Maintenance items (in-house products) already have deadlines, so both
    can use the same mechanic.

### In-house software products (later game)
- **Unlocks later in the game** (e.g. by business tier or reputation): the
  studio can develop and release its own software instead of only doing
  client contracts.
- **Building it is a big project.** It needs a full team (at least
  full-delivery sized) and a large amount of work, several full-delivery
  sized chunks of SLOC, before the first release. Possibly split into
  phases (prototype → beta → 1.0), each needing the team to deliver. That
  ties up a lot of staff for a long time, with no income from it until
  release.
- **Once released, it earns passive income** (sales or subscriptions),
  scaled by user count and user satisfaction.
- **It needs maintenance.** Now and then a released product raises work
  items, which appear on the contract board alongside client contracts:
  - bug fixes;
  - feature requests;
  - updates (e.g. a new platform or dependency version);
  - service/support requests.

  They're staffed like contracts (SLOC target, team requirements,
  language), but they don't pay. They cost salary and staff time, and
  they protect the product's income.
- **Maintenance items have a deadline.** If a bug or requested feature
  takes too long, the users get annoyed:
  - satisfaction drops;
  - income falls;
  - users leave;
  - reputation may take a hit.

  Fast fixes could give a small satisfaction boost. So products compete
  with client contracts for your team: neglect them and they decay.
- **Maintenance teams.** After release, you can assign a dedicated
  maintenance team to a product:
  - **It picks up work automatically.** Any maintenance item the product
    raises goes straight to the team, so the player doesn't staff each
    one.
  - **It's committed.** Its members join the product's core in-house team
    and can't be put on client contracts while assigned. It's a lasting
    trade-off, not a per-job choice.
  - **It can be a small "shell" team.** It can be much smaller than the
    original development team, as small as one person. The trade-off is
    speed: a small team works through items slowly (it's still
    SLOC-driven), so some may miss their deadline. A bigger team keeps
    users happier but ties up more staff.
  - Without a maintenance team, items appear on the contract board to
    staff by hand.
  - Open questions:
    - Does the team still need to meet each item's requirements (e.g. a
      senior for a bigger feature), or is a one-person team allowed to be
      slow at everything?
    - Do items queue for the team, or can it split to work several at
      once?
    - Can you add to or reassign the team freely, or is there a cost or
      lock-in period?
    - Do team members keep earning XP and contract time towards
      promotion?
- Design questions:
  - Is the product's language fixed at the start (so its maintenance
    always needs that language)?
  - Do satisfaction and user count recover over time?
  - Can a product be sunset or sold?
  - How many products can you run at once?
- Fits with: offer expiry (maintenance items are expiring offers with
  consequences), the business tiers, and the later domain unlock (a
  product could have a domain too).

### Semantic versioning and proper releases
- Adopt semantic versioning (MAJOR.MINOR.PATCH):
  - MAJOR: save-breaking or big design changes, i.e. whenever the storage
    key has to be bumped;
  - MINOR: new mechanics;
  - PATCH: fixes and balance tweaks.
- **Show the version in the game** (e.g. the footer) and store it in the
  save, so a save can be migrated deliberately rather than by ad-hoc
  shape guards.
- **Keep a `CHANGELOG.md`** with a section per release; the per-commit
  notes so far could seed it.
- **Cut releases with git tags and GitHub Releases** (e.g.
  `studio-v0.x.y`, prefixed because this repo also holds Debugg).
- **Separate "released" from "in progress".** Today every push to `main`
  deploys straight to GitHub Pages. Options:
  - deploy only on a tag or release, via a GitHub Actions Pages workflow
    instead of branch deploys;
  - or keep `main` as the released branch and do work on a `dev` branch.

### Tests
- There's no test suite; changes have been verified by driving the page
  by hand in a browser. Worth adding:
  - **Unit tests for the game logic.** This first needs the pure
    functions pulled out of `index.html`'s single `<script>` into a
    module the page and tests can both import (e.g. `studio/game.js`).
    That's plain ES modules, still no build step. Targets:
    - structure/capacity rules;
    - promotion status;
    - `evaluateTeam` (requirements, learners, SLOC/time, payout, chance);
    - `resolveDueJobs` (repeat, retry, offline chaining and cap);
    - skill-rule qualification;
    - offer expiry;
    - the desk puzzle answer checking.
  - **End-to-end tests with Playwright**: load the page, hire, staff a
    contract, fast-forward time by editing the save, and check the
    results. These replace the manual browser checks done so far.
  - **Deterministic randomness**: inject a seeded RNG (and a clock) so
    tests can force success/failure and specific offers.
- Run the tests in **GitHub Actions** on every push and PR, and require
  them to pass before a release is cut or deployed.
- Pairs naturally with the "shared idle engine" idea in
  `../ideas/bbq-idle-concept.md` — the same extraction serves both.

### Languages only for now; domains become a later-game unlock
- **Remove domain specialities from the early game.** Contracts, hires and
  skills use programming languages only. That means dropping the domain
  half of:
  - offers and the skill rule (`qualifiedFor()`);
  - skill-match speed and payout (`matchFit()`);
  - XP;
  - promotion requirements (`PROMOTION.dom`);
  - starting skills (`makeHire()`);
  - the employee panel.

  Promotion requirements then need re-stating in language bars only.
- **Quick fixes should cover every language**, so a lone dev always has
  something they can take. That avoids the deadlock where nobody on staff
  knows the language of either quick fix on the board. Offer expiry and
  repeat-picks-a-doable-contract currently paper over this. For example,
  keep one quick-fix offer per language on the board, or let the player
  pick the language when staffing a quick fix.
- **Domains come back later as an unlock**, further into the game (e.g.
  tied to reputation or a business tier):
  - Some team contracts (sprint and up) are then tagged with a domain.
  - Domain **specialists** are a separate kind of hire.
  - A contract with a domain must have a specialist in that domain on the
    team.
  - Open questions: do specialists write code too, are they promotable,
    and does domain experience grow on regular devs or only specialists?
- Save migration: existing saves have `dom` skill maps and domain-tagged
  offers/jobs. Either strip them or bump the storage key.

### Per-hire speed multiplier
- Each new hire rolls a random, permanent speed multiplier that scales
  their SLOC/min (e.g. 0.7×–1.3×, range TBD). It's stored on the person
  and never changes, including on promotion; it stacks with the level's
  base SLOC and the skill-match boost.
- The point is that a slow hire stays slow forever, which gives the
  player a real reason to let people go and rehire.
- It needs to be visible on the roster card and employee panel. Maybe
  also on hire, e.g. "fast / average / slow". That could suggest hiring
  shows a candidate before you pay.

### Show what makes up the success chance
- When staffing a contract (team picker), break the success chance down
  into its contributing factors instead of only the final %, e.g.:
  - each person's base reliability for their level;
  - the skill-match bonus;
  - any cap.

  This ties in with the planned level/skill success rework above.

### Current contract in the employee panel
- Clicking an employee should show the contract they're working on.
  Today the panel only has a one-line "On Sprint (Rust / Web Dev) — 4:12
  left". It should show the full contract:
  - type, language and domain;
  - teammates;
  - progress (SLOC done / target, time left);
  - success chance and payout;
  - repeat status;
  - the failed/retry state.

### Office space: desks, contractors, and buildings (later game)
- Another progression limiter. On-site staff need a desk. You start with
  one free room with a small number of desks (e.g. 4).
- **Contractors** work from home, so they need no desk, but cost more
  (higher salary and/or hire cost). They're a way past the desk cap
  before you can afford space.
- Over time you rent offices, buy rooms, then whole buildings, each adding
  desks. This fits with the business tiers and multiple sites in the
  section above; sites could be where buildings live.
- Open questions:
  - Do contractors count towards the supervision structure and manager
    span?
  - Can they be promoted?
  - Do they gain XP at the same rate?

### Visualise the team and the office
- Some visual representation of the studio: people at desks in
  rooms/buildings, grouped by team or level. It could show who's working
  on what and empty desks. It would pair naturally with the office-space
  mechanic.

### SLOC production animation
- Animate SLOC being produced, e.g. a running counter or lines of code
  ticking up on active contracts, or little bursts from each busy
  person, so the idle layer feels alive rather than just progress bars.

### Total SLOC/min in the top stats bar
- Add a studio-wide SLOC/min stat next to Cash, Reputation, Payroll and
  Headcount. Open question: count only people currently on contracts,
  or show "active / potential"?

## Testing notes

There's no test suite. When changing game logic, the fastest way to verify
correctness is a headless Playwright script driving the page directly
(`file://.../studio/index.html`) and asserting on DOM state/text — that's
how the puzzle-navigation and roster-tree features were verified during
development. Chromium is available; no `playwright install` needed if the
environment already has it configured.
