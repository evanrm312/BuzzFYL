// Which builds the UI can make (responsive/conservative, within budget) win the boss, and why.
//   BRAIN=dist/data/brain_plastic.json npx tsx scripts/winners.ts [seed=7] [nSeeds=10]
import { baselineLevels, buildCost } from "../src/core/config";
import { Sim } from "../src/core/sim";
import type { BuildConfig, Policy } from "../src/core/types";
import { WAVES } from "../src/core/waves";
import { loadBrain } from "./load";

const brain = loadBrain(process.env.BRAIN);
const seed = Number(process.argv[2] ?? 7);
const nSeeds = Number(process.argv[3] ?? 10);
const { bitterScale, loomGfScale } = brain.levels;
const b0 = baselineLevels({ bitter: bitterScale, loomGf: loomGfScale });
const base: BuildConfig = { sugarHz: 100, bitterLevel: b0.bitter, loomGfLevel: b0.loomGf, policy: { bitter: "conservative", loomGf: "conservative" } };
const pols: Policy[] = ["conservative", "responsive"];
const rows: { cfg: BuildConfig; cost: number; res: string; eggs: number; rate: number; why: Record<string, number> }[] = [];
for (const sugarHz of [100, 200] as const)
  for (let b = 0; b < 5; b++)
    for (let l = 0; l < 5; l++)
      for (const pb of pols)
        for (const pl of pols) {
          const cfg: BuildConfig = { sugarHz, bitterLevel: b, loomGfLevel: l, policy: { bitter: pb, loomGf: pl } };
          const cost = buildCost(cfg, base);
          if (cost > WAVES.boss.budget) continue;
          const r = new Sim(brain, { wave: "boss", seed, config: cfg }).runToEnd();
          let wins = 0;
          const why: Record<string, number> = {};
          for (let s = 1; s <= nSeeds; s++) {
            const x = new Sim(brain, { wave: "boss", seed: s, config: cfg }).runToEnd();
            wins += +(x.result === "survived");
            why[x.result] = (why[x.result] ?? 0) + 1;
          }
          rows.push({ cfg, cost, res: r.result, eggs: r.metrics.eggsLaid, rate: wins / nSeeds, why });
        }
const tally = (f: (r: (typeof rows)[number]) => string) => {
  const t: Record<string, string> = {};
  for (const k of [...new Set(rows.map(f))].sort()) {
    const rs = rows.filter((r) => f(r) === k);
    t[k] = `${rs.filter((r) => r.res === "survived").length}/${rs.length} win seed ${seed}, mean ${Math.round((rs.reduce((a, r) => a + r.rate, 0) / rs.length) * 100)}% over ${nSeeds} seeds`;
  }
  return t;
};
const won = rows.filter((r) => r.res === "survived");
console.log(`${rows.length} affordable builds; ${won.length} win on seed ${seed}`);
const res: Record<string, number> = {};
for (const r of rows) res[r.res] = (res[r.res] ?? 0) + 1;
console.log("seed", seed, "results:", res);
console.log("by cost", tally((r) => String(r.cost)));
console.log("by sugar", tally((r) => String(r.cfg.sugarHz)));
console.log("by bitter", tally((r) => `x${bitterScale[r.cfg.bitterLevel]}`));
console.log("by threat", tally((r) => `x${loomGfScale[r.cfg.loomGfLevel]}`));
console.log("by bitter policy", tally((r) => r.cfg.policy.bitter));
console.log("by threat policy", tally((r) => r.cfg.policy.loomGf));
console.log("by threat x policy", tally((r) => `x${loomGfScale[r.cfg.loomGfLevel]} ${r.cfg.policy.loomGf}`));
console.log("by sugar x bitter", tally((r) => `${r.cfg.sugarHz} x${bitterScale[r.cfg.bitterLevel]}`));
