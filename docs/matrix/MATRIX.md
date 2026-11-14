# Feature matrix

450 builds (sugar input 2 × bitter weight 5 × looming→GF weight 5 × bitter policy 3 × threat policy 3) × 10 world seeds per wave. Mean per run. Controller and learning rule as in `src/core/config.ts`; neural responses are lookups of the seed-0+ lattice. Cost is relative to the unmodified brain.

## Wave 1 — Feeding (budget 4, 450 measured builds)

### Effect of each feature (mean over all other settings)

| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |
|---|---|---|---|---|---|---|---|---|---|
| Sugar input (Hz) | 100 | 27% | 0.0 | 4.7 | 0.0 | 0.7 | 0.0 | 0.0 | 0.3 |
| Sugar input (Hz) | 200 | 26% | 0.0 | 8.6 | 0.0 | 2.1 | 0.0 | 0.0 | 1.4 |
| Bitter-cell output weight | 0 | 55% | 0.0 | 12.5 | 0.0 | 3.1 | 0.0 | 0.0 | 1.2 |
| Bitter-cell output weight | 0.25 | 47% | 0.0 | 9.7 | 0.0 | 2.3 | 0.0 | 0.0 | 1.6 |
| Bitter-cell output weight | 0.5 | 32% | 0.0 | 7.2 | 0.0 | 1.6 | 0.0 | 0.0 | 1.4 |
| Bitter-cell output weight | 0.75 | 0% | 0.0 | 2.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| Bitter-cell output weight | 1 | 0% | 0.0 | 2.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| Looming→GF weight | 0.5 | 25% | 0.0 | 6.3 | 0.0 | 1.3 | 0.0 | 0.0 | 0.8 |
| Looming→GF weight | 0.75 | 25% | 0.0 | 6.3 | 0.0 | 1.3 | 0.0 | 0.0 | 0.8 |
| Looming→GF weight | 1 | 25% | 0.0 | 6.3 | 0.0 | 1.3 | 0.0 | 0.0 | 0.8 |
| Looming→GF weight | 1.25 | 29% | 0.0 | 7.2 | 0.0 | 1.6 | 0.0 | 0.0 | 1.0 |
| Looming→GF weight | 1.5 | 29% | 0.0 | 7.2 | 0.0 | 1.6 | 0.0 | 0.0 | 1.0 |
| Bitter policy | frozen | 25% | 0.0 | 6.6 | 0.0 | 1.4 | 0.0 | 0.0 | 0.0 |
| Bitter policy | conservative | 22% | 0.0 | 6.8 | 0.0 | 1.5 | 0.0 | 0.0 | 0.5 |
| Bitter policy | responsive | 32% | 0.0 | 6.6 | 0.0 | 1.3 | 0.0 | 0.0 | 2.1 |
| Threat policy | frozen | 27% | 0.0 | 6.7 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |
| Threat policy | conservative | 27% | 0.0 | 6.7 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |
| Threat policy | responsive | 27% | 0.0 | 6.7 | 0.0 | 1.4 | 0.0 | 0.0 | 0.8 |

### Best in-budget builds

| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | ×0 | ×1 | conservative/frozen | 4 | 90% | 0 | 12 | 0 | 2.9 | 0 |
| 100 | ×0 | ×1 | conservative/conservative | 4 | 90% | 0 | 12 | 0 | 2.9 | 0 |
| 100 | ×0 | ×1 | frozen/frozen | 4 | 70% | 0 | 12.3 | 0 | 3.1 | 0 |
| 100 | ×0 | ×1 | frozen/conservative | 4 | 70% | 0 | 12.3 | 0 | 3.1 | 0 |
| 100 | ×0.25 | ×1.25 | frozen/frozen | 4 | 70% | 0 | 10.7 | 0 | 2.8 | 0 |
| 100 | ×0.25 | ×1.25 | frozen/conservative | 4 | 70% | 0 | 10.7 | 0 | 2.8 | 0 |
| 100 | ×0.25 | ×1.25 | conservative/frozen | 4 | 70% | 0 | 11.5 | 0 | 3.1 | 0 |
| 100 | ×0.25 | ×1.25 | conservative/conservative | 4 | 70% | 0 | 11.5 | 0 | 3.1 | 0 |

