# Demo script (target ready 2:30, demos 2:45)

Run the **pinned build**: `npm run build && npx vite preview` → `http://localhost:4173/`. The build copies
the brain export at build time, so the background export cannot change outcomes mid-demo. (`npm run dev`
on 5173 reads the live file; replicate picks shift as seed 1 fills in.) Picnic seed is 7 by default
(`?seed=N` to change). Controller `body-3`. Picks below were checked against the committed snapshot
with `BRAIN=dist/data/brain_plastic.json npx tsx scripts/pickdemo.ts boss <sugar> <bitterLvl> <threatLvl> <pb> <pl>`.

## One-breath pitch

The player never steers. They choose how a real fly connectome starts (bitter-cell output weight,
looming→Giant Fibre weight, sugar input) and how readily it adapts, then release it across the picnic.
Every eat/drink/refuse/jump decision is a lookup of a real whole-brain run (Shiu LIF on FlyWire v783)
at the fly's current weights, and what happens to it moves those weights during the run.
Goal: reach the fruit and be alive when the encounter ends. Eggs are a bonus.

## Sequence (~3 min), all on seed 7

1. **Picnic → Scout: basic model** (30 s at 4×). Unmodified brain, slow learning. It jumps at every
   shadow, gets hit twice, and ends alive but short of the fruit ("Alive, never reached the fruit").
2. **Workbench** (30 s). 8 points. Show the brain monitor: measured MN9 and Giant Fibre bars move as
   the sliders move (bitter ×1 → sugar+bitter MN9 ≈ 0 Hz; ×0.25 → well above the 30 Hz feed line).
   Set both learning policies to Responsive (2 points), leave weights alone.
3. **Release** (2×–4×). Harmless shadows step looming→GF down (×1 → ×0.75 → ×0.5), the fly stops
   wasting jumps, crosses, and lays 3 eggs. Point at the monitor: last lookup, thresholds, reason.
4. **Results → Replay the evidence.** One event: sensory input → measured MN9/GF → controller action →
   feedback → weight update, with condition ID and model seed.
5. **Compare Frozen Learning.** Same seed, same start: frozen twin never reaches the fruit. "Here
   learning helped."
6. **Learning can hurt.** Revise: sugar 200 Hz, bitter ×0.25, both Responsive (7 points). Adaptive fly
   eats poisoned bait and lowers its threat weight, then dies; its frozen twin survives with 6 eggs.
7. **Limitations** (20 s), below.

| Build (seed 7) | Cost | Adaptive | Frozen twin |
|---|---|---|---|
| Scout: sugar 100, ×1 / ×1, conservative both | 0 | alive, not across | alive, not across |
| sugar 100, ×1 / ×1, responsive both | 2 | **survives**, 3 eggs, 6 updates | alive, not across, 7 jumps at harmless shadows |
| sugar 200, bitter ×0.25, threat ×1, responsive both | 7 | **dies** (2 poisonings, 1 hit) | survives, 6 eggs |
| sugar 200, bitter ×0, threat ×1.5, conservative both | 8 | survives, 4 eggs | survives, 4 eggs |

Balance (450 builds × 10 seeds, `docs/matrix/MATRIX.md`): unmodified frozen brain survives 50%; 56 of 436
in-budget builds reach ≥75%; no single setting dominates (low bitter weight lays more eggs but gets
poisoned; high threat weight avoids hits but wastes jumps).

## Limitations (say these)

- The learning rule is authored by us; the effect of each weight level is measured on the model.
- Every lookup is a fresh 200 ms trial from rest; no spike/voltage history carries over.
- Walking, the route to the fruit, jump direction, cooldowns, energy/poison, egg laying and safe/harmful
  labels are game mechanics.
- Seed coverage is limited (model seed 0 complete incl. water; seed 1 for most conditions).
- Citronella is a proxy (bitter contact), not a smell; the smell route seized the model. The water
  drinking threshold (10 Hz) is ours.
- DNp09 (forward walking) never fired in tested conditions, so walking is authored. MDN is shown but unused.
- The brain monitor layout is schematic, not anatomy; the rates on it are model runs.

## Backup

Record the full sequence once by 2:15 in case the live demo fails. `http://localhost:4173/dev.html` is
the plain harness fallback.
