# Demo script (target ready 2:30, demos 2:45)

Seeds and builds below come from `scripts/pickdemo.ts` and `npm run balance` (seed 0 lattice, controller body-1).
Open `http://localhost:5173/?seed=7` for wave 1, `?seed=2&wave=1` for wave 2.

## One-breath pitch

The player never steers. They choose how a real fly connectome starts (bitter-cell output
weight, looming→Giant Fibre weight, sugar input) and how readily it adapts, then release it.
Every eat/refuse/jump decision is a lookup of a real whole-brain run (Shiu LIF on FlyWire v783)
at the fly's current weights, and what happens to it moves those weights during the run.

## Sequence (~3 min)

1. **Workbench** (30 s). Wave 1. Show the bitter weight's measured MN9 bars: sugar+bitter MN9
   ≈ 100 / 68 / 38 / 5 / 3 Hz at ×0 / .25 / .5 / .75 / 1. Pick sugar 100, bitter ×0.25, bitter learning responsive (cost 4/4). Enter a prediction.
2. **Release** (45 s, 2× speed). Point at the brain panel: pending evidence fills on a safe
   bitter meal, the weight steps ×0.5→×0.25, the next meal's lookup uses the new weight.
   Then poison arrives: evidence flips, the weight steps back up.
3. **Decisive event replay** (30 s). Open the update: stimulus in, condition ID, replicate seed,
   MN9/GF, action and its reason, feedback signal, evidence before/after, scale before/after.
4. **Adaptive vs frozen** (30 s). Same seed, same start, same body controller. Show first
   divergence and the outcome difference (adaptation can help or hurt; show what happened).
5. **Wave 2 / boss glimpse** (20 s). Feeding suppressed without a jump (purple) vs escape jump
   (red) — different causes: measured MN9 drop vs authored meal interruption by the jump.
6. **Limitations** (20 s), below.

Picked pairs (adaptive vs frozen twin, same seed):

| Wave | Seed | Build | Adaptive | Frozen |
|---|---|---|---|---|
| 1 | 7 | sugar 100, bitter ×0.25 responsive | survives, 3 updates | dies: 4 poisonings |
| 2 | 2 | baseline weights, threat responsive | survives, eats 11 | survives, eats 9, 5 jumps on harmless shadows |

Wave 2 tradeoff to narrate: at looming 50 Hz a harmless shadow and a fast swat give the same input.
Lower threat weight stops false jumps but the fast swats hit; hits strengthen it back.

Known balance issues: in wave 3, very low threat weight (×0.5) is strong; the sweep budgets
from the baseline brain, while the campaign budgets from the carried-over adapted brain.

## Limitations (say these)

- The learning rule is authored by us; the effect of each weight level is measured on the model.
- Every lookup is a fresh 200 ms trial from rest; no spike/voltage history carries over.
- Walking, jump direction, cooldowns, energy/poison, and safe/harmful labels are game mechanics.
- Seed coverage is limited (seed 0 complete; more seeds where the export finished).
- DNp09 (forward walking) never fired in tested conditions, so walking is authored. MDN is shown but unused.

## Backup

Record the full sequence once by 2:15 in case the live demo fails.
