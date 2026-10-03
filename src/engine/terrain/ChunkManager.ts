/**
 * Chunk manager - handles chunk loading, unloading, and LOD
 * Engine layer - never imports game
 */

import type { TerrainChunkData } from './TerrainGenerator.js';

export interface ChunkKey {
  x: number;
  z: number;
  lod: number;
}

export interface TerrainLODLevel {
  level: number;
  resolution: number;
  maxDistance: number;
}

export const LOD_LEVELS: TerrainLODLevel[] = [
  { level: 0, resolution: 128, maxDistance: 200 },
  { level: 1, resolution: 64, maxDistance: 400 },
  { level: 2, resolution: 32, maxDistance: 800 },
  { level: 3, resolution: 16, maxDistance: 1600 },
];

export class ChunkManager {
  private chunks: Map<string, TerrainChunkData> = new Map();
  private chunkSize: number;
  private viewDistance: number;
  private worker: Worker | null = null;
  private pendingChunks: Set<string> = new Set();
  private onLoadCallback: ((chunk: TerrainChunkData) => void) | null = null;

  constructor(chunkSize: number = 128, viewDistance: number = 800) {
    this.chunkSize = chunkSize;
    this.viewDistance = viewDistance;
  }

  /**
   * Initialize worker
   */
  initWorker(): void {
    this.worker = new Worker(
      new URL('../../workers/terrain.worker.js', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'chunkGenerated') {
        const key = this.getChunkKey(data.chunkX, data.chunkZ, 0);
        this.chunks.set(key, data);
        this.pendingChunks.delete(key);
        this.onLoadCallback?.(data);
      }
    };
  }

  /**
   * Set callback for when chunks are loaded
   */
  onChunkLoad(callback: (chunk: TerrainChunkData) => void): void {
    this.onLoadCallback = callback;
  }

  /**
   * Get chunk key string
   */
  private getChunkKey(x: number, z: number, lod: number): string {
    return `${x},${z},${lod}`;
  }

  /**
   * Get chunk coordinates from world position
   */
  getChunkCoords(worldX: number, worldZ: number): { x: number; z: number } {
    return {
      x: Math.floor(worldX / this.chunkSize),
      z: Math.floor(worldZ / this.chunkSize),
    };
  }

  /**
   * Request chunk generation
   */
  requestChunk(chunkX: number, chunkZ: number, lod: number = 0, seed: number = 12345): void {
    const key = this.getChunkKey(chunkX, chunkZ, lod);
    
    if (this.chunks.has(key) || this.pendingChunks.has(key)) {
      return;
    }

    this.pendingChunks.add(key);

    const lodLevel = LOD_LEVELS[lod] ?? LOD_LEVELS[0]!;
    
    this.worker?.postMessage({
      type: 'generate',
      params: {
        seed,
        chunkX,
        chunkZ,
        size: this.chunkSize,
        resolution: lodLevel.resolution,
        worldSize: 4000,
      },
    });
  }

  /**
   * Update chunks around camera position
   */
  update(cameraX: number, cameraZ: number, seed: number = 12345): void {
    const { x: centerChunkX, z: centerChunkZ } = this.getChunkCoords(cameraX, cameraZ);
    
    // Calculate view distance in chunks
    const viewChunks = Math.ceil(this.viewDistance / this.chunkSize);
    
    // Request chunks in view
    for (let dz = -viewChunks; dz <= viewChunks; dz++) {
      for (let dx = -viewChunks; dx <= viewChunks; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkZ = centerChunkZ + dz;
        
        // Calculate distance for LOD
        const worldX = (chunkX + 0.5) * this.chunkSize;
        const worldZ = (chunkZ + 0.5) * this.chunkSize;
        const dist = Math.sqrt(
          (worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2
        );
        
        // Determine LOD level
        let lod = 0;
        for (let i = 0; i < LOD_LEVELS.length; i++) {
          if (dist <= LOD_LEVELS[i]!.maxDistance) {
            lod = i;
            break;
          }
          lod = i;
        }
        
        this.requestChunk(chunkX, chunkZ, lod, seed);
      }
    }
  }

  /**
   * Get loaded chunk
   */
  getChunk(chunkX: number, chunkZ: number, lod: number = 0): TerrainChunkData | undefined {
    const key = this.getChunkKey(chunkX, chunkZ, lod);
    return this.chunks.get(key);
  }

  /**
   * Get all loaded chunks
   */
  getAllChunks(): TerrainChunkData[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Unload distant chunks
   */
  unloadDistantChunks(cameraX: number, cameraZ: number, maxDistance: number): void {
    const toUnload: string[] = [];
    
    for (const [key, chunk] of this.chunks.entries()) {
      const worldX = (chunk.chunkX + 0.5) * this.chunkSize;
      const worldZ = (chunk.chunkZ + 0.5) * this.chunkSize;
      const dist = Math.sqrt(
        (worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2
      );
      
      if (dist > maxDistance) {
        toUnload.push(key);
      }
    }
    
    for (const key of toUnload) {
      this.chunks.delete(key);
    }
  }

  /**
   * Dispose worker
   */
  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.chunks.clear();
    this.pendingChunks.clear();
  }
}
