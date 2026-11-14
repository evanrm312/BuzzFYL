# Small Fly, Big Problem: Rebuilt Project Goals (v3, 11:05 ET)

Supersedes the brain sections of the earlier handoffs. The game design (2D top-down picnic, waves, fogger truck boss, Picnic Pop art, Phaser 3 + TS + Vite, three AI lanes) stays.

## 1. What the official resources changed

| Finding | Source | Consequence |
|---|---|---|
| The model is a ~40-line **numpy LIF port of Shiu et al.** over FlyWire v783 (138,639 neurons, 15.1M signed connections). One 200 ms decision takes "a few seconds" on CPU. No Brian2, no compile step. | Starter notebook §4, §6 | Precomputing a 50–100 condition grid takes minutes. Data risk drops a lot. |
| **Escape is verified**: looming (LC4 + LPLC2, 314 cells) at 150 Hz → Giant Fibre (DNp01) 265 Hz, MDN (back up) 16 Hz. | Notebook §7 output | A **brain-driven dodge** is back in scope. It becomes our second real mechanic. |
| Feeding verified: sugar (LB3c, 32 cells) 200 Hz → MN9 100 Hz; sugar + bitter (42 cells) → MN9 5 Hz. | Notebook §7 | Feeding/refusal mechanic confirmed. |
| Lesion recipe is supplied: zero a cell type's outgoing rows of W. The handbook calls lesioning "the real science use." | Notebook "What now?", handbook | Skill tree = lesion and stimulation lab. Judges are primed to value this. |
| Grooming, water and smell are not in the toolkit. Smell/wind "tends to seize." | Handbook sense table | **Drop grooming and water entirely.** |
| Judging: qualification (yes/no), **Creativity (1–5, most weight)**, Demo execution, Demo presentation (goal, purpose, **limitations, next steps**). | Opening slides 38–41 | The pitch has to land the creative angle and state limitations honestly. |
| Schedule: hacking 10:30, **meal 11:45**, projects due and demos **2:45**. Teams of 2–4. | Slide 24 | Keep 2:15 internal submit. Eat at keyboards. |
| Over 110 fly-brain projects already exist, including fly-swat and escape games ("Swat", "Help the Fly Escape", "fly-swing"), Doom, Minecraft, Flappy Bird. Most are bots where the fly plays. Few run controls. | Creations spreadsheet | Our differentiator has to be explicit (see §2). |

## 2. The creative angle (pitch in one breath)

> "Every upgrade in this RPG is a real experiment on a real fly brain. When you buy a skill, you're lesioning or stimulating actual neurons in a 138,639-neuron simulation, and the fly's reflexes change because the brain's output changed."

Why this stands out from the list:
- Prior games mostly hand control to the fly or script it. Here the **player steers and the brain owns the reflexes** (eat or refuse, auto-dodge).
- The **skill tree is a lesion lab** with real tradeoffs measured on the model. The handbook calls this the real science use, and hardly any listed project turns it into gameplay.
- We show a **controlled comparison** on demand (same stimulus, two brain configurations). Most listed projects have no control.

## 3. Brain ↔ game mapping (both mechanics real, both precomputed)

| Game event | Sensory input (Hz) | Readout | Game effect (authored mapping) |
|---|---|---|---|
| Hovering on food | sugar: clean 100, sweet bait 100; bitter: 200 if bitter or poisoned | **MN9** Hz | MN9 below threshold (set after sanity runs, ~20 Hz): fly **refuses**. Otherwise feed progress speed ∝ MN9 (capped). |
| Swatter or truck approaching | looming ramps 0 → 150 as the strike lands (bucketed 0/50/100/150) | **Giant Fibre** Hz | GF over threshold → **automatic escape jump** (direction chosen by game, collision-checked, 2 s cooldown). |
| Same | same | **MDN** Hz | Over threshold → small backward recoil animation. |
| Eating while a swat approaches | sugar (+bitter) **and** looming together | MN9 and GF | If looming suppresses MN9 on the model, the fly **abandons its meal** under threat. Measure before claiming. |

The game never runs the simulation live. It looks up the nearest precomputed condition. In-game label: **"Precomputed whole-brain simulation (Shiu LIF on FlyWire v783)."**

## 4. Skill tree (revised)

Neural slots: one feeding preset and one reflex preset. Body slot: one. Max 5 points, free respec, prices as agreed.

