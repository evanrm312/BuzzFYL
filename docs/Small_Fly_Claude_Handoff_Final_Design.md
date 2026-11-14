# Small Fly, Big Problem

## Handoff to Evan and Evan’s Claude session

Prepared Saturday, November 14, 2026. Planning and visual concepts only. Audience is Evan, Aarush, and their implementation agents. This document consolidates Evan’s supplied handoff, Aarush’s later decisions, and a three-agent debate between game design/player, production, and neuroscience reviewers. It supersedes the earlier 3D kitchen proposal. The playable game has not been implemented or tested.

### Read this first

Build a cute, chaotic 2D top-down picnic survival game using TypeScript, Phaser 3, and Vite. The human steers and dashes. A fruit-fly circuit model determines a feeding-related output, which consistently controls consumption and visible body feedback. Progress through three waves and survive a fogger truck. The prize demonstration is a controlled comparison of the same sensory input under two neural configurations.

The handoff’s schedule remains 10:30 a.m.–2:45 p.m. ET, with internal submission at 2:15. That gives 4 hours 15 minutes through the posted deadline and 3 hours 45 minutes to our target. Confirm any organizer changes at opening remarks. The requested five-hour estimate is a planning envelope only. An explicit extra 45 minutes should go to testing and polish.

The organizers’ notebook is still unseen. Exact neuron IDs, supported conditions, model runtime, and measured effects are unresolved. All skill descriptions below have an evidence gate. No fabricated example output belongs in the judged build.

## 1. Confirmed preferences and recommended defaults

Confirmed by Aarush or the shared handoff:

- 2D top-down arena, backyard BBQ/picnic, increasing waves, fogger boss.
- TypeScript + Phaser 3 + Vite, Python/Colab for neuroscience preparation.
- Direct player movement with brain-linked body responses.
- Cute and chaotic tone.
- Grooming produces a slowdown if included.
- Wave completion and discoveries award neuro points.
- More valuable neural interventions should cost more.
- Replay is desired.
- AI agents handle coding and technical decisions. Humans run, test, tune, and integrate.

Recommended defaults chosen by this review, awaiting Evan’s final reconciliation:

- Five earnable neuro points before the boss, with prices 1, 2, and 3.
- One equipped neural configuration and one equipped body upgrade.
- Free refunds and respec between waves.
- Picnic Pop visual direction.
- Experiment replay is the core replay feature. Full gameplay playback is an extension.
- Three waves and a 50-second survival boss, with grooming conditional on readiness.

## 2. What the panel debated

| Issue | Initial tension | Resolution |
|---|---|---|
| Expensive skills | Player wanted a meaningful premium ability; producer flagged simulation combinations | One neural preset slot. A 3-point combined feeding intervention adds three conditions to a nine-condition single-intervention batch |
| Dodge and wider vision | Visually exciting but supported neural input/output is unverified | Keep manual dash authored. Study neural escape only if the notebook supplies a working example. Wider camera view is an authored presentation change |
| Grooming | Strong visible body behavior but adds a second circuit and hazard system | Slowdown preference remains approved. Add after complete feeding integration and a playable ending |
| Replay | Full playback adds recording and state restoration work | Ship same-stimulus experiment replay first; optionally record a short gameplay clip |
| Parallel AI work | More agents could produce more code but overwhelm two human integrators | Three bounded implementation lanes, one merge/configuration owner, targeted read-only reviews |
| Economy | Flat prices failed the desired progression | Maximum five points, free respec, a premium neural preset and optional independent body upgrade |

The producer’s early premium suggestion was grooming. Design and science proposed the smaller combined feeding preset. The final recommendation prioritizes that combination when its measured effect is useful. These are agent judgments, with no playtest evidence yet.

## 3. The playable run

| Stage | Time | Introduces | Reward |
|---|---|---|---|
| Wave 1 | 30 seconds | Movement, hovering over clean food, energy | One completion point; first clean-feed discovery can award another |
| Wave 2 | 40 seconds | One clearly telegraphed swatter attack | One completion point |
| Wave 3 | 40 seconds | Bitter food, clearly marked poisoned sweet bait, swatter | One completion point; first bitter-food attempt can award another |
| Boss | 50 seconds | Truck crosses the upper street edge and sends moving cloud lanes | Survive until it drives away to win |

Total active action is 160 seconds. Between-wave decisions are untimed and paused. A typical run should take 3–4 minutes, though a player reading every experiment can take longer.

