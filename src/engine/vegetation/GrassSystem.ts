/**
 * Grass System - Near-field grass rendering
 * P10 - High-density grass with wind animation
 */

import * as THREE from 'three';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import { BiomeType } from '../terrain/Biome.js';
import { getBiomeDensity } from './BiomeDensityMaps.js';
import { createGrassMaterial, updateWindUniforms } from './WindShader.js';
import type { WindSample } from '../environment/WeatherSystem.js';

export interface GrassConfig {
  bladesPerSquareMeter: number;
  bladeHeight: number;
  bladeWidth: number;
  maxDistance: number;
}

const DEFAULT_GRASS_CONFIG: GrassConfig = {
  bladesPerSquareMeter: 50,
  bladeHeight: 0.3,
  bladeWidth: 0.05,
  maxDistance: 100,
};

/**
 * Grass system for near-field rendering
 */
export class GrassSystem {
  private config: GrassConfig;
  private scene: THREE.Scene;
  private grassMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private material: THREE.ShaderMaterial;
  private time: number = 0;

  constructor(scene: THREE.Scene, config: Partial<GrassConfig> = {}) {
    this.config = { ...DEFAULT_GRASS_CONFIG, ...config };
    this.scene = scene;
    this.material = createGrassMaterial();
  }

  /**
   * Generate grass for a chunk
   */
  generateGrass(chunkData: TerrainChunkData, worldSeed: number): void {
    const chunkKey = `${chunkData.chunkX},${chunkData.chunkZ}`;
    
    // Calculate grass density based on biome
    const avgBiome = this.getDominantBiome(chunkData);
    const density = getBiomeDensity(avgBiome);
    
    // Skip if no grass in this biome
    if (density.grass <= 0) return;
    
    const { resolution, size, heights, biomes } = chunkData;
    const verticesPerSide = resolution + 1;
    
    // Calculate total grass blades
    const area = size * size;
    const totalBlades = Math.floor(area * density.grass * (this.config.bladesPerSquareMeter / 100));
    
    // Create grass blade geometry
    const geometry = this.createGrassBladeGeometry();
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(geometry, this.material, totalBlades);
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = true;
    
    // Generate grass positions
    const rng = this.createSeededRNG(worldSeed + chunkData.chunkX * 1000 + chunkData.chunkZ);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    const worldOffsetX = chunkData.chunkX * size;
    const worldOffsetZ = chunkData.chunkZ * size;
    
    let bladeIndex = 0;
    
    for (let i = 0; i < totalBlades; i++) {
      // Random position within chunk
      const localX = rng() * size;
      const localZ = rng() * size;
      const worldX = worldOffsetX + localX;
      const worldZ = worldOffsetZ + localZ;
      
      // Interpolate height
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
      const height = (h0 + (h1 - h0) * fz) * 200;
      
      // Check biome
      const biomeIdx = Math.floor(gridZ) * verticesPerSide + Math.floor(gridX);
      const biome = biomes[biomeIdx] as BiomeType;
      
      // Skip water biomes
      if (biome === BiomeType.Ocean || biome === BiomeType.Beach) continue;
      
      // Set transform
      position.set(worldX, height, worldZ);
      rotation.setFromEuler(new THREE.Euler(0, rng() * Math.PI * 2, 0));
      scale.set(1, rng() * 0.5 + 0.75, 1);
      
      matrix.compose(position, rotation, scale);
      instancedMesh.setMatrixAt(bladeIndex, matrix);
      bladeIndex++;
    }
    
    // Update instance count
    instancedMesh.count = bladeIndex;
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    // Store and add to scene
    this.grassMeshes.set(chunkKey, instancedMesh);
    this.scene.add(instancedMesh);
  }

  /**
   * Create grass blade geometry
   */
  private createGrassBladeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const { bladeHeight, bladeWidth } = this.config;
    
    // Create a simple grass blade (triangle)
    const vertices = new Float32Array([
      -bladeWidth / 2, 0, 0,
      bladeWidth / 2, 0, 0,
      0, bladeHeight, 0,
    ]);
    
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    return geometry;
  }

  /**
   * Get dominant biome in chunk
   */
  private getDominantBiome(chunkData: TerrainChunkData): BiomeType {
    const { biomes } = chunkData;
    const counts = new Map<BiomeType, number>();
    
    for (const biome of biomes) {
      const b = biome as BiomeType;
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    
    let maxCount = 0;
    let dominantBiome = BiomeType.Plains;
    
    for (const [biome, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantBiome = biome;
      }
    }
    
    return dominantBiome;
  }

  /**
   * Create seeded RNG
   */
  private createSeededRNG(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Update grass (wind animation)
   */
  update(deltaTime: number, wind: WindSample): void {
    this.time += deltaTime;
    updateWindUniforms(this.material, wind, this.time);
  }

  /**
   * Dispose grass for a chunk
   */
  disposeChunk(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    const mesh = this.grassMeshes.get(chunkKey);
    
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.grassMeshes.delete(chunkKey);
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const mesh of this.grassMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.grassMeshes.clear();
    
    this.material.dispose();
  }

  /**
   * Get total grass blade count
   */
  getBladeCount(): number {
    let total = 0;
    for (const mesh of this.grassMeshes.values()) {
      total += mesh.count;
    }
    return total;
  }

  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.grassMeshes.size;
  }
}
