# Debuggit Ltd: the office view

A plan for drawing the studio as an office building from the very start of Debuggit Ltd: a side-on
cut-away with one floor per storey, a desk per desk the company has, and the people at them. It
builds roadmap item 21b (the agent office) as the graphics version of the studio (item 21), and
grows with the premises of item 15e. Written October 2026 so another chat can pick it up; read
`ltd/CLAUDE.md` first for how the studio works now.

**Status:** agreed with the player-owner in outline (floors, an interview room, breaks). **Step 1
(the spare room, drawn) is built** (October 2026: `ltd/office.js`), with "Decide first" 2 and 4 taken
as proposed (the Director's own table by the front door; shown, with a hide button). Steps 2–5 are
to do. "Decide first" 1 and 3 were settled by the player-owner in October 2026 (breaks are only a
picture; every floor has a break room and a meeting room) and built with step 1, ahead of step 3.
The "Open questions" are still open.

## Where it comes from

- **Agent HQ** (claude-pet, the player-owner's other project): `pharazyn42/claude`, branch
  `claude/creature-animation-ideas-o53x86`, `web/office.js` and `web/creature.js`. A canvas
  office building of real Claude Code agents: a floor per team, a lift, desks with monitors that
  show what each agent is doing, a break room, arrivals by lift. No dependencies.
- **The prototype for this plan:** `ideas/ltd-office-demo.html`, a standalone page (open it in a
  browser; it needs nothing else). It fakes the game with its own fast simulation, but the
  drawing code (`layout()`, `drawShell()`, `drawFloor()`, `drawDesk()`, `screen()`,
  `drawPerson()`, `kiwi()`, `drawLeftRoom()`, `drawKitchen()`, the bubbles and particles) is meant
  to be lifted into the game. Try every premises, "Fill desks", tap applicants, tap a stuck grad.

## What the player-owner asked for

1. **The office from the start**, as a view of the floors like Agent HQ's.
2. **The first office has one floor; bigger offices have more floors, and more desks per floor.**
3. **An interview room** where applicants come, sit and wait.
4. **A break room** that employees go to sometimes, and **a break stops their work** while they're
   away.

## The premises ladder

Each premises is its own building. The prototype's numbers (desks per floor never shrink, floors
grow, so every move reads as a bigger building):

| Premises | Building | Floors × desks | Desks | In `company-growth-roadmap.md` | Cost (placeholder) |
|---|---|---|---|---|---|
| Spare room (built) | A house: pitched roof, chimney, front door | 1 × 4 | 4 | 4 | free |
| Small business unit (built) | A clad unit with stairs | 2 × 5 | 10 | 8 | rent ¤4/min, or buy ¤60,000 + ¤1/min |
| Large business unit | A clad unit with stairs | 3 × 6 | 18 | 16 | ¤8/min |
| Office floors | A tower with a lift | 4 × 10 | 40 | 40 | ¤16/min |
| Office building (bought) | A tower with a lift | 8 × 15 | 120 | 120 | ¤6/min upkeep |

- **Changed from the growth plan:** the two business units go from 8 to 10 desks and 16 to 18,
  so a floor never has fewer desks than the one before. The small unit was built with 10.
- **Built (October 2026):** the spare room and the small business unit (`PREMISES` in `ltd.js`).
  Co-working desks are gone (the player-owner's call), and **each premises after the spare room
  can be rented or bought outright** (also theirs); the unit's sign says which.
- **Squeezed in** (a cramped office): people without a desk sit on stools on the ground floor
  after the last desk, so a cramped office looks cramped (more than 2 only in a save that lost its
  co-working desks).

## The rooms on each floor

Left to right on every floor: the way in (front door, stairs or lift), a side room (the
interview room on the ground floor; the Director's office on the top floor of a unit), the desks,
the meeting room, then the kitchen. Every floor has a kitchen and a meeting room, **except the
spare room, which has no meeting room**; every break room is labelled just "Kitchen" (the
player-owner's calls, October 2026). None of the rooms take desks.

- **Interview room** (ground floor, by the way in): a row of waiting chairs, one per applicant
  slot (`MAX_APPLICANTS` = 3 in the game), a plant and a framed kiwi. Each of
  `state.applicants` sits in a chair in grey, holding a CV in their level's colour. When an
  application expires they get up and leave; when hired they walk to their new desk (by the
  stairs or lift if it's upstairs).
- **Break room** (every floor; the spare room's is its kitchen): a coffee machine, a window and a
  couch. People on a break go there (the couch first, then the coffee machine, then standing).
  **Breaks are only a picture** (the player-owner's call, October 2026): they cost no work, so the
  game's numbers, offline progress and the simulator are untouched.
- **Meeting room** (every floor beside the kitchen, but not in the spare room): a whiteboard and a
  table. Managers on a contract stand there, since they write no code; in the spare room they stay
  at their desk.
- **The bench is not a room.** Someone with no contract (on the bench, doing odd jobs) sits at
  their own desk with a screensaver.

## How the drawing maps to the game

Everything is drawn from the save (`state` in `ltd/ltd.js`); the view never changes the game
except through the actions the panels already have.

| In the game | In the office |
|---|---|
| `deskCount()`, `coworkDesks()`, `desksUsed()`, `cramLevel()` | The desks, the co-working corner, free desks labelled "free", stools when squeezed in |
| The Director (`roster[0]`) | A person with the look the player chose at founding, at the first desk (decided October 2026: they take a desk, and aren't the kiwi) |
| The intern (`isIntern()`) | Beside the Director: they work as a pair and take no desk |
| A person on a running job | At their desk; the monitor types code in the job's language, with a progress bar from `startedAt`/`endsAt` |
| A stuck intern job (`isStuck()`) | The intern's monitor flashes "?"; tapping them does what the job card's **Help them** does (`startHelp()`) |
| A failed job waiting for Retry or Drop | The monitor shows ✗ until it's resolved |
| A delivered job | ✓ and confetti, a bubble with the pay (only when it happens while watching) |
| On the bench (`onBench()`) | At their desk, screensaver; the bubble says "odd jobs" |
| Away (`isAway(p, now)`: training, holiday, sick) | Their desk empty, with a note on the chair ("on holiday"). Nothing sets `p.away` yet (it waits for items 14 and 15c), so draw it from `isAway()` and test it with a seeded save |
| On notice (`p.notice`) | A packing box on their desk |
| `state.applicants` | The interview room's chairs |
| A hire, a leaver | Walks in by the door, stairs or lift, or out the same way |
| Managers on a contract | The meeting room (upper floors) or their desk |
| Cash, rent | Not drawn: the stats bar already has them |

**Who sits where.** The game has no desk numbers, so the view assigns them: staff (everyone but
the Director and the intern) in roster order, filling the ground floor first. To stop people
swapping desks when someone leaves, the view remembers its assignments while the page is open and
gives a newcomer the lowest free desk. Nothing about desks goes in the save (keep it that way
unless a later feature needs it).

## Decide first (with the player-owner)

1. **How breaks cost work. Decided (October 2026): they don't.** Breaks are only a picture; the
   rest of this item is kept for the record. The player-owner first wanted a break to stop a person's work. The game
   works out a contract's end time when it starts (SLOC target ÷ the team's SLOC/min), and
   simulates offline time, so per-person breaks that move `endsAt` would make offline progress and
   the drawing disagree. Two ways:
   - **Recommended: an average.** Everyone spends a set share of contract time on breaks
     (`BREAK_SHARE`, say 5%), applied in `devSlocOn()` like `crampedPenalty()`. The view then
     shows breaks at that rate, chosen deterministically from a hash of the person's id and the
     current 10-minute window, so the same people are on a break after a reload and the picture
     matches the maths. Offline needs nothing new. The balance pass (item 10) and
     `npm run sim` absorb the 5%. Later, break-room upgrades (15e "quality") could shorten breaks.
   - **Or real breaks:** each person's break pushes their job's `endsAt` and shows in the job
     card. Truer, but a lot more code (offline, teams, repeats) for little gain.
   - Or breaks are only a picture and cost nothing (not what was asked).
2. **Where the Director sits. Decided (October 2026): at the first desk**, which counts against the
   premises' desks, and as a person the player designs at founding, not the kiwi (the
   player-owner's calls; built). Before that: the game said the Director works from home, at their own desk, and
   takes no staff desk. Proposed: in the spare room (which is home) the kiwi has the kitchen table,
   an extra desk by the front door that isn't counted; in bigger premises, a corner office on the
   top floor. The prototype gives the Director desk 0, which the game must not do.
3. **The meeting room. Decided (October 2026): one on every floor**, the ground floor included.
   The desk numbers in the premises table are still to confirm.
4. **Shown by default, or a toggle.** Proposed: shown, with a "Hide the office" button whose
   setting goes in the save (`state.showOffice`).

## How to build it

### Files

- **`ltd/office.js`** (new): the renderer, a port of the prototype's drawing code into one object,
  `window.DebuggOffice = { mount(el, api), unmount() }`. No game rules in it.
- **`ltd/ltd.js`**: gives the view a read-only `api`, and fires events. Must work with no
  `DebuggOffice` loaded (`tools/sim-ltd.js` runs `ltd.js` headless with a stand-in page), so every
  call is guarded.
- **`ltd/ltd.css`**: the view's box, its toggle and the text summary, scoped under `.ltd` like the
  rest.
- **`index.html`**: a new slot, `<div id="ltdOffice" hidden></div>`, between `#ltdStats` and
  `<div class="columns">`, so it spans the page's full width (inside `.columns` it would become a
  third grid cell and break the two-column layout). Add it to the
  `body:not(.ltd-on) … { display: none !important }` rule beside the other four slots; the loader loads `ltd/office.js` with
  `ltd/desk.js` and passes `office: $('ltdOffice')` to `DebuggLtd.start()`. On a branch whose
  other files are all Ltd's, `index.html` counts as Ltd's, so the scope check passes.

### The api ltd.js passes in

```js
// As built in step 1 (officeSnapshot() and officeApi in ltd.js):
api = {
  snapshot(),        // { premises: { kind: 'spare-room', perFloor, cowork, squeezed, maxApplicants },
                     //   people: [{ id, name, role, state, job, notice }],   // the whole roster
                     //   applicants: [{ id, name, role }] }, built from `state` each call
                     // state: director | working | stuck | failed | bench | away | idle
  onTap(kind, id),   // 'applicant' → scroll to and flash its card in the Studio panel (hiring
                     // costs money, so the existing hire-applicant button stays the way to hire);
                     // 'stuck' → startHelp(jobId); 'person' → open the employee panel;
                     // 'director' → scroll to the desk
}
// Step 2: ltd.js tells the view what just happened, beside the addLog() calls that already exist:
DebuggOffice.event({ kind: 'delivered' | 'failed' | 'hired' | 'left', ids, pay })
```

`job` in the snapshot is `{ id, tier, lang, progress (0–1), status }`, with `progress` from
`startedAt`/`endsAt` (or `job.left` while stuck).

### The drawing loop

- Its own `requestAnimationFrame` loop, reading `api.snapshot()` each frame (cheap: the roster is
  small). The game's 1-second `setInterval` keeps re-rendering the HTML panels as now.
- Stop drawing when the tab is hidden (`document.hidden`) or the view is toggled off. (A paused
  company isn't loaded at all, so there's nothing to draw then.)
- Coming back from offline time: draw the end state, no catch-up animation. Events only animate
  while the page is open.
- Theme: read colours from CSS custom properties, as the prototype does (`readTheme()`), with
  light-theme values ready for item 10b.
- `prefers-reduced-motion`: people jump to their spots, no confetti or floating SLOC.
- Size: the building's width follows the widest floor; on a phone it scales down to a minimum and
  then scrolls sideways inside its box (`overflow-x: auto`), never the page.

### Accessibility

The canvas is a picture (`role="img"`, an `aria-label` summary like "Spare room: 4 of 6 desks
taken, 3 working, 1 on a break, 2 applicants waiting"). Everything it shows is already in the text
panels, which stay as they are, so the game still plays with a screen reader and on a phone. Tap
targets on the canvas are a convenience, never the only way to do something.

## Steps (one PR each, all Ltd scope)

Each PR adds a line for players under `## Unreleased` in `ltd/CHANGELOG.md`, updates
`ltd/CLAUDE.md` ("What's implemented") and this file's status, and adds tests to
`tests/ltd.spec.js`.

1. **The spare room, drawn.** `ltd/office.js` with the house, its 4 desks, the co-working corner,
   stools when squeezed in, the kitchen (break room), the interview room with
   `state.applicants`, the Director and the intern, and each person's monitor (working with a
   progress bar, bench screensaver, stuck "?", failed ✗). The slot, loader change, toggle and
   `aria-label` summary. Tap: applicant, stuck intern, person.
   Tests: the canvas appears on the Ltd tab and not on the Daily tab; its `aria-label` counts
   match a seeded save (desks, applicants, working); the toggle hides it and survives a reload;
   `npm run sim` still runs.
2. **Things happening.** `DebuggOffice.event()` from `ltd.js`: hires walk from the interview room
   to their desk, leavers walk out, applicants leave when their offer expires, ✓ and confetti with
   the pay on delivery, smoke on failure, floating SLOC while writing (item 20), the packing box on
   notice, the empty chair when away.
3. **Breaks** (built with step 1, October 2026): only a picture, so nothing in `ltd.js`. The view
   picks who is on a break from a hash of their id and the 10-minute window of game time
   (`BREAK_ODDS` 40% of windows, `BREAK_MS` 3 minutes of it: about 12% of the time), so the same
   people are on a break after a reload. They walk to the break room (couch, coffee machine, then
   standing); their monitor shows the work carrying on without them; "on a break" is in the
   summary. People on a contract or the bench take breaks; the Director, a stuck or failed job, a
   manager in the meeting room and anyone away don't. Tests fix who's on a break with
   `window.DEBUGG_OFFICE_BREAKS` (an array of ids).
4. **Bigger buildings**, with 15e phase 2 (business units) and after: floors, the stairs and the
   lift, a meeting room and a break room on each floor, moving day (everyone walks out of the old building and into the new one),
   rooftop signs. The prototype has all of it.
5. **Later:** a floor per team once managers lead teams; an AI floor with no desks (item 17f); a
   campus of buildings (item 18).

## Building step 1: the work in order

Written after checking this plan against the code (October 2026). It breaks step 1 above into
pieces small enough to review one at a time, all on one Ltd branch and one PR. Line numbers drift,
so the function names are what to search for.

**Built (October 2026).** Where the build differs from the notes below: the snapshot is the shape
in "The api ltd.js passes in" above; there's no pause handling or `DebuggOffice.poke()` (a paused
company isn't loaded); the canvas reads its box's width each frame rather than using a
`ResizeObserver`; and because people are sprites that walk to wherever the snapshot puts them,
hires already walk from the interview chairs to their desk, and leavers and anyone away walk out
of the front door. Step 2 adds the events (✓, confetti, smoke, the pay), bubbles and the rest.

### 1. The slot and the loader (`index.html`)

- Add `<div id="ltdOffice" hidden></div>` after `#ltdStats`, and add `#ltdOffice` to the hide
  rule (see "Files" above).
- In the loader, load `ltd/office.js` after `ltd/desk.js` and before `ltd/ltd.js`, only on the
  paths that already load the studio, and pass `office: $('ltdOffice')` to `DebuggLtd.start()`.
- If `office.js` fails to load, the studio still starts (pass the slot anyway; `ltd.js` checks for
  `window.DebuggOffice`).

### 2. The read-only api (`ltd/ltd.js`)

- In `start(slots)`, take `slots.office` (it may be missing: old tests and `tools/sim-ltd.js`
  pass only four slots) and leave it hidden and empty when it is missing or
  `window.DebuggOffice` isn't loaded.
- `officeSnapshot(now)`, built from the helpers that already exist:
  - premises: `{ kind: 'spare-room', floors: 1, perFloor: SPARE_ROOM_DESKS, cowork: coworkDesks(),
    cramped: cramLevel() }`. `kind` is the hook for 15e phase 2.
  - people: `state.roster` mapped to `{ id, name, role, state, job, notice: !!p.notice }`, where
    `state` is one of `director`, `intern`, `working`, `stuck`, `failed`, `bench`, `away`,
    `manager` (a manager on no contract): the job from `busyIds()` and `state.jobs` (`isRunning`,
    `isStuck`, `status === 'failed'`), `onBench()`, `isAway()`.
  - job: `{ id, tier, lang, status, progress }`, progress `(now − startedAt) / (endsAt − startedAt)`
    clamped to 0–1, or `1 − job.left / (endsAt − startedAt)` while stuck. Everyone on a team
    gets the same job.
  - applicants: `state.applicants` mapped to `{ id, role, expiresAt }`.
  - `paused: !!state.pausedAt`.
- `onTap(kind, id)`: `'person'` → `openPersonModal(id)`; `'stuck'` → `startHelp(jobId)` (the same
  call the job card's Help button makes); `'applicant'` → scroll its card in `renderApplicants()`
  into view and flash it with the existing `.guide-target` highlight (hiring stays a button press
  in the panel, since it costs money).
- The toggle: `state.showOffice` (missing means shown, so old saves need no guard), a small
  "Hide the office" / "Show the office" button in the slot's header, saved with `save()`.
- `DebuggLtd.stop()` (used by tests) also calls `DebuggOffice.unmount()`.

### 3. The renderer (`ltd/office.js`, new)

Port from `ideas/ltd-office-demo.html`, which mixes a fake game with the drawing. Keep only the
drawing and the view's own movement:

| Keep (move into `office.js`) | Drop (the game does it) |
|---|---|
| `readTheme`, `rrect`, `ell`, `tint`, `font` | `makePerson`, `hire`, `addApplicant`, `hireApplicant`, `nextRole`, `letGo`, `move` |
| `layout`, `fit`, `frame`, `placeOf`, `steer` | `startJob`, `tick` (the fake contracts), `unstick` |
| `drawSky`, `drawShell`, `sign`, `drawFloor`, `drawFloorSign`, `drawSide`, `door` | `capacity`, `perFloorOf` (from the snapshot's premises instead) |
| `drawKitchen`, `drawLeftRoom`, `drawDesk`, `screen`, `drawPerson`, `kiwi`, `drawFront` | `renderLadder`, `renderTable`, `updateStats`, `renderLadderState`, `poke`, the controls |
| `bubble`, `drawBubbles`, `burst`, `drawParticles`, `banner` | `say` (the game's log does it) |

- Step 1 draws the spare room only; keep the multi-floor code paths but feed them one floor, so
  step 4 is a data change. Delete what step 4 won't use rather than carrying dead branches.
- The view keeps its own state between frames: desk assignments (`Map` of id → desk, lowest free
  desk for a newcomer, kept while the page is open) and each sprite's position, so people walk
  to their spot instead of jumping when the snapshot changes.
- Desk layout for the spare room: the 4 home desks, then `cowork` co-working desks in their tinted
  corner, then up to `CRAM_MAX` stools at the last desk. The Director's spot is the kitchen table
  by the front door, never a counted desk ("Decide first" 2); the intern sits beside the Director.
- Hit testing: keep a list of `{ x, y, w, h, kind, id }` rectangles built while drawing, read on
  `pointerup`, and call `api.onTap`. Give the canvas `cursor: pointer` over a target.
- The loop: `requestAnimationFrame`, stopped when `document.hidden`, when the view is hidden, or
  when unmounted; when paused, draw one dark still frame and stop until the snapshot unpauses (check
  it on the game's 1-second tick through a cheap `DebuggOffice.poke()`).
- Size: a `ResizeObserver` on the slot sets the canvas's CSS width and its pixel size
  (`devicePixelRatio`, capped at 2); below the building's minimum width the box scrolls sideways.
- The `aria-label` summary is rebuilt only when its text changes, so screen readers aren't spammed.

### 4. Styles (`ltd/ltd.css`)

The slot's panel (same `.panel` look as the others), the toggle button, the scroll box, and a
reduced-motion rule. Colours come from the existing custom properties; `readTheme()` reads them,
so the light theme (10b) works by adding its values to `base.css`.

### 5. Tests (`tests/ltd.spec.js`) and the simulator

- The office appears on the Ltd tab with a running company, and not on the Daily tab.
- With a seeded save (2 staff on a job, 1 on the bench, 2 applicants, 2 co-working desks), the
  canvas's `aria-label` reads the right counts.
- A stuck intern job: clicking the intern's spot (from coordinates the view exposes for tests,
  e.g. `DebuggOffice.targets()`) opens the help, the same as the job card's button.
- The toggle hides it and the choice survives a reload.
- No errors in the console with `office.js` blocked (`page.route` it to a 404): the studio still
  plays.
- `npm run sim` runs unchanged (it passes no office slot) and prints the same milestones.
- Run `npm test` and `npm run sim` before pushing.

### 6. Docs and changelog

A player-facing line under `## Unreleased` in `ltd/CHANGELOG.md` ("Your studio is drawn as an
office: …"), the new file and slot in `ltd/CLAUDE.md` ("What's implemented") and the file table in
`CLAUDE.md`, and this plan's status line.

### Before starting

The answers to "Decide first" 2 (the Director's spot) and 4 (shown by default) shape step 1;
1 (breaks) and 3 (meeting room) can wait for steps 3 and 4. Ask the player-owner for 2 and 4, or
build with the proposals above and say so in the PR.

## Open questions

- Which way the phone view goes for tall buildings: the whole building scaled down, or one floor
  at a time with floor buttons.
- Whether the interview room's chairs should grow with premises (the game has 3 applicant slots
  at every stage today).
- Whether people ever visit other floors (a manager walking round their teams, say), or stay on
  their own.
- Names on the floor slab get cut short when a floor is full; is a tap enough to see who's who?
- Sound: none planned.
