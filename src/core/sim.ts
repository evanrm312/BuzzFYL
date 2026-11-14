// Authoritative headless simulation of one run. No rendering, no input: the UI owns the
// clock (pause/speed) and calls step(); the fly is never steered.
//
// Who decides what:
//   measured  — MN9 (feed), Giant Fibre (escape), looked up per decision tick from real runs
//   authored  — walking to the nearest serving, jump direction, cooldowns, arbitration order,
//               energy/poison/damage, safety feedback, the learning rule
// Arbitration per decision tick: escape (GF >= threshold) beats feeding; feeding needs
// MN9 >= threshold; sub-threshold MN9 under looming is "suppressed" (stays, does not eat);
// sub-threshold MN9 with no looming for a few ticks is a refusal (leaves the serving).

import type { Brain, BrainState, Stimulus } from "../brain";
import {
  ARENA,
  CONTROLLER_VERSION,
  CORE_VERSION,
  CTRL,
  GAME,
  LEARNING_RULE_VERSION,
  NEURAL_SEED_POLICY,
  thresholdsSnapshot,
} from "./config";
import { applyEvidence, newGroup } from "./learning";
import { keyed } from "./rng";
import type {
  Action,
  BuildConfig,
  Decision,
  Direction,
  FlyState,
  GameEvent,
  Group,
  GroupState,
  LearningRecord,
  Metrics,
  Outcome,
  RunRecord,
  Serving,
  Threat,
  WaveId,
} from "./types";
import { buildSchedule, WAVES } from "./waves";

export interface SimOptions {
  wave: WaveId;
  seed: number;
  config: BuildConfig;
  onEvent?: (e: GameEvent) => void;
}

const GROUPS: Group[] = ["bitter", "loomGf"];

export class Sim {
  readonly wave;
  readonly seed: number;
  readonly config: BuildConfig;
  t = 0;
  fly: FlyState;
  servings: Serving[];
  threats: Threat[];
  groups: Record<Group, GroupState>;
  events: GameEvent[] = [];
  decisions: Decision[] = [];
  trajectory: RunRecord["trajectory"] = [];
  metrics: Metrics = {
    servingsCompleted: 0,
    servingsRefused: 0,
    poisonings: 0,
    jumps: 0,
    jumpsOnHarmless: 0,
    attacksEscaped: 0,
    attacksHit: 0,
    feedingSuppressedTicks: 0,
    mealsInterruptedByJump: 0,
    damageTaken: 0,
    adaptations: 0,
  };
  result: RunRecord["result"] = "running";
  /** Latest lookup, for the live brain panel. */
  lastDecision: Decision | null = null;

  private ticks = 0;
  private tickEvery: number;
  private threatTick = new Map<string, number>();
  private servingLookups = new Map<string, number>();
  private refuseStreak = 0;
  private decisionKey: string | null = null;
  private jump: { fromX: number; fromY: number; toX: number; toY: number; t0: number } | null = null;
  private onEvent?: (e: GameEvent) => void;

  constructor(readonly brain: Brain, opts: SimOptions) {
    this.wave = WAVES[opts.wave];
    this.seed = opts.seed;
    this.config = structuredClone(opts.config);
    this.onEvent = opts.onEvent;
    const sched = buildSchedule(this.wave, opts.seed);
    this.servings = sched.servings;
    this.threats = sched.threats;
    this.groups = {
      bitter: newGroup(opts.config.bitterLevel, opts.config.policy.bitter),
      loomGf: newGroup(opts.config.loomGfLevel, opts.config.policy.loomGf),
    };
    if (!brain.stateAvailable(this.brainState)) {
      throw new Error(`starting brain state not fully measured: ${JSON.stringify(this.brainState)}`);
    }
    this.fly = {
      x: ARENA.w / 2,
      y: ARENA.h / 2,
      heading: 0,
      health: GAME.maxHealth,
      energy: GAME.startEnergy,
      action: "idle",
      airborneUntil: 0,
      cooldownUntil: 0,
      targetServing: null,
    };
    this.tickEvery = Math.round(CTRL.decisionEvery / CTRL.dt);
    for (const g of GROUPS) this.pushTrajectory(g);
  }

  get scales(): Record<Group, number[]> {
    const l = this.brain.levels;
    return { bitter: l.bitterScale, loomGf: l.loomGfScale };
  }

  get brainState(): BrainState {
    const s = this.scales;
    return { bitterScale: s.bitter[this.groups.bitter.level], loomGfScale: s.loomGf[this.groups.loomGf.level] };
  }

  get done(): boolean {
    return this.result !== "running";
  }

  get phase(): string {
    return [...this.wave.phases].reverse().find((p) => this.t >= p.from)?.label ?? "";
  }

