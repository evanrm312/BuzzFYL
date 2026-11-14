// Full feature matrix: every adjustable brain setting × learning policy, on every wave, over
// several world seeds. Writes docs/matrix/<wave>.csv (one row per build) and
// docs/matrix/MATRIX.md (per-feature effects + best builds).
//   npx tsx scripts/matrix.ts [seeds=10] [wave ...]
import { mkdirSync, writeFileSync } from "node:fs";
import { baselineLevels, buildCost } from "../src/core/config";
import { Sim } from "../src/core/sim";
import type { BuildConfig, Policy, WaveId } from "../src/core/types";
import { WAVE_ORDER, WAVES } from "../src/core/waves";
import { loadBrain } from "./load";

const brain = loadBrain(process.env.BRAIN);
const nSeeds = Number(process.argv[2] ?? 10);
const waves = (process.argv.length > 3 ? process.argv.slice(3) : WAVE_ORDER) as WaveId[];
const { bitterScale, loomGfScale } = brain.levels;
const b0 = baselineLevels({ bitter: bitterScale, loomGf: loomGfScale });
const baseline: BuildConfig = { sugarHz: 100, bitterLevel: b0.bitter, loomGfLevel: b0.loomGf, policy: { bitter: "frozen", loomGf: "frozen" } };
const policies: Policy[] = ["frozen", "conservative", "responsive"];

const builds: BuildConfig[] = [];
for (const sugarHz of [100, 200] as const)
  for (let b = 0; b < bitterScale.length; b++)
    for (let l = 0; l < loomGfScale.length; l++)
      for (const pb of policies)
        for (const pl of policies) builds.push({ sugarHz, bitterLevel: b, loomGfLevel: l, policy: { bitter: pb, loomGf: pl } });

type Row = {
  sugar: number; bitter: number; loomGf: number; pBitter: Policy; pLoom: Policy; cost: number; inBudget: boolean;
  survival: number; eggs: number; eaten: number; drinks: number; poison: number; hits: number; escaped: number;
  falseJumps: number; suppressed: number; adaptations: number; deathHealth: number; deathEnergy: number; deathThirst: number;
};
const cols: (keyof Row)[] = ["sugar", "bitter", "loomGf", "pBitter", "pLoom", "cost", "inBudget", "survival", "eggs", "eaten", "drinks", "poison", "hits", "escaped", "falseJumps", "suppressed", "adaptations", "deathHealth", "deathEnergy", "deathThirst"];

mkdirSync("docs/matrix", { recursive: true });
let md = `# Feature matrix\n\n${builds.length} builds (sugar input 2 × bitter weight 5 × looming→GF weight 5 × bitter policy 3 × threat policy 3) × ${nSeeds} world seeds per wave. Mean per run. Controller and learning rule as in \`src/core/config.ts\`; neural responses are lookups of the seed-0+ lattice. Cost is relative to the unmodified brain.\n`;

