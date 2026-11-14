// Dev harness: the whole v6 loop on plain DOM + canvas, wired only through the core contract
// (docs/CORE_CONTRACT.md). Visual design belongs to the UI screens; this stays plain.

import { Brain } from "./brain";
import { canAfford, continueAdapted, newCampaign, retry, saveAttempt, wave, type Campaign } from "./core/campaign";
import { decisiveEvents, firstDivergence, frozenTwin, replay, runPair } from "./core/compare";
import { ARENA, baselineLevels, buildCost, CTRL } from "./core/config";
import { Sim } from "./core/sim";
import type { BuildConfig, GameEvent, Group, Policy, RunRecord } from "./core/types";
import { WAVES } from "./core/waves";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const brain = await Brain.load();
$("label").textContent = `${brain.label}. Every feed/escape decision is a lookup of a real run.`;
const scales: Record<Group, number[]> = { bitter: brain.levels.bitterScale, loomGf: brain.levels.loomGfScale };
const base0 = baselineLevels(scales);

// ?seed=7&wave=1 jumps straight to a demo encounter
const params = new URLSearchParams(location.search);
let campaign: Campaign = newCampaign(
  {
    sugarHz: 100,
    bitterLevel: base0.bitter,
    loomGfLevel: base0.loomGf,
    policy: { bitter: "conservative", loomGf: "conservative" },
  },
  Number(params.get("seed") ?? 1),
);
campaign.waveIndex = Math.min(3, Math.max(0, Number(params.get("wave") ?? 0)));
let sim: Sim | null = null;
let last: RunRecord | null = null;
let paused = false;
let speed = 1;

$("app").innerHTML = `
<div class="panel" id="head"></div>
<div class="row" style="margin-top:8px">
  <div class="panel" id="bench" style="width:260px"></div>
  <div><canvas id="cv" width="${ARENA.w}" height="${ARENA.h}"></canvas>
    <div class="row"><div class="panel" id="log"></div><div class="panel" id="stats" style="width:250px"></div></div></div>
  <div class="panel" id="brainp" style="width:300px"></div>
</div>
<div class="panel" id="results" style="margin-top:8px"></div>`;

const opt = (v: string | number, text: string, sel: boolean, disabled = false) =>
  `<option value="${v}" ${sel ? "selected" : ""} ${disabled ? "disabled" : ""}>${text}</option>`;

function renderBench() {
  const c = campaign.selected;
  const w = WAVES[wave(campaign)];
  const avail = (b: number, l: number) => brain.stateAvailable({ bitterScale: scales.bitter[b], loomGfScale: scales.loomGf[l] });
  const pol = (g: Group) =>
    (["frozen", "conservative", "responsive"] as Policy[]).map((p) => opt(p, p, c.policy[g] === p)).join("");
  const cost = buildCost(c, campaign.base);
  const ok = canAfford(campaign, c) && avail(c.bitterLevel, c.loomGfLevel);
  const bs = { bitterScale: scales.bitter[c.bitterLevel], loomGfScale: scales.loomGf[c.loomGfLevel] };
  let tests = "";
  if (avail(c.bitterLevel, c.loomGfLevel)) {
    const m = (s: number, b: number, l: number) => brain.mean(bs, { sugar: s, bitter: b, looming: l });
    tests = `<pre>Measured (mean over seeds):
MN9  sugar ${c.sugarHz}            ${m(c.sugarHz, 0, 0).mn9.toFixed(0)} Hz
MN9  sugar ${c.sugarHz} + bitter   ${m(c.sugarHz, 200, 0).mn9.toFixed(0)} Hz  (feed ≥ ${CTRL.feedMn9Hz})
GF   looming 50           ${m(0, 0, 50).giant_fibre.toFixed(0)} Hz  (jump ≥ ${CTRL.escapeGfHz})
GF   looming 100          ${m(0, 0, 100).giant_fibre.toFixed(0)} Hz
MN9  sugar ${c.sugarHz} + loom 50  ${m(c.sugarHz, 0, 50).mn9.toFixed(0)} Hz</pre>`;
  }
  $("bench").innerHTML = `<b>Workbench</b>
  <label>Sugar input <select id="sug">${opt(100, "100 Hz", c.sugarHz === 100)}${opt(200, "200 Hz (cost 2)", c.sugarHz === 200)}</select></label>
  <label>Bitter-cell output weight <select id="bl">${scales.bitter.map((s, i) => opt(i, `×${s}${avail(i, c.loomGfLevel) ? "" : " (not measured yet)"}`, i === c.bitterLevel, !avail(i, c.loomGfLevel))).join("")}</select></label>
  <label>Bitter learning <select id="bp">${pol("bitter")}</select></label>
  <label>Looming→Giant Fibre weight <select id="ll">${scales.loomGf.map((s, i) => opt(i, `×${s}${avail(c.bitterLevel, i) ? "" : " (not measured yet)"}`, i === c.loomGfLevel, !avail(c.bitterLevel, i))).join("")}</select></label>
  <label>Threat learning <select id="lp">${pol("loomGf")}</select></label>
  <p>Cost ${cost} / budget ${w.budget}</p>${tests}
  <label>Prediction (optional) <input id="pred" style="width:100%"></label>
  <button id="go" ${ok ? "" : "disabled"}>Release</button>
  <p class="muted">${w.feedback.join("<br>")}</p>`;
  const upd = (f: (c: BuildConfig, v: string) => void) => (e: Event) => {
    f(campaign.selected, (e.target as HTMLSelectElement).value);
    renderBench();
  };
  $("sug").onchange = upd((c, v) => (c.sugarHz = Number(v) as 100 | 200));
  $("bl").onchange = upd((c, v) => (c.bitterLevel = Number(v)));
  $("ll").onchange = upd((c, v) => (c.loomGfLevel = Number(v)));
  $("bp").onchange = upd((c, v) => (c.policy.bitter = v as Policy));
  $("lp").onchange = upd((c, v) => (c.policy.loomGf = v as Policy));
  $("go").onclick = () => release(($("pred") as HTMLInputElement).value || null);
}

