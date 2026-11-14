// Game-side adapter for the precomputed whole-brain lattice (public/data/brain_plastic.json).
//
// The brain never runs live. Every response the game uses is one real simulation run
// (Shiu LIF on FlyWire v783), looked up by brain state + stimulus. Nothing is interpolated
// and nothing is synthesised: an unsupported request throws.

export type Readout = "mn9" | "giant_fibre" | "mdn";
export type Sensory = "sugar" | "bitter" | "looming";

/** Persistent synapse scaling the fly carries between runs (what "learning" changes). */
export interface BrainState {
  bitterScale: number; // outgoing weight of bitter GRNs
  loomGfScale: number; // LC4/LPLC2 -> Giant Fibre weight
}

export interface Stimulus {
  sugar: number;
  bitter: number;
  looming: number;
}

export interface Run {
  seed: number;
  readouts_hz: Record<Readout, number>;
  sensory_hz: Record<Sensory, number>;
  neurons_active: number;
  trace_hz?: Record<Readout | Sensory, number[]>;
}

interface Condition {
  state: { bitter_scale: number; loom_gf_scale: number };
  stimulus_hz: Stimulus;
  status: string;
  runs: Run[];
  readouts_hz: Record<Readout, number>;
}

export interface BrainData {
  schema_version: number;
  mock: boolean;
  label: string;
  provenance: Record<string, string | null>;
  trial: Record<string, unknown>;
  grid: {
    sugar_hz: number[];
    bitter_hz: number[];
    looming_hz: number[];
    bitter_scale: number[];
    loom_gf_scale: number[];
  };
  plasticity: Record<string, string>;
  groups: Record<string, { selector: string; aggregation: string; root_ids: string[] }>;
  conditions: Record<string, Condition>;
}

/** One looked-up response, with everything a replay record needs. */
export interface Response {
  conditionId: string;
  state: BrainState;
  stimulus: Stimulus; // the supported stimulus actually used (after snapping)
  requested: Stimulus; // what the game asked for
  seed: number; // which real run was used
  readouts: Record<Readout, number>;
  run: Run;
}

export const SCHEMA_VERSION = 2;

export class BrainError extends Error {}

export class Brain {
  private constructor(readonly data: BrainData) {}

  static async load(url = "data/brain_plastic.json"): Promise<Brain> {
    const res = await fetch(url);
    if (!res.ok) throw new BrainError(`brain data ${url}: HTTP ${res.status}`);
    return Brain.from(await res.json());
  }

  static from(data: BrainData): Brain {
    if (data.schema_version !== SCHEMA_VERSION) {
      throw new BrainError(`brain data schema ${data.schema_version}, expected ${SCHEMA_VERSION}`);
    }
    if (data.mock && import.meta.env?.PROD) throw new BrainError("mock brain data rejected in production build");
    return new Brain(data);
  }

  get label(): string {
    return this.data.mock ? `MOCK DATA — ${this.data.label}` : this.data.label;
  }

  /** Learning levels in order, for UI and for the learning rule's step function. */
  get levels() {
    return { bitterScale: this.data.grid.bitter_scale, loomGfScale: this.data.grid.loom_gf_scale };
  }

  /**
   * Map a game-side stimulus onto the measured grid. Sugar and bitter snap to the nearest
   * value; looming snaps DOWN so a threat is never reported stronger than the input.
   */
  snap(stim: Stimulus): Stimulus {
    const g = this.data.grid;
    return {
      sugar: nearest(g.sugar_hz, stim.sugar),
      bitter: nearest(g.bitter_hz, stim.bitter),
      looming: floorTo(g.looming_hz, stim.looming),
    };
  }

  conditionId(state: BrainState, stim: Stimulus): string {
    return `bitter${fmt(state.bitterScale)}|loomgf${fmt(state.loomGfScale)}` +
      `|sugar${stim.sugar}|bitter${stim.bitter}|looming${stim.looming}`;
  }

  /** Every stimulus in the manifest, in grid order. */
  get stimuli(): Stimulus[] {
    const g = this.data.grid;
    return g.sugar_hz.flatMap((sugar) =>
      g.bitter_hz.flatMap((bitter) => g.looming_hz.map((looming) => ({ sugar, bitter, looming }))));
  }

  /**
   * A state is playable only when every manifest stimulus has at least one measured run, so
   * no lookup during a run can hit a hole. Partial exports leave the state unavailable.
   */
  stateAvailable(state: BrainState): boolean {
    return this.stimuli.every((st) => {
      const c = this.data.conditions[this.conditionId(state, st)];
      return !!c && c.status === "ok" && c.runs.length > 0;
    });
  }

  /** Seeds available for a condition (lattice is filled seed 0 first, so this can grow). */
  seeds(state: BrainState, stim: Stimulus): number[] {
    return this.condition(state, this.snap(stim)).runs.map((r) => r.seed);
  }

  /**
   * Look up one real run. `pick` chooses among the available seeds (pass the world RNG so
   * paired runs with the same seed see the same neural variability); defaults to the first.
   */
  respond(state: BrainState, requested: Stimulus, pick: (n: number) => number = () => 0): Response {
    const stimulus = this.snap(requested);
    const cond = this.condition(state, stimulus);
    const run = cond.runs[Math.min(cond.runs.length - 1, Math.max(0, pick(cond.runs.length)))];
    return {
      conditionId: this.conditionId(state, stimulus),
      state,
      stimulus,
      requested,
      seed: run.seed,
      readouts: run.readouts_hz,
      run,
    };
  }

  /** Mean over all seeds, for workbench stimulus tests and summary curves. */
  mean(state: BrainState, requested: Stimulus): Record<Readout, number> {
    return this.condition(state, this.snap(requested)).readouts_hz;
  }

  private condition(state: BrainState, stim: Stimulus): Condition {
    const id = this.conditionId(state, stim);
    const cond = this.data.conditions[id];
    if (!cond || cond.status !== "ok" || cond.runs.length === 0) {
      throw new BrainError(`no measured run for ${id}`);
    }
    return cond;
  }
}

function nearest(values: number[], x: number): number {
  return values.reduce((best, v) => (Math.abs(v - x) < Math.abs(best - x) ? v : best));
}

function floorTo(values: number[], x: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v) => v <= x).pop() ?? sorted[0];
}

// matches Python's f"{x:g}" for the lattice values (0, 0.25, 0.5, 0.75, 1, 1.25, 1.5)
function fmt(x: number): string {
  return String(x);
}
