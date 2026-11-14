// Paired comparisons and replay helpers (v6 §9). Pairs share world seed, schedule, starting
// state, body controller and neural seed policy; only the named difference changes.

import type { Brain } from "../brain";
import { Sim } from "./sim";
import type { BuildConfig, Decision, GameEvent, RunRecord, WaveId } from "./types";

export function frozenTwin(cfg: BuildConfig): BuildConfig {
  return { ...structuredClone(cfg), policy: { bitter: "frozen", loomGf: "frozen" } };
}

export function runPair(brain: Brain, wave: WaveId, seed: number, a: BuildConfig, b: BuildConfig): [RunRecord, RunRecord] {
  return [new Sim(brain, { wave, seed, config: a }).runToEnd(), new Sim(brain, { wave, seed, config: b }).runToEnd()];
}

/** First decision tick where the two runs did different things (or saw different input). */
export function firstDivergence(a: RunRecord, b: RunRecord): { t: number; a: Decision | null; b: Decision | null } | null {
  const n = Math.max(a.decisions.length, b.decisions.length);
  for (let i = 0; i < n; i++) {
    const da = a.decisions[i] ?? null;
    const db = b.decisions[i] ?? null;
    if (!da || !db || da.t !== db.t || da.action !== db.action || da.conditionId !== db.conditionId)
      return { t: Math.min(da?.t ?? Infinity, db?.t ?? Infinity), a: da, b: db };
  }
  return null;
}

/** Events worth opening in the causal replay: weight updates, damage, interrupted meals. */
export function decisiveEvents(r: RunRecord): GameEvent[] {
  return r.events.filter(
    (e) => e.learning?.applied || e.outcome === "poisoned" || e.outcome === "threat_hit" || e.outcome === "threat_escaped",
  );
}

/** Everything the replay panel shows for one event, linked through the decision log. */
export function replay(r: RunRecord, e: GameEvent): { event: GameEvent; decision: Decision | null; before: Decision[] } {
  const decision = r.decisions.find((d) => d.id === e.lastDecisionId) ?? null;
  const rel = r.decisions.filter((d) => d.t <= e.t && ((e.servingId && d.servingId === e.servingId) || (e.threatId && d.threatId === e.threatId)));
  return { event: e, decision, before: rel.slice(-8) };
}
