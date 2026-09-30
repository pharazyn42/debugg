# Low & Slow Ltd: a BBQ and smokehouse idle game

> **Status: idea, not started.** A separate game from Debuggit, sharing no saves. It takes
> Debuggit Ltd as it stands in September 2026 (see `CLAUDE.md`) and re-skins and reshapes it:
> you smoke and grill food and serve people, starting in your back garden and growing to a
> restaurant, catering events and a franchise. The name is a placeholder. Nothing here should
> be wired into this repo's games. Every number is a first guess for a balance pass.
>
> This replaces the first sketch of this file (written against the old Contract Debugger), which
> had the right pitch but predates most of Ltd's systems.

The pitch: real low-and-slow cook times are already idle-game timers. You put a brisket on and
come back to it. Ltd's contracts become **orders** and **bookings**, its developers become
**cooks**, languages become **cuts**, desks become **pits and space**, and the Director's desk
jobs become **pit calls**: the judgement calls a pitmaster makes that nobody else can.

## 1. How Ltd maps to the BBQ

| Debuggit Ltd | Low & Slow | Changes in the mapping |
|---|---|---|
| The Director (you) | **The Pitmaster** (you) | Same: works from the garden, supervises the first few. |
| Desk jobs (questions from past puzzles and Learn) | **Pit calls** (§3) | Questions are real BBQ judgement, not code. |
| Languages (Python, Rust…) | **Cuts**: Grill, Pork, Beef, Poultry | Skill levels per cut, no top, full effect at Lv 5. |
| Domains (item 16, later) | **Regional styles**: Texas, Carolina, Kansas City, Memphis, Korean, Kiwi hāngī-style… | Unlock later; a style needs a specialist. |
| Graduate / Junior / Senior / Principal | **Kitchen hand / Line cook / Pitmaster / Head pitmaster** | Same supervision tree (3 of the level below each). |
| Manager | **Front-of-house manager**, later **Operations manager** | Cooks nothing; runs service and staffs idle cooks. |
| Contracts: hotfix → major release | **Orders**: a plate → a cookout → catering → a festival (§4) | Cook time is set by the meat, not the team (§4.2). |
| SLOC target | **Servings** (kg of meat) | |
| Success chance | **Quality**, shown as stars | A bad roll is a "dry brisket", not a lost contract. |
| Retry at 50% time, 75% pay | **Rescue**: chop it for chilli, pulled-meat rolls or burnt ends | Same numbers; no reputation hit if rescued. |
| Repeat | **Regulars**: a standing order that rolls on | |
| Risk (Standard / Risky / High stakes) | **Standard / Fussy client / Food critic** | Same pay and chance modifiers. |
| Expert contracts | **"Needs a Lv 5 beef pitmaster"**: a proper Texas brisket | Same levels 3 / 5 / 8. |
| Odd jobs on the bench | **Prep and the market stall**: rubs, sauce, sides to sell | Salary + 5%, no XP. |
| The office (desks, co-working, cramped) | **Pits and space** (§5): the garden, a hired commercial kitchen, a truck, a restaurant | A full garden is **smoky**, and the neighbours complain. |
| Hiring market (prices only go up) | Hiring market, plus a **meat market** (§6) | New: ingredients cost money up front. |
| Applicants by reputation | Same | |
| Notice (cramped office, better offer) | Same ("too hot in that truck", "poached by a steakhouse") | |
| Business stages | **Backyard → Side hustle → Food truck → Smokehouse → Restaurant group → Franchise** (§7) | |
| In-house products (item 17) | **The restaurant** (§8): passive service income that needs stock | Built first here, not last. |
| Deadlines (item 6) | **Bookings** for catering (§4.3) | Core, not optional: an event has a date. |
| AI agents (item 17f) | **Smart pellet smokers** (§10) | Same rules: automated, but someone must watch them. |
| Event system (item 15b) | Weather, flare-ups, a failed fridge, inspections (§9) | |
| Prestige (item 19) | **Franchise the brand**, or sell up (§11) | |