The core decision is whether to remain exposed long enough to feed, seek safer food, or change sensory response between rounds. Keep clean food accessible in every stage so bitter silencing remains optional. Cloud patterns need a reachable gap. Boss presentation can reuse the swatter and one moving lane pattern.

Controls are WASD/arrows to move, Space to dash, Escape to pause, R to restart from the end screen, and a visible button for the between-wave experiment panel. Normalize diagonal movement. Manual dash stays available with any neural preset. No neuron configuration can silently remove player steering.

## 4. Food and interrupted feeding

Automatically begin a feeding attempt after 0.35 seconds continuously overlapping one food. Show a small progress ring and a clear response label. Only one food target is active at a time. Moving away stops the progress ring. Preserve partial progress on that food. Transfer energy and apply any poison penalty together when a full serving completes, exactly once, then remove that serving. Energy from earlier completed servings remains with the player. This avoids gaining energy from poisoned food by repeatedly leaving just before its damage trigger.

| Food | Sensory preset | Authored consequence |
|---|---|---|
| Clean fruit/soda | Sugar | Restores energy |
| Bitter fruit | Sugar + bitter | Restores energy if consumed |
| Poisoned sweet bait | Sugar + bitter | Restores some energy and inflicts a one-time serving penalty |

Toxicity belongs to food metadata. The model receives taste input and returns measured activity. Use visible poison symbols and patterns. Citronella scenery does not automatically establish a taste pathway.

The handoff’s earlier bitter-only sample with strong feeding output was hypothetical. The controlled experiment uses sugar plus bitter, then applies bitter-neuron silencing and measures the change.

A food-removal experiment is optional. Preserve the neural state within a single simulation, turn off sensory stimulation, and record the following activity. Independent steady-state trials cannot establish the removal transient. If included, mouthpart animation may follow measured residual activity after the fly departs, but energy gain still requires food contact. Claims about disappointment, regret, learned hunger, or reward prediction require their own model and evidence.

## 5. Economy and skill catalog

Award one point for each completed wave and two one-time discovery points per run. Discoveries are the first successful clean feed and the first completed sensory sampling attempt on sugar-plus-bitter food. Refusal still counts as a discovery. Lock discovery flags for the run so replay, respec, or repeatedly visiting one food cannot farm points. Maximum earned before boss is five.

Show earned and available points in the paused shop. Free refunds make early purchases reversible. One neural preset and one body upgrade may be equipped. A neural preset is a complete simulated configuration, including the combined premium intervention.

| Cost | Display label | Change | Shipping gate |
|---|---|---|---|
| 0 | Baseline | Original configuration | Reproducible reference condition |
| 1 | Sugar sensitivity | Increase documented sugar sensory stimulation during sugar contact | Measured feeding output changes usefully |
| 2 | Bitter bypass | Silence documented bitter sensory neurons | Compare sugar-plus-bitter response with baseline |
| 3 | Feeding override | Joint sugar boost and bitter silencing | Simulate the combined condition directly and verify useful benefit |
| 1 | Dash recovery | Shorter manual dash cooldown | Explicit authored body upgrade |
| 2 | Protective shell | One additional maximum HP | Explicit authored body upgrade; only if tuning needs it |

The exact premium name can change with the observed effect. A higher cost reflects game value. An intervention can saturate, fail, or duplicate a cheaper option. If the combined preset adds no useful effect, remove it from the shop. Do not invent a biological penalty just to justify price. The slot and point budget provide an authored opportunity cost.

Grooming suppression is a later candidate. Demonstrate a documented intervention changing an appropriate downstream readout. Silencing the measured output neuron and observing that same neuron become silent supplies limited evidence about the broader circuit.

Fast neural dodge needs a verified escape input/output and an explicit movement mapping. Wider biological vision needs a visual sensing model and a validated change in sensitivity or coverage. A full-arena camera is already useful for fair hazard visibility. Both neural abilities remain research candidates. The user’s desire for meaningful premium skills is addressed first through measured feeding interventions.

## 6. Grooming, if the evidence and time support it

Grooming is antenna/body cleaning. Dust contact can be translated into a documented antennal mechanical stimulus and a grooming-related readout. The response produces a brief antenna-cleaning animation and slowdown. Aarush chose slowdown. Start with 70% movement speed for about one second, then tune. These values are authored mappings.

Avoid a cloud retriggering slowdown every frame. Use one event per exposure and a re-entry cooldown. If suppressing grooming also leaves dust accumulated, show that effect and document it as a game rule. A neural intervention should have an actual measured effect before it becomes a purchase.