  /** Advance by real seconds (UI passes frame dt × speed). Internally fixed-step. */
  step(seconds: number): void {
    let n = Math.round(seconds / CTRL.dt);
    while (n-- > 0 && !this.done) this.tick();
  }

  runToEnd(): RunRecord {
    while (!this.done) this.tick();
    return this.record();
  }

  record(): RunRecord {
    const s = this.scales;
    return {
      version: {
        core: CORE_VERSION,
        controller: CONTROLLER_VERSION,
        learningRule: LEARNING_RULE_VERSION,
        brainExportedAt: (this.brain.data.provenance.exported_at as string) ?? null,
      },
      wave: this.wave.id,
      worldSeed: this.seed,
      neuralSeedPolicy: NEURAL_SEED_POLICY,
      config: structuredClone(this.config),
      initialState: { bitterScale: s.bitter[this.config.bitterLevel], loomGfScale: s.loomGf[this.config.loomGfLevel] },
      finalState: this.brainState,
      finalLevels: { bitter: this.groups.bitter.level, loomGf: this.groups.loomGf.level },
      thresholds: thresholdsSnapshot(),
      events: this.events,
      decisions: this.decisions,
      trajectory: this.trajectory,
      metrics: { ...this.metrics },
      result: this.result,
      duration: round(this.t),
    };
  }

  // ---------------------------------------------------------------------------

  private tick(): void {
    this.t = round(this.t + CTRL.dt);
    this.ticks++;
    const f = this.fly;

    for (const s of this.servings) {
      if (s.status === "pending" && this.t >= s.spawnAt) s.status = "available";
      if (s.status === "available" && this.t >= s.expiresAt) s.status = "expired";
    }
    for (const th of this.threats) {
      if (th.status === "pending" && this.t >= th.startAt) {
        th.status = "active";
        this.threatTick.set(th.id, -1);
        th.x = f.x;
        th.y = f.y;
      }
      if (th.status === "active" && th.tracking && !th.jumped) {
        th.x = f.x;
        th.y = f.y;
      }
    }

    f.energy = Math.max(0, f.energy - (this.wave.energyDrain ?? GAME.energyDrainPerS) * CTRL.dt);

    this.move();
    if (this.ticks % this.tickEvery === 0) this.decide();

    if (f.health <= 0) this.result = "died_health";
    else if (f.energy <= 0) this.result = "died_energy";
    else if (this.t >= this.wave.duration) this.result = "survived";
  }

  private move(): void {
    const f = this.fly;
    if (this.jump) {
      const k = Math.min(1, (this.t - this.jump.t0) / CTRL.jumpSeconds);
      f.x = this.jump.fromX + (this.jump.toX - this.jump.fromX) * k;
      f.y = this.jump.fromY + (this.jump.toY - this.jump.fromY) * k;
      if (k >= 1) {
        this.jump = null;
        f.action = "idle";
      }
      return;
    }
    if (f.action === "feeding" || f.action === "suppressed" || f.action === "refusing") {
      const s = this.serving(f.targetServing);
      if (s && s.status === "available" && s.refusedUntil <= this.t && dist(f, s) <= CTRL.contactRadius) return;
      f.action = "idle";
    }
    const target = this.pickServing();
    f.targetServing = target?.id ?? null;
    if (!target) {
      f.action = "idle";
      return;
    }
    const d = dist(f, target);
    if (d <= CTRL.contactRadius) {
      f.action = "feeding"; // tentative until the next decision tick reads MN9
      return;
    }
    const stepLen = Math.min(d, CTRL.walkSpeed * CTRL.dt);
    f.heading = Math.atan2(target.y - f.y, target.x - f.x);
    f.x += Math.cos(f.heading) * stepLen;
    f.y += Math.sin(f.heading) * stepLen;
    f.action = "walking";
  }

