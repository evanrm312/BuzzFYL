# Demo script (target ready 2:30, demos 2:45)

Run the **pinned build**: `npm run build && npx vite preview` → `http://localhost:4173/`. The build copies
the brain export at build time, so the background export cannot change outcomes mid-demo. (`npm run dev`
on 5173 reads the live file; replicate picks shift as seed 1 fills in.) Picnic seed is 7 by default
(`?seed=N` to change). Controller `body-4`. Picks below were checked against the committed snapshot
with `BRAIN=dist/data/brain_plastic.json npx tsx scripts/pickdemo.ts boss <sugar> <bitterLvl> <threatLvl> <pb> <pl>`.

## One-breath pitch

The player never steers. They choose how a real fly connectome starts (bitter-cell output weight,
looming→Giant Fibre weight, sugar input) and how readily it adapts, then release it across the picnic.
Every eat/drink/refuse/jump decision is a lookup of a real whole-brain run (Shiu LIF on FlyWire v783)
at the fly's current weights, and what happens to it moves those weights during the run.
Goal: reach the fruit and be alive when the encounter ends. Eggs are a bonus.

## Sequence (~3 min), all on seed 7

The boss is hard on purpose (energy drain 2.2/s, a swat does 50): 6 of the 190 builds the workbench can
afford win on seed 7 (`npx tsx scripts/winners.ts`), and the unmodified brain starves.

1. **Picnic → Scout: basic model** (4×). Unmodified brain. It refuses every bitter-tasting serving
   (MN9 ≈ 0 Hz), wastes meals jumping at shadows, and dies of hunger before the fruit.
2. **Workbench** (40 s). Read the brain monitor while moving sliders. Two things have to be true:
   - *The fly must eat bitter-tasting food.* "Sugar + bitter" MN9 must clear the 30 Hz line: sugar 100
     only does at bitter ×0 (58 Hz; ×0.25 gives 28); sugar 200 does at ×0.5 or lower (38 / 68 / 100 Hz).
   - *The fly must never be hit twice.* Only threat ×1.5 reaches 150 Hz Giant Fibre at looming 30, early
     enough for the snap swats. And threat learning must stay Conservative: Responsive weakens it after
     the first harmless shadows.
   Build: sugar 200, bitter ×0.25, threat ×1.5, both Conservative (7 points).
3. **Release** (2×–4×). It eats coated food and bait (2 poisonings, survivable), jumps clear of every
   swat and the fog, reaches the fruit, lays 3 eggs.
4. **Results → Replay the evidence.** One event: input → measured MN9/GF → action → feedback → update.
5. **Learning can hurt.** Revise: same build, threat learning Responsive (8 points). Shadows step the
   threat weight down, a swat lands, the fly dies. Compare Frozen Learning: the frozen twin survives.
6. **Limitations** (20 s), below.

| Build (seed 7) | Cost | Adaptive | Frozen twin |
|---|---|---|---|
| Scout: sugar 100, ×1 / ×1, conservative both | 0 | starves | starves |
| sugar 200, bitter ×0.25, threat ×1.5, conservative both | 7 | **survives**, 3 eggs | survives, 2 eggs |
| same, threat Responsive | 8 | **dies** (hit after weakening) | survives, 2 eggs |
| sugar 100, bitter ×0, threat ×1.5, conservative both | 6 | survives, 4 eggs | survives, 2 eggs |

All six winners on seed 7: threat ×1.5 with Conservative threat learning, plus sugar 100 / bitter ×0, or
sugar 200 / bitter ×0, ×0.25 or ×0.5 (bitter learning either way at ×0.25 and ×0.5). They also win
80–90% of ten other seeds, so it is the brain, not the seed.

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
