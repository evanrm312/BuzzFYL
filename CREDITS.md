# Credits

## Science and data
- **FlyWire connectome**, materialization 783 — Dorkenwald et al. 2024; Schlegel et al. 2024 (Nature).
  Cell-type annotations from [flyconnectome/flywire_annotations](https://github.com/flyconnectome/flywire_annotations).
- **Whole-brain LIF model** — Shiu et al. 2024, "A Drosophila computational brain model reveals
  sensorimotor processing", Nature. Data files from
  [philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model).
  MN9 root ID taken from that paper.
- The numpy simulator in `notebooks/export_brain.py` is the event organizers' port from
  `fly_brain_starter.ipynb`, used unchanged apart from added spike-trace recording.

## What is measured vs authored
- Measured: every MN9 / Giant Fibre / MDN rate in `public/data/brain_plastic.json` comes from an actual
  simulation run at that weight state. Nothing in it is hand-entered.
- Authored (game rules): the learning rule, thresholds mapping rates to behavior, movement, jump
  direction, poison, health/energy, eggs, levels, the shared swarm brain, and the score.

## Design and assets
- BuzzFYL UI, copy and illustration direction by Aarush. Fonts: Caveat (SIL OFL, `ui/dist/assets/CAVEAT-LICENSE.txt`)
  and a Bookman-style display face from URW base35 (`ui/FONT-LICENSE`).

## AI disclosure
Code in this repository was written with AI assistance (Claude Code / Claude Opus, plus other
AI coding agents per lane), directed and reviewed by the team.
