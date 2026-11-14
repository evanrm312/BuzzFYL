# Fly FYL (Fly For Your Life)

A cute, chaotic 2D top-down picnic survival game. You steer the fly; a precomputed
simulation of the whole fruit-fly brain (138,639 neurons, FlyWire v783) owns its reflexes:
whether it eats or refuses food, and whether it auto-dodges an incoming swat.
Every skill-tree upgrade is a real lesion or stimulation experiment on that brain.

Stack: TypeScript + Phaser 3 + Vite (game), Python + numpy (brain precompute).

## Layout

| Path | Owner | What |
|---|---|---|
| `docs/` | all | Design handoff and project goals |
| `notebooks/export_brain.py` | Neural | Runs the Shiu LIF model over the stimulus × preset grid |
| `public/data/brain.json` | Neural | Precomputed lookup table the game reads |
| `src/brain.ts` | Neural | Game-side adapter for `brain.json` (todo) |
| `src/` (rest), package files | Core | Phaser game (todo) |
| `src/ui/`, `src/art/`, `src/threats/` | Presentation | HUD, panels, procedural art (todo) |

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