## 7. Brain integration and validation

Precomputed whole-brain simulation is the preferred route if runnable. Initially establish four trials with matched duration, initialization, and measurement window:

1. Baseline with no sensory input.
2. Baseline with sugar.
3. Baseline with sugar plus bitter.
4. Bitter silencing with sugar plus bitter.

Inspect whether the expected suppression and restoration occur. The demonstration must follow the actual output. Then expand to nine conditions using baseline, sugar boost, and bitter-silenced configurations crossed with no input, sugar, and sugar+bitter. The combined preset expands this to 12 conditions. Three seeds for each of 12 conditions means 36 trials. Measure setup plus subsequent run times before committing. Export each finished condition so integration can start early.

Keep a reproducible seed and reset state between independent trials. Use a shared output-to-game mapping. The single equipped preset prevents arbitrary combinations. Body upgrades do not enter neural lookups. Every selectable preset needs all sensory conditions that the game can request.

If only connectome data is supplied, use a clearly labeled simplified graph model. Preserve directed connections and real synapse counts. State toy dynamics and assumptions. Output units become the model’s activation units when appropriate. They cannot be labeled as biological Hz without a corresponding spiking calculation. Reword skills around the graph interventions actually implemented. Do not describe a small extracted subgraph as an equivalent whole-brain model.

Notebook inspection decides the mode by 11:10. Verified neural output should change gameplay by 12:15. Synthetic development fixtures must be marked mock and rejected by the judged production configuration.

## 8. What the player sees from the brain

The compact in-game monitor shows current sensory input, selected response, and the model mode. A recorded trace may play with a clear replay label. Food progress and the mouthpart animation follow the same mapped output. The skill panel identifies the intervention, documented cells, source, and actual output change.

Keep the arena dominant. Show raw rates, measurement windows, neuron IDs, and detailed traces in the paused experiment panel. Stimulated/silenced cell highlights are valid from intervention metadata. Downstream firing animation requires downstream activity records. A graph layout is schematic unless anatomical coordinates are actually used.

Experiment replay compares the same input under two configurations side by side. It must pause the game and leave the live run unchanged when closed. Label the result as a fixed experimental stimulus. It cannot imply a counterfactual recording of arbitrary player movement.

Optional gameplay playback can store a short timeline of positions, actions, condition IDs, and events. It is lower priority than experiment replay, feeding feedback, and the ending. A backup screen recording is sufficient for presentation recovery.

## 9. UI directions and chosen default

Three image-generated concept previews accompany this conversation. They illustrate appearance, with placeholder counters and schematic traces. They are planning references. Project graphics can be drawn procedurally during permitted build time, consistent with the handoff’s default.

| Scheme | Appearance | Production consequence |
|---|---|---|
| A — Picnic Pop | Cream HUD, red gingham, bold rounded cartoon outlines, friendly fly | Recommended. Simple shapes and strongest threat readability |
| B — Pocket Arcade | Dark navy HUD, crisp pixel shapes, bright accents | Requires consistent pixel sizing and more sprite discipline |
| C — Field Notebook | Sage/cream palette, hand-drawn field-guide styling | Attractive science theme, but subtle details and textures are more work |

Default to A with a dark scientific panel between waves. Use Nunito or an available rounded sans face for game labels, and a readable monospaced face for measured values. Show hearts/energy upper left, stage/progress upper right, and a compact sensory response strip outside the main action. Use icons and patterns as well as color.

Design effects in priority order: visible swat warning, feeding progress, refusal feedback, wing animation, damage flash, restrained food particles, then sound. Distinguish purple bitter food from dangerous fog through shape and symbols. A simple high-contrast fly silhouette must remain visible on the gingham. Respect mute and avoid rapid screen flashes.

## 10. Initial balance, explicitly authored

- Three HP and one second of shared damage invulnerability.
- Energy 100, initial drain two units per second.
- Clean serving restores about 30 energy.
- At zero energy, lose one HP every three seconds.
- Swat warning approximately 0.8 seconds, one attack roughly every three seconds.
- Manual dash cooldown four seconds; the one-point recovery upgrade starts at three seconds.
- Every cloud pattern preserves a reachable safe region. Avoid spawning hazard damage directly on the player without warning.
- Energy drain, wave timers, swats, and clouds pause while in menus.

