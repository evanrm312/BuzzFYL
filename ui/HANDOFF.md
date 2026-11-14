# BuzzFYL: final UI and implementation handoff

## Authority and scope
This document consolidates the latest user decisions on 14 November 2026. Latest explicit decisions override older handoffs. Ship a 2D game with one picnic boss encounter. No multi-wave campaign, no 3D scene, no direct player steering. The level geometry and balance are deliberately unresolved. The attached prototype is the visual and interaction reference, not a validated neuroscience simulation.

Live prototype: https://buzzfyl-picnic-lab.deep-swift-0542.chatgpt.site
Source: dist/index.html, dist/style.css, dist/app.js. Static assets: dist/assets/. Preserve these assets and their font licenses. The prototype runs without a build step. Its synthetic adapter must be replaced before a scientific demonstration.

## Purpose and judging
Best Use of a Fly Brain is the central goal. Real fruit-fly brain data must meaningfully drive behavior. Creativity carries the most weight, followed by functional demonstration and concise professional presentation. Demonstration time is 3–5 minutes; prioritize a working encounter, one inspectable learning event and a controlled comparison rather than slides. Do not substitute decorative brain animations for real integration.

The player builds a starting brain with limited points, releases an autonomous fly, observes consequences, reviews evidence, and deliberately revises its configuration. Reward informed combinations and learning-policy choices, not time played or currency farming. The fly's experiences change later decisions within an attempt.

## Locked flow
Picnic → Build your fly → Workbench → Release Fly → autonomous encounter → Results/replay → revise, compare or notebook. Successful completion opens the final summary. Picnic also offers Scout: basic model, which launches defaults without overwriting the prepared loadout. An unfinished attempt must be resumed or explicitly ended, never silently replaced.

Navigation tabs are Workbench, Picnic, Notebook. They are distinct bordered tabs with visible selected states and keyboard focus. Do not restore floating text navigation or the removed slogan strip. First time here? opens a scrollable tutorial. Open notebook remains accessible from Picnic. Notebook navigation uses the main tabs and Escape; no Close notebook button.

## Exact approved copy
Picnic headline: “One small step for fly. One giant buzz for flykind.”
Picnic body: “Mack's Pest Control is on the way. Can you build a brain that gets you across the picnic before he gets here?”
Buttons: “Build your fly”, “Scout: basic model”, “First time here?”, “Open notebook”, “Release Fly”.
Workbench prompt: “Build your loadout!”
Branches/settings: “Feeding”, “Escape”, “Sugar”, “Bitter”, “Water”, “Threat”, “Learning”.
Notebook heading: “Field Notebook”. Empty heading: “A fresh page.” Empty body: “Release your first fly to record its settings, discoveries, and results.”
Sugar explanation: “Sugar is a sensory input: increasing this level sends stronger stimulation into sugar-sensing cells.”
Bitter explanation: “Bitter cells signal a reason to reject food. This setting scales their outgoing connections, so weakening it can allow feeding despite a bitter taste. Safe meals weaken this group; poisoning strengthens it under the selected learning policy.”
Remove: “One picnic. One pest controller.”, “Build your next attempt.”, “Keep what worked. Change what didn’t.”, “Every attempt leaves something worth keeping.”, the repeated-picnic caption, and the bottom scouting instruction. No mandatory prediction step.

## Visual specification
A warm, tactile, illustrated picnic game, strictly 2D. Translate material character from the supplied Timmy Time picnic reel into flat illustrated assets. Do not import the older handoff's puppet-height camera, manual walking, proximity interactions, camera sweeps or Blender scene requirements. Those are superseded.
Reference: https://www.facebook.com/reel/1039147914302228 . The earlier visual analysis described chunky silhouettes, stitched fabric, visible basket weave, layered sandwich fillings, bent straws, painted gate grain and scalloped tree canopies. Use those observations as inspiration, not as a requirement to reproduce copyrighted characters or props. A 12-pose-per-second stop-motion cadence was a suggestion, not a measured frame rate.

| Token | Color | Use |
|---|---|---|
| Paper | #F5E9CE | warm reading surfaces |
| Ink | #282923 | primary text |
| Lawn | #89AA52 | background and quieter ground |
| Gate | #8FCBD2 | pale blue accents |
| Mustard | #D3AA42 | blanket and small highlights |
| Dusty pink | #C9768C | tree and warning accents |
| Cloth blue | #435B70 | navigation, notebook binding, primary buttons |

Keep terrain quiet enough to distinguish food, fly and threat silhouettes. Use original illustrated assets, restrained texture and short soft shadows. Avoid glossy dashboard cards, neon glows, glass panels and ubiquitous pill buttons. Preserve the current distinct tabs and eight-segment meter, which the user explicitly approved.

