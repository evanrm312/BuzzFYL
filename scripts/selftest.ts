// Invariants the v6 acceptance list depends on. Runs headless against the real export.
import { strict as assert } from "node:assert";
import { applyEvidence, newGroup } from "../src/core/learning";
import { Sim } from "../src/core/sim";
import type { BuildConfig } from "../src/core/types";
import { WAVE_ORDER } from "../src/core/waves";
import { loadBrain } from "./load";

const brain = loadBrain();
const scales = brain.levels.bitterScale;

// learning rule: thresholds, cancellation, clamping, frozen
{
  const g = newGroup(2, "conservative");
  const ok = () => true;
  applyEvidence("bitter", g, "conservative", "weaken", scales, ok);
  applyEvidence("bitter", g, "conservative", "weaken", scales, ok);
  assert.equal(g.level, 2);
  const r = applyEvidence("bitter", g, "conservative", "strengthen", scales, ok);
  assert.deepEqual(g.evidence, { direction: "strengthen", count: 1 }, "opposite evidence resets");
  assert.match(r.note, /discarded 2/);
  for (let i = 0; i < 2; i++) applyEvidence("bitter", g, "conservative", "strengthen", scales, ok);
  assert.equal(g.level, 3);
  const top = newGroup(4, "responsive");
  assert.equal(applyEvidence("bitter", top, "responsive", "strengthen", scales, ok).applied, false, "clamped");
  const fz = newGroup(2, "frozen");
  applyEvidence("bitter", fz, "frozen", "weaken", scales, ok);
  assert.deepEqual(fz.evidence, { direction: null, count: 0 });
  const blocked = newGroup(2, "responsive");
  assert.equal(applyEvidence("bitter", blocked, "responsive", "weaken", scales, () => false).applied, false);
}

// pick any fully measured state as a test build
const avail: BuildConfig[] = [];
for (let b = 0; b < scales.length; b++)
  for (let l = 0; l < brain.levels.loomGfScale.length; l++)
    if (brain.stateAvailable({ bitterScale: scales[b], loomGfScale: brain.levels.loomGfScale[l] }))
      avail.push({ sugarHz: 200, bitterLevel: b, loomGfLevel: l, policy: { bitter: "responsive", loomGf: "responsive" } });
assert.ok(avail.length > 0, "no fully measured state yet");
console.log(`${avail.length}/25 states fully measured`);

for (const wave of WAVE_ORDER) {
  const cfg = avail[0];
  const a = new Sim(brain, { wave, seed: 7, config: cfg }).runToEnd();
  const b = new Sim(brain, { wave, seed: 7, config: cfg }).runToEnd();
  assert.deepEqual(a, b, `${wave}: deterministic`);
  // one update at most per event, and only from the allowed event → group pairs
  for (const e of a.events) {
    if (!e.learning) continue;
    assert.ok(Math.abs(e.learning.levelAfter - e.learning.levelBefore) <= 1);
    if (e.learning.group === "bitter") assert.ok(e.foodKind === "safe_bitter" || e.foodKind === "poison_bitter");
    else assert.ok(e.outcome === "threat_harmless" || e.outcome === "threat_hit");
    assert.ok(e.exposed);
  }
  assert.equal(new Set(a.events.map((e) => e.id)).size, a.events.length, "unique event ids");
  assert.equal(new Set(a.decisions.map((d) => d.id)).size, a.decisions.length, "unique decision keys");
  // frozen twin starts identical and never adapts
  const frozen = new Sim(brain, { wave, seed: 7, config: { ...cfg, policy: { bitter: "frozen", loomGf: "frozen" } } }).runToEnd();
  assert.equal(frozen.metrics.adaptations, 0);
  assert.deepEqual(frozen.initialState, a.initialState);
  console.log(`${wave.padEnd(9)} ${a.result.padEnd(12)} adapt ${a.metrics.adaptations}  frozen ${frozen.result}`);
}
console.log("selftest ok");