Balance feeding duration after measuring neural rates. Choose the mapping once for all conditions. Use a cap to keep the interface playable while preserving visible meaningful differences. Do not claim every cell-rate change is a validated change in biological consumption speed. An output neuron can indicate feeding initiation while the game maps that readout to energy progress.

## 11. Three AI implementation lanes

Assign by access and continuity. These assignments do not claim one named model is universally better. Fable’s exact export/editor workflow has not been verified.

| Lane | AI session | Human | Ownership |
|---|---|---|---|
| Core and integration | Astra | Aarush | Scaffold, shared types/config, authoritative state, movement, food, waves, restart, production build and final merges |
| Neuroscience | Claude/Opus | Evan | Colab trials, export, scientific validation, brain adapter, condition coverage, source labels |
| Presentation/content | Fable if compatible, otherwise an editor-connected Claude/Astra session | Aarush | HUD, paused skill/experiment panel, procedural art, bounded threat components |

Use one Git repository and separate branches or worktrees per implementation lane. If separate computers cannot share a working directory, exchange committed changes through the repository. Each worker owns a file allowlist. Only the integrator changes shared types, dependencies, scene lifecycle, or package configuration. Integration happens in small patches every 20–30 minutes. Additional agents can review code read-only after a patch is merged.

The presentation lane first proves it can deliver one compatible HUD component. If Fable cannot export compatible code, use it for visual specifications and review and assign the component to an editor-connected session. Avoid a second implementation of the game in a different framework.

Suggested boundaries:

- Core owns src/main.ts, src/types.ts, src/config.ts, src/state.ts, src/scenes/Game.ts, package files, and deployment configuration.
- Neuroscience owns notebooks/, src/brain.ts, public/data/brain.json, and neuroscience sections of credits through an integrator-reviewed patch.
- Presentation owns src/ui/, src/art/, and assigned individual src/threats/ files. It emits commands and reads state. Core applies health, energy, purchases, and transitions.

The initial 15-minute contract establishes a stimulus preset ID, a neural configuration ID, and a response with condition ID, availability/status, raw measured output and units, mapped feeding progress, source/mode, and optional trace. It also establishes UI commands such as purchase, refund, resume, and replay. No missing condition may silently become a fabricated success.

### Copyable work orders for build time

**Astra / core**

Implement the approved Phaser 3 game from this handoff. Own only core files and shared contracts. First deliver movement, one food, pause, restart, and clearly marked mock brain input. Define UI callbacks and the neural adapter contract before parallel work. Integrate small patches, preserve a runnable build, and report changed files, checks, and blockers. Keep neuroscience claims aligned with supplied data. All runtime effects use one authoritative game state.

**Claude/Opus / neuroscience**

Inspect the provided notebook and report dataset, model, neuron annotations, dependencies, and timed first/subsequent runs. Reproduce the four-condition feeding comparison before expanding. Export measured results with provenance and units, validate condition coverage, and implement the agreed adapter. Keep IDs as strings. Record unsuccessful or missing conditions explicitly. Explain what is measured and what gameplay mapping is authored.

**Presentation agent**

Follow Picnic Pop unless Aarush chooses another supplied scheme. Work only in assigned UI/art/threat files. Consume the agreed state and dispatch commands. Deliver a readable HUD first, paused skill panel second, one threat component third. Use procedural shapes, a small palette, and clear warning patterns. Never independently mutate health, points, energy, or stage progression. Return a compatible patch with acceptance checks.

**Read-only reviewer**

Review a runnable integrated build for one assigned concern. Check restart/pause cleanup, overlap damage, neural lookup coverage, point/refund accounting, or production asset loading. Report a reproducible trigger, expected behavior, actual behavior, and the smallest recommended correction. Let the file owner implement it.

## 12. Export details that prevent integration failures

Include schema version, actual dataset release, source notebook, model/code revision, export date, mode, trial configuration, seed, duration and measurement window. Define input rates and units. Identify actual output cell IDs and aggregation across cells if used. Traces specify bin size and units. Graph mode includes nodes, directed edges, and toy-model parameters.

Represent neuron IDs as strings. Optional outputs such as grooming remain unavailable until measured. Pin Phaser 3 and the project’s dependencies. Commit the lockfile so both laptops match. UI availability is derived from a complete validated preset manifest. Body upgrades remain independent of the neural export.

## 13. Timeline and gates