## 2. Why the mapping works (and where it doesn't)

- **Works:** staff with levels and per-thing skills, a supervision tree, promotion by time plus
  skill, risk and expert offers, repeats, rescues, offline catch-up, pause, stages, markets,
  applicants and notice all carry over with new names. That's most of `ltd/ltd.js`.
- **Doesn't, and needs new rules:**
  - **Time.** In Ltd a better team finishes sooner. A brisket takes as long as it takes. Here
    skill raises **quality** and **how much one cook can tend**, not cook time (§4.2).
  - **Stock.** Ltd has no materials. Meat costs money before you cook it, and cooked meat goes
    off. That's the new money sink and the planning puzzle.
  - **Dates.** Ltd's offers start when you take them. A wedding is on Saturday at 6pm whether
    you're ready or not.
  - **Selling to the public.** A restaurant isn't a contract; it's demand you meet from stock.

## 3. The active layer: pit calls

Ltd's desk jobs, re-skinned. They're what the Pitmaster does by hand while the staff run the
rest, and they're where a good player earns more than an idle one.

- **They turn up over time**, as desk jobs do: one every 45–90 minutes (the first straight away),
  at most 3 waiting, each open for 4 hours, while the page is closed too.
- **Each is 1–3 calls** (50 / 33 / 17%), pay per right call, boosted when all are right (×1.25
  for 2, ×1.5 for 3), 1 reputation each.
- **The calls are real BBQ judgement**, the way desk jobs are real code. Formats, echoing the
  daily puzzle's:

  | Call | How it plays | Like the daily's |
  |---|---|---|
  | **Wrap or wait?** | A temperature graph of a brisket sitting in the stall at 68°C, plus the client and the clock. | Multiple choice |
  | **Is it done?** | Internal temp, how the probe goes in, how it bends. Pull, or give it an hour. | Will it error? |
  | **Fix the fire** | The pit's running at 160°C and climbing, grey-white smoke. Pick the vent and fuel moves. | Spot the bug |
  | **Which wood?** | Pick the wood for the cut (oak for beef, apple or cherry for pork and poultry, mesquite used sparingly). | Multiple choice |
  | **Plan the cook** | "Guests eat at 6. Ribs take 5 hours and rest 30 minutes. When do they go on?" | What's the value of x? |
  | **Order the steps** | Trim, rub, smoke, spritz, wrap, rest, slice: put them in order. | Order the lines |
  | **Safe or not?** | Food safety: holding temperatures, how long cooked meat can sit out, raw and cooked on one board. | Will it error? |

- **They're checked like the puzzles.** Every call has one defensible answer and a short "why"
  shown after, so a player learns real technique (a "Pit school" could be to Low & Slow what
  Learn is to Debuggit, later).
- **They feed the Pitmaster's skill.** Right calls earn XP in that cut, which, like the Director's
  puzzle levels, adds up to +10% quality to the company's cooks of that cut.
- **Competitions** (§9) are the same calls, harder and timed, once a week.

Real time or compressed? Real low-and-slow times make great idle timers but would make the pit
calls feel disconnected from the cooks. So: the idle cooks run on game time (§4.2), and pit
calls are standalone scenarios, not a live view of a real cook. Simpler, and the same shape as
desk jobs.

## 4. Orders, cooks and bookings

### 4.1 The board

One foldable group per order type, as Ltd's board is per contract type.

