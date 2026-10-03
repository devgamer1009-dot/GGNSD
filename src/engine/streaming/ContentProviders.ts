/**
 * Content provider management
 * Handles registration and lifecycle of cell content providers
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export interface CellContentProvider {
  /**
   * Unique identifier for this provider
   */
  id: string;

  /**
   * Generate content for a cell
   */
  generateContent(chunkX: number, chunkZ: number, chunkData: TerrainChunkData): Promise<any>;

  /**
   * Dispose content for a cell
   */
  disposeContent(chunkX: number, chunkZ: number): void;
}

export class ContentProviders {
  private providers: Map<string, CellContentProvider> = new Map();
  private cellContent: Map<string, Map<string, any>> = new Map();

  /**
   * Register a content provider
   */
  register(provider: CellContentProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a content provider
   */
  unregister(providerId: string): void {
    this.providers.delete(providerId);
    
    // Dispose all content from this provider
    for (const [chunkKey, providers] of this.cellContent.entries()) {
      if (providers.has(providerId)) {
        const provider = this.providers.get(providerId);
        if (provider) {
          const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
          provider.disposeContent(chunkX!, chunkZ!);
        }
        providers.delete(providerId);
      }
    }
  }

  /**
   * Generate content for a cell from all providers
   */
  async generateCellContent(chunkX: number, chunkZ: number, chunkData: TerrainChunkData): Promise<void> {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    if (!this.cellContent.has(chunkKey)) {
      this.cellContent.set(chunkKey, new Map());
    }

    const providers = this.cellContent.get(chunkKey)!;

    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const content = await provider.generateContent(chunkX, chunkZ, chunkData);
        providers.set(providerId, content);
      } catch (error) {
        console.error(`Content provider ${providerId} failed:`, error);
      }
    }
  }

  /**
   * Dispose content for a cell
   */
  disposeCellContent(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    const providers = this.cellContent.get(chunkKey);
    
    if (providers) {
      for (const [providerId] of providers) {
        const provider = this.providers.get(providerId);
        if (provider) {
          provider.disposeContent(chunkX, chunkZ);
        }
      }
      this.cellContent.delete(chunkKey);
    }
  }

  /**
   * Get content for a cell from a specific provider
   */
  getCellContent(chunkX: number, chunkZ: number, providerId: string): any | undefined {
    const chunkKey = `${chunkX},${chunkZ}`;
    const providers = this.cellContent.get(chunkKey);
    return providers?.get(providerId);
  }

  /**
   * Get all provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all content
   */
  clear(): void {
    for (const [chunkKey, providers] of this.cellContent.entries()) {
      for (const [providerId] of providers) {
        const provider = this.providers.get(providerId);
        if (provider) {
          const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
          provider.disposeContent(chunkX!, chunkZ!);
        }
      }
    }
    this.cellContent.clear();
  }
}