function renderHead() {
  const w = WAVES[wave(campaign)];
  $("head").innerHTML = `<b>${w.title}</b> — ${w.question} · seed ${campaign.worldSeed}
   ${sim ? ` · t ${sim.t.toFixed(1)}/${w.duration}s · <b>${sim.phase}</b>` : ""}
   <span style="float:right"><button id="pause">${paused ? "Resume" : "Pause"}</button>
   ${[1, 2, 4].map((s) => `<button data-s="${s}">${s}×</button>`).join("")}</span>`;
  $("pause").onclick = () => { paused = !paused; renderHead(); };
  document.querySelectorAll<HTMLButtonElement>("[data-s]").forEach((b) => (b.onclick = () => (speed = Number(b.dataset.s))));
}

let prediction: string | null = null;
function release(pred: string | null) {
  prediction = pred;
  const { config, seed } = retry(campaign);
  $("log").innerHTML = "";
  $("results").innerHTML = "";
  sim = new Sim(brain, { wave: wave(campaign), seed, config, onEvent: logEvent });
  paused = false;
  renderHead();
}

function logEvent(e: GameEvent) {
  const l = e.learning;
  const line = `${e.t.toFixed(1)}s ${e.outcome}${e.foodKind ? ` (${e.foodKind})` : ""} — ${e.feedback}` +
    (l ? ` | ${l.group}: ${l.note}${l.applied ? ` ×${l.scaleBefore}→×${l.scaleAfter}` : ""}` : "");
  const div = document.createElement("div");
  div.textContent = line;
  if (l?.applied) div.style.fontWeight = "bold";
  $("log").prepend(div);
}

function renderBrain() {
  if (!sim) return;
  const g = (k: Group, name: string) => {
    const s = sim!.groups[k];
    const ev = s.evidence.direction ? `${s.evidence.count}/${s.threshold === Infinity ? "∞" : s.threshold} → ${s.evidence.direction}` : "none";
    return `<b>${name}</b><br>start ×${scales[k][s.startLevel]} · now ×${scales[k][s.level]} · pending ${ev}<br>`;
  };
  const d = sim.lastDecision;
  $("brainp").innerHTML = `<b>Brain</b> (${sim.config.policy.bitter}/${sim.config.policy.loomGf})<br>
    ${g("bitter", "Bitter-cell outputs")}${g("loomGf", "Looming→GF")}<hr>
    ${d ? `<pre>last lookup t=${d.t.toFixed(2)}s
in: sugar ${d.stimulus.sugar} bitter ${d.stimulus.bitter} looming ${d.stimulus.looming}
MN9 ${d.readouts.mn9.toFixed(0)}  GF ${d.readouts.giant_fibre.toFixed(0)}  MDN ${d.readouts.mdn.toFixed(0)} Hz (seed ${d.replicateSeed})
→ ${d.action}: ${d.reason}</pre>` : ""}`;
  const f = sim.fly;
  const m = sim.metrics;
  $("stats").innerHTML = `<b>${f.action.toUpperCase()}</b><br>health ${f.health.toFixed(0)} · energy ${f.energy.toFixed(0)}<br>
    eaten ${m.servingsCompleted} · refused ${m.servingsRefused} · poisoned ${m.poisonings}<br>
    jumps ${m.jumps} (on harmless ${m.jumpsOnHarmless}) · escaped ${m.attacksEscaped} · hit ${m.attacksHit}<br>
    suppressed ticks ${m.feedingSuppressedTicks} · adaptations ${m.adaptations}`;
}

