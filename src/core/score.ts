// Authored scoring of a finished run. Rewards getting flies across and laying, keeping them
// healthy, and doing it with a small swarm and a cheap brain.

import { buildCost } from "./config";
import type { BuildConfig, RunRecord } from "./types";
import { WAVES } from "./waves";

export interface Score {
  total: number;
  parts: { label: string; detail: string; points: number }[];
}

export function score(r: RunRecord, base: BuildConfig): Score {
  const m = r.metrics;
  const unspent = Math.max(0, WAVES[r.wave].budget - buildCost(r.config, base));
  const lost = m.flies - m.fliesAlive;
  const parts = [
    { label: "Level cleared", detail: r.result === "survived" ? "yes" : "no", points: r.result === "survived" ? 500 : 0 },
    { label: "Flies across and laying", detail: `${m.fliesAcross}`, points: m.fliesAcross * 200 },
    { label: "Eggs laid", detail: `${m.eggsLaid}`, points: m.eggsLaid * 50 },
    { label: "Health left", detail: `${m.healthLeft}`, points: m.healthLeft },
    { label: "Flies lost", detail: `${lost} of ${m.flies}`, points: -100 * lost },
    { label: "Unspent points", detail: r.result === "survived" ? `${unspent}` : "only on a cleared level", points: r.result === "survived" ? unspent * 75 : 0 },
  ];
  return { total: Math.max(0, parts.reduce((a, p) => a + p.points, 0)), parts };
}
