/**
 * Vegetation System - Main orchestrator
 * P10 - Complete vegetation system with instancing, LOD, wind, and culling
 */

import * as THREE from 'three';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import type { AssetManager } from '../assets/manager.js';
import type { WeatherSystem } from '../environment/WeatherSystem.js';
import { VegetationProvider } from './VegetationProvider.js';
import { GrassSystem } from './GrassSystem.js';
import { generateVegetation, type VegetationInstance } from './PlacementSystem.js';
import { generateRocksAndProps } from './RockPropPlacer.js';

export interface VegetationSystemConfig {
  worldSeed: number;
  enableTrees: boolean;
  enableGrass: boolean;
  enableRocks: boolean;
  enableProps: boolean;
  enableWind: boolean;
  enableCulling: boolean;
  maxInstancesPerChunk: number;
}

const DEFAULT_CONFIG: VegetationSystemConfig = {
  worldSeed: 12345,
  enableTrees: true,
  enableGrass: true,
  enableRocks: true,
  enableProps: true,
  enableWind: true,
  enableCulling: true,
  maxInstancesPerChunk: 500,
};

/**
 * Main vegetation system
 * Orchestrates all vegetation subsystems
 */
export class VegetationSystem {
  private config: VegetationSystemConfig;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private assetManager: AssetManager;
  private weatherSystem: WeatherSystem;
  
  private vegetationProvider: VegetationProvider;
  private grassSystem: GrassSystem;
  
  private chunkTreePositions: Map<string, Array<{ x: number; z: number }>> = new Map();

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    assetManager: AssetManager,
    weatherSystem: WeatherSystem,
    config: Partial<VegetationSystemConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scene = scene;
    this.camera = camera;
    this.assetManager = assetManager;
    this.weatherSystem = weatherSystem;
    
    this.vegetationProvider = new VegetationProvider(
      assetManager,
      weatherSystem,
      camera,
      scene,
      {
        worldSeed: this.config.worldSeed,
        maxInstancesPerChunk: this.config.maxInstancesPerChunk,
        enableWind: this.config.enableWind,
        enableCulling: this.config.enableCulling,
      }
    );
    
    this.grassSystem = new GrassSystem(scene);
  }

  /**
   * Generate vegetation for a chunk
   */
  async generateChunkVegetation(chunkData: TerrainChunkData): Promise<void> {
    const chunkKey = `${chunkData.chunkX},${chunkData.chunkZ}`;
    
    // Generate trees, rocks, and props
    if (this.config.enableTrees || this.config.enableRocks || this.config.enableProps) {
      const group = await this.vegetationProvider.generateContent(
        chunkData.chunkX,
        chunkData.chunkZ,
        chunkData
      );
      
      // Store tree positions for rock/prop exclusion
      const treePositions: Array<{ x: number; z: number }> = [];
      group.traverse((child: THREE.Object3D) => {
        if (child.name.startsWith('tree_')) {
          treePositions.push({
            x: child.position.x,
            z: child.position.z,
          });
        }
      });
      
      this.chunkTreePositions.set(chunkKey, treePositions);
    }
    
    // Generate grass
    if (this.config.enableGrass) {
      this.grassSystem.generateGrass(chunkData, this.config.worldSeed);
    }
  }

  /**
   * Dispose vegetation for a chunk
   */
  disposeChunk(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    this.vegetationProvider.disposeContent(chunkX, chunkZ);
    this.grassSystem.disposeChunk(chunkX, chunkZ);
    this.chunkTreePositions.delete(chunkKey);
  }

  /**
   * Update vegetation systems
   */
  update(deltaTime: number): void {
    // Update wind
    const wind = this.weatherSystem.getWind(0, 0, performance.now() / 1000);
    
    // Update vegetation provider
    this.vegetationProvider.update(deltaTime);
    
    // Update grass
    if (this.config.enableGrass) {
      this.grassSystem.update(deltaTime, wind);
    }
  }

  /**
   * Get vegetation provider
   */
  getVegetationProvider(): VegetationProvider {
    return this.vegetationProvider;
  }

  /**
   * Get grass system
   */
  getGrassSystem(): GrassSystem {
    return this.grassSystem;
  }

  /**
   * Get statistics
   */
  getStats(): {
    treeCount: number;
    grassBladeCount: number;
    chunkCount: number;
    totalInstances: number;
  } {
    return {
      treeCount: this.vegetationProvider.getTotalInstanceCount(),
      grassBladeCount: this.grassSystem.getBladeCount(),
      chunkCount: this.vegetationProvider.getChunkCount(),
      totalInstances: this.vegetationProvider.getTotalInstanceCount() + this.grassSystem.getBladeCount(),
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.vegetationProvider.dispose();
    this.grassSystem.dispose();
    this.chunkTreePositions.clear();
  }
}
