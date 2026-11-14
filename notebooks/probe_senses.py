"""Probe new senses on the unmodified connectome before committing to an export.

  water      gustatory cell_sub_class == 'water' (30 GRNs)
  smell_av   citronella proxy A: aversive olfactory glomeruli, CO2 (ORN_V) + geosmin (ORN_DA2)
  bitter     citronella proxy B: contact repellent read through bitter GRNs (already measured)

No glomerulus in FlyWire is identified as a citronella sensor; both are labelled proxies.
Writes notebooks/probe_senses.json.

    .venv/bin/python notebooks/probe_senses.py [--workers 16] [--seeds 0 1]
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_brain as eb  # noqa: E402

OUT = Path(__file__).resolve().parent / "probe_senses.json"
G = {}

CONDITIONS = [
    {},
    {"water": 50}, {"water": 100}, {"water": 200},
    {"water": 200, "bitter": 200},
    {"water": 200, "looming": 50},
    {"smell_av": 50}, {"smell_av": 100}, {"smell_av": 200},
    {"smell_av": 200, "sugar": 200},
    {"smell_av": 200, "water": 200},
    {"smell_av": 200, "looming": 50},
    {"smell_av": 100, "looming": 20},
    {"bitter": 200}, {"bitter": 200, "looming": 50}, {"bitter": 200, "water": 200},
]


def new_groups(groups, root_ids):
    labels = pd.read_csv(eb.ROOT / "notebooks" / ".cache" / "Supplemental_file1_neuron_annotations.tsv",
                         sep="\t", low_memory=False)
    row = {r: i for i, r in enumerate(root_ids)}
    find = lambda mask: np.array([row[r] for r in labels.root_id[mask] if r in row])
    groups = dict(groups)
    groups["water"] = find(labels.cell_sub_class == "water")
    groups["smell_av"] = find(labels.cell_type.isin(["ORN_V", "ORN_DA2"]))
    return groups


def work(task):
    cond, seed = task
    groups = G["groups"]
    inputs = [(groups[k], hz) for k, hz in cond.items()]
    counts, _ = eb.simulate(inputs, G["W"], G["N"], seed=seed)
    return {
        "stimulus_hz": cond,
        "seed": seed,
        "readouts_hz": {n: float(eb.rate(counts, groups[n])) for n in eb.READOUTS},
        "sensory_hz": {k: float(eb.rate(counts, groups[k])) for k in cond},
        "neurons_active": int((counts > 0).sum()),
        "total_spikes": int(counts.sum()),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--seeds", type=int, nargs="+", default=[0])
    args = ap.parse_args()
    N, W, groups, root_ids = eb.load_brain()
    groups = new_groups(groups, root_ids)
    for k in ("water", "smell_av"):
        print(f"  {k:12s} {len(groups[k]):4d} neurons")
    G.update(W=W, N=N, groups=groups)
    tasks = [(c, s) for s in args.seeds for c in CONDITIONS]
    with mp.get_context("fork").Pool(args.workers) as pool:
        results = pool.map(work, tasks)
    for r in results:
        ro = r["readouts_hz"]
        print(f"{json.dumps(r['stimulus_hz']):42s} s{r['seed']}  mn9 {ro['mn9']:6.1f}  gf {ro['giant_fibre']:6.1f}"
              f"  mdn {ro['mdn']:5.1f}  active {r['neurons_active']:6d}  spikes {r['total_spikes']}")
    OUT.write_text(json.dumps({"groups": {k: len(groups[k]) for k in ("water", "smell_av")},
                               "results": results}, indent=1))


if __name__ == "__main__":
    main()
