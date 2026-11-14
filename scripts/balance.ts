// Sweep builds × seeds per wave to find dominant configurations (v6 §7: if maximal settings win
// everywhere, revise costs/encounters rather than claim a tradeoff).
//   npx tsx scripts/balance.ts [wave] [seeds=12]
import { baselineLevels, buildCost } from "../src/core/config";
import { Sim } from "../src/core/sim";
import type { BuildConfig, Policy, WaveId } from "../src/core/types";
import { WAVE_ORDER, WAVES } from "../src/core/waves";
import { loadBrain } from "./load";

const brain = loadBrain();
const { bitterScale, loomGfScale } = brain.levels;
const base0 = baselineLevels({ bitter: bitterScale, loomGf: loomGfScale });
const waves = (process.argv[2] ? [process.argv[2]] : WAVE_ORDER) as WaveId[];
const nSeeds = Number(process.argv[3] ?? 12);
const policies: Policy[] = ["frozen", "conservative", "responsive"];
const baseline: BuildConfig = {
  sugarHz: 100,
  bitterLevel: base0.bitter,
  loomGfLevel: base0.loomGf,
  policy: { bitter: "frozen", loomGf: "frozen" },
};

const builds: BuildConfig[] = [];
for (const sugarHz of [100, 200] as const)
  for (let b = 0; b < bitterScale.length; b++)
    for (let l = 0; l < loomGfScale.length; l++)
      for (const pb of policies)
        for (const pl of policies)
          if (brain.stateAvailable({ bitterScale: bitterScale[b], loomGfScale: loomGfScale[l] }))
            builds.push({ sugarHz, bitterLevel: b, loomGfLevel: l, policy: { bitter: pb, loomGf: pl } });

const label = (c: BuildConfig) =>
  `s${c.sugarHz} b${bitterScale[c.bitterLevel]} l${loomGfScale[c.loomGfLevel]} ${c.policy.bitter[0]}${c.policy.loomGf[0]}`;

for (const wave of waves) {
  const rows = builds.map((cfg) => {
    let survived = 0, hp = 0, eaten = 0, hits = 0, falseJumps = 0, adapt = 0, poison = 0;
    for (let seed = 1; seed <= nSeeds; seed++) {
      const r = new Sim(brain, { wave, seed, config: cfg }).runToEnd();
      if (r.result === "survived") survived++;
      hp += r.result === "survived" ? 1 : 0;
      eaten += r.metrics.servingsCompleted;
      hits += r.metrics.attacksHit;
      falseJumps += r.metrics.jumpsOnHarmless;
      adapt += r.metrics.adaptations;
      poison += r.metrics.poisonings;
    }
    const n = nSeeds;
    return { cfg, cost: buildCost(cfg, baseline), surv: survived / n, eaten: eaten / n, hits: hits / n, falseJumps: falseJumps / n, adapt: adapt / n, poison: poison / n };
  });
  const budget = WAVES[wave].budget;
  rows.sort((a, b) => b.surv - a.surv || a.cost - b.cost);
  console.log(`\n== ${wave} (budget ${budget}, ${builds.length} builds × ${nSeeds} seeds) ==`);
  console.log("surv  cost  eaten poison hits falseJ adapt  build");
  const show = (r: (typeof rows)[0]) =>
    console.log(`${(r.surv * 100).toFixed(0).padStart(4)}% ${String(r.cost).padStart(4)} ${r.eaten.toFixed(1).padStart(6)} ${r.poison.toFixed(1).padStart(6)} ${r.hits.toFixed(1).padStart(4)} ${r.falseJumps.toFixed(1).padStart(6)} ${r.adapt.toFixed(1).padStart(5)}  ${label(r.cfg)}`);
  rows.filter((r) => r.cost <= budget).slice(0, 12).forEach(show);
  const inBudget = rows.filter((r) => r.cost <= budget);
  const winners = inBudget.filter((r) => r.surv >= 0.75);
  console.log(`in budget: ${inBudget.length}, ≥75% survival: ${winners.length}`);
  const bl = rows.find((r) => label(r.cfg) === label(baseline));
  if (bl) { console.log("baseline:"); show(bl); }
}
