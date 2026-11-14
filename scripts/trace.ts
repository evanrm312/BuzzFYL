// Print one run's events: npx tsx scripts/trace.ts wave seed sugar bitterLevel loomLevel pb pl
import { Sim } from "../src/core/sim";
import type { Policy, WaveId } from "../src/core/types";
import { loadBrain } from "./load";

const [wave, seed, sugar, b, l, pb, pl] = process.argv.slice(2);
const r = new Sim(loadBrain(), {
  wave: wave as WaveId,
  seed: Number(seed),
  config: { sugarHz: Number(sugar) as 100 | 200, bitterLevel: Number(b), loomGfLevel: Number(l), policy: { bitter: pb as Policy, loomGf: pl as Policy } },
}).runToEnd();
for (const e of r.events)
  console.log(e.t.toFixed(1).padStart(5), e.outcome.padEnd(18), (e.foodKind ?? e.threatId ?? "").padEnd(14), e.learning ? `${e.learning.group} ${e.learning.note} ×${e.learning.scaleBefore}→×${e.learning.scaleAfter}` : "");
console.log(r.result, r.duration, JSON.stringify(r.metrics));
