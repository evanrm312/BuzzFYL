# Handoff: reconcile the real core with the BuzzFYL UI

Written 2026-11-14 13:38 ET by the session that built the v6 core. Target: demo-ready **2:30 pm**,
demos 2:45. Repo: `~/Projects/fly-brain`, branch **`v6-core`** (main has only the scaffold).
Evan owns the codebase; commits go on `v6-core` with **no Claude co-author line** (Evan's rule).

## Status 14:05: integration done

The UI is wired to the core (`index.html` → `ui/dist/app.js`), decisions 1–4 are implemented, the boss
matrix was rerun at budget 8 and `docs/DEMO.md` has the new seed-7 picks. See "Where the UI lives" in
`docs/CORE_CONTRACT.md`. Not done: a human click-through in a real browser (only headless screenshots
and the stubbed-DOM smoke test), narrow-screen check, backup recording. Everything below is the
original brief, kept for context.

## Read these first, in order

1. `~/Downloads/BUZZFYL_COMPLETE_CLAUDE_HANDOFF.md` (4.7 MB): Aarush's approved UI and design
   brief. Part 1 is the authority for UI, copy and flow. The source (`dist/index.html`,
   `style.css`, `app.js`, assets, fonts) is a base64 payload at the end. Extract it with the script
   in its Part 3. Don't `cat` the whole file.
2. `docs/CORE_CONTRACT.md`: what the core exposes and what the UI reads and dispatches.
3. `docs/DEMO.md`: demo sequence, picked seeds, and the limitations to say out loud.
4. `docs/matrix/MATRIX.md`: 450 builds × 10 seeds × 4 waves, per-feature effects.
5. `~/Downloads/Small_Fly_Learning_Handoff_v6.md`: the v6 scientific rules the core implements.

## The job

The UI prototype runs on a **synthetic** adapter (`window.BuzzFYLBrainAdapter`) and a simplified
`step()` loop. Its own handoff says both must be replaced by Evan's real adapter and core. The
work is to wire the approved UI to `src/core/` without changing the approved look, copy or flow,
and without writing a second simulation engine.

## Decisions Evan made at 13:45 (these override the table below)

1. **Single boss encounter only.** No waves 1–3 in the UI, since there isn't time for multiple
   levels. Use `WAVES.boss`. Waves 1–3 stay in the core but are unused.
2. **Ownership split (resolves the economy question).** Aarush's UI governs how the app looks
   and how the player moves through it: screens, copy, tabs, the 8-segment meter, sliders and
   notebook. The core governs what the fly brain can do, meaning which settings exist, their
   levels, costs and effects, based on what was actually measured. The markdown handoffs (v6
   brief and the UI file's brain sections) are guidance, not rules. Concretely:
   - Sugar exposes only the measured, playable inputs: 100 and 200 Hz, i.e. two levels. There is
     no sugar 0, because the fly could never eat. The UI slider shows two steps.
   - Bitter and threat levels are the core's 5-step weight scales (UI 0–4 already matches).
   - Costs come from `buildCost` in `src/core/config.ts`. Each weight level moved costs 1, sugar
     200 costs 2, and a responsive policy costs 1. Set the boss budget to **8** so the UI's
     8-segment meter shows the real budget, then rebalance (decision 3) and adjust costs if a
     single build dominates.
   - The UI reads levels, costs and budget from the core. Don't hard-code the prototype formula
     `sugar + |bitter−4| + |threat−2|`.
3. **The primary goal is getting across.** Eggs are a bonus ("dopamine spike"), not the win
   condition. Change the core so `result = "survived"` means the fly is alive at the end **and**
   has reached the fruit (`metrics.reachedFruitAt !== null`). Eggs become a score shown on top.
   Remove `eggTarget` and the `no_clutch` result, or repurpose `no_clutch` as "alive but never
   crossed". Then rerun `npx tsx scripts/matrix.ts 10 boss` and `scripts/pickdemo.ts`. The
   current demo seeds in `docs/DEMO.md` were picked under the old egg-target rule.
4. **Keep citronella and water** in scored behavior as implemented: the citronella proxy is a
   bitter contact repellent, and water is measured with an authored 10 Hz drink threshold. Update
   the UI's "Proposed" water label to an honest short note, and add citronella to the UI copy
   where hazards are shown.
5. **Brain data snapshot committed** at 13:45: seed 0 complete (1650 conditions incl. water),
   seed 1 partial (786). The background export keeps adding seeds 1–2. Commit again only if you
   want the extra seeds in the demo.

## Conflicts to resolve with Evan before or while integrating

| # | UI handoff says | Core currently does | Recommendation |
|---|---|---|---|
| 1 | One picnic boss encounter. No multi-wave campaign. | Waves 1–3 plus a boss finale. Evan said "finale after waves 1–3" at ~13:00, and the UI file (13:35) is newer. | Ship the core's `boss` wave as the single encounter. Leave waves 1–3 in the core; the UI doesn't use them. Confirm with Evan. |
| 2 | Budget 8. Sugar 0–2, bitter 0–4 (default 4), threat 0–4 (default 2). Cost = sugar + \|bitter−4\| + \|threat−2\|. Learning costs 0. Responsive/Conservative per group. | `BuildConfig` uses the same index scales: bitter index 0–4 = ×0…×1, threat index 0–4 = ×0.5…×1.5, so defaults 4 and 2 are the unmodified brain. Sugar is 100 or 200 Hz only. Budget 5 for the boss, and responsive costs 1. | Adopt the UI economy. Map UI sugar 1 to 100 Hz and 2 to 200 Hz. **UI sugar 0 = 0 Hz means the fly never eats.** Disable it or make it level 1. Set boss budget to 8 and policy cost to 0, then rerun `npx tsx scripts/matrix.ts 10 boss` to check for a dominant build. |
| 3 | Water is "Proposed", with no slider, cost or neural effect. | Water is measured. Droplets and soda spills are read through water taste cells at 400 Hz. MN9 is weak, ~15–20 Hz alone, so drinking uses an authored 10 Hz threshold. It's an environment resource, not a player setting. | Keep it as no slider and no cost, as the UI says. Change the "Proposed" label to a short honest note (water cells measured, weak response, drink threshold is ours). Evan decides. |
| 4 | Citronella stays out of scored behavior until defined. | Defined: food beside a candle is coated, and the fly tastes it through bitter taste cells. The smell route was probed and seized the model (~10k neurons active), see `notebooks/probe_senses.py`. | It's now defined and labeled as a proxy. Keep it or remove `candles` and `citronella` food from `WAVES.boss`, Evan's call. |
| 5 | "Get across the picnic before Mack (pest control) gets here." Concrete finish region plus survival/food criterion required. | Boss: start (50,250) → fruit bowl (735,250, r 45). Win = survive 75 s **and** lay ≥ 4 eggs. Fogger (Mack) arrives at 48 s. | Mack = the fogger. Reconcile the objective copy ("reach the fruit and lay your eggs before Mack fogs it") with Evan and Aarush. The headline copy itself is locked. |
| 6 | Art: gate upper-left, lawn, blanket/food right, basket, pink-canopy tree. World geometry must stay separate from the art. | Arena is 800×500 world units. Food is placed by route bands (edge 60–320, middle 260–560, far 500–760). Candles are at (330,140), (330,360), (470,250). | Keep core coordinates as world geometry and map them to the art with a transform. If you move start/fruit to match the art, rerun the boss matrix afterwards. |
| 7 | Show backing up (MDN) separately. | MDN is recorded on every decision but drives nothing; it only fires at looming 150 or so. | Show the MDN rate on the brain monitor. Don't invent a backing-up action. |
| 8 | Results report "encounter progress %". | No progress field. The core has `fly.x`, `metrics.reachedFruitAt` and `metrics.eggsLaid`. | Compute progress from distance along the start → fruit line, or add a field to the core. |

## What exists (all on `v6-core`)

- **`src/brain.ts`, the adapter.** `Brain.load()` reads `public/data/brain_plastic.json` (fetched as
  `data/brain_plastic.json`). `stateAvailable(state, withWater)` disables unmeasured states. It
  never interpolates or synthesizes a value.
- **`src/core/sim.ts`, the authoritative headless sim.** The UI owns the clock: call
  `sim.step(dt * speed)`, which is fixed-step and deterministic, so pause and speed don't change
  results. Read `sim.fly`, `sim.servings`, `sim.threats`, `sim.groups` (start, current, pending
  evidence), `sim.lastDecision` (readouts plus a plain-words `reason`), `sim.metrics`,
  `sim.result`, and `sim.record()` for the replay log.
- **`src/core/learning.ts`.** One-level steps per resolved event. Opposite evidence discards what
  is pending. Clamped to the available levels. Frozen counts nothing.
- **`src/core/waves.ts`.** `WAVES.boss` is the encounter. Each `RAMPS` value is the looming Hz per
  0.25 s decision tick.
- **`src/core/campaign.ts`.** Retry, `continueAdapted`, and a notebook in localStorage.
  `restoreBuild(a, "start" | "final")` covers the UI's "Restore starting brain" vs "Use adapted brain".
- **`src/core/compare.ts`.** `runPair`, `frozenTwin`, `firstDivergence`, `decisiveEvents`,
  `replay(record, event)`. Replay is driven by stored records, not by rerunning the sim.
- **`src/main.ts` + `index.html`.** A plain dev harness: Vite, `npm run dev`, port 5173. It's the
  demo fallback if the UI integration slips. URL options: `?seed=9&wave=3` goes straight to the boss.
- **Scripts.** `npm test` checks invariants. `scripts/matrix.ts` runs the feature matrix.
  `scripts/balance.ts`, `scripts/trace.ts` (`wave seed sugar bLvl lLvl pb pl`) and
  `scripts/pickdemo.ts` are the other tools.

## Integration approach (recommended)

The UI is plain JS with no build step, and the core is TypeScript under Vite. Fastest path:

1. Extract the payload into the repo, e.g. `ui/`: `python3 extract_buzzfyl.py <file> ui`.
2. Serve it through Vite. Make `ui/dist/index.html` a Vite entry, or point the root `index.html`
   at it. Turn `app.js` into a module and import the core directly:
   `import { Brain } from "../src/brain"`, plus `Sim`, `campaign` and `compare` from `src/core/`.
3. Replace `window.BuzzFYLBrainAdapter` and the synthetic `step()` with a thin facade that maps the
   UI's commands onto the core:
   - `configure` builds a `BuildConfig`.
   - `release` does `new Sim(brain, {wave: "boss", seed, config, onEvent})`.
   - `pause` and `setSpeed` only affect the UI clock.
   - `end` stops the run and saves it with `saveAttempt(sim.record())`.
   - `restore` calls `restoreBuild`.
   - `compare` calls `runPair(brain, "boss", seed, cfg, frozenTwin(cfg))`.
   - Keep the UI's DOM, CSS, copy, tabs, 8-segment meter and notebook styling unchanged.
4. Brain monitor: the export has real `groups.<name>.root_ids` for sugar, bitter, looming, water,
   MN9, Giant Fibre and MDN. Highlight by group. Any layout must be labeled schematic, with no
   invented anatomy or spikes.
5. Typecheck, run `npm test`, then click through the flow in a browser: Picnic → Build → Release
   → Results → Compare → Notebook. Check `?seed` determinism by running the same seed twice.

## Brain data status

- Seed 0 is complete: 25 weight states × 66 stimuli (48 base + 18 water) = 1650 conditions.
- Seeds 1–2 are being exported in the background (PID ~35232, log `notebooks/.plastic.log`);
  1650 seed-1 runs are needed and 662 were done at 13:38. Writes are atomic (tmp then rename),
  so reading the file mid-run is safe. The game uses whatever seeds exist, and the replicate is
  picked per decision key. It won't finish before 2:30, which is fine.
- `public/data/brain_plastic.json` is modified in the working tree by that export. Commit a
  snapshot before the demo so the demo data is pinned.
- To stop the export, use `kill $(pgrep -f "[e]xport_plastic.py --workers")`. The `[e]` matters:
  a plain `pkill -f export_plastic` kills your own shell. To resume, run
  `.venv/bin/python -u notebooks/export_plastic.py --workers 16 --seeds 1 2 --water --chunk 8`.
  Don't go above 16 workers: the sim is memory-bandwidth bound.
- Measured anchors (seed 0): sugar 200 + bitter 200 gives MN9 ≈ 85/65/40/5/5 Hz at bitter
  ×0/.25/.5/.75/1. Giant Fibre at looming 50 is ≈ 112/140/170/170/200 Hz at threat ×0.5…×1.5.
  Water 400 alone gives MN9 ≈ 20 Hz.

## Gotchas

- The shell is zsh: `$var` doesn't word-split, so use `${=var}` in loops.
- `brain.stateAvailable(state, true)` is required for the boss, which needs the water lattice.
- Controller version is `body-2`. Bump `CONTROLLER_VERSION` or `LEARNING_RULE_VERSION` in
  `src/core/config.ts` if you change thresholds, so saved runs stay attributable.
- Tuning knobs are all authored and in `config.ts` and `waves.ts`: feed MN9 ≥ 30, drink ≥ 10,
  jump GF ≥ 150, conservative 3 events, responsive 1.
- Wording rules are in `docs/CORE_CONTRACT.md`: "authored learning applied to real
  connectivity", reset-state trials, "jump" not "dodge", and citronella and the water threshold
  labeled as ours.

## Suggested order with ~45 minutes

1. Confirm the economy (decision 2) with Evan, and implement the win-condition change (decision 3).
2. Extract the UI, serve it via Vite, import the core, and replace the adapter and step loop.
3. Update the economy (conflict 2), rerun the boss matrix, and re-pick demo seeds with `pickdemo.ts`.
4. Browser click-through, commit a data snapshot, update `docs/DEMO.md`, record backup footage by 2:15.
