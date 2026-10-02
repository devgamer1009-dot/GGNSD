import { describe, it, expect } from 'vitest';
import { initNoise, perlin2, fbm, ridged } from '../src/engine/terrain/Noise.js';
import { generateChunk, heightAt } from '../src/engine/terrain/TerrainGenerator.js';
import { getBiome, BiomeType, getRegionInfluence } from '../src/engine/terrain/Biome.js';

describe('Terrain Noise', () => {
  it('should produce deterministic results with same seed', () => {
    initNoise(12345);
    const val1 = perlin2(1.5, 2.3);
    
    initNoise(12345);
    const val2 = perlin2(1.5, 2.3);
    
    expect(val1).toBe(val2);
  });

  it('should produce different results with different seeds', () => {
    initNoise(12345);
    const val1 = perlin2(1.5, 2.3);
    
    initNoise(54321);
    const val2 = perlin2(1.5, 2.3);
    
    expect(val1).not.toBe(val2);
  });

  it('should produce values in [-1, 1] range for perlin', () => {
    initNoise(12345);
    
    for (let i = 0; i < 100; i++) {
      const val = perlin2(i * 0.1, i * 0.2);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('should produce values in [-1, 1] range for fbm', () => {
    initNoise(12345);
    
    for (let i = 0; i < 100; i++) {
      const val = fbm(i * 0.1, i * 0.2, 4, 2.0, 0.5);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('should produce values in [-1, 1] range for ridged', () => {
    initNoise(12345);
    
    for (let i = 0; i < 100; i++) {
      const val = ridged(i * 0.1, i * 0.2, 4, 2.0, 0.5);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});

describe('Terrain Generation', () => {
  it('should generate chunk with correct dimensions', () => {
    const chunk = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const verticesPerSide = 16 + 1;
    const totalVertices = verticesPerSide * verticesPerSide;

    expect(chunk.heights.length).toBe(totalVertices);
    expect(chunk.normals.length).toBe(totalVertices * 3);
    expect(chunk.biomes.length).toBe(totalVertices);
    expect(chunk.moisture.length).toBe(totalVertices);
    expect(chunk.regionIds.length).toBe(totalVertices);
  });

  it('should produce deterministic chunks with same seed', () => {
    const chunk1 = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const chunk2 = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    expect(chunk1.heights).toEqual(chunk2.heights);
    expect(chunk1.biomes).toEqual(chunk2.biomes);
  });

  it('should produce different chunks with different seeds', () => {
    const chunk1 = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const chunk2 = generateChunk({
      seed: 54321,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    expect(chunk1.heights).not.toEqual(chunk2.heights);
  });

  it('should produce different chunks at different positions', () => {
    const chunk1 = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const chunk2 = generateChunk({
      seed: 12345,
      chunkX: 1,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    expect(chunk1.heights).not.toEqual(chunk2.heights);
  });
});

describe('Height Interpolation', () => {
  it('should interpolate height at chunk center', () => {
    const chunk = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const height = heightAt(chunk, 0, 0, 4000);
    expect(height).toBeGreaterThanOrEqual(0);
    expect(height).toBeLessThanOrEqual(1);
  });

  it('should match mesh vertices at grid points', () => {
    const chunk = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    // Check corner (0, 0)
    const cornerHeight = heightAt(chunk, -2000, -2000, 4000);
    expect(cornerHeight).toBe(chunk.heights[0]!);

    // Check center
    const centerIdx = 8 * 17 + 8; // Middle of 17x17 grid
    const centerWorldX = 0;
    const centerWorldZ = 0;
    const centerHeight = heightAt(chunk, centerWorldX, centerWorldZ, 4000);
    expect(Math.abs(centerHeight - chunk.heights[centerIdx]!)).toBeLessThan(0.01);
  });

  it('should return 0 for positions outside chunk', () => {
    const chunk = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const height = heightAt(chunk, 5000, 5000, 4000);
    expect(height).toBe(0);
  });
});

describe('Biome System', () => {
  it('should assign ocean biome for negative heights', () => {
    const biome = getBiome(-0.5, 0.5);
    expect(biome).toBe(BiomeType.Ocean);
  });

  it('should assign beach biome for low heights', () => {
    const biome = getBiome(0.02, 0.5);
    expect(biome).toBe(BiomeType.Beach);
  });

  it('should assign snow biome for high heights', () => {
    const biome = getBiome(0.9, 0.5);
    expect(biome).toBe(BiomeType.Snow);
  });

  it('should assign desert biome for low moisture', () => {
    const biome = getBiome(0.2, 0.1);
    expect(biome).toBe(BiomeType.Desert);
  });

  it('should assign forest biome for high moisture', () => {
    const biome = getBiome(0.2, 0.8);
    expect(biome).toBe(BiomeType.Forest);
  });

  it('should assign plains biome for moderate conditions', () => {
    const biome = getBiome(0.2, 0.5);
    expect(biome).toBe(BiomeType.Plains);
  });
});

describe('Region System', () => {
  it('should detect Greenmarch at center', () => {
    const { regionId, influence } = getRegionInfluence(0, 0);
    expect(regionId).toBe(0);
    expect(influence).toBeGreaterThan(0.5);
  });

  it('should detect Thornwood in northwest', () => {
    const { regionId, influence } = getRegionInfluence(-1200, -800);
    expect(regionId).toBe(1);
    expect(influence).toBeGreaterThan(0.5);
  });

  it('should detect Ironcrag in northeast', () => {
    const { regionId, influence } = getRegionInfluence(1200, -1000);
    expect(regionId).toBe(2);
    expect(influence).toBeGreaterThan(0.5);
  });

  it('should detect Saltfen in southwest', () => {
    const { regionId, influence } = getRegionInfluence(-1000, 1200);
    expect(regionId).toBe(3);
    expect(influence).toBeGreaterThan(0.5);
  });

  it('should detect Ashfell in southeast', () => {
    const { regionId, influence } = getRegionInfluence(1400, 1000);
    expect(regionId).toBe(4);
    expect(influence).toBeGreaterThan(0.5);
  });

  it('should have decreasing influence with distance', () => {
    const center = getRegionInfluence(0, 0);
    const far = getRegionInfluence(500, 500);
    expect(center.influence).toBeGreaterThan(far.influence);
  });
});

describe('Chunk Borders', () => {
  it('should have matching heights at chunk borders', () => {
    const chunk1 = generateChunk({
      seed: 12345,
      chunkX: 0,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    const chunk2 = generateChunk({
      seed: 12345,
      chunkX: 1,
      chunkZ: 0,
      size: 128,
      resolution: 16,
      worldSize: 4000,
    });

    // Get height at right edge of chunk1
    const rightEdgeX = 64; // Right edge of chunk 0
    const rightEdgeZ = 0;
    const height1 = heightAt(chunk1, rightEdgeX, rightEdgeZ, 4000);

    // Get height at left edge of chunk2
    const leftEdgeX = 64; // Left edge of chunk 1
    const leftEdgeZ = 0;
    const height2 = heightAt(chunk2, leftEdgeX, leftEdgeZ, 4000);

    // Heights should be close (within interpolation tolerance)
    expect(Math.abs(height1 - height2)).toBeLessThan(0.1);
  });
});
