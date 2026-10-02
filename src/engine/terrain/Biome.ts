/**
 * Biome system and region masks
 * Engine layer — never imports game
 */

export enum BiomeType {
  Ocean = 0,
  Beach = 1,
  Plains = 2,
  Forest = 3,
  Hills = 4,
  Mountains = 5,
  Snow = 6,
  Desert = 7,
}

export interface BiomeConfig {
  minHeight: number;
  maxHeight: number;
  minMoisture: number;
  maxMoisture: number;
  color: [number, number, number]; // RGB 0-1
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  [BiomeType.Ocean]: {
    minHeight: -1,
    maxHeight: 0,
    minMoisture: 0,
    maxMoisture: 1,
    color: [0.1, 0.2, 0.5],
  },
  [BiomeType.Beach]: {
    minHeight: 0,
    maxHeight: 0.05,
    minMoisture: 0,
    maxMoisture: 1,
    color: [0.8, 0.7, 0.5],
  },
  [BiomeType.Plains]: {
    minHeight: 0.05,
    maxHeight: 0.3,
    minMoisture: 0.3,
    maxMoisture: 0.7,
    color: [0.4, 0.6, 0.2],
  },
  [BiomeType.Forest]: {
    minHeight: 0.1,
    maxHeight: 0.5,
    minMoisture: 0.5,
    maxMoisture: 1,
    color: [0.2, 0.4, 0.1],
  },
  [BiomeType.Hills]: {
    minHeight: 0.3,
    maxHeight: 0.6,
    minMoisture: 0,
    maxMoisture: 1,
    color: [0.5, 0.5, 0.3],
  },
  [BiomeType.Mountains]: {
    minHeight: 0.6,
    maxHeight: 0.85,
    minMoisture: 0,
    maxMoisture: 1,
    color: [0.4, 0.4, 0.4],
  },
  [BiomeType.Snow]: {
    minHeight: 0.85,
    maxHeight: 1,
    minMoisture: 0,
    maxMoisture: 1,
    color: [0.9, 0.9, 0.95],
  },
  [BiomeType.Desert]: {
    minHeight: 0.05,
    maxHeight: 0.4,
    minMoisture: 0,
    maxMoisture: 0.3,
    color: [0.9, 0.8, 0.5],
  },
};

/**
 * Determine biome from height and moisture
 */
export function getBiome(height: number, moisture: number): BiomeType {
  if (height < 0) return BiomeType.Ocean;
  if (height < 0.05) return BiomeType.Beach;
  if (height > 0.85) return BiomeType.Snow;
  if (height > 0.6) return BiomeType.Mountains;
  if (height > 0.3) return BiomeType.Hills;
  
  if (moisture < 0.3) return BiomeType.Desert;
  if (moisture > 0.5) return BiomeType.Forest;
  return BiomeType.Plains;
}

/**
 * Region mask data
 * Defines 5 regions: Greenmarch, Thornwood, Ironcrag, Saltfen, Ashfell
 */
export interface RegionMask {
  id: number;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  heightMultiplier: number;
  moistureMultiplier: number;
}

export const REGIONS: RegionMask[] = [
  {
    id: 0,
    name: 'Greenmarch',
    centerX: 0,
    centerZ: 0,
    radius: 800,
    heightMultiplier: 0.8,
    moistureMultiplier: 1.2,
  },
  {
    id: 1,
    name: 'Thornwood',
    centerX: -1200,
    centerZ: -800,
    radius: 600,
    heightMultiplier: 1.0,
    moistureMultiplier: 1.5,
  },
  {
    id: 2,
    name: 'Ironcrag',
    centerX: 1200,
    centerZ: -1000,
    radius: 700,
    heightMultiplier: 1.5,
    moistureMultiplier: 0.6,
  },
  {
    id: 3,
    name: 'Saltfen',
    centerX: -1000,
    centerZ: 1200,
    radius: 650,
    heightMultiplier: 0.5,
    moistureMultiplier: 1.8,
  },
  {
    id: 4,
    name: 'Ashfell',
    centerX: 1400,
    centerZ: 1000,
    radius: 550,
    heightMultiplier: 1.3,
    moistureMultiplier: 0.3,
  },
];

/**
 * Get region influence at position
 */
export function getRegionInfluence(x: number, z: number): { regionId: number; influence: number } {
  let maxInfluence = 0;
  let regionId = 0;
  
  for (const region of REGIONS) {
    const dx = x - region.centerX;
    const dz = z - region.centerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const influence = Math.max(0, 1 - dist / region.radius);
    
    if (influence > maxInfluence) {
      maxInfluence = influence;
      regionId = region.id;
    }
  }
  
  return { regionId, influence: maxInfluence };
}

/**
 * Get region modifiers at position
 */
export function getRegionModifiers(x: number, z: number): { heightMult: number; moistureMult: number } {
  const { regionId, influence } = getRegionInfluence(x, z);
  const region = REGIONS[regionId]!;
  
  return {
    heightMult: 1 + (region.heightMultiplier - 1) * influence,
    moistureMult: 1 + (region.moistureMultiplier - 1) * influence,
  };
}