Current typography: self-hosted Bookman-style Picnic display face, neutral sans-serif controls, Caveat for notebook records. Fraunces/Nunito/Caveat was proposed but not selected by the user. Do not silently treat a proposed pairing as approved. Use handwriting for the notebook, readable upright controls and numeric labels for scientific data. Include font licenses.

## Screen-by-screen contract
### Persistent frame
Large scientific brain monitor at bottom-left on desktop; it is a major part of the project, not a small decorative card. Current reference reserves roughly 320 × 410 px. Main content changes in the middle/right. Keep the monitor blank until real data is connected. Highlight selected cells/connections when supported by real identifiers. Do not fabricate anatomy or spikes. A schematic layout must be labeled schematic. On narrow screens reserve space rather than overlaying important controls; mobile placement is a responsive compromise, not the desktop reference.

### Workbench
Eight points represented by eight physical segments. Lit segments show points remaining; spending a point extinguishes a segment with a short transition. Keep a numeric remaining count and accessible meter value. Honor reduced motion. Do not substitute a continuous progress bar.
Feeding contains Sugar, Bitter and Water. Escape contains Threat and Learning. Connectors must end at the buttons, never extend beyond them or run across a wrapped row. Selecting a capability opens its details/sliders. Initial settings and learned current settings are distinct.
Current prototype defaults: sugar 1, bitter 4, threat 2; both learning policies responsive. Cost = sugar + abs(bitter−4) + abs(threat−2), budget 8. Sugar levels 0–2, bitter/threat 0–4. These are prototype balance choices, not biological constants or a finalized economy.
Responsive and Conservative buttons show an explanatory paragraph below the selected policy. Prototype thresholds are one versus three qualifying events. Keep separate bitter and threat policies. Learning costs currently zero. Water is visible and selectable for explanation, labeled Proposed; no active slider, fabricated neural effect or point cost. Its implementation awaits validated inputs and a gameplay decision.

### Picnic and tutorial
Use the exact approved copy. Scouting exposes the world through play, not a hazard briefing. Tutorial explains the budget, autonomy, learning, replay and frozen comparison in short scrollable sections. Do not disclose hidden poison locations or dictate the correct build.

### Arena
One 2D picnic level. The final route, food positions, hazards and pest-controller phases remain for Claude and the team to design. Current illustration is a composition reference only. Keep pause and playback speed controls top-right, brain monitor bottom-left, and restrained live health/energy, food and elapsed-time metrics. Playback controls must not steer the fly or alter simulation results.
Distinguish feeding suppression, backing up and escape. Show starting/current weights and pending learning evidence. Event notices should explain changes without pausing automatically. Current prototype follows a synthetic 30-second schedule with a predetermined path; do not retain that as the real game merely because it is wired to the UI.

### Results and replay
Report encounter progress %, completed food servings, damage taken, escape triggers and meal interruptions. Survival/outcome and adaptation counts are useful. Do not label triggered jumps successful dodges without checking actual avoidance. Replay must show recorded events, not rerun changing randomness. Inspect sensory input → measured output → controller action → resolved feedback → weight update. Explain what changed and why using stored records. Deterministic summaries are preferable to an LLM inventing biological explanations; an optional agent summary must stay grounded in those records.

### Field Notebook
Literal notebook presentation: cloth-blue binding, cream ruled pages, margin line, page/spine details and handwritten records. Preserve the approved empty state. Automatically save failed and successful attempts. Record attempt number and boss encounter, stats, starting configuration, policies, final adapted configuration, learning history, discoveries, seed/model/controller metadata and replay references. Restore starting brain and Use adapted brain are separate actions. Include export. Do not trim the full scientific log to the few most recent displayed bullets.

### Frozen Learning and ending
Paired comparison fixes starting configuration, world seed/schedule and controller version. Adaptive changes supported weights; frozen keeps them fixed. Different actions can naturally expose different later inputs. Show whether learning helped or hurt; never guarantee improvement. Match environmental randomness independently of action count. Fixed-stimulus comparisons isolate neural effects; full encounters compare gameplay outcomes.
Final summary tells what the fly began with, what it became, decisive events and actual outcome. No multi-wave progression.

