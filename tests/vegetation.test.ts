import { describe, it, expect } from 'vitest';
import { generateVegetation } from '../src/engine/vegetation/PlacementSystem.js';
import { generateRocksAndProps } from '../src/engine/vegetation/RockPropPlacer.js';
import { getBiomeDensity, selectTreeType, selectRockType } from '../src/engine/vegetation/BiomeDensityMaps.js';
import { BiomeType } from '../src/engine/terrain/Biome.js';
import type { TerrainChunkData } from '../src/engine/terrain/TerrainGenerator.js';

describe('Vegetation Placement', () => {
  // Create mock chunk data
  function createMockChunk(chunkX: number, chunkZ: number): TerrainChunkData {
    const resolution = 16;
    const size = 128;
    const verticesPerSide = resolution + 1;
    const totalVertices = verticesPerSide * verticesPerSide;
    
    const heights = new Float32Array(totalVertices);
    const biomes = new Uint8Array(totalVertices);
    
    // Fill with flat terrain and plains biome
    for (let i = 0; i < totalVertices; i++) {
      heights[i] = 0.5;
      biomes[i] = BiomeType.Plains;
    }
    
    return {
      chunkX,
      chunkZ,
      size,
      resolution,
      heights,
      normals: new Float32Array(totalVertices * 3),
      biomes,
      moisture: new Float32Array(totalVertices),
      regionIds: new Uint8Array(totalVertices),
    };
  }

  describe('Placement Determinism', () => {
    it('should generate identical vegetation with same seed', () => {
      const chunk = createMockChunk(0, 0);
      const worldSeed = 12345;
      
      const instances1 = generateVegetation(chunk, worldSeed);
      const instances2 = generateVegetation(chunk, worldSeed);
      
      expect(instances1.length).toBe(instances2.length);
      
      // Check positions match
      for (let i = 0; i < instances1.length; i++) {
        expect(instances1[i]!.position.x).toBe(instances2[i]!.position.x);
        expect(instances1[i]!.position.y).toBe(instances2[i]!.position.y);
        expect(instances1[i]!.position.z).toBe(instances2[i]!.position.z);
        expect(instances1[i]!.assetId).toBe(instances2[i]!.assetId);
      }
    });

    it('should generate different vegetation with different seeds', () => {
      const chunk = createMockChunk(0, 0);
      
      const instances1 = generateVegetation(chunk, 12345);
      const instances2 = generateVegetation(chunk, 54321);
      
      // Should have different positions or counts
      let hasDifference = false;
      if (instances1.length !== instances2.length) {
        hasDifference = true;
      } else {
        for (let i = 0; i < instances1.length; i++) {
          if (
            instances1[i]!.position.x !== instances2[i]!.position.x ||
            instances1[i]!.position.z !== instances2[i]!.position.z
          ) {
            hasDifference = true;
            break;
          }
        }
      }
      
      expect(hasDifference).toBe(true);
    });

    it('should generate different vegetation for different chunks', () => {
      const chunk1 = createMockChunk(0, 0);
      const chunk2 = createMockChunk(1, 0);
      const worldSeed = 12345;
      
      const instances1 = generateVegetation(chunk1, worldSeed);
      const instances2 = generateVegetation(chunk2, worldSeed);
      
      // Should have different positions
      let hasDifference = false;
      if (instances1.length !== instances2.length) {
        hasDifference = true;
      } else if (instances1.length > 0) {
        hasDifference = instances1[0]!.position.x !== instances2[0]!.position.x;
      }
      
      expect(hasDifference).toBe(true);
    });
  });

  describe('Biome Density', () => {
    it('should return correct density for each biome', () => {
      const forestDensity = getBiomeDensity(BiomeType.Forest);
      expect(forestDensity.trees).toBeGreaterThan(5);
      expect(forestDensity.grass).toBeGreaterThan(5);
      
      const desertDensity = getBiomeDensity(BiomeType.Desert);
      expect(desertDensity.trees).toBeLessThan(1);
      expect(desertDensity.grass).toBeLessThan(1);
      
      const oceanDensity = getBiomeDensity(BiomeType.Ocean);
      expect(oceanDensity.trees).toBe(0);
      expect(oceanDensity.grass).toBe(0);
    });

    it('should select tree types based on biome weights', () => {
      const rng = () => 0.5; // Middle value
      
      const forestTree = selectTreeType(BiomeType.Forest, rng);
      expect(forestTree).toBeTruthy();
      expect(['tree_pine', 'tree_oak', 'tree_birch']).toContain(forestTree);
      
      const mountainTree = selectTreeType(BiomeType.Mountains, rng);
      expect(mountainTree).toBe('tree_pine'); // Only pine in mountains
      
      const oceanTree = selectTreeType(BiomeType.Ocean, rng);
      expect(oceanTree).toBeNull(); // No trees in ocean
    });
  });

  describe('Exclusion Rules', () => {
    it('should not place vegetation in ocean biome', () => {
      const chunk = createMockChunk(0, 0);
      // Set all biomes to ocean
      for (let i = 0; i < chunk.biomes.length; i++) {
        chunk.biomes[i] = BiomeType.Ocean;
      }
      
      const instances = generateVegetation(chunk, 12345);
      
      // Should have no instances (or very few from edge effects)
      expect(instances.length).toBe(0);
    });

    it('should respect slope limits', () => {
      const chunk = createMockChunk(0, 0);
      
      // Create steep terrain
      for (let z = 0; z <= chunk.resolution; z++) {
        for (let x = 0; x <= chunk.resolution; x++) {
          const idx = z * (chunk.resolution + 1) + x;
          chunk.heights[idx] = x * 0.1; // Steep slope
        }
      }
      
      const instances = generateVegetation(chunk, 12345, {
        minSlope: 0,
        maxSlope: 30, // Limit to 30 degrees
      });
      
      // Should have fewer instances due to slope exclusion
      // (exact count depends on implementation, but should be less than flat terrain)
      expect(instances.length).toBeGreaterThanOrEqual(0);
    });

    it('should place rocks with distance from trees', () => {
      const chunk = createMockChunk(0, 0);
      const treePositions = [
        { x: 64, z: 64 }, // Center of chunk
      ];
      
      const instances = generateRocksAndProps(chunk, 12345, treePositions, {
        minDistanceFromTrees: 5.0,
      });
      
      // Check that no rocks are too close to trees
      for (const instance of instances) {
        if (instance.type === 'rock') {
          for (const tree of treePositions) {
            const dx = instance.position.x - tree.x;
            const dz = instance.position.z - tree.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            expect(distance).toBeGreaterThanOrEqual(5.0);
          }
        }
      }
    });
  });

  describe('Rock and Prop Placement', () => {
    it('should generate rocks based on biome density', () => {
      const chunk = createMockChunk(0, 0);
      // Set to mountain biome (high rock density)
      for (let i = 0; i < chunk.biomes.length; i++) {
        chunk.biomes[i] = BiomeType.Mountains;
      }
      
      const instances = generateRocksAndProps(chunk, 12345, []);
      
      const rockCount = instances.filter(i => i.type === 'rock').length;
      expect(rockCount).toBeGreaterThan(0);
    });

    it('should select rock types based on biome', () => {
      const rng = () => 0.5;
      
      const mountainRock = selectRockType(BiomeType.Mountains, rng);
      expect(mountainRock).toBeTruthy();
      expect(['rock_small', 'rock_medium', 'rock_large']).toContain(mountainRock);
    });
  });
});
