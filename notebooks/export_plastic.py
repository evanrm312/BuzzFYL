"""Precompute the learning lattice: every brain state the fly can reach between runs.

Learning in the game = persistent scaling of two real synapse groups between runs
(each decision still starts from a fresh resting state):
  bitter   outgoing synapses of all bitter GRNs           (taste habituation / aversion)
  loom_gf  LC4 + LPLC2 -> DNp01 Giant Fibre synapses only (looming habituation / sensitisation)
Probe (probe_brain.py) showed both give graded, monotonic readout changes.

    .venv/bin/python notebooks/export_plastic.py [--workers 10] [--seeds 0 1 2]

Writes public/data/brain_plastic.json after every finished (state, seed) task; resumes.
"""

from __future__ import annotations

import argparse
import itertools
import json
import multiprocessing as mp
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import scipy.sparse as sp

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_brain as eb  # noqa: E402

OUT = eb.ROOT / "public" / "data" / "brain_plastic.json"
SCHEMA_VERSION = 2

BITTER_SCALE = [0.0, 0.25, 0.5, 0.75, 1.0]
LOOM_GF_SCALE = [0.5, 0.75, 1.0, 1.25, 1.5]
SUGAR_HZ = [0, 100, 200]
BITTER_HZ = [0, 200]
LOOMING_HZ = [0, 10, 20, 30, 40, 50, 100, 150]
READOUTS = eb.READOUTS
SENSORY = eb.SENSORY

G = {}


def state_id(b, l):
    return f"bitter{b:g}|loomgf{l:g}"


def condition_id(sid, s, b, l):
    return f"{sid}|sugar{s}|bitter{b}|looming{l}"


def build_W(b_scale, l_scale):
    W, N, groups = G["W"], G["N"], G["groups"]
    coo = W.tocoo(copy=True)
    data = coo.data.astype(float)
    pre_bitter = np.isin(coo.row, groups["bitter"])
    data[pre_bitter] *= b_scale
    loom_gf = np.isin(coo.row, groups["looming"]) & np.isin(coo.col, groups["giant_fibre"])
    data[loom_gf] *= l_scale
    return sp.csr_matrix((data, (coo.row, coo.col)), shape=W.shape)


def work(task):
    b_scale, l_scale, seed, todo = task
    W = build_W(b_scale, l_scale)
    groups, N = G["groups"], G["N"]
    out = []
    for s, b, l in todo:
        inputs = [(groups[n], hz) for n, hz in (("sugar", s), ("bitter", b), ("looming", l)) if hz > 0]
        record = {n: groups[n] for n in READOUTS + SENSORY} if seed == 0 else None
        t0 = time.perf_counter()
        counts, traces = eb.simulate(inputs, W, N, seed=seed, record=record)
        run = {
            "seed": seed,
            "readouts_hz": {n: float(eb.rate(counts, groups[n])) for n in READOUTS},
            "sensory_hz": {n: float(eb.rate(counts, groups[n])) for n in SENSORY},
            "neurons_active": int((counts > 0).sum()),
            "wall_seconds": round(time.perf_counter() - t0, 2),
        }
        if record:
            bin_s = eb.TRACE_BIN_MS / 1000
            run["trace_hz"] = {n: [round(float(c) / len(groups[n]) / bin_s, 3) for c in tr]
                               for n, tr in traces.items()}
        out.append(((s, b, l), run))
    return b_scale, l_scale, seed, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=10)
    ap.add_argument("--seeds", type=int, nargs="+", default=[0, 1, 2])
    ap.add_argument("--chunk", type=int, default=8, help="stimuli per task")
    args = ap.parse_args()

    N, W, groups, root_ids = eb.load_brain()
    G.update(W=W, N=N, groups=groups)

    export = eb.new_export(groups, root_ids)
    export["schema_version"] = SCHEMA_VERSION
    export["provenance"]["script"] = "notebooks/export_plastic.py"
    del export["presets"]
    export["grid"] = {"sugar_hz": SUGAR_HZ, "bitter_hz": BITTER_HZ, "looming_hz": LOOMING_HZ,
                      "bitter_scale": BITTER_SCALE, "loom_gf_scale": LOOM_GF_SCALE}
    export["plasticity"] = {
        "bitter": "Multiply weights of all outgoing synapses of bitter GRNs (cell_sub_class == 'bitter').",
        "loom_gf": "Multiply weights of synapses from LC4/LPLC2 onto DNp01 (Giant Fibre) only.",
        "note": "Scales are persistent between game runs; each 200 ms trial starts from rest. "
                "The rule that moves the scales is a game rule, not a biological learning model.",
    }
    del export["sanity"]
    if OUT.exists():
        old = json.loads(OUT.read_text())
        if old.get("schema_version") == SCHEMA_VERSION:
            export["conditions"] = old["conditions"]

    stimuli = list(itertools.product(SUGAR_HZ, BITTER_HZ, LOOMING_HZ))
    tasks = []
    for seed in args.seeds:
        for b_scale, l_scale in itertools.product(BITTER_SCALE, LOOM_GF_SCALE):
            sid = state_id(b_scale, l_scale)
            todo = [st for st in stimuli
                    if not any(r["seed"] == seed for r in
                               export["conditions"].get(condition_id(sid, *st), {}).get("runs", []))]
            # chunked so a lone leftover state still spreads across workers
            for i in range(0, len(todo), args.chunk):
                tasks.append((b_scale, l_scale, seed, todo[i:i + args.chunk]))
    print(f"{len(tasks)} tasks x up to {len(stimuli)} stimuli on {args.workers} workers", flush=True)

    with mp.get_context("fork").Pool(args.workers) as pool:
        for b_scale, l_scale, seed, out in pool.imap_unordered(work, tasks):
            sid = state_id(b_scale, l_scale)
            for (s, b, l), run in out:
                cond = export["conditions"].setdefault(condition_id(sid, s, b, l), {
                    "state": {"bitter_scale": b_scale, "loom_gf_scale": l_scale},
                    "stimulus_hz": {"sugar": s, "bitter": b, "looming": l},
                    "status": "ok", "runs": [],
                })
                cond["runs"] = sorted([r for r in cond["runs"] if r["seed"] != seed] + [run],
                                      key=lambda r: r["seed"])
                cond["readouts_hz"] = eb.summarize(cond["runs"])
            export["provenance"]["exported_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            tmp = OUT.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(export, separators=(",", ":")))
            os.replace(tmp, OUT)
            print(f"  {sid:22s} seed {seed} done ({len(out)} stimuli)", flush=True)
    print(f"done: {len(export['conditions'])} conditions -> {OUT.relative_to(eb.ROOT)}")


if __name__ == "__main__":
    main()