  /** Authored: nearest available serving the fly has not just refused. */
  private pickServing(): Serving | null {
    let best: Serving | null = null;
    let bestD = Infinity;
    for (const s of this.servings) {
      if (s.status !== "available" || s.refusedUntil > this.t) continue;
      const d = dist(this.fly, s);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  private decide(): void {
    const f = this.fly;
    const airborne = this.jump !== null;

    // advance threat ramps and resolve the ones that finished
    let looming = 0;
    let threat: Threat | null = null;
    for (const th of this.threats) {
      if (th.status !== "active") continue;
      const k = (this.threatTick.get(th.id) ?? -1) + 1;
      this.threatTick.set(th.id, k);
      if (k >= th.ramp.length) {
        this.resolveThreat(th);
        continue;
      }
      if (!airborne && dist(f, th) <= CTRL.threatRadius) {
        th.exposed = true;
        if (th.ramp[k] > looming) {
          looming = th.ramp[k];
          threat = th;
        }
      }
    }
    if (this.done || airborne) return;

    const s = this.serving(f.targetServing);
    const onFood = !!s && s.status === "available" && dist(f, s) <= CTRL.contactRadius;
    if (!onFood && looming === 0) return; // no sensory input: nothing to look up

    const requested: Stimulus = {
      sugar: onFood ? this.config.sugarHz : 0,
      bitter: onFood && s!.kind !== "clean" ? 200 : 0,
      looming,
    };
    const lookups = onFood ? (this.servingLookups.get(s!.id) ?? 0) : 0;
    if (onFood) this.servingLookups.set(s!.id, lookups + 1);
    const key = `${onFood ? `${s!.id}#${lookups}` : "-"}|${threat ? `${threat.id}@${this.threatTick.get(threat.id)}` : "-"}`;
    this.decisionKey = key;
    const r = this.brain.respond(this.brainState, requested, (n) => Math.floor(keyed(this.seed, key) * n));
    const mn9 = r.readouts.mn9;
    const gf = r.readouts.giant_fibre;

    let action: Action;
    let reason: string;
    if (threat && gf >= CTRL.escapeGfHz && !threat.jumped && this.t >= f.cooldownUntil) {
      action = "escaping";
      reason = `GF ${fmt(gf)} Hz ≥ ${CTRL.escapeGfHz}: escape jump`;
      if (onFood) {
        reason += `; meal interrupted at ${Math.round(s!.progress * 100)}% (authored consequence of the jump)`;
        this.metrics.mealsInterruptedByJump++;
      }
      this.startJump(threat);
    } else if (onFood && mn9 >= CTRL.feedMn9Hz) {
      action = "feeding";
      reason = `MN9 ${fmt(mn9)} Hz ≥ ${CTRL.feedMn9Hz}: feeding`;
      if (threat) reason += `; GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: no jump`;
      this.refuseStreak = 0;
      s!.progress = Math.min(1, s!.progress + (CTRL.decisionEvery * Math.min(mn9, 100)) / 100 / CTRL.servingSeconds);
      if (s!.progress >= 1) this.completeServing(s!);
    } else if (onFood && looming > 0) {
      action = "suppressed";
      reason = `MN9 ${fmt(mn9)} Hz < ${CTRL.feedMn9Hz} under looming ${looming} Hz` +
        (threat?.jumped || this.t < f.cooldownUntil
          ? ": feeding suppressed (escape latched/cooling down)"
          : `; GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: feeding suppressed, no jump`);
      this.metrics.feedingSuppressedTicks++;
    } else if (onFood) {
      this.refuseStreak++;
      action = "refusing";
      reason = `MN9 ${fmt(mn9)} Hz < ${CTRL.feedMn9Hz}, no threat: refusing (${this.refuseStreak}/${CTRL.refuseAfterTicks})`;
      if (this.refuseStreak >= CTRL.refuseAfterTicks) {
        this.refuseStreak = 0;
        s!.refusedUntil = this.t + CTRL.refuseRetrySeconds;
        this.metrics.servingsRefused++;
        this.emit("serving_refused", { serving: s!, exposed: true, feedback: "none (refusal gives no evidence)" });
      }
    } else {
      action = f.action;
      reason = threat?.jumped
        ? `looming ${looming} Hz: escape already used for this threat`
        : this.t < f.cooldownUntil
          ? `looming ${looming} Hz: escape cooling down`
          : `GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: no jump`;
    }
    if (action !== "escaping" && action !== "walking" && action !== "idle") f.action = action;

    const d: Decision = {
      id: key,
      t: this.t,
      servingId: onFood ? s!.id : null,
      threatId: threat?.id ?? null,
      requested,
      stimulus: r.stimulus,
      conditionId: r.conditionId,
      replicateSeed: r.seed,
      readouts: { ...r.readouts },
      state: { ...r.state },
      action,
      reason,
    };
    this.decisions.push(d);
    this.lastDecision = d;
    this.decisionKey = null;
  }

  private startJump(th: Threat): void {
    const f = this.fly;
    th.jumped = true;
    th.tracking = false;
    f.cooldownUntil = this.t + CTRL.escapeCooldown;
    f.action = "escaping";
    f.targetServing = null;
    this.refuseStreak = 0;
    this.metrics.jumps++;
    if (!th.harmful) this.metrics.jumpsOnHarmless++;
    const base = keyed(this.seed, `jump|${th.id}`) * Math.PI * 2;
    const m = 30;
    let to = { x: f.x, y: f.y };
    for (let i = 0; i < 8; i++) {
      const a = base + (i * Math.PI) / 4;
      const x = f.x + Math.cos(a) * CTRL.jumpDistance;
      const y = f.y + Math.sin(a) * CTRL.jumpDistance;
      if (x > m && x < ARENA.w - m && y > m && y < ARENA.h - m) {
        to = { x, y };
        break;
      }
    }
    f.heading = Math.atan2(to.y - f.y, to.x - f.x);
    this.jump = { fromX: f.x, fromY: f.y, toX: to.x, toY: to.y, t0: this.t };
  }

  private completeServing(s: Serving): void {
    s.status = "eaten";
    this.metrics.servingsCompleted++;
    this.fly.energy = Math.min(GAME.maxEnergy, this.fly.energy + GAME.servingEnergy);
    this.fly.action = "idle";
    if (s.kind === "clean") {
      this.emit("serving_completed", { serving: s, exposed: true, feedback: "clean food: no bitter input, no bitter evidence" });
    } else if (s.kind === "safe_bitter") {
      this.emit("serving_completed", {
        serving: s,
        exposed: true,
        feedback: "game signal after the meal: bitter but safe",
        learn: ["bitter", "weaken"],
      });
    } else {
      this.damage(GAME.poisonDamage);
      this.metrics.poisonings++;
      this.emit("poisoned", {
        serving: s,
        exposed: true,
        feedback: "game signal after the meal: poisoned (damage applied with the energy, once)",
        learn: ["bitter", "strengthen"],
      });
    }
  }

  private resolveThreat(th: Threat): void {
    const f = this.fly;
    if (!th.harmful) {
      th.status = "passed";
      this.emit("threat_harmless", {
        threat: th,
        exposed: th.exposed,
        feedback: th.exposed ? "game signal: shadow passed with no contact (harmless)" : "not exposed: no evidence",
        learn: th.exposed ? ["loomGf", "weaken"] : undefined,
      });
      return;
    }
    const hit = !this.jump && dist(f, th) <= CTRL.hitRadius;
    if (hit) {
      th.status = "hit";
      this.damage(th.kind === "fog" ? GAME.fogDamage : GAME.swatDamage);
      this.metrics.attacksHit++;
      this.emit("threat_hit", {
        threat: th,
        exposed: th.exposed,
        feedback: th.exposed ? `game signal: ${th.kind} landed (damage)` : "not exposed: no evidence",
        learn: th.exposed ? ["loomGf", "strengthen"] : undefined,
      });
    } else {
      th.status = "missed";
      if (th.jumped) this.metrics.attacksEscaped++;
      this.emit(th.jumped ? "threat_escaped" : "threat_missed", {
        threat: th,
        exposed: th.exposed,
        feedback: th.jumped ? `${th.kind} missed after a jump: no evidence either way` : `${th.kind} missed without a jump: no evidence`,
      });
    }
  }

  private damage(n: number): void {
    this.fly.health = Math.max(0, this.fly.health - n);
    this.metrics.damageTaken += n;
  }

  private emit(
    outcome: Outcome,
    o: { serving?: Serving; threat?: Threat; exposed: boolean; feedback: string; learn?: [Group, Direction] },
  ): void {
    let learning: LearningRecord | null = null;
    if (o.learn) {
      const [group, direction] = o.learn;
      const before = this.brainState;
      learning = applyEvidence(group, this.groups[group], this.config.policy[group], direction, this.scales[group], (lvl) =>
        this.brain.stateAvailable({ ...before, [group === "bitter" ? "bitterScale" : "loomGfScale"]: this.scales[group][lvl] }),
      );
      if (learning.applied) {
        this.metrics.adaptations++;
        this.pushTrajectory(group);
      }
    }
    const e: GameEvent = {
      id: `${outcome}|${o.serving?.id ?? o.threat?.id}|${this.events.length}`,
      t: this.t,
      outcome,
      servingId: o.serving?.id,
      threatId: o.threat?.id,
      foodKind: o.serving?.kind,
      exposed: o.exposed,
      feedback: o.feedback,
      learning,
      lastDecisionId: this.decisionKey ?? this.lastDecision?.id ?? null,
    };
    this.events.push(e);
    this.onEvent?.(e);
  }

  private pushTrajectory(group: Group): void {
    const level = this.groups[group].level;
    this.trajectory.push({ t: this.t, group, level, scale: this.scales[group][level] });
  }

  private serving(id: string | null): Serving | undefined {
    return id ? this.servings.find((s) => s.id === id) : undefined;
  }
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const round = (x: number) => Math.round(x * 1000) / 1000;
const fmt = (x: number) => (Math.round(x * 10) / 10).toString();
