# BuzzFYL: Buzz For Your Life

*One small step for fly. One giant buzz for flykind.*

An autonomous picnic game driven by a precomputed simulation of the whole fruit-fly brain
(138,639 neurons, FlyWire v783). You never steer. You set how a real connectome starts (sugar input,
bitter-cell output weight, looming → Giant Fibre weight), how readily it adapts, and how many flies
to release. The swarm shares that brain. Every eat, drink and jump decision is a lookup of a real
whole-brain model run at the swarm's current weights, and what happens to the flies moves those
weights during the run. Get two flies across the picnic to lay eggs on the fruit before Mack's Pest
Control fogs it.

## Play

```sh
npm install
npm run build && npx vite preview   # http://localhost:4173/  (pinned brain data; use this for demos)
npm run dev                         # http://localhost:5173/  (reads the live export)
```

URL options: `?seed=N` picks the picnic (default 7), `?level=easy|medium|boss`.
`/dev.html` is a plain harness that runs the same core.

## How it works

| Step | Where |
|---|---|
| Connectome + LIF model (Shiu et al. 2024, organizers' numpy port) | `notebooks/export_brain.py` |
| Re-run the brain with scaled bitter-output and looming → Giant Fibre synapses: 25 weight states × 66 stimuli × 3 seeds | `notebooks/export_plastic.py` |
| The measured data: MN9, Giant Fibre and MDN rates per condition, with neuron IDs per group | `public/data/brain_plastic.json` |
| Adapter: looks up real runs, never interpolates, refuses unmeasured states | `src/brain.ts` |
| Simulation: swarm, levels, MN9 ≥ 30 Hz feeds, Giant Fibre ≥ 150 Hz jumps | `src/core/sim.ts`, `src/core/config.ts`, `src/core/waves.ts` |
| Learning rule: safe bitter meals weaken bitter outputs, poison strengthens them; harmless shadows weaken looming → Giant Fibre, hits strengthen it | `src/core/learning.ts` |
| Score, paired adaptive vs frozen comparison, replay, notebook | `src/core/score.ts`, `src/core/compare.ts`, `src/core/campaign.ts` |
| UI (BuzzFYL screens, brain map) | `ui/dist/app.js`, `ui/dist/style.css` |

Contract between UI and core: `docs/CORE_CONTRACT.md`. Demo script and winning builds: `docs/DEMO.md`.

## What is measured and what is ours

- **Measured** (model runs): every MN9, Giant Fibre and MDN rate the game uses, at every weight level.
- **Ours** (game rules): the learning rule, feed/jump thresholds, walking and route, jump direction,
  energy, poison, eggs, the swarm sharing one brain, and the score.

## Limitations

- Every lookup is a fresh 200 ms trial from rest; no spike or voltage history carries over.
- Precomputed lattice: 5 discrete levels per plastic group, inputs snapped to tested rates.
- Only two connection groups adapt. DNp09 (forward walking) never fired, so walking is authored. MDN is shown, unused.
- Citronella is a proxy through bitter taste cells (the smell route seized the model). Water weakly drives MN9; the 10 Hz drink threshold is ours.
- The brain map is schematic: cell groups and rates, not anatomy.

## Next steps

Run the model live in a web worker so weights can take any value; make more connection groups plastic;
add the nerve cord and body (BANC) for real walking and jump muscles; replace rate-coded inputs with
richer stimuli.

## Tests

```sh
npm test                                    # invariants against the real export
npx tsx scripts/uismoke.ts "?view=results"  # UI loads against a stubbed DOM
LEVEL=medium LIST=1 npx tsx scripts/tune.ts 7 0   # which builds clear a level
```

See [CREDITS.md](CREDITS.md) for sources and AI disclosure.
