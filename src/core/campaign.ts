// Campaign, retry and notebook semantics (v6 §6, §9). Pure functions over plain records;
// persistence is localStorage when present, otherwise in-memory.

import { buildCost } from "./config";
import type { BuildConfig, RunRecord, WaveId } from "./types";
import { WAVE_ORDER, WAVES } from "./waves";

export interface Attempt {
  id: string;
  savedAt: string;
  prediction: string | null; // optional, recorded before release, never scored
  record: RunRecord;
  pairOf?: string; // id of the attempt this was compared against
}

export interface Campaign {
  waveIndex: number;
  base: BuildConfig; // wave's starting build: budget is spent relative to this
  selected: BuildConfig; // what Retry restores
  worldSeed: number; // Retry keeps it; New encounter changes it
}

export const wave = (c: Campaign): WaveId => WAVE_ORDER[c.waveIndex];

export function newCampaign(base: BuildConfig, worldSeed = 1): Campaign {
  return { waveIndex: 0, base, selected: structuredClone(base), worldSeed };
}

export function canAfford(c: Campaign, cfg: BuildConfig): boolean {
  return buildCost(cfg, c.base) <= WAVES[wave(c)].budget;
}

/** Retry: same starting build, same evidence counters (fresh), same encounter seed. */
export function retry(c: Campaign): { config: BuildConfig; seed: number } {
  return { config: structuredClone(c.selected), seed: c.worldSeed };
}

/** Final adapted levels as a starting build (same sugar input and policies). */
export function adaptedBuild(r: RunRecord): BuildConfig {
  return { ...structuredClone(r.config), bitterLevel: r.finalLevels.bitter, loomGfLevel: r.finalLevels.loomGf };
}

/**
 * Continue with adapted brain (explicit action): the final levels become the next starting
 * build. Levels reached by learning are free; deliberate changes from there cost budget.
 * On a survived run this also advances the wave.
 */
export function continueAdapted(c: Campaign, r: RunRecord): Campaign {
  const next = adaptedBuild(r);
  const advance = r.result === "survived" && c.waveIndex < WAVE_ORDER.length - 1;
  return {
    waveIndex: advance ? c.waveIndex + 1 : c.waveIndex,
    base: next,
    selected: structuredClone(next),
    worldSeed: advance ? c.worldSeed + 1 : c.worldSeed,
  };
}

// --- notebook ----------------------------------------------------------------

const KEY = "small-fly-notebook-v1";
let memory: Attempt[] = [];

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadNotebook(): Attempt[] {
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : memory;
  } catch {
    return memory;
  }
}

/** Every completed attempt is saved, failed ones included. */
export function saveAttempt(record: RunRecord, prediction: string | null = null, pairOf?: string): Attempt {
  const a: Attempt = {
    id: `${record.wave}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    savedAt: new Date().toISOString(),
    prediction,
    record,
    pairOf,
  };
  memory = [...loadNotebook(), a];
  try {
    storage()?.setItem(KEY, JSON.stringify(memory));
  } catch {
    // quota or privacy mode: keep the in-memory copy
  }
  return a;
}

/** Restore either the starting build of an attempt or its final adapted build. */
export function restoreBuild(a: Attempt, which: "start" | "final"): BuildConfig {
  return which === "start" ? structuredClone(a.record.config) : adaptedBuild(a.record);
}