const cv = $<HTMLCanvasElement>("cv");
const ctx = cv.getContext("2d")!;
const foodColor = { clean: "#4a9e3f", safe_bitter: "#c9a227", poison_bitter: "#c9a227" };
function draw() {
  ctx.clearRect(0, 0, ARENA.w, ARENA.h);
  if (!sim) return;
  for (const s of sim.servings) {
    if (s.status !== "available") continue;
    ctx.fillStyle = foodColor[s.kind];
    ctx.globalAlpha = s.refusedUntil > sim.t ? 0.35 : 1;
    ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, 7); ctx.fill();
    if (s.progress > 0) { ctx.fillStyle = "#000"; ctx.fillRect(s.x - 10, s.y + 13, 20 * s.progress, 3); }
  }
  ctx.globalAlpha = 1;
  for (const th of sim.threats) {
    if (th.status !== "active") continue;
    ctx.strokeStyle = th.kind === "shadow" ? "#888" : th.kind === "fog" ? "#7a6" : "#c33";
    ctx.setLineDash(th.kind === "shadow" ? [6, 6] : []);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(th.x, th.y, CTRL.hitRadius, 0, 7); ctx.stroke();
  }
  ctx.setLineDash([]);
  const f = sim.fly;
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.heading);
  ctx.fillStyle = f.action === "escaping" ? "#c33" : f.action === "suppressed" ? "#a6c" : "#333";
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#222"; ctx.font = "12px system-ui";
  ctx.fillText(f.action, f.x + 12, f.y - 10);
}

let prev = performance.now();
function frame(now: number) {
  const dt = Math.min(0.1, (now - prev) / 1000);
  prev = now;
  if (sim && !paused && !sim.done) {
    sim.step(dt * speed);
    if (sim.done) finish();
  }
  draw();
  if (sim) { renderBrain(); renderHead(); }
  requestAnimationFrame(frame);
}

function finish() {
  last = sim!.record();
  const att = saveAttempt(last, prediction);
  showResults(last, att.id);
}

function showResults(r: RunRecord, _id: string) {
  const traj = (g: Group) => r.trajectory.filter((p) => p.group === g).map((p) => `×${p.scale}@${p.t.toFixed(0)}s`).join(" → ");
  const dec = decisiveEvents(r);
  $("results").innerHTML = `<b>Result: ${r.result}</b> after ${r.duration}s · prediction: ${prediction ?? "—"}
   <pre>bitter outputs ${traj("bitter")}
looming→GF     ${traj("loomGf")}
${JSON.stringify(r.metrics)}</pre>
   <button id="retry">Retry (same start, same seed)</button>
   <button id="cont">Continue with adapted brain${r.result === "survived" ? " → next wave" : ""}</button>
   <button id="cmp">Compare vs frozen twin</button>
   <div class="row"><div id="evs" style="width:420px"></div><div id="rep" style="flex:1"></div></div>`;
  $("evs").innerHTML = "<b>Decisive events</b><br>" + dec.map((e, i) =>
    `<button data-e="${i}">${e.t.toFixed(1)}s ${e.outcome}${e.learning?.applied ? ` · ${e.learning.group} ×${e.learning.scaleBefore}→×${e.learning.scaleAfter}` : ""}</button>`).join("<br>");
  document.querySelectorAll<HTMLButtonElement>("[data-e]").forEach((b) => (b.onclick = () => {
    const rp = replay(r, dec[Number(b.dataset.e)]);
    $("rep").innerHTML = `<pre>${JSON.stringify({ event: rp.event, decision: rp.decision }, null, 1)}</pre>`;
  }));
  $("retry").onclick = () => { renderBench(); release(prediction); };
  $("cont").onclick = () => { campaign = continueAdapted(campaign, r); sim = null; $("results").innerHTML = ""; renderBench(); renderHead(); };
  $("cmp").onclick = () => {
    const [a, b] = runPair(brain, r.wave, r.worldSeed, r.config, frozenTwin(r.config));
    saveAttempt(b, null);
    const div = firstDivergence(a, b);
    $("rep").innerHTML = `<pre>Same seed ${r.worldSeed}, same start, same body controller.
adaptive: ${a.result}  ${JSON.stringify(a.metrics)}
frozen:   ${b.result}  ${JSON.stringify(b.metrics)}
first divergence: ${div ? `${div.t.toFixed(2)}s\n  adaptive: ${div.a?.action} (${div.a?.reason})\n  frozen:   ${div.b?.action} (${div.b?.reason})` : "none"}</pre>`;
  };
}

renderBench();
renderHead();
requestAnimationFrame(frame);
