// Wave definitions and up-front schedule generation. A schedule depends only on (wave, seed),
// never on the fly's behaviour, so paired runs face the same world.

import { ARENA } from "./config";
import { stream } from "./rng";
import type { FoodKind, Serving, Threat, ThreatKind, WaveId } from "./types";

// Looming ramps, one value per decision tick (Hz of LC4/LPLC2 drive). The strike lands on the
// tick after the last value. Shadows rise and fall with no strike.
export const RAMPS = {
  shadow: [10, 20, 30, 40, 50, 50, 40, 20, 10],
  swat_slow: [10, 20, 30, 40, 50, 100, 150],
  swat_fast: [20, 50, 100],
  swat_snap: [30, 50],
  fog: [10, 20, 30, 40, 50, 50, 100],
} as const;
type RampName = keyof typeof RAMPS;

export interface WaveDef {
  id: WaveId;
  title: string;
  question: string;
  duration: number;
  budget: number;
  energyDrain?: number; // per second; GAME.energyDrainPerS when absent
  hydrationDrain?: number; // per second; no thirst when absent
  needsWater?: boolean; // every state must also have the water lattice measured
  start?: { x: number; y: number };
  fruit?: { x: number; y: number; r: number }; // egg-laying site; the route's destination
  candles?: { x: number; y: number }[]; // citronella candles: food beside them is coated
  foodLife?: number; // seconds a serving stays out (default 9)
  phases: { from: number; label: string }[];
  food: { at: number; kind: FoodKind; band?: [number, number] }[]; // band: x range on the route
  threats: { at: number; ramp: RampName }[];
  feedback: string[]; // how game-defined safety signals reach the fly, shown in briefing
}

const every = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let t = from; t < to; t += step) out.push(t);
  return out;
};

// route bands for the boss level: edge, middle, far side
const E: [number, number] = [60, 320];
const M: [number, number] = [260, 560];
const F: [number, number] = [500, 760];

export const WAVES: Record<WaveId, WaveDef> = {
  feeding: {
    id: "feeding",
    title: "Wave 1 — Feeding",
    question: "How readily should bitter experience change acceptance?",
    duration: 56,
    budget: 4,
    phases: [
      { from: 0, label: "Clean food" },
      { from: 10, label: "Bitter but safe" },
      { from: 30, label: "Bitter, mostly poisoned" },
    ],
    food: [
      ...every(1, 9, 4).map((at) => ({ at, kind: "clean" as const })),
      ...every(9, 30, 2.6).map((at) => ({ at, kind: "safe_bitter" as const })),
      ...every(30, 54, 2.0).map((at, i) => ({ at, kind: (i % 3 === 2 ? "safe_bitter" : "poison_bitter") as FoodKind })),
    ],
    threats: [],
    feedback: [
      "A completed bitter serving is followed by a game signal: 'safe' (energy arrives) or 'poisoned' (damage).",
      "Safe and poisoned bitter food give the same sensory input; the fly cannot tell them apart beforehand.",
    ],
  },
  threats: {
    id: "threats",
    title: "Wave 2 — Threats",
    question: "Can reduced threat sensitivity keep meals going without losing the escape?",
    duration: 53,
    budget: 3,
    energyDrain: 3.0,
    phases: [
      { from: 0, label: "Harmless shadows" },
      { from: 22, label: "Real swats" },
    ],
    food: every(1, 48, 3.2).map((at) => ({ at, kind: "clean" as const })),
    threats: [
      ...every(3, 22, 4).map((at) => ({ at, ramp: "shadow" as RampName })),
      { at: 23, ramp: "swat_slow" },
      { at: 32, ramp: "swat_fast" },
      { at: 37, ramp: "swat_snap" },
      { at: 44, ramp: "swat_fast" },
      { at: 47, ramp: "swat_snap" },
      { at: 50, ramp: "swat_snap" },
    ],
    feedback: [
      "A shadow that passes without contact is labelled harmless by the game when it ends.",
      "A swat that lands is damage. A swat that misses after a jump is not a false alarm.",
    ],
  },
  combined: {
    id: "combined",
    title: "Wave 3 — Combined",
    question: "How do interruptions change what the fly gets to learn from?",
    duration: 55,
    budget: 4,
    energyDrain: 2.4,
    phases: [
      { from: 0, label: "Bitter meals under shadows" },
      { from: 25, label: "Poison and swats" },
    ],
    food: [
      ...every(1, 25, 3).map((at, i) => ({ at, kind: (i % 3 === 0 ? "clean" : "safe_bitter") as FoodKind })),
      ...every(25, 53, 2.8).map((at, i) => ({ at, kind: (["poison_bitter", "clean", "safe_bitter", "poison_bitter"][i % 4]) as FoodKind })),
    ],
    threats: [
      ...every(4, 25, 5).map((at) => ({ at, ramp: "shadow" as RampName })),
      ...every(27, 53, 4.5).map((at, i) => ({ at, ramp: (["swat_fast", "shadow", "swat_snap", "swat_slow"][i % 4]) as RampName })),
    ],
    feedback: [
      "Same signals as waves 1 and 2. A serving interrupted by a jump gives no safe-food evidence until completed.",
    ],
  },
  boss: {
    id: "boss",
    title: "Boss — Across the Picnic",
    question: "Can the fly cross the picnic, refuel, and lay her eggs on the fruit before the fogger?",
    duration: 75,
    budget: 5,
    energyDrain: 2.2,
    hydrationDrain: 1.6,
    needsWater: true,
    start: { x: 50, y: 250 },
    fruit: { x: 735, y: 250, r: 45 },
    candles: [{ x: 330, y: 140 }, { x: 330, y: 360 }, { x: 470, y: 250 }],
    foodLife: 12,
    phases: [
      { from: 0, label: "Picnic edge: crumbs, droplets, passing guests" },
      { from: 22, label: "Citronella row: coated food, fogger bait, swats" },
      { from: 48, label: "The fogger arrives at the fruit" },
    ],
    food: [
      ...every(1, 22, 4).map((at) => ({ at, kind: "clean" as const, band: E })),
      ...every(3, 22, 5).map((at) => ({ at, kind: "water" as const, band: E })),
      ...every(22, 48, 3).map((at) => ({ at, kind: "citronella" as const, band: M })),
      ...every(24, 48, 4.5).map((at) => ({ at, kind: "poison_bitter" as const, band: M })),
      ...[26, 36, 46].map((at) => ({ at, kind: "water" as const, band: M })),
      ...[30, 40].map((at) => ({ at, kind: "soda" as const, band: M })),
      ...[50, 60, 70].map((at) => ({ at, kind: "water" as const, band: F })),
      ...[52, 62].map((at) => ({ at, kind: "clean" as const, band: F })),
      ...[56, 68].map((at) => ({ at, kind: "poison_bitter" as const, band: F })),
      { at: 64, kind: "soda", band: F },
    ],
    threats: [
      ...every(4, 22, 5).map((at) => ({ at, ramp: "shadow" as RampName })),
      { at: 25, ramp: "swat_slow" },
      { at: 29, ramp: "shadow" },
      { at: 33, ramp: "swat_fast" },
      { at: 37, ramp: "shadow" },
      { at: 41, ramp: "swat_snap" },
      ...every(50, 74, 4).map((at) => ({ at, ramp: "fog" as RampName })),
      { at: 54, ramp: "shadow" },
      { at: 58, ramp: "swat_snap" },
      { at: 66, ramp: "shadow" },
      { at: 71, ramp: "swat_fast" },
    ],
    feedback: [
      "Goal: reach the fruit bowl and lay eggs; score is eggs laid. Walking route and egg laying are authored.",
      "Citronella-coated food is bitter to the fly (contact-repellent proxy through bitter taste cells) but safe; fogger bait is bitter and poisoned. Same input, different consequence.",
      "Water droplets and soda spills are read through water taste cells; plain water only weakly drives MN9, so drinking is slow.",
      "Fog bursts land like a slow swat at the fruit: damage unless the fly has jumped clear.",
    ],
  },
};