Unmodified brain, frozen: survival 0%, eggs 0, eaten 2, drinks 0.
In budget with ≥75% survival: 2 of 194.

## Wave 2 — Threats (budget 3, 450 measured builds)

### Effect of each feature (mean over all other settings)

| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |
|---|---|---|---|---|---|---|---|---|---|
| Sugar input (Hz) | 100 | 66% | 0.0 | 8.6 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Sugar input (Hz) | 200 | 67% | 0.0 | 11.1 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Bitter-cell output weight | 0 | 66% | 0.0 | 9.6 | 0.0 | 0.0 | 1.6 | 2.3 | 1.8 |
| Bitter-cell output weight | 0.25 | 66% | 0.0 | 9.7 | 0.0 | 0.0 | 1.6 | 2.3 | 1.8 |
| Bitter-cell output weight | 0.5 | 67% | 0.0 | 10.0 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Bitter-cell output weight | 0.75 | 67% | 0.0 | 10.0 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Bitter-cell output weight | 1 | 67% | 0.0 | 10.0 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Looming→GF weight | 0.5 | 33% | 0.0 | 10.9 | 0.0 | 0.0 | 2.7 | 0.0 | 1.0 |
| Looming→GF weight | 0.75 | 33% | 0.0 | 10.9 | 0.0 | 0.0 | 2.7 | 0.0 | 1.7 |
| Looming→GF weight | 1 | 65% | 0.0 | 9.2 | 0.0 | 0.0 | 1.6 | 3.0 | 2.0 |
| Looming→GF weight | 1.25 | 100% | 0.0 | 8.9 | 0.0 | 0.0 | 0.7 | 4.0 | 2.0 |
| Looming→GF weight | 1.5 | 100% | 0.0 | 9.2 | 0.0 | 0.0 | 0.7 | 4.3 | 2.3 |
| Bitter policy | frozen | 66% | 0.0 | 9.8 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Bitter policy | conservative | 66% | 0.0 | 9.8 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Bitter policy | responsive | 66% | 0.0 | 9.8 | 0.0 | 0.0 | 1.7 | 2.3 | 1.8 |
| Threat policy | frozen | 60% | 0.0 | 9.5 | 0.0 | 0.0 | 1.2 | 3.0 | 0.0 |
| Threat policy | conservative | 40% | 0.0 | 9.6 | 0.0 | 0.0 | 1.8 | 2.6 | 1.4 |
| Threat policy | responsive | 100% | 0.0 | 10.4 | 0.0 | 0.0 | 2.0 | 1.2 | 4.0 |

### Best in-budget builds

| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | ×1 | ×1 | frozen/frozen | 0 | 100% | 0 | 6.6 | 0 | 0 | 0 |
| 100 | ×1 | ×1 | conservative/frozen | 0 | 100% | 0 | 6.6 | 0 | 0 | 0 |
| 100 | ×0.75 | ×1 | frozen/frozen | 1 | 100% | 0 | 6.6 | 0 | 0 | 0 |
| 100 | ×0.75 | ×1 | conservative/frozen | 1 | 100% | 0 | 6.6 | 0 | 0 | 0 |
| 100 | ×1 | ×1 | frozen/responsive | 1 | 100% | 0 | 9.4 | 0 | 0 | 2 |
| 100 | ×1 | ×1 | conservative/responsive | 1 | 100% | 0 | 9.4 | 0 | 0 | 2 |
| 100 | ×1 | ×1 | responsive/frozen | 1 | 100% | 0 | 6.6 | 0 | 0 | 0 |
| 100 | ×1 | ×1.25 | frozen/frozen | 1 | 100% | 0 | 7.1 | 0 | 0 | 0 |

Unmodified brain, frozen: survival 100%, eggs 0, eaten 6.6, drinks 0.
In budget with ≥75% survival: 70 of 116.

## Wave 3 — Combined (budget 4, 450 measured builds)

### Effect of each feature (mean over all other settings)

| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |
|---|---|---|---|---|---|---|---|---|---|
| Sugar input (Hz) | 100 | 52% | 0.0 | 4.2 | 0.0 | 0.3 | 0.7 | 2.7 | 1.7 |
| Sugar input (Hz) | 200 | 38% | 0.0 | 6.6 | 0.0 | 1.1 | 0.7 | 2.8 | 2.3 |
| Bitter-cell output weight | 0 | 45% | 0.0 | 8.5 | 0.0 | 1.8 | 0.7 | 2.9 | 2.2 |
| Bitter-cell output weight | 0.25 | 29% | 0.0 | 6.2 | 0.0 | 1.1 | 0.7 | 2.7 | 2.3 |
| Bitter-cell output weight | 0.5 | 47% | 0.0 | 5.1 | 0.0 | 0.7 | 0.7 | 2.7 | 2.3 |
| Bitter-cell output weight | 0.75 | 52% | 0.0 | 3.6 | 0.0 | 0.0 | 0.7 | 2.6 | 1.6 |
| Bitter-cell output weight | 1 | 52% | 0.0 | 3.6 | 0.0 | 0.0 | 0.7 | 2.6 | 1.6 |
| Looming→GF weight | 0.5 | 53% | 0.0 | 6.1 | 0.0 | 0.7 | 1.0 | 0.0 | 1.0 |
| Looming→GF weight | 0.75 | 49% | 0.0 | 6.0 | 0.0 | 0.7 | 1.0 | 0.0 | 1.6 |
| Looming→GF weight | 1 | 38% | 0.0 | 5.0 | 0.0 | 0.7 | 0.6 | 3.4 | 2.2 |
| Looming→GF weight | 1.25 | 34% | 0.0 | 4.8 | 0.0 | 0.7 | 0.6 | 4.8 | 2.5 |
| Looming→GF weight | 1.5 | 49% | 0.0 | 5.0 | 0.0 | 0.8 | 0.3 | 5.3 | 2.8 |
| Bitter policy | frozen | 44% | 0.0 | 5.3 | 0.0 | 0.7 | 0.7 | 2.7 | 1.6 |
| Bitter policy | conservative | 43% | 0.0 | 5.4 | 0.0 | 0.7 | 0.7 | 2.7 | 1.7 |
| Bitter policy | responsive | 47% | 0.0 | 5.4 | 0.0 | 0.7 | 0.7 | 2.7 | 2.7 |
| Threat policy | frozen | 52% | 0.0 | 5.3 | 0.0 | 0.8 | 0.4 | 3.9 | 0.4 |
| Threat policy | conservative | 41% | 0.0 | 5.3 | 0.0 | 0.7 | 0.8 | 3.1 | 1.8 |
| Threat policy | responsive | 41% | 0.0 | 5.6 | 0.0 | 0.7 | 1.0 | 1.2 | 3.8 |

### Best in-budget builds

| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | ×1 | ×0.5 | frozen/frozen | 2 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×1 | ×0.5 | frozen/conservative | 2 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×1 | ×0.5 | conservative/frozen | 2 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×1 | ×0.5 | conservative/conservative | 2 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×0.75 | ×0.5 | frozen/frozen | 3 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×0.75 | ×0.5 | frozen/conservative | 3 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×0.75 | ×0.5 | conservative/frozen | 3 | 100% | 0 | 4.4 | 0 | 0 | 1 |
| 100 | ×0.75 | ×0.5 | conservative/conservative | 3 | 100% | 0 | 4.4 | 0 | 0 | 1 |

Unmodified brain, frozen: survival 10%, eggs 0, eaten 2.3, drinks 0.
In budget with ≥75% survival: 49 of 194.

## Boss — Across the Picnic (budget 8, 450 measured builds)

### Effect of each feature (mean over all other settings)

