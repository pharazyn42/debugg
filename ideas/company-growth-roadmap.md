# Debuggit Ltd: business units, property and rentals

A sketch of where the company **works** as it grows, and what it does with space: from the spare
room, to renting a **business unit** (a small office unit, like one on a business park), to
bigger premises, to **owning property**, to letting out **rental units** for income. It pulls
together roadmap items 13 (business stages), 15 (office space) and 18 (multiple sites), and
gives the demo a money sink. Status and decisions live in `ideas/roadmap.md` and `ltd/CLAUDE.md`; this file is the detail.
Every number here is a placeholder for the balance pass (item 10).

**Changed in October 2026 (the player-owner's calls):** co-working desks are gone, and buying is no
longer a late-game step: **each premises after the spare room is a choice of renting or buying it
outright**. The small business unit is built that way: 2 floors × 5 desks (not 8), rent ¤4/min, or
buy for ¤60,000 then ¤1/min upkeep, selling for 90% when moving out. The tables below are the
earlier sketch; where they disagree, this note and `ltd/CLAUDE.md` win.

## The progression

| Stage (item 13) | Where you work | Property as income |
|---|---|---|
| **Start-up** | Your spare room: 4 desks, free. Co-working desks for a few more. | — |
| **Small business** | **Rent a business unit**: your own small office | — |
| **Mid-size company** | A bigger unit, or two side by side; then an office floor | Sublet spare desks |
| **Large company** | **Buy** your premises: a unit, then a building | **Let rental units** in what you own |
| **Multinational** | Several sites (item 18), a campus | A property portfolio |

The loop: more people need more desks, desks cost rent or capital, and owning more space than you
need can pay you back. Cash has somewhere to go at every stage, which the demo lacks today.

## 1. Desks

Every on-site person needs a **desk**, and the space you hold sets how many.

- **Desks cap on-site headcount**, alongside the supervision limits. Both show, and the lower
  one stops hiring: "Devs 5/16 · Desks 5/8". Hire buttons say which is full ("no free desk —
  find bigger premises").
- **Some people work from home** and need no desk (see "Working from home" below): the way past a
  full office before you can afford bigger premises.
- **An Office line** at the top of the Studio panel shows where you are, desks used out of the
  total, rent per minute and lease days left, with a **Find premises** button.

### Working from home

Some **applicants** (item 13's juniors, seniors and principals who apply) **work from home**:
their card says **WFH**, and they take no desk. They replace item 15's separate "contractors".

- **How many:** about 1 in 4 applicants. Graduates hired with the button are always on site
  (they need mentoring), but a grad could ask to go WFH later, after their first promotion.
- **What you get:** no desk and no share of rent. They keep working when the office is closed
  (a burst pipe, moving day, a power cut: item 17d), so they're steady through disruption.
- **What it costs** (decided with the player-owner: the trade-off keeps WFH a choice, not a free
  win, so desks and premises still matter; the exact numbers are for the balance pass): they
  learn a little slower (−25% XP, less mentoring from the team, item 22), and they
  can't be a **learner** on a contract, since learning a new language needs someone beside you.
  They ask the same pay as anyone else.
- **Supervision still applies**: they count towards the structure (Devs, and their level's
  slots), just not towards desks. The stats bar shows "Desks 5/8 · +2 WFH".
- **Later:** an office-only policy (everyone comes in, some leave) or a hybrid policy, and
  WFH requests from people already on site.

## 2. Renting: co-working and business units

### The rental ladder

| Premises | Desks | Terms | Rent (placeholder) |
|---|---|---|---|
| **Spare room** (start) | 4 | Yours, free | ¤0 |
| **Co-working desks** | Add 1–6 desks | Per desk per minute; leave any time | ¤1/min per desk |
| **Business unit, small** | 8 | Lease 3, 7 or 14 days; deposit of 1 day's rent | ¤4/min (3 days) → ¤3/min (14) |
| **Business unit, large** | 16 | Lease 7, 14 or 30 days; deposit of 2 days' rent | ¤8/min → ¤6/min |
| **Office floor** | 40 | Lease 14 or 30 days; deposit of 3 days' rent | ¤16/min → ¤12/min |

For scale: a demo-sized team (a junior and 3 grads) nets about ¤1,150 an hour, or ¤19 a minute.
So a small business unit costs about a sixth of that team's income, and a co-working desk half a
grad's salary.

### Rules

- **Several units at once.** You can rent a second unit (the one next door) instead of moving,
  up to 3 units; more units cost more per desk than one bigger space, so moving is usually better.
- **Rent is a running cost like payroll**: drawn every second, shown next to Payroll in the
  stats bar, charged while offline (within the 4-hour cap), and stopped while paused.
- **Leases lock you in.** Longer is cheaper, but leaving early costs the rest of the lease's rent,
  up to 3 days' worth. When a lease ends you renew (at the current rent) or leave. The deposit comes back
  when a lease ends normally.
- **Moving takes time.** Moving puts everyone off contracts for 10 minutes (running contracts
  pause, not fail), so it's a decision, not a free click.
- **Rents drift.** A **property market**, like the hiring market, nudges rents and prices up now
  and then; a lease fixes your rent until it ends.
- **The premises panel** lists the units available right now (a few at a time, refreshing like
  applicants), each with desks, rent, lease options and what moving would change. Available units
  come and go, so the one you want might not be there when you need it.

## 3. Buying property

From **Large company**, you can buy premises instead of renting.

| Property | Desks | Price (placeholder) | Upkeep |
|---|---|---|---|
| **Business unit** (buy the one you're in, or another) | 8–16 | ¤60,000–¤110,000 | ¤1–2/min |
| **Office building** | 3 floors of 40 | ¤300,000 | ¤6/min |
| **Campus** (Multinational; a site of its own) | 400+ | ¤1,500,000+ | ¤20/min |

- **No rent, only upkeep**, whether you use the space or not.
- **Property has a value** that moves with the property market (a slow upward drift, with the
  odd dip), shown in the premises panel. You can **sell** at the current value.
- **Buying the unit you rent** skips the move.

## 4. Rental units: letting space out

Space you own but don't use can be **let** as rental units: a business unit you've outgrown, or
floors of a building.

- **Subletting** (from Mid-size, while renting): let spare desks at a little under the rent you
  pay, to cover part of a lease you grew into too early.
- **Letting units you own** (Large): each unit or floor is either yours or a tenant's. A tenant
  signs a lease (7–30 days) and pays rent every second; you can't take it back until the lease
  ends.
- **Tenants come and go.** An empty rental unit finds a tenant every few hours; what they pay
  depends on the property's **quality** and your reputation. When a lease ends, the tenant renews
  or leaves (a gap with no income).
- **Quality and upgrades.** Upgrades (a better lobby, a kitchen, fast internet) raise quality,
  and so rent. They can raise your own team's speed in the space you use, too. Another money
  sink.
- **The trade-off**: a tenant on a long lease pays well but blocks you from growing into that
  space. Growing faster than planned means co-working desks or renting elsewhere.

### Events (with the shared event system, item 15b)

- A tenant leaves early and pays a break fee; a tenant is late with rent.
- A burst pipe closes a unit for an hour (yours or a tenant's): repair cost, or insurance.
- A buyer offers above value for one of your properties.

## How it fits the rest

- **Stages (item 13)** gate the steps: business units from Small business, subletting from
  Mid-size, buying and letting from Large, sites from Multinational.
- **Reputation (item 12)** raises what tenants pay.
- **Contract types** can say what space they need: "Minor releases: 5 devs, a principal, and
  desks for them".
- **Company stats (item 15d)**: rent paid, property value, rental income.
- **Prestige (item 19)**: selling the company values its property too.
- **The demo**: managers plus co-working desks and the small business unit are the money sink the
  demo needs now; the rest comes in v0.1.

## Save shape (sketch)

```js
state.premises = [ { id, kind: 'room'|'cowork'|'unit-s'|'unit-l'|'floor'|'building'|'campus', desks,
                     tenure: 'free'|'rent'|'lease'|'owned', ratePerMin, leaseEndsAt, deposit, value,
                     quality, siteId,
                     lets: [ { id, desks, tenant: { name, ratePerMin, leaseEndsAt } | null } ] } ];
state.listings = [ … ];               // premises available to rent or buy right now
state.propertyMarket = { index, nextAt };
```

New saves start with the spare room. Old saves get the smallest premises that fit their headcount,
free for a grace period (item 15's migration note).

## Phases

1. **Desks and co-working** (with managers unlocked in the demo): the desk cap, co-working desks
   by the minute, rent in the stats bar, the Office line. The demo's money sink.
2. **Business units**: renting small and large units on leases, deposits, early exits, moving time,
   renewals, a second unit next door, the premises panel with listings that come and go.
3. **Bigger premises**: office floors, subletting spare desks.
4. **Buying property**: buying units and buildings, upkeep, value and selling, the property market.
5. **Rental units**: letting what you own, tenants, quality and upgrades, the events.
6. **Sites** (item 18): campuses and premises in more than one place.

## Open questions

- **Desks for managers and the Director?** Simplest: everyone on site takes a desk, the Director
  included (the spare room's 4 desks then means 3 hires). Or the Director works from home.
- **How harsh is a full office?** Hiring blocked (as sketched), or allowed with a "cramped"
  speed penalty until you find more space.
- **Listings**: a few random units available at a time (more game, more waiting), or any size
  whenever you want it (simpler)?
- **Tenants**: named companies, or just lines of income?
- **Buying purely to let**: can you buy property you never use, as an investment? That's a
  second economy; it could wait.
- **Later, not in this plan:** splitting a big company into teams or divisions, each with a head
  and a focus, if managing everyone as one team gets unwieldy.
