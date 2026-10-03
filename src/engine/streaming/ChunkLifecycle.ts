/**
 * Chunk lifecycle management
 * Handles loading, unloading, and LRU eviction
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export class ChunkLifecycle {
  private chunks: Map<string, TerrainChunkData> = new Map();
  private lruOrder: string[] = [];
  private maxLoadedChunks: number;

  constructor(maxLoadedChunks: number = 100) {
    this.maxLoadedChunks = maxLoadedChunks;
  }

  /**
   * Add chunk to loaded set
   */
  addChunk(key: string, data: TerrainChunkData): void {
    this.chunks.set(key, data);
    this.updateLRU(key);
    this.evictIfNeeded();
  }

  /**
   * Get chunk by key
   */
  getChunk(key: string): TerrainChunkData | undefined {
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.updateLRU(key);
    }
    return chunk;
  }

  /**
   * Remove chunk
   */
  removeChunk(key: string): TerrainChunkData | undefined {
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.chunks.delete(key);
      const lruIndex = this.lruOrder.indexOf(key);
      if (lruIndex !== -1) {
        this.lruOrder.splice(lruIndex, 1);
      }
    }
    return chunk;
  }

  /**
   * Check if chunk is loaded
   */
  hasChunk(key: string): boolean {
    return this.chunks.has(key);
  }

  /**
   * Get all loaded chunks
   */
  getAllChunks(): TerrainChunkData[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * Update LRU order (move to end)
   */
  private updateLRU(key: string): void {
    const index = this.lruOrder.indexOf(key);
    if (index !== -1) {
      this.lruOrder.splice(index, 1);
    }
    this.lruOrder.push(key);
  }

  /**
   * Evict oldest chunks if over limit
   */
  private evictIfNeeded(): void {
    while (this.chunks.size > this.maxLoadedChunks && this.lruOrder.length > 0) {
      const oldestKey = this.lruOrder.shift()!;
      this.chunks.delete(oldestKey);
    }
  }

  /**
   * Clear all chunks
   */
  clear(): void {
    this.chunks.clear();
    this.lruOrder = [];
  }
}
