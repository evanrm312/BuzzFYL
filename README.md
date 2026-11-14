# Small Fly, Big Problem

An autonomous picnic-survival experiment game on a precomputed simulation of the whole
fruit-fly brain (138,639 neurons, FlyWire v783). The player never steers. They set the fly's
starting connectivity (bitter-cell output weight, looming→Giant Fibre weight, sugar input) and
a learning policy, release it, and inspect what happened. During a run, game-defined feedback
moves those real synapse weights one level at a time (authored learning applied to real
connectivity); every feed/escape decision is a lookup of a real model run at the current weights.

Stack: TypeScript + Vite (game), Python + numpy (brain precompute). Design brief: v6 handoff.

## Layout

| Path | What |
|---|---|
| `notebooks/export_plastic.py` | 25 weight states × 48 stimuli × 3 seeds → `public/data/brain_plastic.json` |
| `src/brain.ts` | Adapter: lookups, availability (a state is playable only when fully measured) |
| `src/core/` | Headless sim, learning rule, waves, campaign/notebook, paired comparison |
| `docs/CORE_CONTRACT.md` | What UI screens read and dispatch |
| `src/main.ts`, `index.html` | Plain dev harness running the whole loop (placeholder for UI screens) |
| `scripts/selftest.ts`, `scripts/balance.ts` | Invariants; build × seed sweep for dominant builds |

```sh
npm install && npm run dev       # play
npm test                         # invariants against the real export
npm run balance -- feeding 12    # sweep builds on one wave
```

## Regenerating brain data

```sh
python -m venv .venv && .venv/bin/pip install -r notebooks/requirements.txt
.venv/bin/python notebooks/export_brain.py               # seed 0, 48 runs, resumes if interrupted
.venv/bin/python notebooks/export_brain.py --seeds 0 1 2 # add more seeds
```

No FlyWire token needed. The script downloads the connectome (~cached in `notebooks/.cache/`),
runs the handbook sanity gate (nothing → silence, sugar → MN9, sugar+bitter → MN9 drops,
looming → Giant Fibre), and aborts if any check fails. `brain.json` is rewritten after every run.

Grid: sugar {0,100,200} Hz × bitter {0,200} Hz × looming {0,50,100,150} Hz × presets
{baseline, bitter_lesion}. Readouts are mean firing rates (Hz) of MN9 (feeding), DNp01 Giant
Fibre (escape) and MDN (back up) over a 200 ms trial, plus 10 ms binned traces.

See [CREDITS.md](CREDITS.md) for sources and AI disclosure.