| Feature | Value | Survival | Eggs | Eaten | Drinks | Poisoned | Hits | Jumps on harmless | Adaptations |
|---|---|---|---|---|---|---|---|---|---|
| Sugar input (Hz) | 100 | 56% | 3.2 | 4.2 | 2.6 | 0.2 | 1.4 | 3.0 | 2.3 |
| Sugar input (Hz) | 200 | 42% | 5.4 | 4.9 | 2.4 | 0.7 | 1.3 | 3.0 | 2.4 |
| Bitter-cell output weight | 0 | 30% | 6.7 | 5.4 | 2.0 | 1.1 | 1.3 | 3.0 | 2.3 |
| Bitter-cell output weight | 0.25 | 38% | 4.7 | 4.8 | 2.2 | 0.7 | 1.3 | 3.0 | 2.5 |
| Bitter-cell output weight | 0.5 | 47% | 3.8 | 4.6 | 2.4 | 0.4 | 1.4 | 3.0 | 2.5 |
| Bitter-cell output weight | 0.75 | 66% | 3.1 | 3.9 | 2.9 | 0.0 | 1.3 | 3.0 | 2.3 |
| Bitter-cell output weight | 1 | 65% | 3.1 | 3.9 | 2.9 | 0.0 | 1.3 | 3.0 | 2.3 |
| Looming→GF weight | 0.5 | 37% | 5.2 | 4.4 | 2.4 | 0.5 | 1.8 | 0.0 | 1.2 |
| Looming→GF weight | 0.75 | 37% | 5.1 | 4.4 | 2.4 | 0.5 | 1.8 | 0.0 | 1.9 |
| Looming→GF weight | 1 | 52% | 4.1 | 4.6 | 2.5 | 0.4 | 1.2 | 3.7 | 2.5 |
| Looming→GF weight | 1.25 | 55% | 3.6 | 4.6 | 2.6 | 0.4 | 1.3 | 5.2 | 2.9 |
| Looming→GF weight | 1.5 | 65% | 3.4 | 4.7 | 2.5 | 0.4 | 0.7 | 6.0 | 3.3 |
| Bitter policy | frozen | 50% | 4.3 | 4.5 | 2.5 | 0.5 | 1.3 | 3.0 | 2.1 |
| Bitter policy | conservative | 50% | 4.3 | 4.5 | 2.5 | 0.5 | 1.3 | 3.0 | 2.2 |
| Bitter policy | responsive | 48% | 4.3 | 4.5 | 2.5 | 0.4 | 1.4 | 3.0 | 2.8 |
| Threat policy | frozen | 59% | 3.5 | 4.5 | 2.5 | 0.4 | 0.8 | 4.5 | 0.2 |
| Threat policy | conservative | 48% | 4.1 | 4.6 | 2.5 | 0.4 | 1.5 | 3.2 | 1.6 |
| Threat policy | responsive | 40% | 5.2 | 4.5 | 2.5 | 0.5 | 1.8 | 1.2 | 5.3 |

### Best in-budget builds

| Sugar | Bitter | Loom→GF | Policies (bitter/threat) | Cost | Survival | Eggs | Eaten | Drinks | Poisoned | Hits |
|---|---|---|---|---|---|---|---|---|---|---|
| 200 | ×0 | ×1.5 | frozen/conservative | 8 | 100% | 6.4 | 6.3 | 2.3 | 1.4 | 0 |
| 200 | ×0 | ×1.5 | conservative/conservative | 8 | 100% | 6.4 | 6.3 | 2.3 | 1.4 | 0 |
| 200 | ×0 | ×1 | frozen/frozen | 6 | 100% | 6.2 | 6.1 | 2.3 | 0.9 | 0.1 |
| 200 | ×0 | ×1 | conservative/frozen | 6 | 100% | 6.2 | 6.1 | 2.3 | 0.9 | 0.1 |
| 200 | ×0 | ×1 | responsive/frozen | 7 | 100% | 6.2 | 6 | 2.3 | 0.8 | 0.1 |
| 200 | ×0.25 | ×1.5 | frozen/conservative | 7 | 100% | 5.6 | 6.3 | 2.6 | 1.4 | 0 |
| 200 | ×0.25 | ×1.5 | conservative/conservative | 7 | 100% | 5.6 | 6.3 | 2.6 | 1.4 | 0 |
| 200 | ×0 | ×1.5 | frozen/frozen | 8 | 100% | 5.4 | 6.1 | 2.2 | 1.1 | 0.1 |

Unmodified brain, frozen: survival 50%, eggs 0.8, eaten 3.8, drinks 2.8.
In budget with ≥75% survival: 56 of 436.
