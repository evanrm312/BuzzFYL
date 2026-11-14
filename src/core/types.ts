// Core ↔ UI contract. Core owns everything here; UI reads it and dispatches commands
// (see sim.ts and docs/CORE_CONTRACT.md). All records are plain JSON so they can be saved,
// replayed and compared.

import type { BrainState, Readout, Stimulus } from "../brain";

export type Group = "bitter" | "loomGf";
export type Policy = "frozen" | "conservative" | "responsive";
export type Direction = "weaken" | "strengthen";
export type SugarSetting = 100 | 200;

/** What the player chooses on the workbench. */
export interface BuildConfig {
  sugarHz: SugarSetting; // input setting, not a learned weight
  bitterLevel: number; // index into grid.bitter_scale
  loomGfLevel: number; // index into grid.loom_gf_scale
  policy: Record<Group, Policy>;
  swarm?: number; // points spent doubling the swarm on route levels: 0 → 1 fly, 1 → 2 … 4 → 16
}

export interface Evidence {
  direction: Direction | null;
  count: number; // qualifying events toward `direction` since the last update/reset
}

/** Live adaptive state of one weight group. */
export interface GroupState {
  startLevel: number;
  level: number;
  evidence: Evidence;
  threshold: number; // events needed; Infinity when frozen (serialised as null)
  updates: number;
}

export type WaveId = "feeding" | "threats" | "combined" | "easy" | "medium" | "boss";

// citronella: food near a candle, coated with repellent (bitter input, safe to eat).
// water: droplet (water input). soda: spilled drink (sugar + water input).
export type FoodKind = "clean" | "safe_bitter" | "poison_bitter" | "citronella" | "water" | "soda";

export interface Serving {
  id: string;
  kind: FoodKind;
  x: number;
  y: number;
  spawnAt: number;
  expiresAt: number;
  progress: number; // 0..1, kept across interruptions
  portions: number; // flies it can still feed; shared by the swarm
  status: "pending" | "available" | "eaten" | "expired";
  refusedUntil: number; // body controller will not retry before this time
}

export type ThreatKind = "shadow" | "swat" | "fog";

export interface Threat {
  id: string;
  kind: ThreatKind;
  harmful: boolean;
  startAt: number;
  ramp: number[]; // looming Hz per decision tick while active
  x: number;
  y: number;
  tracking: boolean; // swatter follows its target fly until that fly jumps
  target: number; // id of the fly it is aimed at
  exposed: boolean; // the fly received looming input from it at least once
  jumped: boolean; // some fly jumped from it (each fly escapes a threat at most once)
  status: "pending" | "active" | "hit" | "missed" | "passed";
}

export type Action = "idle" | "walking" | "feeding" | "drinking" | "suppressed" | "refusing" | "escaping" | "laying";

/** One neural lookup and what the body controller did with it. */
export interface Decision {
  id: string; // stable key, also used to choose the neural replicate
  t: number;
  flyId: number;
  neuronsActive: number; // neurons that spiked in the looked-up model run
  servingId: string | null;
  threatId: string | null;
  requested: Stimulus;
  stimulus: Stimulus; // supported grid stimulus actually used
  conditionId: string;
  replicateSeed: number;
  readouts: Record<Readout, number>;
  state: BrainState;
  action: Action;
  reason: string; // which threshold decided it, in plain words
}

export type Outcome =
  | "serving_completed"
  | "drink_completed"
  | "reached_fruit"
  | "egg_laid"
  | "serving_refused"
  | "poisoned"
  | "threat_harmless"
  | "threat_hit"
  | "threat_escaped"
  | "threat_missed"; // dangerous attack missed without a jump

/** A resolved world event and any learning it caused. */
export interface GameEvent {
  id: string;
  t: number;
  outcome: Outcome;
  flyId?: number;
  servingId?: string;
  threatId?: string;
  foodKind?: FoodKind;
  exposed: boolean;
  feedback: string; // how the game-defined signal arrived
  learning: LearningRecord | null;
  lastDecisionId: string | null;
}

export interface LearningRecord {
  group: Group;
  direction: Direction;
  policy: Policy;
  evidenceBefore: Evidence;
  evidenceAfter: Evidence;
  levelBefore: number;
  levelAfter: number;
  scaleBefore: number;
  scaleAfter: number;
  applied: boolean;
  note: string;
}

export interface FlyState {
  id: number;
  alive: boolean;
  death: "health" | "energy" | "thirst" | null;
  reachedFruitAt: number | null;
  eggs: number;
  progress: number;
  x: number;
  y: number;
  heading: number;
  health: number;
  energy: number;
  hydration: number;
  action: Action;
  airborneUntil: number;
  cooldownUntil: number;
  targetServing: string | null;
}

export interface Metrics {
  servingsCompleted: number;
  servingsRefused: number;
  poisonings: number;
  jumps: number;
  jumpsOnHarmless: number;
  attacksEscaped: number; // jumped before the strike and the strike missed
  attacksHit: number;
  feedingSuppressedTicks: number; // on food, MN9 below threshold under looming, no jump
  mealsInterruptedByJump: number;
  damageTaken: number;
  adaptations: number;
  drinks: number;
  eggsLaid: number;
  reachedFruitAt: number | null; // first fly to arrive
  flies: number;
  fliesAlive: number;
  fliesAcross: number; // alive, on the fruit side, and laid at least one egg
  healthLeft: number; // summed over living flies
  progress: number; // 0..1, closest approach to the fruit (1 only once reached); elapsed fraction on route-less waves
}

export interface RunRecord {
  version: { core: string; controller: string; learningRule: string; brainExportedAt: string | null };
  wave: WaveId;
  worldSeed: number;
  neuralSeedPolicy: string;
  config: BuildConfig;
  initialState: BrainState;
  finalState: BrainState;
  finalLevels: Record<Group, number>;
  thresholds: Record<string, number>;
  events: GameEvent[];
  decisions: Decision[];
  trajectory: { t: number; group: Group; level: number; scale: number }[];
  metrics: Metrics;
  // survived = alive at the end AND reached the fruit; not_crossed = alive but never got there
  result: "survived" | "not_crossed" | "wiped_out" | "died_health" | "died_energy" | "died_thirst" | "running";
  duration: number;
}
