// Authored learning applied to real connectivity. The rule (when to move a weight group one
// level) is a game rule designed by the team; what a level does to the fly's outputs is the
// measured model response at that weight scale.
//
// Evidence rule: qualifying events in the same direction accumulate; an event in the opposite
// direction discards pending evidence and starts a new count in its own direction. When the
// count reaches the policy threshold, the group moves one level (clamped to available levels)
// and the count resets. One call per resolved event, never per frame.

import { POLICY_THRESHOLD } from "./config";
import type { Direction, Evidence, Group, GroupState, LearningRecord, Policy } from "./types";

export function newGroup(level: number, policy: Policy): GroupState {
  return {
    startLevel: level,
    level,
    evidence: { direction: null, count: 0 },
    threshold: POLICY_THRESHOLD[policy],
    updates: 0,
  };
}

/**
 * Bitter: weaken = lower outgoing weight (index down). Looming→GF: weaken = lower weight.
 * Both scale lists are ascending, so weaken is always index - 1.
 */
export function applyEvidence(
  group: Group,
  g: GroupState,
  policy: Policy,
  direction: Direction,
  scales: number[],
  levelOk: (level: number) => boolean,
): LearningRecord {
  const evidenceBefore = { ...g.evidence };
  const levelBefore = g.level;
  let note: string;
  let applied = false;

  if (policy === "frozen") {
    note = "frozen: evidence not counted";
  } else {
    const ev: Evidence =
      g.evidence.direction === direction
        ? { direction, count: g.evidence.count + 1 }
        : { direction, count: 1 };
    if (g.evidence.direction && g.evidence.direction !== direction) {
      note = `opposite evidence: discarded ${g.evidence.count} pending ${g.evidence.direction}`;
    } else {
      note = `${ev.count}/${g.threshold} toward ${direction}`;
    }
    g.evidence = ev;
    if (ev.count >= g.threshold) {
      const target = g.level + (direction === "weaken" ? -1 : 1);
      if (target < 0 || target >= scales.length) {
        note += "; already at the limit";
      } else if (!levelOk(target)) {
        note += "; next level not measured yet (unavailable)";
      } else {
        g.level = target;
        g.updates++;
        applied = true;
        note += `; ${direction}ed one level`;
      }
      g.evidence = { direction: null, count: 0 };
    }
  }

  return {
    group,
    direction,
    policy,
    evidenceBefore,
    evidenceAfter: { ...g.evidence },
    levelBefore,
    levelAfter: g.level,
    scaleBefore: scales[levelBefore],
    scaleAfter: scales[g.level],
    applied,
    note,
  };
}
