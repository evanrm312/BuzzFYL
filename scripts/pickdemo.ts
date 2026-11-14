// Find seeds where an adaptive build and its frozen twin end differently.
//   npx tsx scripts/pickdemo.ts wave sugar bitterLevel loomLevel bitterPolicy threatPolicy
import { frozenTwin, runPair } from "../src/core/compare";
import type { Policy, WaveId } from "../src/core/types";
import { loadBrain } from "./load";

const brain = loadBrain(process.env.BRAIN);
const [wave, sugar, b, l, pb, pl, swarm] = process.argv.slice(2);
const cfg = { sugarHz: Number(sugar) as 100 | 200, bitterLevel: Number(b), loomGfLevel: Number(l), policy: { bitter: pb as Policy, loomGf: pl as Policy }, swarm: Number(swarm ?? 1) };
for (let seed = 1; seed <= 12; seed++) {
  const [a, f] = runPair(brain, wave as WaveId, seed, cfg, frozenTwin(cfg));
  const m = (r: typeof a) => `${r.result.padEnd(12)} eggs ${r.metrics.eggsLaid} ate ${r.metrics.servingsCompleted} drank ${r.metrics.drinks} poison ${r.metrics.poisonings} hits ${r.metrics.attacksHit} falseJ ${r.metrics.jumpsOnHarmless} adapt ${r.metrics.adaptations}`;
  console.log(`seed ${String(seed).padStart(2)} adaptive ${m(a)} | frozen ${m(f)}`);
}
