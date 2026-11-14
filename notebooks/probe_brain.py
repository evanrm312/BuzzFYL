"""Probe experiments that decide which capabilities and learning rules can ship.

Answers the open questions in handoff v5 section 9 before anything goes into the game:
  1. Does DNp09 (forward walking) respond to any supported input?
  2. Where between 0 and 50 Hz looming does the Giant Fibre start firing, and does
     strong sugar keep MN9 alive under weak threat?
  3. Is MN9 under sugar+bitter a graded function of bitter synapse strength?
     (graded = a plasticity rule can move it a step per run)
  4. Does scaling only the looming -> Giant Fibre synapses shift escape, and does it
     spare feeding? (candidate habituation / sensitisation site)

    .venv/bin/python notebooks/probe_brain.py [--workers 6] [--seeds 0]

Writes notebooks/probe_results.json (not the game export).
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import scipy.sparse as sp

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_brain as eb  # noqa: E402

OUT = eb.ROOT / "notebooks" / "probe_results.json"
READOUTS = ["mn9", "giant_fibre", "mdn", "dnp09"]

G = {}  # filled in the parent before fork, shared copy-on-write


def scale_rows_to(W, rows, cols, factor):
    """Scale synapses from `rows` onto `cols` only."""
    W = W.tocoo(copy=True)
    pre = np.isin(W.row, rows)
    post = np.isin(W.col, cols)
    data = W.data.astype(float)
    data[pre & post] *= factor
    return sp.csr_matrix((data, (W.row, W.col)), shape=W.shape)


def scale_rows(W, N, rows, factor):
    d = np.ones(N)
    d[rows] = factor
    return (sp.diags(d) @ W).tocsr()


def brain_variants(W, N, groups):
    return {
        "baseline": lambda: W,
        **{f"bitter_x{f}": (lambda f=f: scale_rows(W, N, groups["bitter"], f)) for f in (0.0, 0.25, 0.5, 0.75)},
        **{f"loom_gf_x{f}": (lambda f=f: scale_rows_to(W, groups["looming"], groups["giant_fibre"], f))
           for f in (0.0, 0.5, 1.5)},
        **{f"loom_all_x{f}": (lambda f=f: scale_rows(W, N, groups["looming"], f)) for f in (0.5,)},
    }


def plan():
    jobs = []
    # 1. DNp09 across the notebook stimuli
    for s, b, l in [(0, 0, 0), (200, 0, 0), (200, 200, 0), (0, 200, 0), (0, 0, 50), (0, 0, 150)]:
        jobs.append(("baseline", s, b, l))
    # 2. fine looming ramp, with and without strong sugar
    for l in (5, 10, 20, 30, 40):
        for s in (0, 100, 200):
            jobs.append(("baseline", s, 0, l))
    # 3. graded bitter synapse strength
    for f in (0.0, 0.25, 0.5, 0.75):
        for s in (100, 200):
            jobs.append((f"bitter_x{f}", s, 200, 0))
    # 4. looming -> GF synapse scaling, and a whole-looming-output scale for contrast
    for v in ("loom_gf_x0.0", "loom_gf_x0.5", "loom_gf_x1.5", "loom_all_x0.5"):
        for s in (0, 200):
            for l in (20, 50, 150):
                jobs.append((v, s, 0, l))
    return jobs


def work(args):
    variant, s, b, l, seed = args
    W = G["Ws"][variant]
    inputs = [(G["groups"][n], hz) for n, hz in (("sugar", s), ("bitter", b), ("looming", l)) if hz > 0]
    t0 = time.perf_counter()
    counts, _ = eb.simulate(inputs, W, G["N"], seed=seed)
    return {
        "variant": variant, "seed": seed,
        "stimulus_hz": {"sugar": s, "bitter": b, "looming": l},
        "readouts_hz": {n: float(eb.rate(counts, G["groups"][n])) for n in READOUTS},
        "neurons_active": int((counts > 0).sum()),
        "wall_seconds": round(time.perf_counter() - t0, 2),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--seeds", type=int, nargs="+", default=[0])
    args = ap.parse_args()

    N, W, groups, root_ids = eb.load_brain()
    labels = pd.read_csv(eb.fetch(eb.LABELS_URL), sep="\t", low_memory=False)
    row = {r: i for i, r in enumerate(root_ids)}
    groups["dnp09"] = np.array([row[r] for r in labels.root_id[labels.cell_type == "DNp09"] if r in row])
    print(f"  dnp09        {len(groups['dnp09']):4d} neurons")
    if len(groups["dnp09"]) == 0:
        sys.exit("DNp09 not found in annotations")

    jobs = [(*j, seed) for seed in args.seeds for j in plan()]
    needed = {j[0] for j in jobs}
    G.update(N=N, groups=groups, Ws={k: f() for k, f in brain_variants(W, N, groups).items() if k in needed})
    # the direct looming -> GF synapse count tells us how much of GF drive is monosynaptic
    coo = W.tocoo()
    direct = np.isin(coo.row, groups["looming"]) & np.isin(coo.col, groups["giant_fibre"])
    into_gf = np.isin(coo.col, groups["giant_fibre"]) & (coo.data > 0)
    meta = {
        "dnp09_root_ids": [str(root_ids[i]) for i in groups["dnp09"]],
        "looming_to_gf_weight": float(coo.data[direct].sum()),
        "all_excitatory_to_gf_weight": float(coo.data[into_gf].sum()),
    }
    print(meta)

    print(f"{len(jobs)} runs on {args.workers} workers")
    results = []
    with mp.get_context("fork").Pool(args.workers) as pool:
        for r in pool.imap_unordered(work, jobs):
            results.append(r)
            ro = r["readouts_hz"]
            st = r["stimulus_hz"]
            print(f"  {r['variant']:14s} s{st['sugar']:3d} b{st['bitter']:3d} l{st['looming']:3d} seed {r['seed']}  "
                  f"mn9 {ro['mn9']:6.1f}  gf {ro['giant_fibre']:6.1f}  mdn {ro['mdn']:5.1f}  "
                  f"dnp09 {ro['dnp09']:5.1f}", flush=True)
            OUT.write_text(json.dumps({"meta": meta, "results": results}, indent=1))
    print(f"done -> {OUT.relative_to(eb.ROOT)}")


if __name__ == "__main__":
    main()
