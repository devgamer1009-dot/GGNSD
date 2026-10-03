/**
 * Biome Density Maps - Vegetation density per biome
 * P10 - Deterministic vegetation placement based on biome
 */

import { BiomeType } from '../terrain/Biome.js';

export interface BiomeDensity {
  trees: number;      // Trees per 100m²
  grass: number;      // Grass clumps per 100m²
  rocks: number;      // Rocks per 100m²
  props: number;      // Props per 100m²
}

/**
 * Density maps for each biome type
 * Values represent instances per 100 square meters
 */
export const BIOME_DENSITY_MAPS: Record<BiomeType, BiomeDensity> = {
  [BiomeType.Ocean]: {
    trees: 0,
    grass: 0,
    rocks: 0.5,
    props: 0,
  },
  [BiomeType.Beach]: {
    trees: 0.2,
    grass: 0.5,
    rocks: 1.0,
    props: 0.1,
  },
  [BiomeType.Plains]: {
    trees: 2.0,
    grass: 15.0,
    rocks: 0.5,
    props: 0.3,
  },
  [BiomeType.Forest]: {
    trees: 8.0,
    grass: 10.0,
    rocks: 1.0,
    props: 0.5,
  },
  [BiomeType.Hills]: {
    trees: 3.0,
    grass: 12.0,
    rocks: 3.0,
    props: 0.4,
  },
  [BiomeType.Mountains]: {
    trees: 1.0,
    grass: 5.0,
    rocks: 8.0,
    props: 0.2,
  },
  [BiomeType.Snow]: {
    trees: 0.5,
    grass: 2.0,
    rocks: 4.0,
    props: 0.1,
  },
  [BiomeType.Desert]: {
    trees: 0.1,
    grass: 0.3,
    rocks: 2.0,
    props: 0.2,
  },
};

/**
 * Tree type distribution per biome
 * Maps biome to tree asset IDs with weights
 */
export const TREE_DISTRIBUTION: Record<BiomeType, Array<{ assetId: string; weight: number }>> = {
  [BiomeType.Ocean]: [],
  [BiomeType.Beach]: [
    { assetId: 'tree_pine', weight: 0.3 },
    { assetId: 'tree_oak', weight: 0.7 },
  ],
  [BiomeType.Plains]: [
    { assetId: 'tree_oak', weight: 0.6 },
    { assetId: 'tree_birch', weight: 0.4 },
  ],
  [BiomeType.Forest]: [
    { assetId: 'tree_pine', weight: 0.5 },
    { assetId: 'tree_oak', weight: 0.3 },
    { assetId: 'tree_birch', weight: 0.2 },
  ],
  [BiomeType.Hills]: [
    { assetId: 'tree_pine', weight: 0.7 },
    { assetId: 'tree_oak', weight: 0.3 },
  ],
  [BiomeType.Mountains]: [
    { assetId: 'tree_pine', weight: 1.0 },
  ],
  [BiomeType.Snow]: [
    { assetId: 'tree_pine', weight: 1.0 },
  ],
  [BiomeType.Desert]: [],
};

/**
 * Rock type distribution per biome
 */
export const ROCK_DISTRIBUTION: Record<BiomeType, Array<{ assetId: string; weight: number }>> = {
  [BiomeType.Ocean]: [
    { assetId: 'rock_small', weight: 0.7 },
    { assetId: 'rock_medium', weight: 0.3 },
  ],
  [BiomeType.Beach]: [
    { assetId: 'rock_small', weight: 0.6 },
    { assetId: 'rock_medium', weight: 0.4 },
  ],
  [BiomeType.Plains]: [
    { assetId: 'rock_small', weight: 0.8 },
    { assetId: 'rock_medium', weight: 0.2 },
  ],
  [BiomeType.Forest]: [
    { assetId: 'rock_small', weight: 0.7 },
    { assetId: 'rock_medium', weight: 0.3 },
  ],
  [BiomeType.Hills]: [
    { assetId: 'rock_small', weight: 0.5 },
    { assetId: 'rock_medium', weight: 0.4 },
    { assetId: 'rock_large', weight: 0.1 },
  ],
  [BiomeType.Mountains]: [
    { assetId: 'rock_small', weight: 0.3 },
    { assetId: 'rock_medium', weight: 0.5 },
    { assetId: 'rock_large', weight: 0.2 },
  ],
  [BiomeType.Snow]: [
    { assetId: 'rock_small', weight: 0.4 },
    { assetId: 'rock_medium', weight: 0.5 },
    { assetId: 'rock_large', weight: 0.1 },
  ],
  [BiomeType.Desert]: [
    { assetId: 'rock_small', weight: 0.5 },
    { assetId: 'rock_medium', weight: 0.4 },
    { assetId: 'rock_large', weight: 0.1 },
  ],
};

/**
 * Prop distribution per biome
 */
export const PROP_DISTRIBUTION: Record<BiomeType, Array<{ assetId: string; weight: number }>> = {
  [BiomeType.Ocean]: [],
  [BiomeType.Beach]: [
    { assetId: 'prop_barrel', weight: 0.5 },
    { assetId: 'prop_crate', weight: 0.5 },
  ],
  [BiomeType.Plains]: [
    { assetId: 'prop_barrel', weight: 0.4 },
    { assetId: 'prop_crate', weight: 0.4 },
    { assetId: 'prop_chest', weight: 0.2 },
  ],
  [BiomeType.Forest]: [
    { assetId: 'prop_chest', weight: 0.6 },
    { assetId: 'prop_crate', weight: 0.4 },
  ],
  [BiomeType.Hills]: [
    { assetId: 'prop_barrel', weight: 0.5 },
    { assetId: 'prop_crate', weight: 0.5 },
  ],
  [BiomeType.Mountains]: [
    { assetId: 'prop_chest', weight: 1.0 },
  ],
  [BiomeType.Snow]: [
    { assetId: 'prop_chest', weight: 1.0 },
  ],
  [BiomeType.Desert]: [
    { assetId: 'prop_crate', weight: 1.0 },
  ],
};

/**
 * Get density for a biome
 */
export function getBiomeDensity(biome: BiomeType): BiomeDensity {
  return BIOME_DENSITY_MAPS[biome] ?? { trees: 0, grass: 0, rocks: 0, props: 0 };
}

/**
 * Select tree type based on biome weights
 */
export function selectTreeType(biome: BiomeType, rng: () => number): string | null {
  const distribution = TREE_DISTRIBUTION[biome];
  if (!distribution || distribution.length === 0) return null;

  const roll = rng();
  let cumulative = 0;
  
  for (const entry of distribution) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry.assetId;
    }
  }
  
  return distribution[distribution.length - 1]?.assetId ?? null;
}

/**
 * Select rock type based on biome weights
 */
export function selectRockType(biome: BiomeType, rng: () => number): string | null {
  const distribution = ROCK_DISTRIBUTION[biome];
  if (!distribution || distribution.length === 0) return null;

  const roll = rng();
  let cumulative = 0;
  
  for (const entry of distribution) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry.assetId;
    }
  }
  
  return distribution[distribution.length - 1]?.assetId ?? null;
}

/**
 * Select prop type based on biome weights
 */
export function selectPropType(biome: BiomeType, rng: () => number): string | null {
  const distribution = PROP_DISTRIBUTION[biome];
  if (!distribution || distribution.length === 0) return null;

  const roll = rng();
  let cumulative = 0;
  
  for (const entry of distribution) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry.assetId;
    }
  }
  
  return distribution[distribution.length - 1]?.assetId ?? null;
}
