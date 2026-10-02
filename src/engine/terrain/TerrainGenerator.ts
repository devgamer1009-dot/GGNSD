/**
 * Terrain generation logic (runs in Web Worker)
 * Engine layer — never imports game
 */

import { initNoise, fbm, ridged, domainWarp, thermalErosion, carveRiver } from './Noise.js';
import { getBiome, getRegionModifiers, type BiomeType } from './Biome.js';

export interface TerrainChunkData {
  chunkX: number;
  chunkZ: number;
  size: number;
  resolution: number;
  heights: Float32Array;
  normals: Float32Array;
  biomes: Uint8Array;
  moisture: Float32Array;
  regionIds: Uint8Array;
}

export interface TerrainGenParams {
  seed: number;
  chunkX: number;
  chunkZ: number;
  size: number;
  resolution: number;
  worldSize: number;
}

/**
 * Generate terrain chunk
 */
export function generateChunk(params: TerrainGenParams): TerrainChunkData {
  const { seed, chunkX, chunkZ, size, resolution, worldSize } = params;
  
  // Initialize noise with seed
  initNoise(seed);
  
  const verticesPerSide = resolution + 1;
  const totalVertices = verticesPerSide * verticesPerSide;
  
  const heights = new Float32Array(totalVertices);
  const moisture = new Float32Array(totalVertices);
  const biomes = new Uint8Array(totalVertices);
  const regionIds = new Uint8Array(totalVertices);
  
  // Generate base heightmap
  for (let z = 0; z < verticesPerSide; z++) {
    for (let x = 0; x < verticesPerSide; x++) {
      const idx = z * verticesPerSide + x;
      
      // World position
      const worldX = chunkX * size + (x / resolution) * size - worldSize / 2;
      const worldZ = chunkZ * size + (z / resolution) * size - worldSize / 2;
      
      // Normalize to [-1, 1]
      const nx = worldX / worldSize;
      const nz = worldZ / worldSize;
      
      // Domain warping
      const warped = domainWarp(nx * 3, nz * 3, 0.5, 3);
      
      // Base terrain (fBm)
      let height = fbm(warped.x, warped.y, 6, 2.0, 0.5);
      height = (height + 1) * 0.5; // Normalize to [0, 1]
      
      // Add ridged mountains
      const ridgedHeight = ridged(warped.x * 2, warped.y * 2, 4, 2.0, 0.5);
      const mountainMask = fbm(nx * 2, nz * 2, 3, 2.0, 0.5);
      if (mountainMask > 0.3) {
        height += (ridgedHeight + 1) * 0.5 * (mountainMask - 0.3) * 2;
      }
      
      // Region modifiers
      const { heightMult, moistureMult } = getRegionModifiers(worldX, worldZ);
      height *= heightMult;
      
      // Moisture
      let moist = fbm(nx * 4 + 100, nz * 4 + 100, 4, 2.0, 0.5);
      moist = (moist + 1) * 0.5 * moistureMult;
      moist = Math.max(0, Math.min(1, moist));
      
      heights[idx] = height;
      moisture[idx] = moist;
      biomes[idx] = getBiome(height, moist);
      
      const { regionId } = getRegionInfluence(worldX, worldZ);
      regionIds[idx] = regionId;
    }
  }
  
  // Apply erosion
  thermalErosion(heights, verticesPerSide, verticesPerSide, 5);
  
  // Carve rivers
  const riverStartX = Math.floor(verticesPerSide * 0.3);
  const riverStartZ = Math.floor(verticesPerSide * 0.2);
  carveRiver(heights, verticesPerSide, verticesPerSide, riverStartX, riverStartZ, 100, 0.05);
  
  // Calculate normals
  const normals = calculateNormals(heights, verticesPerSide, verticesPerSide, size / resolution);
  
  return {
    chunkX,
    chunkZ,
    size,
    resolution,
    heights,
    normals,
    biomes,
    moisture,
    regionIds,
  };
}

/**
 * Calculate normals from heightmap
 */
function calculateNormals(
  heights: Float32Array,
  width: number,
  height: number,
  scale: number
): Float32Array {
  const normals = new Float32Array(width * height * 3);
  
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const idx = z * width + x;
      
      // Sample neighbors
      const left = x > 0 ? heights[idx - 1]! : heights[idx]!;
      const right = x < width - 1 ? heights[idx + 1]! : heights[idx]!;
      const down = z > 0 ? heights[idx - width]! : heights[idx]!;
      const up = z < height - 1 ? heights[idx + width]! : heights[idx]!;
      
      // Calculate normal
      const nx = (left - right) / (2 * scale);
      const ny = 1.0;
      const nz = (down - up) / (2 * scale);
      
      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const nIdx = idx * 3;
      normals[nIdx] = nx / len;
      normals[nIdx + 1] = ny / len;
      normals[nIdx + 2] = nz / len;
    }
  }
  
  return normals;
}

/**
 * Get height at world position (interpolated)
 */
export function heightAt(
  chunkData: TerrainChunkData,
  worldX: number,
  worldZ: number,
  worldSize: number
): number {
  const { chunkX, chunkZ, size, resolution, heights } = chunkData;
  
  // Convert world position to chunk-local position
  const localX = worldX - (chunkX * size - worldSize / 2);
  const localZ = worldZ - (chunkZ * size - worldSize / 2);
  
  // Check bounds
  if (localX < 0 || localX > size || localZ < 0 || localZ > size) {
    return 0;
  }
  
  // Convert to grid coordinates
  const gridX = (localX / size) * resolution;
  const gridZ = (localZ / size) * resolution;
  
  // Bilinear interpolation
  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, resolution);
  const z1 = Math.min(z0 + 1, resolution);
  
  const fx = gridX - x0;
  const fz = gridZ - z0;
  
  const verticesPerSide = resolution + 1;
  
  const h00 = heights[z0 * verticesPerSide + x0]!;
  const h10 = heights[z0 * verticesPerSide + x1]!;
  const h01 = heights[z1 * verticesPerSide + x0]!;
  const h11 = heights[z1 * verticesPerSide + x1]!;
  
  const h0 = h00 + (h10 - h00) * fx;
  const h1 = h01 + (h11 - h01) * fx;
  
  return h0 + (h1 - h0) * fz;
}

// Helper for region influence (duplicated from Biome.ts for worker context)
function getRegionInfluence(x: number, z: number): { regionId: number; influence: number } {
  const regions = [
    { id: 0, centerX: 0, centerZ: 0, radius: 800 },
    { id: 1, centerX: -1200, centerZ: -800, radius: 600 },
    { id: 2, centerX: 1200, centerZ: -1000, radius: 700 },
    { id: 3, centerX: -1000, centerZ: 1200, radius: 650 },
    { id: 4, centerX: 1400, centerZ: 1000, radius: 550 },
  ];
  
  let maxInfluence = 0;
  let regionId = 0;
  
  for (const region of regions) {
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