| Type (Ltd tier) | What it is | Team (placeholder) | Game time | Servings |
|---|---|---|---|---|
| **Plate** (hotfix) | A neighbour wants burgers, sausages, a rack of wings. Always one per cut. | 1 cook | ~1 min | ~5 |
| **Cookout** (patch) | A backyard party: pork shoulder, ribs and sides. | 3–5 incl. a pitmaster | ~10 min | ~60 |
| **Catering** (minor release) | A wedding, a corporate lunch, a school fair. **Booked for a date.** | 5–10 incl. a head pitmaster | ~30 min cook + service | ~250 |
| **Festival** (major release) | A food festival stand or a stadium: brisket by the hundredweight. **Booked.** | 10+ incl. a manager, 2 head pitmasters, 3 pitmasters | ~90 min cook + service | ~2,000 |

- **Grilling is fast, smoking is slow.** Plates are grill work (the hotfix tier, a lone cook,
  about a minute); smoking starts at cookouts. So "Grill" is the cut a first hire knows, the way
  a grad knows one language.
- **Pay** = servings × a rate per cut (brisket pays most, sausages least) × the type's
  multiplier, minus nothing: meat is paid for up front (§6), so the margin is the game.
- **Risk** rolls per offer: **Standard** (70%), **Fussy client** (22%: ×1.4 pay, −15% quality,
  2× the reputation lost on a bad cook), **Food critic** (8%: ×2, −30%, 4×). A critic's review
  that goes well gives a burst of reputation too.
- **Expert** offers need someone at Lv 3 / 5 / 8 in the cut, pay ×1.3 / ×1.6 / ×2.2: "Needs Lv 5
  Beef · a proper Texas brisket".
- **Learners** as in Ltd: a cook with no bars in the cut can join a team, cooks nothing, costs
  10% of the team's output in teaching, and earns the XP. The only way to learn a new cut.

### 4.2 Cook time is fixed; skill buys quality and capacity

The one real rule change from Ltd.

- **Each cut has a cook time** (game time, scaled from real): sausages and burgers ~1 min, wings
  ~3 min, chicken ~6 min, ribs ~12 min, pork shoulder ~25 min, brisket ~40 min, plus resting.
- **Each cook can tend a number of pits** by level (kitchen hand 1, line cook 2, pitmaster 3,
  head pitmaster 5), and **each pit holds a load** (§5). The team's pits × load must cover the
  order's servings, or it cooks in batches, which is where time grows.
- So a bigger or more senior team finishes a big order sooner **by cooking it in fewer
  batches**, not by cooking meat faster. Small orders take the meat's time whoever cooks.
- **Quality** (the success chance) comes from average level, skill in the cut (+5% at Lv 5),
  the Pitmaster's boost (+10% max) and the pit (§5), rolled as stars on delivery:
  ★★★★★ a tip on top (+10%), ★★★–★★★★ full pay, ★★ a complaint (−reputation), ★ **dry**: the
  rescue choice.
