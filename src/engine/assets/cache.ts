/**
 * Asset Cache
 * P8 - Versioned cache with IndexedDB backend
 */

import type { LoadedAsset } from './types.js';

/**
 * Asset cache manager
 */
export class AssetCache {
  private cache = new Map<string, LoadedAsset>();
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'crownfall-assets') {
    this.dbName = dbName;
    this.storeName = 'assets';
  }

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Generate versioned cache key
   */
  makeKey(id: string, version: string): string {
    return `${id}:${version}`;
  }

  /**
   * Get asset from cache
   */
  get(id: string, version: string): LoadedAsset | undefined {
    const key = this.makeKey(id, version);
    return this.cache.get(key);
  }

  /**
   * Store asset in cache
   */
  set(id: string, version: string, asset: LoadedAsset): void {
    const key = this.makeKey(id, version);
    this.cache.set(key, asset);
  }

  /**
   * Check if asset is cached
   */
  has(id: string, version: string): boolean {
    const key = this.makeKey(id, version);
    return this.cache.has(key);
  }

  /**
   * Remove asset from cache
   */
  remove(id: string, version: string): void {
    const key = this.makeKey(id, version);
    this.cache.delete(key);
  }

  /**
   * Increment reference count
   */
  acquire(id: string, version: string): void {
    const asset = this.get(id, version);
    if (asset) {
      asset.refCount++;
    }
  }

  /**
   * Decrement reference count, dispose if zero
   */
  release(id: string, version: string): boolean {
    const asset = this.get(id, version);
    if (!asset) return false;

    asset.refCount--;
    if (asset.refCount <= 0) {
      this.remove(id, version);
      // Dispose Three.js resources
      if ('dispose' in asset.data) {
        (asset.data as any).dispose();
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all cached assets
   */
  clear(): void {
    for (const asset of this.cache.values()) {
      if ('dispose' in asset.data) {
        (asset.data as any).dispose();
      }
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; assets: string[] } {
    return {
      size: this.cache.size,
      assets: Array.from(this.cache.keys()),
    };
  }

  /**
   * Close database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
