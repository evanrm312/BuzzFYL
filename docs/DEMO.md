# Demo script (target ready 2:30, demos 2:45)

Run the **pinned build**: `npm run build && npx vite preview` → `http://localhost:4173/`. The build copies
the brain export at build time, so the background export cannot change outcomes mid-demo. (`npm run dev`
on 5173 reads the live file; replicate picks shift as seed 1 fills in.) Picnic seed is 7 by default
(`?seed=N` to change). Controller `body-6`. Picks below were checked against the committed snapshot
with `BRAIN=dist/data/brain_plastic.json npx tsx scripts/pickdemo.ts boss <sugar> <bitterLvl> <threatLvl> <pb> <pl>`.

## One-breath pitch

The player never steers. They choose how a real fly connectome starts (bitter-cell output weight,
looming→Giant Fibre weight, sugar input) and how readily it adapts, then release it across the picnic.
Every eat/drink/refuse/jump decision is a lookup of a real whole-brain run (Shiu LIF on FlyWire v783)
at the fly's current weights, and what happens to it moves those weights during the run.
Goal: reach the fruit and be alive when the encounter ends. Eggs are a bonus.

## Sequence (~5 min), all on seed 7

Purpose in one line: breed a brain, not a fly. You tune real connectome weights, release a swarm that
shares them, and see which brains get two flies across to lay eggs.

Budget is 8 points. One fly is free; each point doubles the swarm (2, 4, 8, 16), so every clear spends
at least 1 point on a second fly. "Scout: basic model" releases the unmodified brain with 2 flies.

1. **Level 1 · Garden Party → Scout** (4×). Clears, 18 eggs. Point at the brain map: nodes light with each
   lookup; the number in the middle is neurons that fired in that model run.
2. **Level 2 · Citronella Row → Scout.** Fails: the flies refuse every coated serving (sugar + bitter MN9
   ≈ 0 Hz, below the 30 Hz feed line) and starve. Yellow haze = food tastes bitter there.
3. **Workbench.** Swarm 2 flies, sugar 200 Hz, bitter ×0.5 (5 points). "Sugar + bitter" now clears 30 Hz.
   Release: cleared, 21 eggs. Results → **▶ Play brain changes** steps through each weight update.
   **Compare Frozen Learning**: the frozen twin fails. Learning helped (shadows taught the swarm to
   stop wasting jumps).
4. **Level 3 · Mack → Scout.** Wiped out. Build: 2 flies, sugar 100, bitter ×0, threat ×1.5, both
   Conservative (7 points): cleared, 11 eggs. Set threat learning to Responsive (8 points): wiped out,
   frozen twin survives. Learning hurt.
5. **Limitations** (20 s), below.

| Level | Build (seed 7, 2 flies) | Cost | Adaptive | Frozen twin |
|---|---|---|---|---|
| 1 | Scout | 1 | cleared, 18 eggs | cleared, 14 eggs |
| 2 | Scout | 1 | not cleared | wiped out |
| 2 | sugar 200, bitter ×0.5, threat ×1, conservative both | 5 | **cleared**, 21 eggs | not cleared |
| 2 | sugar 100, bitter ×0, threat ×1, conservative both | 5 | cleared, 24 eggs | cleared, 20 eggs |
| 3 | sugar 100, bitter ×0, threat ×1.5, conservative both | 7 | **cleared**, 11 eggs | cleared, 14 eggs |
| 3 | same, threat Responsive | 8 | **wiped out** | cleared, 14 eggs |
| 3 | sugar 200, bitter ×0.25, threat ×1.5, conservative both | 8 | cleared, 16 eggs | cleared, 11 eggs |

Builds that clear on seed 7 (`LEVEL=medium LIST=1 npx tsx scripts/tune.ts 7 0`): Level 1 430 of 694 (any
build with 2, 4 or 8 flies), Level 2 94 of 694, Level 3 39 of 694. One fly or 16 flies never clears.
A few cheap Level 3 builds (bitter ×1, threat ×0.5–0.75) clear on seed 7 by luck: about 3 of 12 other seeds.

## Limitations (say these)

- The learning rule is authored by us; the effect of each weight level is measured on the model.
- Every lookup is a fresh 200 ms trial from rest; no spike/voltage history carries over.
- Walking, the route to the fruit, jump direction, cooldowns, energy/poison, egg laying and safe/harmful
  labels are game mechanics.
- Seed coverage is limited (model seed 0 complete incl. water; seed 1 for most conditions).
- Citronella is a proxy (bitter contact), not a smell; the smell route seized the model. The water
  drinking threshold (10 Hz) is ours.
- DNp09 (forward walking) never fired in tested conditions, so walking is authored. MDN is shown but unused.
- The swarm sharing one set of weights is a game rule, as are swarm size, food portions and the score.
- The brain monitor layout is schematic, not anatomy; the rates on it are model runs.

## Backup

Record the full sequence once by 2:15 in case the live demo fails. `http://localhost:4173/dev.html` is
the plain harness fallback.
