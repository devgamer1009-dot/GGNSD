/**
 * Vegetation Placement System - Deterministic placement
 * P10 - Seeded random placement with exclusion rules
 */

import { SeededRNG } from '../utils/SeededRNG.js';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import { BiomeType } from '../terrain/Biome.js';
import {
  getBiomeDensity,
  selectTreeType,
  selectRockType,
  selectPropType,
} from './BiomeDensityMaps.js';

export interface VegetationInstance {
  assetId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  type: 'tree' | 'rock' | 'prop' | 'grass';
}

export interface PlacementConfig {
  minSlope: number;        // Minimum slope angle (degrees)
  maxSlope: number;        // Maximum slope angle (degrees)
  minDistanceFromWater: number; // Minimum distance from water (meters)
  minDistanceFromPlayer: number;  // Minimum distance from player (meters)
  minSpacing: number;      // Minimum distance between instances (meters)
}

const DEFAULT_CONFIG: PlacementConfig = {
  minSlope: 0,
  maxSlope: 45,
  minDistanceFromWater: 2.0,
  minDistanceFromPlayer: 5.0,
  minSpacing: 2.0,
};

/**
 * Generate vegetation instances for a chunk
 */
export function generateVegetation(
  chunkData: TerrainChunkData,
  worldSeed: number,
  config: Partial<PlacementConfig> = {}
): VegetationInstance[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const instances: VegetationInstance[] = [];
  
  const { chunkX, chunkZ, size, resolution, heights, biomes } = chunkData;
  const verticesPerSide = resolution + 1;
  
  // Create seeded RNG for this chunk
  const chunkSeed = worldSeed + chunkX * 73856093 + chunkZ * 19349663;
  const rng = new SeededRNG(chunkSeed);
  
  // Calculate world offset for this chunk
  const worldOffsetX = chunkX * size;
  const worldOffsetZ = chunkZ * size;
  
  // Generate instances for each cell
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * verticesPerSide + x;
      const biome = biomes[idx] as BiomeType;
      const density = getBiomeDensity(biome);
      
      // Calculate world position
      const localX = (x / resolution) * size;
      const localZ = (z / resolution) * size;
      const worldX = worldOffsetX + localX;
      const worldZ = worldOffsetZ + localZ;
      const worldY = heights[idx]! * 200; // Scale height
      
      // Calculate slope (simplified)
      const slope = calculateSlope(heights, idx, verticesPerSide);
      
      // Check exclusion rules
      if (slope < cfg.minSlope || slope > cfg.maxSlope) continue;
      if (biome === BiomeType.Ocean || biome === BiomeType.Beach) continue;
      
      // Generate trees
      const treeCount = Math.floor(density.trees * rng.next());
      for (let i = 0; i < treeCount; i++) {
        const offsetX = rng.nextFloat(0, size / resolution);
        const offsetZ = rng.nextFloat(0, size / resolution);
        const treeX = worldX + offsetX;
        const treeZ = worldZ + offsetZ;
        const treeY = interpolateHeight(heights, treeX - worldOffsetX, treeZ - worldOffsetZ, size, resolution);
        
        const treeType = selectTreeType(biome, () => rng.next());
        if (treeType) {
          instances.push({
            assetId: treeType,
            position: { x: treeX, y: treeY, z: treeZ },
            rotation: { x: 0, y: rng.nextFloat(0, Math.PI * 2), z: 0 },
            scale: rng.nextFloat(0.8, 1.2),
            type: 'tree',
          });
        }
      }
      
      // Generate rocks
      const rockCount = Math.floor(density.rocks * rng.next());
      for (let i = 0; i < rockCount; i++) {
        const offsetX = rng.nextFloat(0, size / resolution);
        const offsetZ = rng.nextFloat(0, size / resolution);
        const rockX = worldX + offsetX;
        const rockZ = worldZ + offsetZ;
        const rockY = interpolateHeight(heights, rockX - worldOffsetX, rockZ - worldOffsetZ, size, resolution);
        
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
 * Calculate slope angle at a vertex
 */
function calculateSlope(heights: Float32Array, idx: number, verticesPerSide: number): number {
  const x = idx % verticesPerSide;
  const z = Math.floor(idx / verticesPerSide);
  
  // Get neighboring heights
  const current = heights[idx]!;
  const left = x > 0 ? heights[idx - 1]! : current;
  const right = x < verticesPerSide - 1 ? heights[idx + 1]! : current;
  const up = z > 0 ? heights[idx - verticesPerSide]! : current;
  const down = z < verticesPerSide - 1 ? heights[idx + verticesPerSide]! : current;
  
  // Calculate gradient
  const dx = (right - left) * 200; // Scale height
  const dz = (down - up) * 200;
  
  // Calculate slope angle
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
  
  return (h0 + (h1 - h0) * fz) * 200; // Scale height
}

/**
 * Check if placement is valid (exclusion rules)
 */
export function isValidPlacement(
  position: { x: number; y: number; z: number },
  playerPosition: { x: number; y: number; z: number },
  waterPositions: Array<{ x: number; z: number }>,
  config: PlacementConfig
): boolean {
  // Check distance from player
  const dx = position.x - playerPosition.x;
  const dz = position.z - playerPosition.z;
  const distanceFromPlayer = Math.sqrt(dx * dx + dz * dz);
  if (distanceFromPlayer < config.minDistanceFromPlayer) return false;
  
  // Check distance from water
  for (const water of waterPositions) {
    const wdx = position.x - water.x;
    const wdz = position.z - water.z;
    const distanceFromWater = Math.sqrt(wdx * wdx + wdz * wdz);
    if (distanceFromWater < config.minDistanceFromWater) return false;
  }
  
  return true;
}
