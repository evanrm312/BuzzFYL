"""Precompute the Fly FYL brain lookup table.

Runs the organizers' numpy LIF port of Shiu et al. 2024 (fly_brain_starter.ipynb,
section 6) over FlyWire v783 for every stimulus x preset the game can request,
and writes public/data/brain.json after every run so the game lane can
integrate early.

    python notebooks/export_brain.py               # seed 0, full grid
    python notebooks/export_brain.py --seeds 0 1 2 # add seeds (resumes)

No FlyWire token needed. Data files are cached in notebooks/.cache/.
"""

from __future__ import annotations

import argparse
import itertools
import json
import os
import platform
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import scipy.sparse as sp

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "notebooks" / ".cache"
OUT = ROOT / "public" / "data" / "brain.json"

SCHEMA_VERSION = 1
SHIU = "https://github.com/philshiu/Drosophila_brain_model/raw/main/"
LABELS_URL = ("https://github.com/flyconnectome/flywire_annotations/raw/main/supplemental_files/"
              "Supplemental_file1_neuron_annotations.tsv")
MN9_ROOT_ID = 720575940660219265  # not in the label file; ID from Shiu et al. 2024

MS = 200  # simulated brain time per trial, ms (same as the notebook)
TRACE_BIN_MS = 10

SUGAR_HZ = [0, 100, 200]
BITTER_HZ = [0, 200]
LOOMING_HZ = [0, 50, 100, 150]
PRESETS = {
    "baseline": "Original connectome, no changes.",
    "bitter_lesion": "Outgoing synapses of all bitter GRNs (cell_sub_class == 'bitter') set to zero. "
                     "The cells still fire, but nothing downstream hears them.",
}


# ---------------------------------------------------------------- data