export const WAVE_ORDER: WaveId[] = ["feeding", "threats", "combined", "boss"];

const kindOf = (ramp: RampName): ThreatKind =>
  ramp === "shadow" ? "shadow" : ramp === "fog" ? "fog" : "swat";

export function buildSchedule(wave: WaveDef, seed: number): { servings: Serving[]; threats: Threat[] } {
  const rnd = stream(seed ^ 0x9e3779b9);
  const margin = 60;
  const pos = () => ({
    x: margin + rnd() * (ARENA.w - 2 * margin),
    y: margin + rnd() * (ARENA.h - 2 * margin),
  });
  const place = (f: WaveDef["food"][number]) => {
    if (f.kind === "citronella" && wave.candles?.length) {
      const c = wave.candles[Math.floor(rnd() * wave.candles.length)];
      const a = rnd() * Math.PI * 2;
      return { x: c.x + Math.cos(a) * 30, y: c.y + Math.sin(a) * 30 };
    }
    const p = pos();
    if (f.band) p.x = f.band[0] + rnd() * (f.band[1] - f.band[0]);
    return p;
  };
  const servings: Serving[] = wave.food.map((f, i) => {
    const jitter = rnd() * 0.6;
    return {
      id: `food${i}`,
      kind: f.kind,
      ...place(f),
      spawnAt: f.at + jitter,
      expiresAt: f.at + jitter + (wave.foodLife ?? 9),
      progress: 0,
      status: "pending",
      refusedUntil: 0,
    };
  });
  const threats: Threat[] = wave.threats.map((th, i) => {
    const kind = kindOf(th.ramp);
    return {
      id: `threat${i}`,
      kind,
      harmful: kind !== "shadow",
      startAt: th.at + rnd() * 0.8,
      ramp: [...RAMPS[th.ramp]],
      x: 0,
      y: 0,
      tracking: kind === "swat",
      exposed: false,
      jumped: false,
      status: "pending",
    };
  });
  return { servings, threats };
}
