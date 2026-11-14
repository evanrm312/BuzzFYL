// Authoritative headless simulation of one run. No rendering, no input: the UI owns the
// clock (pause/speed) and calls step(); the fly is never steered.
//
// Who decides what:
//   measured  — MN9 (feed), Giant Fibre (escape), looked up per decision tick from real runs
//   authored  — walking to the nearest serving, jump direction, cooldowns, arbitration order,
//               energy/poison/damage, safety feedback, the learning rule
// Route levels release a swarm: every fly has its own body and makes its own lookups, but
// the swarm shares one set of weights, so any fly's experience trains all of them (authored).
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
  SWARM_LIMIT,
  swarmSize,
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

/** One fly's body: public state plus what the controller tracks for it. */
interface Body extends FlyState {
  jump: { fromX: number; fromY: number; toX: number; toY: number; t0: number } | null;
  refuseStreak: number;
  nextEggAt: number;
}

export class Sim {
  readonly wave;
  readonly seed: number;
  readonly config: BuildConfig;
  t = 0;
  flies: Body[];
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
    drinks: 0,
    eggsLaid: 0,
    reachedFruitAt: null,
    flies: 0,
    fliesAlive: 0,
    fliesAcross: 0,
    healthLeft: 0,
    progress: 0,
  };
  result: RunRecord["result"] = "running";
  /** Latest lookup by any fly, for the live brain panel. */
  lastDecision: Decision | null = null;

  private ticks = 0;
  private tickEvery: number;
  private threatTick = new Map<string, number>();
  private servingLookups = new Map<string, number>();
  private latch = new Set<string>(); // `${threat}|${fly}`: that fly already jumped from it
  private decisionKey: string | null = null;
  private wet: boolean;
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
    this.wet = !!this.wave.needsWater;
    if (!brain.stateAvailable(this.brainState, this.wet)) {
      throw new Error(`starting brain state not fully measured: ${JSON.stringify(this.brainState)}`);
    }
    const n = this.wave.fliesNeeded ? swarmSize(opts.config) : 1;
    const gap = Math.min(44, 380 / n);
    this.flies = Array.from({ length: n }, (_, i) => ({
      id: i,
      alive: true,
      death: null,
      reachedFruitAt: null,
      eggs: 0,
      progress: 0,
      x: this.wave.start?.x ?? ARENA.w / 2,
      y: (this.wave.start?.y ?? ARENA.h / 2) + (i - (n - 1) / 2) * gap,
      heading: 0,
      health: GAME.maxHealth,
      energy: GAME.startEnergy,
      hydration: this.wave.hydrationDrain ? GAME.startHydration : GAME.maxHydration,
      action: "idle",
      airborneUntil: 0,
      cooldownUntil: 0,
      targetServing: null,
      jump: null,
      refuseStreak: 0,
      nextEggAt: 0,
    }));
    this.tickEvery = Math.round(CTRL.decisionEvery / CTRL.dt);
    for (const g of GROUPS) this.pushTrajectory(g);
    this.census();
  }

  /** The fly furthest along among the living (the only fly on single-fly waves). */
  get fly(): FlyState {
    const alive = this.flies.filter((f) => f.alive);
    return alive.reduce((a, b) => (b.progress > a.progress ? b : a), alive[0] ?? this.flies[0]);
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
    const alive = () => this.flies.filter((f) => f.alive);

    for (const s of this.servings) {
      if (s.status === "pending" && this.t >= s.spawnAt) s.status = "available";
      if (s.status === "available" && this.t >= s.expiresAt) s.status = "expired";
    }
    for (const th of this.threats) {
      if (th.status === "pending" && this.t >= th.startAt) {
        const a = alive();
        const tgt = a[Math.floor(keyed(this.seed, `target|${th.id}`) * a.length)] ?? this.flies[0];
        th.status = "active";
        th.target = tgt.id;
        this.threatTick.set(th.id, -1);
        th.x = tgt.x;
        th.y = tgt.y;
      }
      if (th.status === "active" && th.tracking) {
        const tgt = this.flies[th.target];
        if (tgt.alive && !this.latch.has(`${th.id}|${tgt.id}`)) {
          th.x = tgt.x;
          th.y = tgt.y;
        }
      }
    }

    for (const f of alive()) {
      f.energy = Math.max(0, f.energy - (this.wave.energyDrain ?? GAME.energyDrainPerS) * CTRL.dt);
      f.hydration = Math.max(0, f.hydration - (this.wave.hydrationDrain ?? 0) * CTRL.dt);
      this.move(f);
      this.trackProgress(f);
    }
    if (this.ticks % this.tickEvery === 0) this.decide();

    for (const f of alive()) {
      const death = f.health <= 0 ? "health" : f.energy <= 0 ? "energy" : f.hydration <= 0 ? "thirst" : null;
      if (!death) continue;
      f.alive = false;
      f.death = death;
      f.action = "idle";
      f.jump = null;
    }
    this.census();
    if (this.metrics.fliesAlive === 0) {
      this.result = this.flies.length === 1 ? (`died_${this.flies[0].death}` as RunRecord["result"]) : "wiped_out";
    } else if (this.t >= this.wave.duration) {
      const need = this.wave.fliesNeeded;
      this.result = !need || (this.metrics.fliesAcross >= need && this.flies.length < SWARM_LIMIT) ? "survived" : "not_crossed";
    }
  }

  /** Swarm totals. Across = alive, reached the fruit, laid at least one egg. */
  private census(): void {
    const m = this.metrics;
    const alive = this.flies.filter((f) => f.alive);
    m.flies = this.flies.length;
    m.fliesAlive = alive.length;
    m.fliesAcross = alive.filter((f) => f.reachedFruitAt !== null && f.eggs > 0).length;
    m.healthLeft = Math.round(alive.reduce((a, f) => a + f.health, 0));
    const need = Math.min(this.flies.length, this.wave.fliesNeeded ?? 1);
    const best = this.flies.map((f) => f.progress).sort((a, b) => b - a).slice(0, need);
    m.progress = round(best.reduce((a, b) => a + b, 0) / need);
  }

  private move(f: Body): void {
    if (f.jump) {
      const k = Math.min(1, (this.t - f.jump.t0) / CTRL.jumpSeconds);
      f.x = f.jump.fromX + (f.jump.toX - f.jump.fromX) * k;
      f.y = f.jump.fromY + (f.jump.toY - f.jump.fromY) * k;
      if (k >= 1) {
        f.jump = null;
        f.action = "idle";
      }
      return;
    }
    if (f.action === "feeding" || f.action === "drinking" || f.action === "suppressed" || f.action === "refusing") {
      const s = this.serving(f.targetServing);
      if (s && s.status === "available" && s.refusedUntil <= this.t && dist(f, s) <= CTRL.contactRadius) return;
      f.action = "idle";
    }
    const target = this.pickServing(f);
    f.targetServing = target?.id ?? null;
    const fruit = this.wave.fruit;
    if (!target && fruit) {
      // authored route: no pressing need, so head for the fruit and lay eggs there
      if (dist(f, fruit) <= fruit.r) {
        this.layEggs(f);
        return;
      }
      this.walkTo(f, fruit);
      return;
    }
    if (!target) {
      f.action = "idle";
      return;
    }
    const d = dist(f, target);
    if (d <= CTRL.contactRadius) {
      f.action = isDrink(target) ? "drinking" : "feeding"; // tentative until MN9 is read
      return;
    }
    this.walkTo(f, target);
  }

  /** Closest approach to the fruit as a fraction of the start → fruit distance; time elapsed on waves without a route. */
  private trackProgress(f: Body): void {
    const { start, fruit } = this.wave;
    let p = this.t / this.wave.duration;
    if (start && fruit) {
      if (f.reachedFruitAt !== null) p = 1;
      else p = Math.min(0.99, 1 - (dist(f, fruit) - fruit.r) / (dist(start, fruit) - fruit.r));
    }
    f.progress = Math.max(f.progress, Math.min(1, Math.max(0, round(p))));
  }

  private walkTo(f: Body, target: { x: number; y: number }): void {
    const d = dist(f, target);
    const stepLen = Math.min(d, CTRL.walkSpeed * CTRL.dt);
    f.heading = Math.atan2(target.y - f.y, target.x - f.x);
    f.x += Math.cos(f.heading) * stepLen;
    f.y += Math.sin(f.heading) * stepLen;
    f.action = "walking";
  }

  /** Authored egg laying at the fruit: one egg per eggSeconds while reserves allow. */
  private layEggs(f: Body): void {
    if (f.reachedFruitAt === null) {
      f.reachedFruitAt = this.t;
      this.metrics.reachedFruitAt ??= this.t;
      this.emit("reached_fruit", { fly: f, exposed: false, feedback: "arrived at the fruit bowl (authored route)" });
      f.nextEggAt = this.t + CTRL.eggSeconds;
    }
    f.action = "laying";
    if (this.t < f.nextEggAt) return;
    f.nextEggAt = this.t + CTRL.eggSeconds;
    if (f.energy < GAME.eggMinReserve || f.hydration < GAME.eggMinReserve) return;
    f.energy -= GAME.eggEnergy;
    f.eggs++;
    this.metrics.eggsLaid++;
    this.emit("egg_laid", { fly: f, exposed: false, feedback: `egg ${this.metrics.eggsLaid} laid (authored)` });
  }

  /**
   * Authored: nearest available serving the fly has not just refused, preferring ones fewer
   * swarm-mates are already heading for. On a route level the fly only detours for what it
   * needs (energy or water below CTRL.needLevel).
   */
  private pickServing(f: Body): Serving | null {
    const route = !!this.wave.fruit;
    const fr = this.wave.fruit;
    const need = fr && dist(f, fr) <= fr.r ? CTRL.needLevelAtFruit : CTRL.needLevel;
    const needE = f.energy < need;
    const needW = f.hydration < need;
    let best: Serving | null = null;
    let bestD = Infinity;
    for (const s of this.servings) {
      if (s.status !== "available" || s.refusedUntil > this.t) continue;
      if (route) {
        const water = s.kind === "water" || s.kind === "soda";
        const food = s.kind !== "water";
        if (!((needE && food) || (needW && water))) continue;
      }
      let d = dist(f, s);
      for (const o of this.flies) if (o !== f && o.alive && o.targetServing === s.id) d += 60;
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  private decide(): void {
    // advance threat ramps once per tick and resolve the ones that finished
    const live: { th: Threat; hz: number }[] = [];
    for (const th of this.threats) {
      if (th.status !== "active") continue;
      const k = (this.threatTick.get(th.id) ?? -1) + 1;
      this.threatTick.set(th.id, k);
      if (k >= th.ramp.length) this.resolveThreat(th);
      else live.push({ th, hz: th.ramp[k] });
    }
    for (const f of this.flies) {
      if (!f.alive || f.jump) continue;
      let looming = 0;
      let threat: Threat | null = null;
      for (const { th, hz } of live) {
        if (dist(f, th) > CTRL.threatRadius) continue;
        th.exposed = true;
        if (hz > looming) {
          looming = hz;
          threat = th;
        }
      }
      this.decideFly(f, looming, threat);
    }
  }

  private decideFly(f: Body, looming: number, threat: Threat | null): void {
    const s = this.serving(f.targetServing);
    const onFood = !!s && s.status === "available" && dist(f, s) <= CTRL.contactRadius;
    if (!onFood && looming === 0) return; // no sensory input: nothing to look up

    const requested: Stimulus = onFood ? { ...stimulusFor(s!, this.config.sugarHz), looming } : { sugar: 0, bitter: 0, looming };
    const drink = onFood && isDrink(s!);
    const thr = drink ? CTRL.drinkMn9Hz : CTRL.feedMn9Hz;
    const lk = onFood ? `${f.id}:${s!.id}` : "";
    const lookups = onFood ? (this.servingLookups.get(lk) ?? 0) : 0;
    if (onFood) this.servingLookups.set(lk, lookups + 1);
    const key = `fly${f.id}|${onFood ? `${s!.id}#${lookups}` : "-"}|${threat ? `${threat.id}@${this.threatTick.get(threat.id)}` : "-"}`;
    this.decisionKey = key;
    const r = this.brain.respond(this.brainState, requested, (n) => Math.floor(keyed(this.seed, key) * n));
    const mn9 = r.readouts.mn9;
    const gf = r.readouts.giant_fibre;
    const latched = !!threat && this.latch.has(`${threat.id}|${f.id}`);

    let action: Action;
    let reason: string;
    if (threat && gf >= CTRL.escapeGfHz && !latched && this.t >= f.cooldownUntil) {
      action = "escaping";
      reason = `GF ${fmt(gf)} Hz ≥ ${CTRL.escapeGfHz}: escape jump`;
      if (onFood) {
        reason += `; meal interrupted at ${Math.round(s!.progress * 100)}% (authored consequence of the jump)`;
        this.metrics.mealsInterruptedByJump++;
      }
      this.startJump(f, threat);
    } else if (onFood && mn9 >= thr) {
      action = drink ? "drinking" : "feeding";
      reason = `MN9 ${fmt(mn9)} Hz ≥ ${thr}: ${action}`;
      if (threat) reason += `; GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: no jump`;
      f.refuseStreak = 0;
      const full = drink ? CTRL.drinkFullMn9Hz : 100; // MN9 at which a serving takes servingSeconds
      s!.progress = Math.min(1, s!.progress + (CTRL.decisionEvery * Math.min(mn9, full)) / full / CTRL.servingSeconds);
      if (s!.progress >= 1) this.completeServing(f, s!);
    } else if (onFood && looming > 0) {
      action = "suppressed";
      reason = `MN9 ${fmt(mn9)} Hz < ${thr} under looming ${looming} Hz` +
        (latched || this.t < f.cooldownUntil
          ? ": feeding suppressed (escape latched/cooling down)"
          : `; GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: feeding suppressed, no jump`);
      this.metrics.feedingSuppressedTicks++;
    } else if (onFood) {
      f.refuseStreak++;
      action = "refusing";
      reason = `MN9 ${fmt(mn9)} Hz < ${thr}, no threat: refusing (${f.refuseStreak}/${CTRL.refuseAfterTicks})`;
      if (f.refuseStreak >= CTRL.refuseAfterTicks) {
        f.refuseStreak = 0;
        s!.refusedUntil = this.t + CTRL.refuseRetrySeconds;
        this.metrics.servingsRefused++;
        this.emit("serving_refused", { fly: f, serving: s!, exposed: true, feedback: "none (refusal gives no evidence)" });
      }
    } else {
      action = f.action;
      reason = latched
        ? `looming ${looming} Hz: escape already used for this threat`
        : this.t < f.cooldownUntil
          ? `looming ${looming} Hz: escape cooling down`
          : `GF ${fmt(gf)} Hz < ${CTRL.escapeGfHz}: no jump`;
    }
    if (action !== "escaping" && action !== "walking" && action !== "idle") f.action = action;

    const d: Decision = {
      id: key,
      t: this.t,
      flyId: f.id,
      neuronsActive: r.run.neurons_active,
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

  private startJump(f: Body, th: Threat): void {
    th.jumped = true;
    this.latch.add(`${th.id}|${f.id}`);
    f.cooldownUntil = this.t + CTRL.escapeCooldown;
    f.action = "escaping";
    f.targetServing = null;
    f.refuseStreak = 0;
    this.metrics.jumps++;
    if (!th.harmful) this.metrics.jumpsOnHarmless++;
    const base = keyed(this.seed, `jump|${th.id}|${f.id}`) * Math.PI * 2;
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
    f.jump = { fromX: f.x, fromY: f.y, toX: to.x, toY: to.y, t0: this.t };
  }

  private completeServing(f: Body, s: Serving): void {
    // a serving feeds `portions` flies; the swarm shares what is on the lawn
    s.portions--;
    if (s.portions <= 0) s.status = "eaten";
    else s.progress = 0;
    f.action = "idle";
    if (isDrink(s)) {
      this.metrics.drinks++;
      f.hydration = Math.min(GAME.maxHydration, f.hydration + GAME.drinkHydration);
      if (s.kind === "soda") f.energy = Math.min(GAME.maxEnergy, f.energy + GAME.sodaEnergy);
      this.emit("drink_completed", {
        fly: f,
        serving: s,
        exposed: true,
        feedback: s.kind === "soda" ? "soda: water + sugar, no bitter evidence" : "water droplet: no bitter evidence",
      });
      return;
    }
    this.metrics.servingsCompleted++;
    f.energy = Math.min(GAME.maxEnergy, f.energy + GAME.servingEnergy);
    if (s.kind === "citronella") {
      this.emit("serving_completed", {
        fly: f,
        serving: s,
        exposed: true,
        feedback: "game signal after the meal: citronella-coated, repellent but safe",
        learn: ["bitter", "weaken"],
      });
    } else if (s.kind === "clean") {
      this.emit("serving_completed", { fly: f, serving: s, exposed: true, feedback: "clean food: no bitter input, no bitter evidence" });
    } else if (s.kind === "safe_bitter") {
      this.emit("serving_completed", {
        fly: f,
        serving: s,
        exposed: true,
        feedback: "game signal after the meal: bitter but safe",
        learn: ["bitter", "weaken"],
      });
    } else {
      this.damage(f, GAME.poisonDamage);
      this.metrics.poisonings++;
      this.emit("poisoned", {
        fly: f,
        serving: s,
        exposed: true,
        feedback: "game signal after the meal: poisoned (damage applied with the energy, once)",
        learn: ["bitter", "strengthen"],
      });
    }
  }

  private resolveThreat(th: Threat): void {
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
    const hit = this.flies.filter((f) => f.alive && !f.jump && dist(f, th) <= CTRL.hitRadius);
    if (hit.length) {
      th.status = "hit";
      for (const f of hit) this.damage(f, th.kind === "fog" ? GAME.fogDamage : (this.wave.swatDamage ?? GAME.swatDamage));
      this.metrics.attacksHit += hit.length;
      this.emit("threat_hit", {
        fly: hit[0],
        threat: th,
        exposed: th.exposed,
        feedback: th.exposed ? `game signal: ${th.kind} landed on ${hit.length === 1 ? "a fly" : `${hit.length} flies`} (damage)` : "not exposed: no evidence",
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

  private damage(f: Body, n: number): void {
    f.health = Math.max(0, f.health - n);
    this.metrics.damageTaken += n;
  }

  private emit(
    outcome: Outcome,
    o: { fly?: Body; serving?: Serving; threat?: Threat; exposed: boolean; feedback: string; learn?: [Group, Direction] },
  ): void {
    let learning: LearningRecord | null = null;
    if (o.learn) {
      const [group, direction] = o.learn;
      const before = this.brainState;
      learning = applyEvidence(group, this.groups[group], this.config.policy[group], direction, this.scales[group], (lvl) =>
        this.brain.stateAvailable({ ...before, [group === "bitter" ? "bitterScale" : "loomGfScale"]: this.scales[group][lvl] }, this.wet),
      );
      if (learning.applied) {
        this.metrics.adaptations++;
        this.pushTrajectory(group);
      }
    }
    const e: GameEvent = {
      id: `${outcome}|${o.serving?.id ?? o.threat?.id ?? "fly"}|${this.events.length}`,
      t: this.t,
      outcome,
      flyId: o.fly?.id,
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

const isDrink = (s: Serving) => s.kind === "water" || s.kind === "soda";

/** Sensory input a serving delivers on contact. Citronella is read through bitter taste cells. */
function stimulusFor(s: Serving, sugarHz: number): Omit<Stimulus, "looming"> {
  switch (s.kind) {
    case "clean":
      return { sugar: sugarHz, bitter: 0 };
    case "safe_bitter":
    case "poison_bitter":
    case "citronella":
      return { sugar: sugarHz, bitter: 200 };
    case "water":
      return { sugar: 0, bitter: 0, water: 400 };
    case "soda":
      return { sugar: sugarHz, bitter: 0, water: 400 };
  }
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const round = (x: number) => Math.round(x * 1000) / 1000;
const fmt = (x: number) => (Math.round(x * 10) / 10).toString();
