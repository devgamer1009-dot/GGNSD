/**
 * IndexedDB cache for terrain chunks
 * Stores generated chunks to avoid regeneration
 */

export interface CacheKey {
  seed: number;
  version: string;
  chunkX: number;
  chunkZ: number;
  lod: number;
}

export class ChunkCache {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private maxAge: number;

  constructor(dbName: string = 'crownfall-terrain', maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    this.dbName = dbName;
    this.storeName = 'chunks';
    this.maxAge = maxAge; // 7 days default
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
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key string
   */
  private makeKey(cacheKey: CacheKey): string {
    return `${cacheKey.seed}:${cacheKey.version}:${cacheKey.chunkX}:${cacheKey.chunkZ}:${cacheKey.lod}`;
  }

  /**
   * Get chunk from cache
   */
  async get(cacheKey: CacheKey): Promise<any | null> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(this.makeKey(cacheKey));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - result.timestamp > this.maxAge) {
          this.delete(cacheKey);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  /**
   * Store chunk in cache
   */
  async set(cacheKey: CacheKey, data: any): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const record = {
        key: this.makeKey(cacheKey),
        timestamp: Date.now(),
        data,
      };

      const request = store.put(record);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete chunk from cache
   */
  async delete(cacheKey: CacheKey): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(this.makeKey(cacheKey));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all cached chunks
   */
  async clear(): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get cache size (number of entries)
   */
  async size(): Promise<number> {
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
