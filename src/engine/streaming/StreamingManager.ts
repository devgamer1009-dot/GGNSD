/**
 * Streaming manager - handles chunk streaming with priority, caching, and worker pool
 * Implements player-centered rings and time-sliced GPU uploads
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import { PriorityQueue } from './PriorityQueue.js';
import { WorkerPool } from './WorkerPool.js';
import { ChunkCache, type CacheKey } from './ChunkCache.js';

export interface StreamingRings {
  full: number;      // Full detail radius (meters)
  near: number;      // Near radius (meters)
  far: number;       // Far radius (meters)
  unloaded: number;  // Unload radius (meters)
}

export interface ChunkRequest {
  chunkX: number;
  chunkZ: number;
  lod: number;
  distance: number;
  timestamp: number;
}

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

export class StreamingManager {
  private chunkSize: number;
  private rings: StreamingRings;
  private seed: number;
  private version: string;
  
  private chunks: Map<string, TerrainChunkData> = new Map();
  private chunkMeshes: Map<string, any> = new Map(); // Three.js meshes
  private pendingRequests: Map<string, ChunkRequest> = new Map();
  private requestQueue: PriorityQueue<ChunkRequest>;
  private workerPool: WorkerPool;
  private cache: ChunkCache;
  
  private contentProviders: Map<string, CellContentProvider> = new Map();
  private cellContent: Map<string, Map<string, any>> = new Map(); // chunkKey -> providerId -> content
  
  private lruOrder: string[] = []; // Least recently used order
  private maxLoadedChunks: number;
  
  private cameraX: number = 0;
  private cameraZ: number = 0;
  private lastCameraX: number = 0;
  private lastCameraZ: number = 0;
  
  private uploadQueue: Array<{ chunkData: TerrainChunkData; resolve: () => void }> = [];
  private uploadBudget: number = 2; // Max uploads per frame
  private disposed: boolean = false;

  constructor(
    chunkSize: number = 128,
    rings: StreamingRings = { full: 400, near: 800, far: 1600, unloaded: 2400 },
    seed: number = 12345,
    version: string = '1.0.0',
    maxLoadedChunks: number = 100
  ) {
    this.chunkSize = chunkSize;
    this.rings = rings;
    this.seed = seed;
    this.version = version;
    this.maxLoadedChunks = maxLoadedChunks;
    
    this.requestQueue = new PriorityQueue();
    this.workerPool = new WorkerPool(
      new URL('../../workers/terrain.worker.js', import.meta.url).href,
      4
    );
    this.cache = new ChunkCache('crownfall-terrain');
  }

  /**
   * Initialize streaming system
   */
  async init(): Promise<void> {
    this.workerPool.init();
    await this.cache.init();
  }

  /**
   * Register content provider
   */
  registerContentProvider(provider: CellContentProvider): void {
    this.contentProviders.set(provider.id, provider);
  }

  /**
   * Unregister content provider
   */
  unregisterContentProvider(providerId: string): void {
    this.contentProviders.delete(providerId);
    
    // Dispose all content from this provider
    for (const [chunkKey, providers] of this.cellContent.entries()) {
      if (providers.has(providerId)) {
        const provider = this.contentProviders.get(providerId);
        if (provider) {
          const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
          provider.disposeContent(chunkX!, chunkZ!);
        }
        providers.delete(providerId);
      }
    }
  }

  /**
   * Update streaming based on camera position
   */
  update(cameraX: number, cameraZ: number): void {
    if (this.disposed) return;

    this.lastCameraX = this.cameraX;
    this.lastCameraZ = this.cameraZ;
    this.cameraX = cameraX;
    this.cameraZ = cameraZ;

    // Calculate velocity for priority
    const velocityX = cameraX - this.lastCameraX;
    const velocityZ = cameraZ - this.lastCameraZ;
    const velocity = Math.sqrt(velocityX * velocityX + velocityZ * velocityZ);

    // Determine which chunks to load
    const centerChunkX = Math.floor(cameraX / this.chunkSize);
    const centerChunkZ = Math.floor(cameraZ / this.chunkSize);

    const maxChunks = Math.ceil(this.rings.unloaded / this.chunkSize);

    // Request chunks in rings
    for (let dz = -maxChunks; dz <= maxChunks; dz++) {
      for (let dx = -maxChunks; dx <= maxChunks; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkZ = centerChunkZ + dz;

        const worldX = (chunkX + 0.5) * this.chunkSize;
        const worldZ = (chunkZ + 0.5) * this.chunkSize;
        const distance = Math.sqrt(
          (worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2
        );

        // Determine LOD based on distance
        let lod = 3;
        if (distance <= this.rings.full) lod = 0;
        else if (distance <= this.rings.near) lod = 1;
        else if (distance <= this.rings.far) lod = 2;

        // Request chunk if within unload radius
        if (distance <= this.rings.unloaded) {
          this.requestChunk(chunkX, chunkZ, lod, distance, velocity);
        }
      }
    }

    // Unload distant chunks
    this.unloadDistantChunks();

    // Process upload queue (time-sliced)
    this.processUploadQueue();

    // Process request queue
    this.processRequestQueue();
  }

  /**
   * Request chunk with priority
   */
  private requestChunk(chunkX: number, chunkZ: number, lod: number, distance: number, velocity: number): void {
    const key = `${chunkX},${chunkZ},${lod}`;

    // Already loaded or pending
    if (this.chunks.has(key) || this.pendingRequests.has(key)) {
      // Update LRU
      if (this.chunks.has(key)) {
        this.updateLRU(key);
      }
      return;
    }

    // Create request
    const request: ChunkRequest = {
      chunkX,
      chunkZ,
      lod,
      distance,
      timestamp: Date.now(),
    };

    // Calculate priority (lower distance = higher priority, velocity bonus for moving toward)
    const velocityBonus = velocity > 0 ? -50 : 0; // Moving toward = higher priority
    const priority = distance + velocityBonus;

    this.pendingRequests.set(key, request);
    this.requestQueue.enqueue(request, priority);
  }

  /**
   * Process request queue
   */
  private processRequestQueue(): void {
    const maxConcurrent = 4; // Max concurrent worker tasks
    
    while (this.requestQueue.size() > 0 && this.workerPool.getBusyCount() < maxConcurrent) {
      const request = this.requestQueue.dequeue();
      if (!request) break;

      const key = `${request.chunkX},${request.chunkZ},${request.lod}`;
      
      // Check if still needed (might have been cancelled)
      if (!this.pendingRequests.has(key)) continue;

      // Try to load from cache first
      this.loadFromCacheOrGenerate(request);
    }
  }

  /**
   * Load chunk from cache or generate
   */
  private async loadFromCacheOrGenerate(request: ChunkRequest): Promise<void> {
    const key = `${request.chunkX},${request.chunkZ},${request.lod}`;
    const cacheKey: CacheKey = {
      seed: this.seed,
      version: this.version,
      chunkX: request.chunkX,
      chunkZ: request.chunkZ,
      lod: request.lod,
    };

    try {
      // Try cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.handleChunkLoaded(request, cached);
        return;
      }

      // Generate via worker pool
      const taskId = `generate_${key}`;
      const result = await this.workerPool.submit<TerrainChunkData>(taskId, {
        type: 'generate',
        params: {
          seed: this.seed,
          chunkX: request.chunkX,
          chunkZ: request.chunkZ,
          size: this.chunkSize,
          resolution: [128, 64, 32, 16][request.lod]!,
          worldSize: 4000,
        },
      });

      // Cache result
      await this.cache.set(cacheKey, result);

      this.handleChunkLoaded(request, result);
    } catch (error) {
      // Task cancelled or failed
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Handle chunk loaded
   */
  private handleChunkLoaded(request: ChunkRequest, chunkData: TerrainChunkData): void {
    const key = `${request.chunkX},${request.chunkZ},${request.lod}`;
    
    // Remove from pending
    this.pendingRequests.delete(key);

    // Add to loaded chunks
    this.chunks.set(key, chunkData);
    this.updateLRU(key);

    // Queue for GPU upload (time-sliced)
    this.uploadQueue.push({
      chunkData,
      resolve: () => {
        // Generate content from providers
        this.generateCellContent(request.chunkX, request.chunkZ, chunkData);
      },
    });

    // LRU eviction if needed
    this.evictIfNeeded();
  }

  /**
   * Process upload queue (time-sliced)
   */
  private processUploadQueue(): void {
    let uploadsThisFrame = 0;

    while (this.uploadQueue.length > 0 && uploadsThisFrame < this.uploadBudget) {
      const upload = this.uploadQueue.shift()!;
      upload.resolve();
      uploadsThisFrame++;
    }
  }

  /**
   * Generate content from providers
   */
  private async generateCellContent(chunkX: number, chunkZ: number, chunkData: TerrainChunkData): Promise<void> {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    if (!this.cellContent.has(chunkKey)) {
      this.cellContent.set(chunkKey, new Map());
    }

    const providers = this.cellContent.get(chunkKey)!;

    for (const [providerId, provider] of this.contentProviders.entries()) {
      try {
        const content = await provider.generateContent(chunkX, chunkZ, chunkData);
        providers.set(providerId, content);
      } catch (error) {
        console.error(`Content provider ${providerId} failed:`, error);
      }
    }
  }

  /**
   * Update LRU order
   */
  private updateLRU(key: string): void {
    const index = this.lruOrder.indexOf(key);
    if (index !== -1) {
      this.lruOrder.splice(index, 1);
    }
    this.lruOrder.push(key);
  }

  /**
   * Evict chunks if over limit
   */
  private evictIfNeeded(): void {
    while (this.chunks.size > this.maxLoadedChunks && this.lruOrder.length > 0) {
      const oldestKey = this.lruOrder.shift()!;
      this.unloadChunk(oldestKey);
    }
  }

  /**
   * Unload distant chunks
   */
  private unloadDistantChunks(): void {
    const toUnload: string[] = [];

    for (const [key, chunk] of this.chunks.entries()) {
      const worldX = (chunk.chunkX + 0.5) * this.chunkSize;
      const worldZ = (chunk.chunkZ + 0.5) * this.chunkSize;
      const distance = Math.sqrt(
        (worldX - this.cameraX) ** 2 + (worldZ - this.cameraZ) ** 2
      );

      if (distance > this.rings.unloaded) {
        toUnload.push(key);
      }
    }

    for (const key of toUnload) {
      this.unloadChunk(key);
    }
  }

  /**
   * Unload single chunk
   */
  private unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    // Dispose content from providers
    const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
    const providers = this.cellContent.get(chunkKey);
    if (providers) {
      for (const [providerId] of providers) {
        const provider = this.contentProviders.get(providerId);
        if (provider) {
          provider.disposeContent(chunk.chunkX, chunk.chunkZ);
        }
      }
      this.cellContent.delete(chunkKey);
    }

    // Dispose mesh
    const mesh = this.chunkMeshes.get(key);
    if (mesh) {
      mesh.geometry?.dispose();
      this.chunkMeshes.delete(key);
    }

    // Remove from chunks
    this.chunks.delete(key);
    this.pendingRequests.delete(key);

    // Remove from LRU
    const lruIndex = this.lruOrder.indexOf(key);
    if (lruIndex !== -1) {
      this.lruOrder.splice(lruIndex, 1);
    }
  }

  /**
   * Get loaded chunk
   */
  getChunk(chunkX: number, chunkZ: number, lod: number): TerrainChunkData | undefined {
    const key = `${chunkX},${chunkZ},${lod}`;
    return this.chunks.get(key);
  }

  /**
   * Get all loaded chunks
   */
  getAllChunks(): TerrainChunkData[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Set mesh for chunk
   */
  setChunkMesh(chunkX: number, chunkZ: number, lod: number, mesh: any): void {
    const key = `${chunkX},${chunkZ},${lod}`;
    this.chunkMeshes.set(key, mesh);
  }

  /**
   * Get mesh for chunk
   */
  getChunkMesh(chunkX: number, chunkZ: number, lod: number): any | undefined {
    const key = `${chunkX},${chunkZ},${lod}`;
    return this.chunkMeshes.get(key);
  }

  /**
   * Get all chunk meshes
   */
  getAllChunkMeshes(): any[] {
    return Array.from(this.chunkMeshes.values());
  }

  /**
   * Get content for cell
   */
  getCellContent(chunkX: number, chunkZ: number, providerId: string): any | undefined {
    const chunkKey = `${chunkX},${chunkZ}`;
    const providers = this.cellContent.get(chunkKey);
    return providers?.get(providerId);
  }

  /**
   * Get statistics
   */
  getStats(): {
    loadedChunks: number;
    pendingRequests: number;
    queuedRequests: number;
    busyWorkers: number;
    idleWorkers: number;
    uploadQueueSize: number;
  } {
    return {
      loadedChunks: this.chunks.size,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.size(),
      busyWorkers: this.workerPool.getBusyCount(),
      idleWorkers: this.workerPool.getIdleCount(),
      uploadQueueSize: this.uploadQueue.length,
    };
  }

  /**
   * Dispose everything
   */
  dispose(): void {
    this.disposed = true;

    // Unload all chunks
    for (const key of Array.from(this.chunks.keys())) {
      this.unloadChunk(key);
    }

    // Dispose worker pool
    this.workerPool.dispose();

    // Close cache
    this.cache.close();

    // Clear queues
    this.requestQueue.clear();
    this.uploadQueue = [];
    this.pendingRequests.clear();
    this.lruOrder = [];
  }
}
