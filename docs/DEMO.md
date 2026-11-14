# Demo script (target ready 2:30, demos 2:45)

Run the **pinned build**: `npm run build && npx vite preview` → `http://localhost:4173/`. The build copies
the brain export at build time, so the background export cannot change outcomes mid-demo. (`npm run dev`
on 5173 reads the live file; replicate picks shift as seed 1 fills in.) Picnic seed is 7 by default
(`?seed=N` to change). Controller `body-5`. Picks below were checked against the committed snapshot
with `BRAIN=dist/data/brain_plastic.json npx tsx scripts/pickdemo.ts boss <sugar> <bitterLvl> <threatLvl> <pb> <pl>`.

## One-breath pitch

The player never steers. They choose how a real fly connectome starts (bitter-cell output weight,
looming→Giant Fibre weight, sugar input) and how readily it adapts, then release it across the picnic.
Every eat/drink/refuse/jump decision is a lookup of a real whole-brain run (Shiu LIF on FlyWire v783)
at the fly's current weights, and what happens to it moves those weights during the run.
Goal: reach the fruit and be alive when the encounter ends. Eggs are a bonus.

## Sequence (~3 min), all on seed 7, two flies unless noted

Purpose in one line: breed a brain, not a fly. You tune real connectome weights, release a swarm that
shares them, and watch which brains get two flies across to lay eggs. Score rewards eggs, health,
few flies lost and points left unspent.

1. **Level 1 · Garden Party → Scout: basic model** (4×). Unmodified brain clears it (18 eggs). Point at the
   brain map: nodes light with each lookup, the count in the middle is neurons that fired in that model run.
2. **Level 2 · Citronella Row, Scout again.** Fails: the flies refuse every coated serving (sugar + bitter
   MN9 ≈ 0 Hz) and one starves. The yellow haze marks where food tastes bitter.
3. **Workbench.** Sugar 200 Hz, bitter ×0.5, leave the rest (4 points). The "Sugar + bitter" bar now clears
   the 30 Hz line. Release: cleared, 21 eggs. **Compare Frozen Learning**: the frozen twin fails, because
   the adaptive swarm's safe citronella meals weakened the shared bitter weight further. Learning helped.
4. **Results → Replay the evidence**: input → measured MN9/GF → action → feedback → weight update, with the
   brain map for that lookup.
5. **Level 3 · Mack.** Scout is wiped out. Sugar 200, bitter ×0.25, threat ×1.5, both Conservative (7 points):
   cleared, 16 eggs. Same build with threat learning Responsive (8 points): wiped out, frozen twin survives.
   Learning hurt.
6. **Swarm** (if time): each point doubles the swarm; they share food, each lost fly costs 100, and 16
   flies is the limit and cannot win.
7. **Limitations** (20 s), below.

| Level | Build (seed 7, 2 flies) | Cost | Adaptive | Frozen twin |
|---|---|---|---|---|
| 1 | Scout | 0 | cleared, 18 eggs | cleared, 14 eggs |
| 2 | Scout | 0 | not cleared | wiped out |
| 2 | sugar 200, bitter ×0.5, threat ×1, conservative both | 4 | **cleared**, 21 eggs | not cleared |
| 2 | sugar 100, bitter ×0, threat ×1, conservative both | 4 | cleared, 24 eggs | cleared, 20 eggs |
| 3 | Scout | 0 | wiped out | not cleared |
| 3 | sugar 200, bitter ×0.25, threat ×1.5, conservative both | 7 | **cleared**, 16 eggs | cleared, 11 eggs |
| 3 | same, threat Responsive | 8 | **wiped out** | cleared, 11 eggs |

Builds that clear, seed 7, all swarm sizes within budget: Level 1 620 of 620, Level 2 161 of 620,
Level 3 64 of 620 (`LEVEL=medium npx tsx scripts/tune.ts 7 0`). A swarm of 16 never counts as a win.

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
