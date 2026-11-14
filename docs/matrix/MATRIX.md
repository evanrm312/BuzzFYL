# Feature matrix

450 builds (sugar input 2 × bitter weight 5 × looming→GF weight 5 × bitter policy 3 × threat policy 3) × 4 world seeds per wave. Mean per run. Controller and learning rule as in `src/core/config.ts`; neural responses are lookups of the seed-0+ lattice. Cost is relative to the unmodified brain.

## Wave 1 — Feeding (budget 4, 450 measured builds)

### Effect of each feature (mean over all other settings)

| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |
|---|---|---|---|---|---|---|---|---|---|
| Sugar input (Hz) | 100 | 26% | 0.0 | 4.7 | 0.0 | 0.8 | 0.0 | 0.0 | 0.3 |
| Sugar input (Hz) | 200 | 26% | 0.0 | 8.9 | 0.0 | 2.1 | 0.0 | 0.0 | 1.3 |
| Bitter-cell output weight | 0 | 44% | 0.0 | 12.7 | 0.0 | 3.2 | 0.0 | 0.0 | 1.1 |
| Bitter-cell output weight | 0.25 | 47% | 0.0 | 9.9 | 0.0 | 2.3 | 0.0 | 0.0 | 1.5 |
| Bitter-cell output weight | 0.5 | 38% | 0.0 | 7.4 | 0.0 | 1.5 | 0.0 | 0.0 | 1.3 |
| Bitter-cell output weight | 0.75 | 0% | 0.0 | 2.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| Bitter-cell output weight | 1 | 0% | 0.0 | 2.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| Looming→GF weight | 0.5 | 23% | 0.0 | 6.4 | 0.0 | 1.3 | 0.0 | 0.0 | 0.7 |
| Looming→GF weight | 0.75 | 23% | 0.0 | 6.4 | 0.0 | 1.3 | 0.0 | 0.0 | 0.7 |
| Looming→GF weight | 1 | 23% | 0.0 | 6.4 | 0.0 | 1.3 | 0.0 | 0.0 | 0.7 |
| Looming→GF weight | 1.25 | 29% | 0.0 | 7.3 | 0.0 | 1.6 | 0.0 | 0.0 | 0.9 |
| Looming→GF weight | 1.5 | 29% | 0.0 | 7.3 | 0.0 | 1.6 | 0.0 | 0.0 | 0.9 |
| Bitter policy | frozen | 27% | 0.0 | 6.6 | 0.0 | 1.4 | 0.0 | 0.0 | 0.0 |
| Bitter policy | conservative | 16% | 0.0 | 7.0 | 0.0 | 1.6 | 0.0 | 0.0 | 0.5 |
| Bitter policy | responsive | 35% | 0.0 | 6.8 | 0.0 | 1.3 | 0.0 | 0.0 | 1.9 |
| Threat policy | frozen | 26% | 0.0 | 6.8 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |
| Threat policy | conservative | 26% | 0.0 | 6.8 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |
| Threat policy | responsive | 26% | 0.0 | 6.8 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |

### Best in-budget builds

| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | ×0.25 | ×1.25 | frozen/frozen | 4 | 100% | 0 | 11 | 0 | 2.5 | 0 |
| 100 | ×0.25 | ×1.25 | frozen/conservative | 4 | 100% | 0 | 11 | 0 | 2.5 | 0 |
| 200 | ×0.5 | ×1 | frozen/frozen | 4 | 100% | 0 | 11 | 0 | 2.5 | 0 |
| 200 | ×0.5 | ×1 | frozen/conservative | 4 | 100% | 0 | 11 | 0 | 2.5 | 0 |
| 100 | ×0 | ×1 | conservative/frozen | 4 | 75% | 0 | 12 | 0 | 3 | 0 |
| 100 | ×0 | ×1 | conservative/conservative | 4 | 75% | 0 | 12 | 0 | 3 | 0 |
| 100 | ×0.25 | ×1.25 | conservative/frozen | 4 | 75% | 0 | 12 | 0 | 3 | 0 |
| 100 | ×0.25 | ×1.25 | conservative/conservative | 4 | 75% | 0 | 12 | 0 | 3 | 0 |

Unmodified brain, frozen: survival 0%, eggs 0, eaten 2, drinks 0.
In budget with ≥75% survival: 8 of 194.