| ET | Core / Aarush | Neural / Evan | Presentation lane | Gate |
|---|---|---|---|---|
| 10:30–10:45 | Scaffold and contract, movement | Inspect notebook, time setup | HUD draft against fixture | Shared contract and owners agreed |
| 10:45–11:10 | Food, energy, pause, restart | First control trials, choose mode | Player/food shapes, warning styles | Data mode selected |
| 11:10–11:45 | Swatter integration, damage | Core comparison, incremental exports | Skill panel with mock labels | One complete food/threat loop |
| 11:45–12:15 | Connect real adapter and progression | Validate output, expand supported presets | Real source/response panel | Brain changes gameplay |
| 12:15–12:45 | Complete waves, truck, win/loss | Experiment replay conditions | Boss lane visuals and upgrade polish | Complete run |
| 12:45–1:15 | Balance, merge, build | Validate provenance/coverage, repeat if feasible | Effects and legibility | Feature freeze |
| 1:15–1:45 | Both-laptop test, host | Scientific demo check | Fix visible issues, record backup | Demonstrable production build |
| 1:45–2:15 | Rehearse and submit | Verify description and challenge selection | Blocker corrections only | Submission verified |
| 2:15–2:45 | Deadline buffer | Deadline buffer | Deadline buffer | Preserve stable result |

Take food in staggered short breaks. If the first full loop slips, cut gameplay rewind, grooming, water mechanics, extra boss patterns, and extra body upgrades in that order. Preserve authentic data integration, food feedback, one neural choice, experiment replay, a clear end state, and restart. A conditional feature moves into production only when its dependencies are verified.

## 14. Acceptance and demo

Both humans play one full run. Verify diagonal speed, single food target, one-time discovery rewards, point refunds, respec availability, absence of missing neural conditions, capped repeated damage, and reachable food/gaps. Pause must stop all game clocks. Restart resets timers, physics objects, listeners, neural selection, discovery flags, and UI. Experiment replay leaves the run unchanged. Production rejects mock data. Test the hosted URL in a fresh tab and keep a local production preview ready.

Rehearse a 90-second demo, subject to the organizer’s actual limit. Show the fly encountering sugar-plus-bitter food, replay the fixed stimulus under two neural configurations, point to the measured difference and the resulting feeding behavior, then show the boss or ending. State the dataset, precomputed or simplified mode, and team-authored movement/toxicity/progression rules. Present only measured changes. Preserve a backup recording and a saved experiment comparison.

## 15. Morning decisions for Evan’s Claude

Accept these recommended defaults or identify a concrete conflict quickly:

1. Five-point economy, 1/2/3 neural prices, one preset slot plus one body upgrade.
2. Combined feeding intervention as conditional premium; baseline and bitter remain the minimum comparison.
3. Picnic Pop theme, with paused dark experiment panel.
4. Three AI lanes and Aarush as integration owner, Evan as neural owner.
5. Experiment replay before gameplay replay; grooming only after core evidence and complete run.

Immediately inspect the notebook when available. Confirm organizer rules on early work, generated assets, AI disclosure, exact deadline, demo length, and submission fields. These planning materials and concept previews were created before build time. No message has been sent to organizers or Evan on the user's behalf.

## Sources and evidence boundaries

- [MLH event](https://events.mlh.com/events/15651). Schedule read earlier in the conversation and repeated in Evan’s handoff. Confirm on arrival.
- [Challenge brief](https://www.mlh.com/events/hack-day-x-hack_ncstate-thinking-machines-at-ncsu/challenges/01a1cc99-5960-594e-a5f0-a720b485302f). Allows creative applications of neural graphs, pathways, and structural data.
- [MLH Hack Day guide](https://github.com/MLH/mlh-hack-days-organizer-guide/blob/main/project-submissions.md). Project-specific work during the event is the default; local organizers may communicate another policy.
- [Shiu reference implementation](https://github.com/philshiu/Drosophila_brain_model). Activation, silencing, and spike outputs. The actual organizer notebook remains uninspected.
- [Shiu et al., Nature 2024](https://www.nature.com/articles/s41586-024-07763-9). Published feeding, taste interaction, and antennal grooming work supports candidate experiments. Gameplay mapping and premium usefulness require our own checks.
- [Eon embodied-fly explanation](https://eon.systems/updates/embodied-brain-emulation). Demonstrates the need to map sensory events into neural inputs and selected outputs into authored body controllers.
- [Phaser 3.90 documentation](https://phaser.io/oss/docs/api-documentation/3.90.0/event/physics-arcade-events). Match documentation to the pinned major version.