def fetch(url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / url.rsplit("/", 1)[-1]
    if not path.exists():
        print(f"downloading {path.name} ...", flush=True)
        tmp = path.with_suffix(path.suffix + ".part")
        urllib.request.urlretrieve(url, tmp)
        tmp.rename(path)
    return path


def load_brain():
    """Section 4 + 5 of the starter notebook, unchanged apart from local caching."""
    neurons = pd.read_csv(fetch(SHIU + "Completeness_783.csv"), index_col=0)
    wiring = pd.read_parquet(fetch(SHIU + "Connectivity_783.parquet"))
    labels = pd.read_csv(fetch(LABELS_URL), sep="\t", low_memory=False)

    N = len(neurons)
    W = sp.csr_matrix((wiring["Excitatory x Connectivity"],
                       (wiring["Presynaptic_Index"], wiring["Postsynaptic_Index"])), shape=(N, N))
    row = {root_id: i for i, root_id in enumerate(neurons.index)}

    def find(mask):
        return np.array([row[r] for r in labels.root_id[mask] if r in row])

    groups = {
        "sugar": find(labels.cell_type == "LB3c"),
        "bitter": find(labels.cell_sub_class == "bitter"),
        "looming": find(labels.cell_type.isin(["LC4", "LPLC2"])),
        "mn9": np.array([row[MN9_ROOT_ID]]),
        "giant_fibre": find(labels.cell_type == "DNp01"),
        "mdn": find(labels.cell_type == "MDN"),
    }
    root_ids = np.asarray(neurons.index)
    print(f"{N:,} neurons, {W.nnz:,} connections")
    for name, idx in groups.items():
        print(f"  {name:12s} {len(idx):4d} neurons")
    return N, W, groups, root_ids


# ---------------------------------------------------------------- model

def simulate(inputs, W, N, ms=MS, seed=0, record=None, bin_ms=TRACE_BIN_MS):
    """Starter notebook section 6, verbatim, plus optional binned spike traces.

    inputs: [(neurons, rate_hz), ...] -> spike count for every neuron.
    record: {name: neuron indices} -> also return per-bin spike counts per group.
    """
    dt, v0, vth, tm, ts, ref = 0.1, -52.0, -45.0, 20.0, 5.0, 2.2
    wsyn, kick, delay = 0.275, 250 * 0.275, int(1.8 / 0.1)
    rng = np.random.default_rng(seed)
    v, g = np.full(N, v0), np.zeros(N)
    last, counts = np.full(N, -1e9), np.zeros(N, int)
    driven = np.zeros(N, bool)
    for idx, _ in inputs:
        driven[idx] = True
    ring = np.zeros((delay, N))
    record = record or {}
    steps_per_bin = int(round(bin_ms / dt))
    traces = {name: np.zeros(int(ms / bin_ms), int) for name in record}
    for k in range(int(ms / dt)):
        t, slot = k * dt, k % delay
        g += ring[slot]; ring[slot] = 0
        free = ((t - last) > ref) | driven
        v[free] += dt * (v0 - v[free] + g[free]) / tm
        g[free] *= np.exp(-dt / ts)
        for idx, hz in inputs:
            v[idx[rng.random(len(idx)) < hz * dt / 1000]] += kick
        s = np.flatnonzero(v > vth)
        v[s], g[s], last[s] = v0, 0.0, t
        counts[s] += 1
        if len(s):
            ring[slot] += np.asarray(W[s].sum(0)).ravel() * wsyn
            for name, idx in record.items():
                traces[name][k // steps_per_bin] += np.isin(s, idx, assume_unique=True).sum()
    return counts, traces


def rate(counts, group, ms=MS):
    """Average spikes per second of a group."""
    return counts[group].sum() / len(group) / (ms / 1000)


def lesion(W, N, idx):
    keep = np.ones(N)
    keep[idx] = 0
    return (sp.diags(keep) @ W).tocsr()


# ---------------------------------------------------------------- export

READOUTS = ["mn9", "giant_fibre", "mdn"]
SENSORY = ["sugar", "bitter", "looming"]


def condition_id(preset, sugar, bitter, looming):
    return f"{preset}|sugar{sugar}|bitter{bitter}|looming{looming}"


def run_condition(preset, sugar, bitter, looming, seed, Ws, groups, N):
    inputs = [(groups[name], hz) for name, hz in
              (("sugar", sugar), ("bitter", bitter), ("looming", looming)) if hz > 0]
    record = {name: groups[name] for name in READOUTS + SENSORY}
    t0 = time.perf_counter()
    counts, traces = simulate(inputs, Ws[preset], N, seed=seed, record=record)
    elapsed = time.perf_counter() - t0
    bin_s = TRACE_BIN_MS / 1000
    return {
        "seed": seed,
        "readouts_hz": {name: float(rate(counts, groups[name])) for name in READOUTS},
        "sensory_hz": {name: float(rate(counts, groups[name])) for name in SENSORY},
        "neurons_active": int((counts > 0).sum()),
        # mean Hz per cell in each bin, so it plots on the same axis as readouts_hz
        "trace_hz": {name: [round(float(c) / len(groups[name]) / bin_s, 3) for c in tr]
                     for name, tr in traces.items()},
        "wall_seconds": round(elapsed, 2),
    }


def summarize(runs):
    return {name: float(np.mean([r["readouts_hz"][name] for r in runs])) for name in READOUTS}


def new_export(groups, root_ids):
    return {
        "schema_version": SCHEMA_VERSION,
        "mode": "precomputed",
        "mock": False,
        "label": "Precomputed whole-brain simulation (Shiu LIF on FlyWire v783)",
        "provenance": {
            "dataset": "FlyWire FAFB materialization 783",
            "connectivity": SHIU + "Connectivity_783.parquet",
            "neurons": SHIU + "Completeness_783.csv",
            "labels": LABELS_URL,
            "model": "Leaky integrate-and-fire, numpy port of Shiu et al. 2024 "
                     "(Nature, doi:10.1038/s41586-024-07763-9) from the organizers' fly_brain_starter.ipynb",
            "script": "notebooks/export_brain.py",
            "python": platform.python_version(),
            "numpy": np.__version__,
            "exported_at": None,
        },
        "trial": {
            "duration_ms": MS,
            "measurement_window_ms": [0, MS],
            "dt_ms": 0.1,
            "trace_bin_ms": TRACE_BIN_MS,
            "input": "Independent Poisson kicks to every cell in the stimulated group at the given rate",
            "rate_units": "Hz (spikes/s), mean over cells in the group, over the measurement window",
            "state": "fresh resting state for every trial; no carry-over between conditions",
        },
        "grid": {"sugar_hz": SUGAR_HZ, "bitter_hz": BITTER_HZ, "looming_hz": LOOMING_HZ,
                 "presets": list(PRESETS)},
        "presets": PRESETS,
        "groups": {
            name: {
                "selector": sel,
                "aggregation": "mean over cells",
                "root_ids": [str(r) for r in root_ids[groups[name]]],
            }
            for name, sel in {
                "sugar": "cell_type == 'LB3c'",
                "bitter": "cell_sub_class == 'bitter'",
                "looming": "cell_type in ['LC4', 'LPLC2']",
                "mn9": f"root_id {MN9_ROOT_ID} (Shiu et al. 2024)",
                "giant_fibre": "cell_type == 'DNp01'",
                "mdn": "cell_type == 'MDN'",
            }.items()
        },
        "sanity": None,
        "conditions": {},
    }


def write(export):
    export["provenance"]["exported_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(export, indent=1))
    os.replace(tmp, OUT)


def ensure(export, preset, sugar, bitter, looming, seed, Ws, groups, N):
    """Run one condition/seed unless already exported, then write the file."""
    cid = condition_id(preset, sugar, bitter, looming)
    cond = export["conditions"].setdefault(cid, {
        "preset": preset,
        "stimulus_hz": {"sugar": sugar, "bitter": bitter, "looming": looming},
        "status": "ok",
        "runs": [],
    })
    if not any(r["seed"] == seed for r in cond["runs"]):
        r = run_condition(preset, sugar, bitter, looming, seed, Ws, groups, N)
        cond["runs"].append(r)
        cond["runs"].sort(key=lambda r: r["seed"])
        cond["readouts_hz"] = summarize(cond["runs"])
        write(export)
        ro = r["readouts_hz"]
        print(f"  {cid:44s} seed {seed}  mn9 {ro['mn9']:6.1f}  gf {ro['giant_fibre']:6.1f}  "
              f"mdn {ro['mdn']:6.1f}  active {r['neurons_active']:5d}  ({r['wall_seconds']}s)",
              flush=True)
    return cond["readouts_hz"]


def sanity_gate(export, Ws, groups, N, seed):
    """Handbook sanity checks on the notebook's own four conditions (baseline, seed 0)."""
    print("sanity gate:")
    nothing = ensure(export, "baseline", 0, 0, 0, seed, Ws, groups, N)
    sugar = ensure(export, "baseline", 200, 0, 0, seed, Ws, groups, N)
    both = ensure(export, "baseline", 200, 200, 0, seed, Ws, groups, N)
    loom = ensure(export, "baseline", 0, 0, 150, seed, Ws, groups, N)
    checks = {
        "nothing -> silence": all(v == 0 for v in nothing.values()),
        "sugar -> MN9 fires": sugar["mn9"] > 0,
        "sugar + bitter -> MN9 drops": both["mn9"] < sugar["mn9"],
        "looming -> giant fibre fires": loom["giant_fibre"] > 0,
    }
    export["sanity"] = {"seed": seed, "checks": checks, "passed": all(checks.values())}
    write(export)
    for name, ok in checks.items():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    return all(checks.values())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seeds", type=int, nargs="+", default=[0])
    ap.add_argument("--fresh", action="store_true", help="ignore existing brain.json instead of resuming")
    args = ap.parse_args()

    N, W, groups, root_ids = load_brain()
    Ws = {"baseline": W, "bitter_lesion": lesion(W, N, groups["bitter"])}

    export = new_export(groups, root_ids)
    if OUT.exists() and not args.fresh:
        old = json.loads(OUT.read_text())
        if old.get("schema_version") == SCHEMA_VERSION and not old.get("mock"):
            export["conditions"] = old.get("conditions", {})
            print(f"resuming: {len(export['conditions'])} conditions already in {OUT.relative_to(ROOT)}")

    if not sanity_gate(export, Ws, groups, N, args.seeds[0]):
        print("sanity gate FAILED, aborting export", file=sys.stderr)
        sys.exit(1)

    # Order of value: looming ramp, then sugar x looming interaction, then lesions.
    grid = list(itertools.product(PRESETS, SUGAR_HZ, BITTER_HZ, LOOMING_HZ))
    grid.sort(key=lambda c: (c[0] != "baseline", c[1] > 0 and c[3] > 0, c[2] > 0))
    for seed in args.seeds:
        print(f"grid, seed {seed}:")
        for preset, sugar, bitter, looming in grid:
            ensure(export, preset, sugar, bitter, looming, seed, Ws, groups, N)

    missing = [condition_id(*c) for c in grid
               if len(export["conditions"].get(condition_id(*c), {}).get("runs", [])) == 0]
    print(f"done: {len(export['conditions'])} conditions, {len(missing)} missing -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