for (const wave of waves) {
  const t0 = Date.now();
  const def = WAVES[wave];
  const rows: Row[] = [];
  for (const cfg of builds) {
    const st = { bitterScale: bitterScale[cfg.bitterLevel], loomGfScale: loomGfScale[cfg.loomGfLevel] };
    if (!brain.stateAvailable(st, !!def.needsWater)) continue;
    const acc = { survival: 0, eggs: 0, eaten: 0, drinks: 0, poison: 0, hits: 0, escaped: 0, falseJumps: 0, suppressed: 0, adaptations: 0, deathHealth: 0, deathEnergy: 0, deathThirst: 0 };
    for (let seed = 1; seed <= nSeeds; seed++) {
      const r = new Sim(brain, { wave, seed, config: cfg }).runToEnd();
      const m = r.metrics;
      acc.survival += +(r.result === "survived");
      acc.deathHealth += +(r.result === "died_health");
      acc.deathEnergy += +(r.result === "died_energy");
      acc.deathThirst += +(r.result === "died_thirst");
      acc.eggs += m.eggsLaid; acc.eaten += m.servingsCompleted; acc.drinks += m.drinks; acc.poison += m.poisonings;
      acc.hits += m.attacksHit; acc.escaped += m.attacksEscaped; acc.falseJumps += m.jumpsOnHarmless;
      acc.suppressed += m.feedingSuppressedTicks; acc.adaptations += m.adaptations;
    }
    for (const k of Object.keys(acc) as (keyof typeof acc)[]) acc[k] = Math.round((acc[k] / nSeeds) * 100) / 100;
    const cost = buildCost(cfg, baseline);
    rows.push({ sugar: cfg.sugarHz, bitter: bitterScale[cfg.bitterLevel], loomGf: loomGfScale[cfg.loomGfLevel], pBitter: cfg.policy.bitter, pLoom: cfg.policy.loomGf, cost, inBudget: cost <= def.budget, ...acc });
  }
  writeFileSync(`docs/matrix/${wave}.csv`, [cols.join(","), ...rows.map((r) => cols.map((c) => r[c]).join(","))].join("\n") + "\n");

  const score = (r: Row) => r.survival * 100 + r.eggs;
  const mean = (rs: Row[], k: keyof Row) => rs.reduce((a, r) => a + (r[k] as number), 0) / Math.max(1, rs.length);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  md += `\n## ${def.title} (budget ${def.budget}, ${rows.length} measured builds)\n\n### Effect of each feature (mean over all other settings)\n\n| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  const feats: [string, keyof Row, (string | number)[]][] = [
    ["Sugar input (Hz)", "sugar", [100, 200]],
    ["Bitter-cell output weight", "bitter", bitterScale],
    ["Looming→GF weight", "loomGf", loomGfScale],
    ["Bitter policy", "pBitter", policies],
    ["Threat policy", "pLoom", policies],
  ];
  for (const [name, key, vals] of feats)
    for (const v of vals) {
      const rs = rows.filter((r) => r[key] === v);
      md += `| ${name} | ${v} | ${pct(mean(rs, "survival"))} | ${mean(rs, "eggs").toFixed(1)} | ${mean(rs, "eaten").toFixed(1)} | ${mean(rs, "drinks").toFixed(1)} | ${mean(rs, "poison").toFixed(1)} | ${mean(rs, "hits").toFixed(1)} | ${mean(rs, "falseJumps").toFixed(1)} | ${mean(rs, "adaptations").toFixed(1)} |\n`;
    }
  const top = rows.filter((r) => r.inBudget).sort((a, b) => score(b) - score(a) || a.cost - b.cost).slice(0, 8);
  md += `\n### Best in-budget builds\n\n| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of top) md += `| ${r.sugar} | ×${r.bitter} | ×${r.loomGf} | ${r.pBitter}/${r.pLoom} | ${r.cost} | ${pct(r.survival)} | ${r.eggs} | ${r.eaten} | ${r.drinks} | ${r.poison} | ${r.hits} |\n`;
  const bl = rows.find((r) => r.sugar === 100 && r.bitter === 1 && r.loomGf === 1 && r.pBitter === "frozen" && r.pLoom === "frozen");
  if (bl) md += `\nUnmodified brain, frozen: survival ${pct(bl.survival)}, eggs ${bl.eggs}, eaten ${bl.eaten}, drinks ${bl.drinks}.\n`;
  const viable = rows.filter((r) => r.inBudget && r.survival >= 0.75).length;
  md += `In budget with ≥75% survival: ${viable} of ${rows.filter((r) => r.inBudget).length}.\n`;
  console.log(`${wave}: ${rows.length} builds × ${nSeeds} seeds in ${((Date.now() - t0) / 1000).toFixed(0)}s, ${viable} viable`);
}
writeFileSync("docs/matrix/MATRIX.md", md);
