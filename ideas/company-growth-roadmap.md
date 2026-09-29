# Debuggit Ltd: business units, property and rentals

A sketch of how the company grows physically and organisationally once it's past a handful of
developers: **where people sit** (property), **how the company is organised** (business units),
and **what it does with space it doesn't need** (rental units). It pulls together roadmap items
13 (business stages), 15 (office space), 18 (multiple sites) and 19 (prestige) into one
progression, and gives the demo a money sink. Status and decisions live in `CLAUDE.md`; this
file is the detail. Every number here is a placeholder for the balance pass (item 10).

## The idea in one line per stage

| Stage (item 13) | Where you sit | How you're organised | Space as income |
|---|---|---|---|
| **Start-up** | Your spare room: 4 desks, free | You run everyone | — |
| **Small business** | Co-working hot desks, then a small leased office | Managers staff people; one team | — |
| **Mid-size company** | An office floor on a long lease | **Business units**: 2–3 teams with a focus and a head | Sublet spare desks on your floor |
| **Large company** | **Buy a building** (or lease a big one) | Units with their own budgets and staffing rules | **Let whole floors** to tenants |
| **Multinational** | Several sites (item 18), a campus | Units spread across sites; spin one off (item 19) | A property portfolio |

The loop: growing headcount needs desks, desks cost rent or capital, and owning more space than
you need can pay you back. That gives cash somewhere to go at every stage, which the demo lacks
today.

## 1. Property: desks, leases and buildings

Builds out item 15. Every on-site person needs a **desk**; the property you hold sets how many.

### The ladder

| Property | Desks | Terms | Rough cost (placeholder) |
|---|---|---|---|
| **Spare room** (start) | 4 | Yours, free | ¤0 |
| **Co-working hot desks** | Rent 1–10 desks, any number | Pay per desk per minute; leave any time | ¤1/min per desk |
| **Small office** | 12 | Lease: 3, 7 or 14 days; deposit of 1 day's rent | ¤6/min (short) → ¤4/min (long) |
| **Office floor** | 40 | Lease: 7, 14 or 30 days; deposit of 2 days' rent | ¤14/min (short) → ¤10/min (long) |
| **Building** | 120 (3 floors) | **Buy** for ¤250,000, or lease | owned: ¤4/min upkeep; leased: ¤30/min |
| **Campus** (Multinational) | 400+ | Buy only; a site of its own (item 18) | ¤1,000,000+ |

For scale: a demo-sized team (a junior and 3 grads) nets about ¤1,150 an hour, or ¤19 a minute.
So a small office costs about a third of that team's income, and co-working desks cost half a
grad's salary each.

### Rules

- **Desks cap on-site headcount**, alongside the supervision limits. Both caps show, and the
  lower one stops hiring: "Devs 5/16 · Desks 5/12". Hire buttons say which cap is full.
- **Rent is a running cost like payroll**: drawn every second, shown next to Payroll in the stats
  bar, charged while offline (within the 4-hour cap), and stopped while paused.
- **Leases lock you in.** Longer is cheaper per desk, but ending early costs the rest of the
  lease's rent, up to 3 days' worth. When a lease ends you can renew it (at the current market
  rent) or move out. The deposit comes back when a lease ends normally.
- **Moving takes time.** Moving office puts everyone off contracts for 10 minutes (running
  contracts pause, not fail), so it's a decision, not a free click.
- **Owned buildings** have no rent, only upkeep. They can be **sold** at their current value.
  Property prices move with a **property market**, like the hiring market: a slow upward
  drift, with the odd dip.