## Experimental evidence supplied by the team
These are reported results, not independently reproduced here. Two seeds were tested for the cited experiments; verify final export coverage before claiming three-seed completeness.
- DNp09 never fired under tested conditions. Forward walking is an authored default. Disclose that clearly. Brain outputs can govern stopping/feeding (MN9), backing up (MDN) and escape (Giant Fibre), only where the adapter has verified coverage.
- Looming 5–50 Hz produced Giant Fibre approximately 7, 30, 70, 108, 134, 169 Hz. Use measured graded responses, not a binary threat toggle disguised as neuroscience.
- Sugar 200 + bitter 200: bitter outgoing weights ×0, ×0.25, ×0.5, ×0.75, ×1 gave MN9 roughly 100, 68, 38, 5, 3 Hz.
- Looming 50: direct looming→GF weights ×0.5, ×1, ×1.5 gave GF about 115, 169, 204 Hz. Strong looming 150 could still drive GF near 200 Hz after weakening. Validate exact conditions before making a pitch claim.
- Cutting direct looming→GF connections still left GF around 70 Hz; feeding could remain suppressed under a strong threat. This is evidence consistent with additional pathways, not identification of a specific hidden circuit.
- Planned export: 25 brain states × 48 stimuli × 3 seeds in public/data/brain_plastic.json, generated by notebooks/export_plastic.py. Completion was reported as in progress. Inspect the actual manifest, multipliers and seeds; never assume a complete file.

## Learning and controller correctness
Learning changes real connection groups through authored rules. Do not call those rules experimentally established biological learning. Precomputed responses are reset-state trials; configuration history persists, neural membrane state does not automatically persist.
Completed safe bitter serving weakens bitter outputs; completed poison serving strengthens them. Explicitly harmless looming exposure weakens threat connections; damage from a relevant looming attack strengthens them. An escaped dangerous attack is not a false alarm. Poison must not train threat connections. Clean food must not train bitter connections. No exposure means no evidence. One update per unique resolved event, never per frame. Define opposing-evidence cancellation before integration. Clamp to supported states and use updated settings for the next decision only.
Escape interrupts contact and feeding. Preserve partial serving progress; award energy and poison exactly once at completed consumption. Escape wins a simultaneous completion race. Use a cooldown and per-threat latch. Incomplete servings generate no safe-food feedback. Separate measured MN9 suppression from authored meal interruption caused by movement.
Default retry restores the selected start, evidence counters and encounter seed. Carrying an adapted brain is explicit and subject to budget. No farming permanent points.

## Level design brief for Claude
Design the final level after inspecting the team's actual simulation and supported stimuli. Do not infer collision or food contact from painted pixels. Maintain separate render art and world geometry. Proposed visual arrangement: gate at upper-left, quiet traversable lawn, blanket/food toward the right, basket and notebook as landmarks, one off-axis pink-canopy tree. This is composition guidance, not locked spawn coordinates or a promised path.
The single encounter should present feeding opportunities interrupted by both harmless and dangerous looming events, with safe bitter versus poisonous food creating a meaningful acceptance/adaptation tradeoff. Threat timing and food contact should interact. Include readable visual warnings with enough time for autonomous response; never require manual dodge input. Define a concrete finish region and survival/food criterion before balancing. The headline implies crossing before Mack arrives; decide how that maps to boss phases and reconcile all objective copy. Do not silently use a pure stationary survival goal.
Water, grooming, dust, citronella and persistent fog were discussed but have no validated implementation contract. Water now has an approved UI placeholder. Keep the others out of scored behavior until their inputs, outputs, costs and authored consequences are explicitly defined. No invented brain pathways.
Test at least several distinct configurations and same-seed retries. If a single maximized setting dominates, revise encounter costs/timing rather than inventing biological tradeoffs. Scouting should reveal useful information without being mandatory grind.

## Integration ownership and data
Evan owns experimental brain exports and planned TypeScript adapter/core simulation. UI teammate owns components and presentation. Claude must inspect existing work before implementing; avoid duplicate simulation engines. Establish one integration owner.
Core state is authoritative; UI dispatches configure, release, pause, setSpeed, end, restore and compare commands. Store exact input condition, lookup key, seed, measured rates with units, selected action, feedback ID, evidence before/after and configuration before/after. Runs retain model/controller versions and full replay logs. Missing neural records are unavailable, not zero. Read exports atomically; disable unsupported states rather than synthesizing measurements.
Current window.BuzzFYLBrainAdapter is explicitly demonstration data. The existing step() loop also has simplified feedback bookkeeping and must not be treated as the production learning rule. Wire and test the real core rather than merely swapping labels.

## Acceptance and remaining decisions
Verify all tabs, keyboard focus, slider updates without lost focus, meter counts, scout loadout preservation, active-attempt protection, pause/speed determinism, notebook restoration, export and frozen comparison. Check wide and narrow screens for connector overflow and monitor overlap. Screen-reader labels, visible selection and reduced motion are required. Keep the aesthetic 2D throughout.
Unresolved: actual level geometry, crossing/win condition, boss schedule, water pathway, grooming, supported neural state manifest, threshold calibration, directional evidence cancellation, final economy and optional font changes. Resolve these explicitly while preserving the approved UI.
This handoff supersedes older multi-wave, 3D/manual movement, small-monitor, prediction-required and Close notebook instructions. It preserves their valid experimental safeguards and evidence contracts.