| Cost | Skill | Real change on the model | Ships if |
|---|---|---|---|
| 0 | Baseline | none | always |
| 1 | Sugar sensitivity | food drives sugar cells at 200 Hz instead of 100 | MN9 measurably higher |
| 2 | Bitter bypass | **lesion** bitter cells' outputs | sugar+bitter MN9 recovers |
| 3 | Feeding override | both of the above | adds benefit beyond bitter bypass |
| 1 | Hair trigger (reflex) | swat registers at higher looming rate (input gain) → GF crosses threshold earlier | GF curve vs looming confirms earlier crossing |
| 2 | Iron nerves (reflex, optional) | lesion a cell type that suppresses feeding under threat, *only if* one is found quickly | measured; otherwise cut |
| 1 | Dash recovery | authored, cooldown 4 s → 3 s | always (labeled game mechanic) |
| 2 | Protective shell | authored, +1 HP | only if tuning needs it |

Possible tradeoff to verify: if "Hair trigger" also makes the fly abandon food more often (looming suppresses MN9), it's a true brain-level tradeoff. Present it only if measured.

## 5. Waves (revised)

| Stage | Time | Threat | Brain mechanic showcased |
|---|---|---|---|
| Wave 1 | 30 s | hunger only | feeding (MN9) |
| Wave 2 | 40 s | swatter | auto-escape (GF) + manual dash |
| Wave 3 | 40 s | bitter food, poisoned bait, swatter | refusal, bitter bypass tradeoff |
| Boss | 50 s | fogger truck: looming sweeps plus fog that turns nearby food bitter; clean and bitter food present | everything |

## 6. Precompute plan (neural lane, Evan + Claude)

Script: `notebooks/export_brain.py` (delivered with this file). Steps:
1. Load data exactly as the notebook does.
2. **Sanity gate** (from the handbook): nothing → silence; sugar → MN9 fires; sugar+bitter → MN9 drops; looming → GF fires. Abort export if any check fails.
3. Grid: sugar {0,100,200} × bitter {0,200} × looming {0,50,100,150} = 24 stimuli × presets {baseline, bitter_lesion} = **48 runs**, seed 0. Add seeds 1–2 if time allows.
4. Write `public/data/brain.json` after **every** run so the game lane can integrate early. IDs are strings.

Order of value: the four notebook conditions first, then the looming ramp, then sugar×looming interaction, then lesions.

## 7. Cuts (in order if behind)
Iron nerves → protective shell → MDN recoil → second seed → boss food contamination (keep truck looming) → hair trigger. **Never cut**: feeding refusal, auto-escape, the before/after comparison panel, win/loss/restart.

## 8. Timeline from now

| ET | Core (Aarush + Astra) | Neural (Evan + Claude) | Presentation (Fable lane) |
|---|---|---|---|
| 11:05–11:45 | Scaffold, movement, food, energy, mock brain lookup | Run export script, sanity gate, first 4 conditions to JSON | HUD + fly/food/swatter shapes |
| 11:45–12:15 (eat at keys) | Swatter + auto-dodge hook, damage | Full grid; pick MN9 and GF thresholds | Skill panel with real labels |
| 12:15–1:00 | Waves, shop, truck, win/loss/restart | `brain.ts` adapter, comparison replay data | Comparison panel (spike trace replay) |
| 1:00–1:30 | **Feature freeze**, balance, production build | Verify every selectable condition exists | Polish, warning visuals |
| 1:30–2:15 | Both-laptop test, deploy, submit | Write limitations slide, backup recording | Fixes only |
| 2:15–2:45 | Buffer | Buffer | Buffer |

## 9. Demo (aligned to judging)

1. **Goal** (10 s): survive a backyard BBQ as a fly whose reflexes come from a real simulated brain.
2. **Play** (25 s): feed, a swat comes in, the fly auto-dodges ("that dodge was the Giant Fibre firing").
3. **Experiment** (30 s): bitter food is refused. Open the lab and show the same stimulus under baseline vs bitter lesion (MN9 5 Hz vs recovered). Equip it, and the fly eats, including the poison.
4. **Limitations + next steps** (20 s): precomputed lookups and authored movement/direction; brain only (no nerve cord or body); next would be live simulation in a worker and BANC for real jump muscles.

## 10. Rules to respect
- Production build rejects mock data.
- Any number shown in the demo comes from an actual run.
- Disclose AI-written code and the Shiu/FlyWire sources in the submission and `CREDITS.md`.
- FlyWire token never goes into the repo. The precompute script doesn't need it.
