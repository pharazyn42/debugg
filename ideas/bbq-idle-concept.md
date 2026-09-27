# Low & Slow — BBQ restaurant idle game concept

> **Status: idea, not started.** A separate concept from both Debugg and
> Contract Debugger. It grew out of the Contract Debugger work because a
> lot of its engine (timed jobs, staff with skills, repeat, offline
> progress, promotions) would carry over. The working title is a
> placeholder. Nothing here should be wired into this repo's games.

An idle/incremental game about growing a smokehouse from one backyard pit
to a BBQ empire. The pitch: real low-and-slow cook times are already
idle-game timers. You put a brisket on before bed and pull it in the
morning.

## 1. Why BBQ fits the idle genre

- **Cook times are natural long timers.** They sit on the same scale as
  Contract Debugger's contract tiers:

  | Cut | Cook time |
  |---|---|
  | Wings | ~1h |
  | Chicken | ~2–3h |
  | Ribs | ~5–6h |
  | Pork shoulder | ~8–12h |
  | Brisket | ~10–14h |

- **There's a built-in skill ceiling.** Temperature, smoke, the stall,
  wrapping and resting are real decisions with real trade-offs. That gives
  the active layer depth without needing trivia.
- **Growth is easy to picture.** Backyard pit → food truck → one
  restaurant → multiple sites → a franchise or competition circuit. That
  maps onto the business tiers planned for Contract Debugger.

## 2. The active mechanic: running the pit

The player's hands-on loop replaces Debugg's code puzzles. It should be
short, skill-based and optional: the idle layer works without it, but a
good pitmaster earns much more.

- **Hold the temperature.** The pit drifts. You add fuel, open or close
  vents, and fight weather events (wind, rain, a cold snap) to keep it in
  the target band (e.g. 107–135°C). Time in the band raises cook quality.
- **The stall.** Partway through big cuts, internal temperature plateaus.
  You choose between:
  - waiting it out: better bark, costs time;
  - wrapping in paper or foil: faster, softer bark.

  The right call depends on the cut and what the customers want.
- **Pull and rest.** Pull too early and it's tough; too late and it dries
  out. Resting improves quality but holds up a pit slot.
- **Quality score** per cook (e.g. 1–5 stars), like Debugg's "clean"
  bonus. It drives price, reputation and competition results.

Possible shape: a cook is a sequence of 3–5 decision points (light, set
vents, stall choice, wrap, pull), each with a small skill check, rather
than continuous twitch control, so it works on mobile and in short
sessions.

## 3. The idle layer: the smokehouse

### Staff
- Levels mirror Contract Debugger: Prep Cook → Line Cook → Pitmaster →
  Head Pitmaster.
- **Skills by cut** (brisket, ribs, pork, poultry, sausage) replace
  programming languages. **Wood types** (hickory, oak, mesquite, cherry,
  apple, pecan) could play the domain role, unlocked later, matching the
  Contract Debugger plan.
- Staff run cooks on their own at a quality set by their skill. Low-skill
  staff risk a "dry brisket" (the equivalent of a failed contract), with
  a partial-rescue option (chop it for sandwiches at a lower price),
  echoing Contract Debugger's retry mechanic.
- **Learners**: an apprentice learns a new cut only by working alongside
  someone who knows it, slowing the cook down (same rule as Contract
  Debugger's learners).

### Capacity: pits and space
- Pits are the capacity limiter, like desks in the planned office
  mechanic. Each pit holds a certain load and burns fuel. Examples:
  - a kettle: small, cheap, fiddly;
  - an offset smoker: classic, needs tending;
  - a pellet grill: steady, low effort, lower "bark" ceiling;
  - a big rotisserie pit: huge capacity, late game.
- Front-of-house seats and hours limit how much you can sell. Unsold
  meat can be held for a while, then becomes leftovers (chili, burnt ends)
  at a lower value.

### Customers and demand
- Daily demand by cut, and it shifts with time of day, weekends and
  events (game day, holidays).
- Selling out early builds hype; running out mid-service costs
  reputation. Timing cooks so meat is ready for service is the planning
  puzzle.

## 4. Progression and spend

Roughly in unlock order:

1. More pits, and better pits.
2. Hiring and training staff.
3. New cuts and wood types (recipes).
4. Moving from a food truck to a restaurant.
5. More sites.
6. Sauces and rubs as passive quality multipliers (like Contract
   Debugger's planned "tools").

**Competitions** could be a periodic event:
- enter a cook you ran yourself;
- scored on your quality stars;
- the reward is trophies that give permanent boosts or unlocks.

This rewards active skill the same way Debugg's clean solves do.

**Prestige**: "Franchise it". Sell the business for a permanent multiplier
and pick a regional style for the next run, each with its own bonuses and
penalties: Texas (beef), Carolina (pork and vinegar), Kansas City (sauce
and variety), Memphis (ribs and dry rub).

## 5. What could be reused from Contract Debugger

- Timed jobs with a team, success chance and payout (contract → cook).
- Repeat, which keeps running while the page is closed, with an offline
  cap.
- Staff levels, time-on-the-job promotions, skill bars and XP from work
  done.
- The learner rule and the retry/partial-rescue on failure.
- Supervision/structure limits and the planned business tiers.

Worth doing: pull these out of `studio/index.html` into a small shared
"idle engine" before starting a second game, rather than copying and
diverging.

## Open questions

- Platform: phone-first matters more here than for Contract Debugger
  (people check a smoker from anywhere).
- How real should cook times be? Real hours make the idle loop, but
  the active mini-game needs a compressed "cook session" version to be
  playable in one sitting.
- Is the active mini-game per cook, or per service/day (like Debugg's
  once-a-day puzzles)?
- Tone: cosy/cartoony or grounded and technical?
- Name.
