// Authored constants: body controller, game mechanics, learning policy, budget.
// None of these are biological measurements. Changing any of them bumps CONTROLLER_VERSION
// (or LEARNING_RULE_VERSION) so saved runs say which rules produced them.

import type { BuildConfig, Group, Policy } from "./types";

export const CORE_VERSION = "core-0.6.0";
export const CONTROLLER_VERSION = "body-3";
export const LEARNING_RULE_VERSION = "event-step-1";
export const NEURAL_SEED_POLICY = "replicate = hash(worldSeed, decisionKey) mod availableSeeds";

export const ARENA = { w: 800, h: 500 };

export const CTRL = {
  dt: 0.05, // simulation step, s
  decisionEvery: 0.25, // one neural lookup (a 200 ms reset-state trial) per decision tick
  walkSpeed: 110, // authored forward walking, units/s
  contactRadius: 14,
  feedMn9Hz: 30, // MN9 at or above: feed
  drinkMn9Hz: 10, // MN9 at or above on water/soda: drink (water alone only reaches ~15-20 Hz)
  drinkFullMn9Hz: 50, // drinking reaches full speed at this MN9 (soda); plain water ~20 Hz is slower
  escapeGfHz: 150, // Giant Fibre at or above: jump
  servingSeconds: 1.2, // a serving takes this long at MN9 = 100 Hz
  refuseAfterTicks: 2, // consecutive no-threat sub-threshold ticks before leaving a serving
  refuseRetrySeconds: 5,
  jumpDistance: 230,
  jumpSeconds: 0.35,
  escapeCooldown: 1.5,
  threatRadius: 170, // inside this, the fly receives the threat's looming input
  hitRadius: 70,
  needLevel: 60, // boss route: detour for food/water below this, otherwise head for the fruit
  needLevelAtFruit: 30, // once laying, only leave the fruit when this low
  eggSeconds: 1.5,
} as const;

export const GAME = {
  maxHealth: 100,
  maxEnergy: 100,
  startEnergy: 50,
  energyDrainPerS: 2.0,
  servingEnergy: 22,
  maxHydration: 100,
  startHydration: 70,
  drinkHydration: 35,
  sodaEnergy: 12,
  eggEnergy: 3,
  eggMinReserve: 15, // energy and water needed to lay
  poisonDamage: 30,
  swatDamage: 40,
  fogDamage: 25,
} as const;

/** Qualifying events needed for a one-level step. Balance parameters, not biology. */
export const POLICY_THRESHOLD: Record<Policy, number> = {
  frozen: Infinity,
  conservative: 3,
  responsive: 1,
};

export const SUGAR_COST = { 100: 0, 200: 2 } as const;
export const POLICY_COST: Record<Policy, number> = { frozen: 0, conservative: 0, responsive: 1 };

/** Index of 1.0 (unmodified connectome) in each scale list. */
export function baselineLevels(scales: Record<Group, number[]>): Record<Group, number> {
  return { bitter: scales.bitter.indexOf(1), loomGf: scales.loomGf.indexOf(1) };
}

/**
 * Budget cost of a build relative to `base` (the wave's starting build: baseline on a fresh
 * campaign, the carried-over adapted build after advancing). Each level moved costs 1.
 */
export function buildCost(cfg: BuildConfig, base: BuildConfig): number {
  return (
    Math.abs(cfg.bitterLevel - base.bitterLevel) +
    Math.abs(cfg.loomGfLevel - base.loomGfLevel) +
    Math.max(0, SUGAR_COST[cfg.sugarHz] - SUGAR_COST[base.sugarHz]) +
    POLICY_COST[cfg.policy.bitter] +
    POLICY_COST[cfg.policy.loomGf]
  );
}

export function thresholdsSnapshot(): Record<string, number> {
  return {
    feedMn9Hz: CTRL.feedMn9Hz,
    escapeGfHz: CTRL.escapeGfHz,
    decisionEvery: CTRL.decisionEvery,
    conservative: POLICY_THRESHOLD.conservative,
    responsive: POLICY_THRESHOLD.responsive,
  };
}
