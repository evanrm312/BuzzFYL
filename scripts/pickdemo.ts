// Find seeds where an adaptive build and its frozen twin end differently.
import { frozenTwin, runPair } from "../src/core/compare";
import type { BuildConfig, WaveId } from "../src/core/types";
import { loadBrain } from "./load";

const brain = loadBrain();
const cases: [WaveId, BuildConfig][] = [
  ["feeding", { sugarHz: 100, bitterLevel: 1, loomGfLevel: 2, policy: { bitter: "responsive", loomGf: "frozen" } }],
  ["threats", { sugarHz: 100, bitterLevel: 4, loomGfLevel: 2, policy: { bitter: "frozen", loomGf: "responsive" } }],
];
for (const [wave, cfg] of cases)
  for (let seed = 1; seed <= 12; seed++) {
    const [a, b] = runPair(brain, wave, seed, cfg, frozenTwin(cfg));
    console.log(wave, seed, `adaptive ${a.result} hp ${100 - a.metrics.damageTaken} ate ${a.metrics.servingsCompleted} adapt ${a.metrics.adaptations}`, `| frozen ${b.result} ate ${b.metrics.servingsCompleted} poison ${b.metrics.poisonings} hits ${b.metrics.attacksHit} falseJ ${b.metrics.jumpsOnHarmless}`);
  }
