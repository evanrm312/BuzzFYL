# Core ↔ UI contract (v6)

Integration owner: Evan (core, brain adapter, scientific labels). UI (Aarush's screens) reads
core state and dispatches commands; it never mutates sim state. Everything below is in
`src/core/` and `src/brain.ts`. Records are plain JSON.

## Loading

```ts
const brain = await Brain.load();              // public/data/brain_plastic.json
brain.levels                                    // { bitterScale: [0,.25,.5,.75,1], loomGfScale: [.5,.75,1,1.25,1.5] }
brain.stateAvailable({ bitterScale, loomGfScale }) // false until every one of the 48 stimuli is measured
brain.mean(state, stimulus)                     // workbench stimulus-test bars (mean over seeds)
```

Unavailable states must be shown disabled ("not measured yet"), never as zero.

## Workbench → `BuildConfig`

| Field | Values | Meaning |
|---|---|---|
| `sugarHz` | 100 \| 200 | Sugar input setting (not a learned weight) |
| `bitterLevel` | index into `bitterScale` | Starting weight of bitter-cell outputs |
| `loomGfLevel` | index into `loomGfScale` | Starting weight of looming → Giant Fibre synapses |
| `policy.bitter`, `policy.loomGf` | `frozen` \| `conservative` (3 events) \| `responsive` (1 event) | Readiness to change |

Cost: `buildCost(cfg, base)` vs `WAVES[wave].budget` (boss: 8, shown on the UI's 8-segment meter). Each
level moved costs 1, sugar 200 costs 2, each responsive policy costs 1. The UI reads levels, costs and
budget from the core and offers responsive/conservative only (frozen is used for the comparison twin).

## Live run

```ts
const sim = new Sim(brain, { wave, seed, config, onEvent });  // onEvent → small notices
// each frame, UI owns pause/speed:
if (!paused) sim.step(frameSeconds * speed);
```

Read each frame: `sim.t`, `sim.phase`, `sim.fly` (x, y, heading, health, energy, action),
`sim.servings`, `sim.threats` (x, y, ramp, status), `sim.groups[g]` (startLevel, level,
evidence {direction, count}, threshold), `sim.brainState`, `sim.lastDecision` (readouts +
plain-words `reason`), `sim.metrics`, `sim.done`, `sim.result`. Arena is 800×500 units (`ARENA`).

Boss level (`WAVES.boss`, the single encounter the UI ships; waves 1–3 stay in the core, unused): `wave.start`, `wave.fruit` {x, y, r} (egg site and
route destination), `wave.candles` [{x, y}], `fly.hydration`, `metrics.eggsLaid`, `metrics.drinks`,
`metrics.reachedFruitAt`, `metrics.progress` (0–1, closest approach to the fruit; 1 only once reached).
Result: `survived` = alive at the end **and** reached the fruit; `not_crossed` = alive but never got there;
eggs are a bonus score. Serving kinds: `clean`, `safe_bitter`, `poison_bitter`, `citronella`
(coated food beside a candle: bitter input, safe), `water`, `soda` (sugar + water). Result can be
`died_thirst`. A boss build must pass `brain.stateAvailable(state, true)` (water lattice measured).

`fly.action`: `walking` · `feeding` · `drinking` · `laying` · `suppressed` (on food, MN9 below threshold under a threat,
no jump: **show separately from escaping**) · `refusing` · `escaping` · `idle`.

## After a run

`sim.record()` → `RunRecord` (versions, seeds, config, initial/final state, events, decisions,
trajectory, metrics, result). Save with `saveAttempt(record, prediction)` (failed runs too).

- Replay: `decisiveEvents(record)` → pick one → `replay(record, event)` gives the event
  (feedback text, learning record with evidence before/after and scale before/after) and the
  decision (requested + supported stimulus, condition ID, replicate seed, MN9/GF/MDN, action, reason).
- Compare: `runPair(brain, wave, seed, cfgA, frozenTwin(cfgA))`, `firstDivergence(a, b)`.
- Retry: `retry(campaign)` → same starting build and seed. Continue with adapted brain:
  `continueAdapted(campaign, record)` (advances the wave on survival). Notebook:
  `loadNotebook()`, `restoreBuild(attempt, "start" | "final")`.

## Wording rules (scientific labels)

- "Authored learning applied to real connectivity." The rule is ours; the effect of each weight
  level is the measured model response.
- Every lookup is a reset-state 200 ms trial. Don't imply spike/voltage history carries over.
- Walking, jump direction, cooldowns, arbitration, energy/poison, and safe/harmful feedback are
  authored. Feeding (MN9) and escape (Giant Fibre) come from the brain.
- A jump is a "jump", not a "dodge". `attacksEscaped` = jumped and the strike missed.
- MDN is displayed but drives nothing (no useful response at tested inputs).

## Where the UI lives

`index.html` → `ui/dist/app.js` + `ui/dist/style.css` (Aarush's BuzzFYL screens, extracted from his handoff,
wired to the core; no second simulation). `dev.html` is the plain harness. `?seed=N` picks the picnic
(default 7). `?view=workbench|notebook|tutorial|live&t=30|results|compare` opens a screen directly.
`npx tsx scripts/uismoke.ts "?view=results"` loads the UI against a stubbed DOM to catch runtime errors.
