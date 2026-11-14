// Balance probe: apply overrides to the boss, then count which UI-buildable builds win.
//   BRAIN=... O='{"energyDrain":2.4,"game":{"poisonDamage":40},"dropClean":2}' npx tsx scripts/tune.ts [seed=7] [nSeeds=5]
import { baselineLevels, buildCost, GAME } from "../src/core/config";
import { Sim } from "../src/core/sim";
import type { BuildConfig, Policy } from "../src/core/types";
import { WAVES } from "../src/core/waves";
import { loadBrain } from "./load";

const o = JSON.parse(process.env.O ?? "{}");
const level = (process.env.LEVEL ?? "boss") as "easy" | "medium" | "boss";
const boss = WAVES[level] as any;
for (const k of ["energyDrain", "hydrationDrain", "duration", "budget", "foodLife"]) if (o[k] != null) boss[k] = o[k];
Object.assign(GAME as any, o.game ?? {});
if (o.dropClean) { let i = 0; boss.food = boss.food.filter((f: any) => f.kind !== "clean" || i++ % o.dropClean === 0); }
if (o.dropKinds) boss.food = boss.food.filter((f: any) => !o.dropKinds.includes(f.kind));
const brain = loadBrain(process.env.BRAIN);
const seed = Number(process.argv[2] ?? 7), nSeeds = Number(process.argv[3] ?? 5);
const { bitterScale: bs, loomGfScale: ls } = brain.levels;
const b0 = baselineLevels({ bitter: bs, loomGf: ls });
const base: BuildConfig = { sugarHz: 100, bitterLevel: b0.bitter, loomGfLevel: b0.loomGf, policy: { bitter: "conservative", loomGf: "conservative" } };
const pols: Policy[] = ["conservative", "responsive"];
const rows: any[] = [];
for (const sugarHz of [100, 200] as const) for (let b = 0; b < 5; b++) for (let l = 0; l < 5; l++) for (const pb of pols) for (const pl of pols) for (let w = 0; w < 5; w++) {
  const cfg: BuildConfig = { sugarHz, bitterLevel: b, loomGfLevel: l, policy: { bitter: pb, loomGf: pl }, swarm: w };
  const cost = buildCost(cfg, base);
  if (cost > boss.budget) continue;
  const run = (s: number) => new Sim(brain, { wave: level, seed: s, config: cfg }).runToEnd();
  const r = run(seed);
  let wins = 0;
  for (let s = 1; s <= nSeeds; s++) wins += +(run(s).result === "survived");
  rows.push({ id: `${sugarHz} b${bs[b]} t${ls[l]} ${pb[0]}/${pl[0]} x${1 << w} $${cost}`, w, sugarHz, b, l, pb, pl, cost, res: r.result, eggs: r.metrics.eggsLaid, rate: wins / nSeeds });
}
const res: Record<string, number> = {};
for (const r of rows) res[r.res] = (res[r.res] ?? 0) + 1;
const won = rows.filter((r) => r.res === "survived");
console.log(level, JSON.stringify(o), `| ${won.length}/${rows.length} win seed ${seed}`, res, `| mean ${Math.round((rows.reduce((a, r) => a + r.rate, 0) / rows.length) * 100)}% over ${nSeeds} seeds | scout: ${rows.find((r) => r.cost === 0)?.res} ${rows.find((r) => r.cost === 0)?.rate}`);
const by = (name: string, f: (r: any) => string) => console.log(" ", name, [...new Set(rows.map(f))].sort().map((k) => `${k}:${won.filter((r) => f(r) === k).length}/${rows.filter((r) => f(r) === k).length}`).join("  "));
by("sugar", (r) => String(r.sugarHz)); by("bitter", (r) => `x${bs[r.b]}`); by("threat", (r) => `x${ls[r.l]}`); by("pb", (r) => r.pb); by("pl", (r) => r.pl); by("swarm", (r) => `${String(1 << r.w).padStart(2, "0")}`); by("cost", (r) => `$${r.cost}`);
if (process.env.LIST) for (const r of won) console.log("   ", r.id, "eggs", r.eggs, "rate", r.rate);
