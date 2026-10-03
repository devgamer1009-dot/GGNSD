/**
 * Streaming manager - handles chunk streaming with priority, caching, and worker pool
 * Implements player-centered rings and time-sliced GPU uploads
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import { PriorityQueue } from './PriorityQueue.js';
import { WorkerPool } from './WorkerPool.js';
import { ChunkCache, type CacheKey } from './ChunkCache.js';
import { ChunkLifecycle } from './ChunkLifecycle.js';
import { ContentProviders, type CellContentProvider } from './ContentProviders.js';
import { UploadQueue } from './UploadQueue.js';

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

export { CellContentProvider };

export class StreamingManager {
  private chunkSize: number;
  private rings: StreamingRings;
  private seed: number;
  private version: string;
  
  private chunkLifecycle: ChunkLifecycle;
  private chunkMeshes: Map<string, any> = new Map();
  private pendingRequests: Map<string, ChunkRequest> = new Map();
  private requestQueue: PriorityQueue<ChunkRequest>;
  private workerPool: WorkerPool;
  private cache: ChunkCache;
  private contentProviders: ContentProviders;
  private uploadQueue: UploadQueue;
  
  private cameraX: number = 0;
  private cameraZ: number = 0;
  private lastCameraX: number = 0;
  private lastCameraZ: number = 0;
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
    
    this.chunkLifecycle = new ChunkLifecycle(maxLoadedChunks);
    this.requestQueue = new PriorityQueue();
    this.workerPool = new WorkerPool(
      new URL('../../workers/terrain.worker.js', import.meta.url).href,
      4
    );
    this.cache = new ChunkCache('crownfall-terrain');
    this.contentProviders = new ContentProviders();
    this.uploadQueue = new UploadQueue(2);
  }

  async init(): Promise<void> {
    this.workerPool.init();
    await this.cache.init();
  }

  registerContentProvider(provider: CellContentProvider): void {
    this.contentProviders.register(provider);
  }

  unregisterContentProvider(providerId: string): void {
    this.contentProviders.unregister(providerId);
  }

  update(cameraX: number, cameraZ: number): void {
    if (this.disposed) return;

    this.lastCameraX = this.cameraX;
    this.lastCameraZ = this.cameraZ;
    this.cameraX = cameraX;
    this.cameraZ = cameraZ;

    const velocityX = cameraX - this.lastCameraX;
    const velocityZ = cameraZ - this.lastCameraZ;
    const velocity = Math.sqrt(velocityX * velocityX + velocityZ * velocityZ);

    const centerChunkX = Math.floor(cameraX / this.chunkSize);
    const centerChunkZ = Math.floor(cameraZ / this.chunkSize);
    const maxChunks = Math.ceil(this.rings.unloaded / this.chunkSize);

    for (let dz = -maxChunks; dz <= maxChunks; dz++) {
      for (let dx = -maxChunks; dx <= maxChunks; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkZ = centerChunkZ + dz;

        const worldX = (chunkX + 0.5) * this.chunkSize;
        const worldZ = (chunkZ + 0.5) * this.chunkSize;
        const distance = Math.sqrt(
          (worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2
        );

        let lod = 3;
        if (distance <= this.rings.full) lod = 0;
        else if (distance <= this.rings.near) lod = 1;
        else if (distance <= this.rings.far) lod = 2;

        if (distance <= this.rings.unloaded) {
          this.requestChunk(chunkX, chunkZ, lod, distance, velocity);
        }
      }
    }

    this.unloadDistantChunks();
    this.uploadQueue.process();
    this.processRequestQueue();
  }

  private requestChunk(chunkX: number, chunkZ: number, lod: number, distance: number, velocity: number): void {
    const key = `${chunkX},${chunkZ},${lod}`;

    if (this.chunkLifecycle.hasChunk(key) || this.pendingRequests.has(key)) {
      return;
    }

    const request: ChunkRequest = {
      chunkX,
      chunkZ,
      lod,
      distance,
      timestamp: Date.now(),
    };

    const velocityBonus = velocity > 0 ? -50 : 0;
    const priority = distance + velocityBonus;

    this.pendingRequests.set(key, request);
    this.requestQueue.enqueue(request, priority);
  }

  private processRequestQueue(): void {
    const maxConcurrent = 4;
    
    while (this.requestQueue.size() > 0 && this.workerPool.getBusyCount() < maxConcurrent) {
      const request = this.requestQueue.dequeue();
      if (!request) break;

      const key = `${request.chunkX},${request.chunkZ},${request.lod}`;
      
      if (!this.pendingRequests.has(key)) continue;

      this.loadFromCacheOrGenerate(request);
    }
  }

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
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.handleChunkLoaded(request, cached);
        return;
      }

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

      await this.cache.set(cacheKey, result);
      this.handleChunkLoaded(request, result);
    } catch (error) {
      this.pendingRequests.delete(key);
    }
  }

  private handleChunkLoaded(request: ChunkRequest, chunkData: TerrainChunkData): void {
    const key = `${request.chunkX},${request.chunkZ},${request.lod}`;
    
    this.pendingRequests.delete(key);
    this.chunkLifecycle.addChunk(key, chunkData);

    this.uploadQueue.enqueue(chunkData).then(() => {
      this.contentProviders.generateCellContent(request.chunkX, request.chunkZ, chunkData);
    });
  }

  private unloadDistantChunks(): void {
    const chunks = this.chunkLifecycle.getAllChunks();
    
    for (const chunk of chunks) {
      const worldX = (chunk.chunkX + 0.5) * this.chunkSize;
      const worldZ = (chunk.chunkZ + 0.5) * this.chunkSize;
      const distance = Math.sqrt(
        (worldX - this.cameraX) ** 2 + (worldZ - this.cameraZ) ** 2
      );

      if (distance > this.rings.unloaded) {
        const key = `${chunk.chunkX},${chunk.chunkZ},0`;
        this.unloadChunk(key, chunk.chunkX, chunk.chunkZ);
      }
    }
  }

  private unloadChunk(key: string, chunkX: number, chunkZ: number): void {
    this.chunkLifecycle.removeChunk(key);
    this.contentProviders.disposeCellContent(chunkX, chunkZ);

    const mesh = this.chunkMeshes.get(key);
    if (mesh) {
      mesh.geometry?.dispose();
      this.chunkMeshes.delete(key);
    }
  }

  getChunk(chunkX: number, chunkZ: number, lod: number): TerrainChunkData | undefined {
    const key = `${chunkX},${chunkZ},${lod}`;
    return this.chunkLifecycle.getChunk(key);
  }

  getAllChunks(): TerrainChunkData[] {
    return this.chunkLifecycle.getAllChunks();
  }

  setChunkMesh(chunkX: number, chunkZ: number, lod: number, mesh: any): void {
    const key = `${chunkX},${chunkZ},${lod}`;
    this.chunkMeshes.set(key, mesh);
  }

  getChunkMesh(chunkX: number, chunkZ: number, lod: number): any | undefined {
    const key = `${chunkX},${chunkZ},${lod}`;
    return this.chunkMeshes.get(key);
  }

  getAllChunkMeshes(): any[] {
    return Array.from(this.chunkMeshes.values());
  }

  getCellContent(chunkX: number, chunkZ: number, providerId: string): any | undefined {
    return this.contentProviders.getCellContent(chunkX, chunkZ, providerId);
  }

  getStats(): {
    loadedChunks: number;
    pendingRequests: number;
    queuedRequests: number;
    busyWorkers: number;
    idleWorkers: number;
    uploadQueueSize: number;
  } {
    return {
      loadedChunks: this.chunkLifecycle.getChunkCount(),
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.size(),
      busyWorkers: this.workerPool.getBusyCount(),
      idleWorkers: this.workerPool.getIdleCount(),
      uploadQueueSize: this.uploadQueue.size(),
    };
  }

  dispose(): void {
    this.disposed = true;
    this.chunkLifecycle.clear();
    this.contentProviders.clear();
    this.uploadQueue.clear();
    this.workerPool.dispose();
    this.cache.close();
    this.requestQueue.clear();
    this.pendingRequests.clear();
  }
}