- **Rescue** (Ltd's retry): chop it into chilli, rolls or burnt ends, in half the time, for 75%
  of the pay. Or bin it. Regulars rescue automatically.

### 4.3 Bookings: catering and festivals

What makes catering its own game, and the place Ltd's planned deadlines (item 6) arrive for real.

- **Booked ahead.** A catering offer has an **event time** (e.g. "Saturday wedding, 6pm, 250
  guests, pulled pork and brisket, buffet"), a few hours of game time away; a festival is a day or
  more away. Accepting books the date and reserves nothing yet.
- **Start in time.** You staff it and start the cook yourself, or a manager does. The picker
  shows "ready at 5:20 · serves at 6:00 ✓", or a red warning.
- **Too early costs quality.** Food finished early is **held** in a warmer, losing a star every
  so often past an hour. Ready late means cold guests: pay drops by the minute, then the client
  cancels (no pay, a big reputation hit).
- **Service is part of the job.** After the cook, the team serves for a while (buffet, plated,
  food stand), during which they're still tied up. A manager on the team speeds service.
- **Deposits.** Bigger bookings pay 25% on booking, the rest on the day, so cancelling (or
  missing it) forfeits the deposit.
- **Bookings stack up**: a good weekend has three events overlapping. Juggling who's free when
  is the late-game staffing puzzle.

## 5. Pits and space (Ltd's office)

Every cook needs somewhere to cook, and the space sets how many pits you can run.

### 5.1 Pits

Like desks, but they differ:

| Pit | Load | Quality | Notes |
|---|---|---|---|
| **Kettle grill** (start) | Small | Grill ✓, smoke so-so | Fiddly: −5% quality on long cooks. |
| **Offset smoker** | Medium | Best bark (+5%) | Needs a cook tending it the whole time. |
| **Drum smoker** | Medium | Good | Cheap, low effort. |
| **Pellet smoker** | Medium | Steady, lower ceiling (no ★★★★★) | Can run with smart controllers (§10). |
| **Rotisserie pit** | Huge | Good | Restaurant and up. |
| **Hāngī / pit oven** | Huge, one cut at a time | Unique | A regional style unlock (§7). |

Pits are bought once (a money sink that keeps its value, sold at half) and burn **fuel** per
cook (charcoal, wood, pellets), added to the order's cost.

### 5.2 Where you cook

| Premises | Pits | Terms | Stage |
|---|---|---|---|
| **The back garden** (start) | 2 | Free | Backyard |
| **Hired commercial kitchen** | +1–4 | By the minute, leave any time (Ltd's co-working desks) | Side hustle |
| **Market stall / pop-up** | Uses garden pits | A weekly slot; sells to the public (§8 in miniature) | Side hustle |
| **Food truck** | 2 on the trailer | Bought; can go to events without a kitchen | Food truck |
| **Small restaurant** (lease) | 4–6 + seats | Lease, deposit, early-exit fee (Ltd's business units) | Smokehouse |
| **Bigger restaurant / buy the building** | 8–12 | Buy or lease | Restaurant group |
| **Central kitchen (commissary)** | 20+ | Feeds several sites and franchises | Franchise |

- **The smoky garden** (Ltd's cramped office). Past the garden's 2 pits you can squeeze in 2 more
  on the lawn, but the **neighbours complain**: −5% quality per extra pit (cooks rushed, space
  tight) and a chance per hour of a **council warning**. Three warnings and the garden's shut
  for a day. The way out is a commercial kitchen or the truck.
- **Staff need somewhere too.** Kitchen hands on a cookout need a pit's worth of space, as in
  Ltd everyone on staff needs a desk.
- **The food hygiene rating.** From the food truck on, an inspector visits now and then (an
  event, §9). The rating (0–5) caps who books you: 3+ for weddings, 5 for a stadium. Pit calls on
  food safety and a manager on staff raise it. Reputation gates offers, and hygiene gates venues.

## 6. The markets: hiring and meat

- **Hiring** as Ltd: prices only go up, inflation or a rival stealing one role.
- **The meat market** is new. Every order pays for its meat when the cook starts (brisket
  dearest, chicken cheapest), at a price that moves: brisket prices spike before a public holiday,
  pork's cheap one week. Cooks show the margin: "Pays ¤480 · meat ¤190 · fuel ¤20".
- **Stock, later.** From the restaurant on you can buy meat ahead into a **cold room** (limited
  space, it keeps a few days) when prices are low. That's the one bit of inventory; before the
  restaurant, every order buys its own.
- **Cash can go negative**, as in Ltd, but a cook you can't pay for can't start.

## 7. Business stages

Ltd's stages, on the player-owner's ladder: the garden, then a restaurant, then a franchise. Stages gate premises, order types and what managers do.

| Stage | Needs | What opens |
|---|---|---|
| **Backyard** | You and a kettle | Plates. Hire a kitchen hand. Pit calls. |
| **Side hustle** | 4 staff | Cookouts, the hired kitchen, a weekly market stall. |
| **Food truck** | 1 manager, ¤ for the truck | Catering bookings, events without a kitchen, the hygiene rating. |
| **Smokehouse** | 2 managers, 15 staff, a restaurant lease | Your first restaurant (§8), the cold room, regulars from service. |
| **Restaurant group** | 5 managers, 40 staff, 2 restaurants | Festivals, buying premises, an ops manager who runs sites. |
| **Franchise** | 10 managers, 100 staff, a 5-star hygiene rating and a reputation mark | Franchisees (§11), the central kitchen. |

As in Ltd, from **Food truck** on **managers staff idle cooks** (the biggest orders a free team
can take, on repeat), and **pit call pay shrinks** by stage (100%, 60%, 30%, 15%, 8%, 5%), so the
Pitmaster's hands matter most early and the company carries itself later.

**Regional styles** (Ltd's domains, item 16) unlock at Smokehouse: Texas (beef, oak, salt and
pepper), Carolina (whole hog, vinegar), Kansas City (sauce, burnt ends), Memphis (dry-rub ribs),
Korean (gochujang, fast grill), and a **Kiwi** style (hāngī and lamb). Some bookings ask for a
style and need a **specialist** hire who knows it; a restaurant's menu can have one (§8).

## 8. The restaurant (Ltd's in-house product)

The first thing in this game Ltd doesn't have yet, and it's item 17 re-skinned: a passive income
that needs looking after.

- **Seats × opening hours × demand** sets how many plates you can sell a service. Demand moves
  with the day (Friday night and Sunday lunch are big), the weather, and your reputation.
- **You sell from what's cooked.** The pitmasters cook ahead onto a **menu**: a few cuts in
  quantities you set ("40 kg brisket, 30 kg pork, 60 wings a day"), as a standing order the
  kitchen repeats every service.
- **Sold out early** is good: a small **hype** bonus to tomorrow's demand ("sold out by 1pm").
  **Running out at 7pm** costs reputation. **Leftovers** go into chilli and burnt ends (Ltd's
  rescue) at a lower price, or the bin.
- **A front-of-house manager** is to service what a manager is to contracts: without one the
  restaurant opens only when you're looking; with one it runs offline (within the 4-hour cap).
- **The menu is the choice.** Brisket makes the most per plate and takes the longest and the
  best cook; wings are quick and cheap. Matching the menu to your staff's cuts is the puzzle.
- **More sites later**: a second restaurant, each with its own pits, seats and team, sharing the
  roster (Ltd's item 18).

## 9. Events

On one shared event system (Ltd's item 15b), simulated offline too.

- **Weather:** rain (a smoker in the garden loses quality, a food truck event gets fewer guests),
  wind (pits run hot; a pit call), a heatwave (more demand, more notice), a cold snap.
- **Kitchen:** a flare-up (one cook loses a star), the fridge fails (stock lost unless someone's
  on the bench), out of charcoal (a cook pauses until fuel is bought).
- **People:** a cook calls in sick, a star pitmaster applies, a rival smokehouse opens nearby
  (demand dips for a few days).
- **Visits:** the hygiene inspector; a food critic eats at the restaurant unannounced; a TV
  crew wants to film (a demand boost if the kitchen's good that day).
- **Competitions**, weekly: enter a cut, then answer a round of hard, timed pit calls; your
  score and your best cook's stars decide the place. Trophies are permanent small bonuses (+1%
  quality in that cut, a better class of applicant), shown on a shelf.

## 10. Smart pellet smokers (Ltd's AI agents)

Ltd's item 17f, which fits BBQ better than it fits code.

- A **smart controller** on a pellet smoker runs it without a cook: it counts as extra hands on
  an order, but **someone must look after it**, at the level the order needs and skilled in the
  cut.
- **Controllers improve over time.** The first are unreliable (lower quality, the odd flame-out
  event), and each new model, announced in the news a few days before it arrives, runs more pits
  and holds temperature better. New models cost more to buy and to run (a subscription per
  minute, like payroll).
- They need no space in the kitchen, never learn and never get promoted.

## 11. Franchise, and the endgame

The top of the ladder is two choices, and one is the prestige reset.

- **Franchising** (the late game): other people open restaurants under your name. A franchisee
  pays a fee to join and **royalties** (a share of their sales) every second. Their sales
  depend on your **brand** (reputation), and their quality on the **recipes** you give them
  (your best staff's skills in each cut, written down) and supplies from your **central
  kitchen**. Neglect it and a franchise's hygiene slips, which costs the whole brand. You can
  **second a head pitmaster** to a struggling franchise (Ltd's maintenance team: tied up for
  good, while it's assigned).
- **Sell up** (prestige, Ltd's item 19): sell the brand for a permanent multiplier and start
  again in a new garden with a **regional style** for the run (Texas: beef quality up, pork
  down; Carolina: whole hog, cheaper pork; and so on). Trophies stay.

## 12. What to reuse from Debuggit Ltd

Ltd's roadmap item 1 already says: pull the pure game logic out of `ltd/ltd.js` into a module
(`ltd/engine.js`) that tests can import. Do that first, generically enough that Low & Slow is a
second set of data and a few new rules on the same engine, not a fork.

| Reuse as is (renamed data) | Reuse with changes | New |
|---|---|---|
| Staff, roles, the supervision tree, promotions, skill levels and XP | Contracts → orders: fixed cook time, batches from pits × load (§4.2) | Bookings with an event time, holding and lateness (§4.3) |
| Payroll per second, offline catch-up (4h cap), pause and resume | Success → stars, rescue for ★ | Meat and fuel costs, the meat market, the cold room (§6) |
| The hiring market, applicants by reputation, notice | Desks → pits and space, cramped → smoky garden | The restaurant: demand, menu, service (§8) |
| Risk, expert offers, learners, repeats, odd jobs | Desk jobs → pit calls (new question bank, same engine as `ltd/desk.js`) | The hygiene rating (§5.2) |
| Stages, managers staffing idle staff, the stage bar | Premises from item 15e's ladder | Competitions, franchising |
| The guide, the log, the backup code | | |

Rough split: about two thirds of Ltd's code comes over as is.

## 13. A first playable, and then

1. **Backyard to side hustle** (the demo): the garden and its 2 pits, plates and cookouts, kitchen
   hands and line cooks, pit calls (a first bank of ~100), the hired kitchen, the smoky garden,
   the meat market. Equivalent to Ltd's demo today.
2. **Food truck and catering**: bookings with event times, holding, service, deposits, the
   hygiene rating, managers.
3. **The smokehouse**: the restaurant, the menu, demand, the cold room.
4. **Growth**: regional styles and specialists, festivals, buying premises, more sites,
   competitions, smart smokers.
5. **Franchise and prestige.**

## Open questions

- **Platform.** Phone-first matters more here than for Debuggit: people check a smoker from
  anywhere, and "your ribs are ready" is the push notification.
- **Tone.** Cosy and cartoony, or grounded and technical? The pit calls lean technical (real
  technique); the look could still be warm and playful.
- **Mascot.** Ltd is heading for a kiwi; a BBQ game wants its own (a pig in an apron is the
  cliché to avoid). If it's a New Zealand game, the hāngī and a pōhutukawa-lined garden give it
  a place.
- **How much stock?** A cold room from the restaurant on is the lightest version. Buying meat
  ahead from the start is more game and more to manage.
- **Game time vs real time**, settled above for the idle cooks (compressed). Revisit if a
  "real cook" mode, where you follow an actual overnight brisket, sounds fun.
- **Separate site or a third product on Debuggit's?** Separate, sharing only the engine module;
  its saves and name have nothing to do with code.
- **The name.** Low & Slow is descriptive and probably taken somewhere. Avoid Pit Boss (a grill
  brand) and Traeger-alikes. Others to check: Smoke Ring, Burnt Ends Ltd, Bark & Brisket, Pit
  Stop Smokehouse.
