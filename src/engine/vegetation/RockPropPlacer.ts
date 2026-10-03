/**
 * Rock and Prop Placement System
 * P10 - Placement with slope and water exclusion rules
 */

import { SeededRNG } from '../utils/SeededRNG.js';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import { BiomeType } from '../terrain/Biome.js';
import { getBiomeDensity, selectRockType, selectPropType } from './BiomeDensityMaps.js';
import type { VegetationInstance } from './PlacementSystem.js';

export interface RockPropConfig {
  minSlope: number;        // Minimum slope for placement (degrees)
  maxSlope: number;        // Maximum slope for placement (degrees)
  minDistanceFromWater: number;
  minDistanceFromTrees: number;
  minSpacing: number;
}

const DEFAULT_CONFIG: RockPropConfig = {
  minSlope: 0,
  maxSlope: 60,
  minDistanceFromWater: 3.0,
  minDistanceFromTrees: 2.0,
  minSpacing: 3.0,
};

/**
 * Generate rocks and props for a chunk
 */
export function generateRocksAndProps(
  chunkData: TerrainChunkData,
  worldSeed: number,
  treePositions: Array<{ x: number; z: number }>,
  config: Partial<RockPropConfig> = {}
): VegetationInstance[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const instances: VegetationInstance[] = [];
  
  const { chunkX, chunkZ, size, resolution, heights, biomes } = chunkData;
  const verticesPerSide = resolution + 1;
  
  // Create seeded RNG
  const chunkSeed = worldSeed + chunkX * 73856093 + chunkZ * 19349663 + 999;
  const rng = new SeededRNG(chunkSeed);
  
  const worldOffsetX = chunkX * size;
  const worldOffsetZ = chunkZ * size;
  
  // Generate for each cell
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * verticesPerSide + x;
      const biome = biomes[idx] as BiomeType;
      const density = getBiomeDensity(biome);
      
      // Skip water biomes
      if (biome === BiomeType.Ocean) continue;
      
      const localX = (x / resolution) * size;
      const localZ = (z / resolution) * size;
      const worldX = worldOffsetX + localX;
      const worldZ = worldOffsetZ + localZ;
      const worldY = heights[idx]! * 200;
      
      // Calculate slope
      const slope = calculateSlope(heights, idx, verticesPerSide);
      
      // Check slope rules
      if (slope < cfg.minSlope || slope > cfg.maxSlope) continue;
      
      // Generate rocks
      const rockCount = Math.floor(density.rocks * rng.next());
      for (let i = 0; i < rockCount; i++) {
        const offsetX = rng.nextFloat(0, size / resolution);
        const offsetZ = rng.nextFloat(0, size / resolution);
        const rockX = worldX + offsetX;
        const rockZ = worldZ + offsetZ;
        const rockY = interpolateHeight(heights, rockX - worldOffsetX, rockZ - worldOffsetZ, size, resolution);
        
        // Check exclusion rules
        if (!isValidRockPosition(rockX, rockZ, treePositions, cfg)) continue;
        
        const rockType = selectRockType(biome, () => rng.next());
        if (rockType) {
          instances.push({
            assetId: rockType,
            position: { x: rockX, y: rockY, z: rockZ },
            rotation: { x: 0, y: rng.nextFloat(0, Math.PI * 2), z: 0 },
            scale: rng.nextFloat(0.7, 1.3),
            type: 'rock',
          });
        }
      }
      
      // Generate props
      const propCount = Math.floor(density.props * rng.next());
      for (let i = 0; i < propCount; i++) {
        const offsetX = rng.nextFloat(0, size / resolution);
        const offsetZ = rng.nextFloat(0, size / resolution);
        const propX = worldX + offsetX;
        const propZ = worldZ + offsetZ;
        const propY = interpolateHeight(heights, propX - worldOffsetX, propZ - worldOffsetZ, size, resolution);
        
        // Check exclusion rules
        if (!isValidPropPosition(propX, propZ, treePositions, cfg)) continue;
        
        const propType = selectPropType(biome, () => rng.next());
        if (propType) {
          instances.push({
            assetId: propType,
            position: { x: propX, y: propY, z: propZ },
            rotation: { x: 0, y: rng.nextFloat(0, Math.PI * 2), z: 0 },
            scale: rng.nextFloat(0.9, 1.1),
            type: 'prop',
          });
        }
      }
    }
  }
  
  return instances;
}

/**
 * Check if rock position is valid
 */
function isValidRockPosition(
  x: number,
  z: number,
  treePositions: Array<{ x: number; z: number }>,
  config: RockPropConfig
): boolean {
  // Check distance from trees
  for (const tree of treePositions) {
    const dx = x - tree.x;
    const dz = z - tree.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < config.minDistanceFromTrees) return false;
  }
  
  return true;
}

/**
 * Check if prop position is valid
 */
function isValidPropPosition(
  x: number,
  z: number,
  treePositions: Array<{ x: number; z: number }>,
  config: RockPropConfig
): boolean {
  // Props have same rules as rocks
  return isValidRockPosition(x, z, treePositions, config);
}

/**
 * Calculate slope angle at a vertex
 */
function calculateSlope(heights: Float32Array, idx: number, verticesPerSide: number): number {
  const x = idx % verticesPerSide;
  const z = Math.floor(idx / verticesPerSide);
  
  const current = heights[idx]!;
  const left = x > 0 ? heights[idx - 1]! : current;
  const right = x < verticesPerSide - 1 ? heights[idx + 1]! : current;
  const up = z > 0 ? heights[idx - verticesPerSide]! : current;
  const down = z < verticesPerSide - 1 ? heights[idx + verticesPerSide]! : current;
  
  const dx = (right - left) * 200;
  const dz = (down - up) * 200;
  
  const slope = Math.sqrt(dx * dx + dz * dz);
  return Math.atan(slope) * (180 / Math.PI);
}

/**
 * Interpolate height at arbitrary position
 */
function interpolateHeight(
  heights: Float32Array,
  localX: number,
  localZ: number,
  size: number,
  resolution: number
): number {
  const verticesPerSide = resolution + 1;
  const gridX = (localX / size) * resolution;
  const gridZ = (localZ / size) * resolution;
  
  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, resolution);
  const z1 = Math.min(z0 + 1, resolution);
  
  const fx = gridX - x0;
  const fz = gridZ - z0;
  
  const h00 = heights[z0 * verticesPerSide + x0]!;
  const h10 = heights[z0 * verticesPerSide + x1]!;
  const h01 = heights[z1 * verticesPerSide + x0]!;
  const h11 = heights[z1 * verticesPerSide + x1]!;
  
  const h0 = h00 + (h10 - h00) * fx;
  const h1 = h01 + (h11 - h01) * fx;
  
  return (h0 + (h1 - h0) * fz) * 200;
}
