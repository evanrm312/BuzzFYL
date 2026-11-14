// Deterministic randomness. World schedules come from a seeded stream generated up front,
// so they never depend on what the fly does. Anything decided mid-run (jump direction,
// which neural replicate to read) is keyed by a stable event key instead of a draw count,
// so paired runs stay matched even after their trajectories diverge.

export function hashString(s: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return mix(h);
}

function mix(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Uniform [0, 1) from a key; same key, same value. */
export function keyed(seed: number, key: string): number {
  return hashString(`${seed}|${key}`) / 4294967296;
}

/** mulberry32 stream for up-front schedule generation. */
export function stream(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