- **Remote workers** (item 15's contractors) need no desk but cost 50% more in salary: the way
  past a full office before you can afford the next one.

### Where it shows

An **Office** line at the top of the Studio panel shows the current office, desks used out of
the total, rent per minute and lease days left, with a **Move** button. It opens a panel listing
the next properties, their costs and terms, and what moving there would change. On the board, locked
contract types say what they need: "Minor releases: needs 5 devs, 1 principal, and desks for them".

## 2. Business units

From the **Mid-size** stage, the company can be split into **business units**: teams with a
name, a **focus**, a **head** and their own people. It's how a big company stays manageable, and
where the late-game choices live.

### What a unit is

- **A name and a focus.** The focus is a language to start with (e.g. "Rust Services"), later a
  domain (item 16: Games, Embedded) or a contract size ("Hotfix Squad", "Release Team").
- **A head**: a manager (or a principal) who runs it. Its first manager heads it; more managers
  add capacity as today.
- **Members**: developers assigned to the unit. A person is in one unit at a time; moving them
  between units is free but resets nothing.
- **Its own desk space**: each unit sits somewhere, a share of a floor or a building of its own
  (and later, a site).

### What a unit does

- **Specialises.** Members get **+10% SLOC/min** on contracts in the unit's focus, and managers
  staff them onto those contracts first. A unit working outside its focus loses the bonus.
- **Runs itself by rules.** Each unit has a **staffing policy** its head follows: *Biggest
  first* (as managers work today), *Keep hotfixes covered*, or *Hold for releases* (keep a team
  free for the next big contract). This is the player's lever once the company is too big to
  staff by hand.
- **Has a profit and loss.** Income from its contracts, minus salaries and its share of rent.
  A **Units** panel shows each unit's people, SLOC/min, profit per hour and what it's working on,
  so you can see which part of the company earns its keep.
- **Can be closed or spun out.** Closing a unit sends its people to the bench. Spinning one out
  is prestige-lite (item 19): sell it for a lump sum based on its profit, losing its people and
  its desks' lease.

### Limits

- Mid-size: up to 2 units. Large: up to 5. Multinational: one per 30 staff.
- Every unit needs a head, so managers are what unlock units.

## 3. Rental units: space as income

Once you hold more space than you use (a lease a size too big, or an owned building), you can
**let it out**. That turns property from a pure cost into an investment, and gives owning a
building a reason beyond desks.

### How it works

- **Sublet desks** (Mid-size, on a floor you lease): let spare desks at a little under the rent
  you pay, to cover part of a lease you grew into too early.
- **Let floors** (Large, in a building you own): each floor can be yours or a tenant's. A tenant
  signs a lease (7–30 days) and pays rent every second; you can't take the floor back until it ends.
- **Tenants come and go.** An empty unit attracts a tenant every few hours; the rent it gets
  depends on the building's **quality** and on your reputation. When a lease ends, the tenant
  renews or leaves (a gap with no income).
- **Upkeep and upgrades.** Owned buildings cost upkeep per floor, occupied or not. Upgrades
  (a better lobby, a café, faster internet) raise quality, which raises rent from tenants and
  could later raise your own people's speed. Another money sink.
- **The trade-off**: a tenant on a long lease pays well, but blocks you from growing into that
  floor. Growing faster than planned means co-working or a second building.

### Events (with the shared event system, item 15b)

- A tenant leaves early and pays a break fee; a tenant is late with rent.
- A burst pipe closes a floor for an hour (yours or theirs): repair cost, or insurance.
- A rival wants your building: an offer to buy it above value.

## How it fits the rest

- **Stages (item 13)** gate the steps: co-working and small offices from Small business, floors
  and units from Mid-size, buying and letting buildings from Large, sites from Multinational.
- **Reputation (item 12)** raises what tenants pay and who applies.
- **Deadlines and events** make moving, closed floors and lease ends matter.
- **Company stats (item 15d)**: rent paid, property value, rental income, and each unit's history.
- **Prestige (item 19)**: selling the company (or spinning out units) values its property too.
- **The demo**: managers plus co-working desks are the money sink the demo needs now. A small
  office, floors and units would come in v0.1.

## Save shape (sketch)

```js
state.property = {
  holdings: [ { id, kind: 'room'|'cowork'|'office'|'floor'|'building'|'campus', desks,
                tenure: 'free'|'rent'|'lease'|'owned', ratePerMin, leaseEndsAt, deposit, value,
                floors: [ { id, desks, use: 'own'|'tenant'|'empty', tenant: { name, ratePerMin, leaseEndsAt } } ],
                quality, siteId } ],
  market: { index, nextAt }          // property prices, like state.market for hiring
};
state.units = [ { id, name, focus: { lang }, headId, policy: 'biggest'|'hotfixes'|'hold', members: [ids] } ];
```

New saves start with the spare room. Old saves get the smallest property that fits their
headcount, free for a grace period (item 15's migration note).

## Phases

1. **Desks and co-working** (with managers unlocked in the demo): the desk cap, co-working desks
   rented by the minute, rent in the stats bar, the Office line. The demo's money sink.
2. **Leases**: small office and office floor, lease terms, deposits, early-exit fees, moving
   time, renewals. Contract types show what space they need.
3. **Business units**: units with a focus, head, members and staffing policy; the Units panel
   with profit per hour.
4. **Buying property**: buildings, upkeep, selling, the property market.
5. **Rental units**: subletting desks, letting floors, tenants, quality and upgrades, the events.
6. **Sites and spin-outs** (items 18 and 19): campuses, units across sites, selling a unit.

## Open questions

- **Desks for managers and the Director?** Simplest: everyone on site takes a desk, the Director
  included (the spare room's 4 desks then means 3 hires). Or the Director works from home.
- **How harsh is running out of desks?** Hiring blocked (as sketched), or allowed with a
  "cramped" speed penalty until you move.
- **Business units by language, or by contract size, first?** Language fits today's game; domains
  (item 16) make units richer later.
- **Should units be optional?** A player who likes one big team could skip them, at the cost of
  the specialisation bonus.
- **Tenants: simulated companies with names, or just income lines?** Named tenants are more fun
  but more UI.
- **Property as an investment**: can you buy buildings you don't use at all, purely to let? That's
  a big second economy; it could wait for prestige.
