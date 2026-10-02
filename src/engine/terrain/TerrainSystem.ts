/**
 * High-level terrain system API
 * Engine layer - never imports game
 */

import { ChunkManager } from './ChunkManager.js';
import { heightAt as heightAtChunk, type TerrainChunkData } from './TerrainGenerator.js';

export class TerrainSystem {
  private chunkManager: ChunkManager;
  private seed: number;
  private worldSize: number;

  constructor(chunkSize: number = 128, viewDistance: number = 800, seed: number = 12345, worldSize: number = 4000) {
    this.chunkManager = new ChunkManager(chunkSize, viewDistance);
    this.seed = seed;
    this.worldSize = worldSize;
  }

  /**
   * Initialize the terrain system
   */
  init(): void {
    this.chunkManager.initWorker();
  }

  /**
   * Set callback for when chunks are loaded
   */
  onChunkLoad(callback: (chunk: TerrainChunkData) => void): void {
    this.chunkManager.onChunkLoad(callback);
  }

  /**
   * Update terrain around camera position
   */
  update(cameraX: number, cameraZ: number): void {
    this.chunkManager.update(cameraX, cameraZ, this.seed);
  }

  /**
   * Get height at world position
   * This is the main API used by rendering and physics
   */
  heightAt(worldX: number, worldZ: number): number {
    const { x: chunkX, z: chunkZ } = this.chunkManager.getChunkCoords(worldX, worldZ);
    
    // Try to find chunk at any LOD
    for (let lod = 0; lod < 4; lod++) {
      const chunk = this.chunkManager.getChunk(chunkX, chunkZ, lod);
      if (chunk) {
        return heightAtChunk(chunk, worldX, worldZ, this.worldSize);
      }
    }
    
    // No chunk loaded, return 0
    return 0;
  }

  /**
   * Get all loaded chunks
   */
  getLoadedChunks(): TerrainChunkData[] {
    return this.chunkManager.getAllChunks();
  }

  /**
   * Unload distant chunks
   */
  unloadDistantChunks(cameraX: number, cameraZ: number, maxDistance: number = 2000): void {
    this.chunkManager.unloadDistantChunks(cameraX, cameraZ, maxDistance);
  }

  /**
   * Dispose the terrain system
   */
  dispose(): void {
    this.chunkManager.dispose();
  }
}
