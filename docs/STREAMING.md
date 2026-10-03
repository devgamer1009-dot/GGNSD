# Streaming System

## Overview

The streaming system manages dynamic loading and unloading of terrain chunks based on camera position. It implements player-centered rings, priority-based loading, worker pooling, time-sliced GPU uploads, LRU eviction, and IndexedDB caching.

## Architecture

```
Main Thread                          Worker Pool (4 workers)
┌─────────────────┐                  ┌──────────────────┐
│ StreamingManager│                  │ Worker 1         │
│  ├─ Rings       │                  │ Worker 2         │
│  ├─ PriorityQueue                  │ Worker 3         │
│  ├─ WorkerPool  │─────tasks──────▶│ Worker 4         │
│  ├─ ChunkCache  │◀────results─────└──────────────────┘
│  └─ LRU         │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ IndexedDB       │
│ (chunk cache)   │
└─────────────────┘
```

## Player-Centered Rings

The streaming system uses four concentric rings around the camera:

| Ring       | Radius | Purpose                                    |
| ---------- | ------ | ------------------------------------------ |
| Full       | 400m   | Full detail (LOD 0, 128×128)               |
| Near       | 800m   | High detail (LOD 1, 64×64)                 |
| Far        | 1600m  | Low detail (LOD 2, 32×32)                  |
| Unloaded   | 2400m  | Minimal detail (LOD 3, 16×16), then unload |

Chunks beyond the unload radius are removed from memory.

## Priority System

Chunks are loaded based on priority (lower = higher priority):

```typescript
priority = distance + velocityBonus
```

- **Distance**: Closer chunks have higher priority
- **Velocity bonus**: If camera is moving toward a chunk, it gets -50 priority boost

This ensures chunks in the camera's path are loaded first.

## Worker Pool

The system uses 4 workers for parallel chunk generation:

- Workers process tasks from a queue
- Each task has a unique ID for cancellation
- Workers can be cancelled mid-generation
- Results are transferred via zero-copy TypedArrays

## Time-Sliced GPU Uploads

To avoid frame hitches, GPU mesh creation is time-sliced:

- **Upload budget**: 2 chunks per frame
- Uploads are queued and processed incrementally
- Prevents large frame spikes when many chunks load

## LRU Eviction

When chunk count exceeds `maxLoadedChunks` (default: 100):

- Oldest accessed chunks are evicted first
- Accessing a chunk moves it to the end of the LRU list
- Ensures memory usage stays bounded

## IndexedDB Cache

Generated chunks are cached in IndexedDB:

- **Key**: `seed:version:chunkX:chunkZ:lod`
- **Expiration**: 7 days (configurable)
- **Purpose**: Avoid regenerating chunks on reload
- **Storage**: TypedArrays stored directly (efficient)

## CellContentProvider Interface

Content providers can register to generate additional content per cell:

```typescript
interface CellContentProvider {
  id: string;
  generateContent(chunkX: number, chunkZ: number, chunkData: TerrainChunkData): Promise<any>;
  disposeContent(chunkX: number, chunkZ: number): void;
}
```

**Example providers:**
- Vegetation (trees, grass)
- NPCs (characters, animals)
- Settlements (buildings, props)
- Roads/paths

**Usage:**
```typescript
const vegetationProvider: CellContentProvider = {
  id: 'vegetation',
  async generateContent(chunkX, chunkZ, chunkData) {
    // Generate trees based on biome
    return trees;
  },
  disposeContent(chunkX, chunkZ) {
    // Clean up tree meshes
  }
};

streamingManager.registerContentProvider(vegetationProvider);
```

## Floating-Origin Rebasing

To prevent floating-point precision issues at large distances:

- Camera position is used as the origin
- All chunk positions are relative to camera
- When camera moves far enough, origin is rebased
- Prevents jitter and precision loss

## Streaming Contract

### Loading Flow

1. **Update(cameraX, cameraZ)** called each frame
2. System calculates which chunks are needed based on rings
3. Chunks are added to priority queue with distance/velocity priority
4. Worker pool processes queue (max 4 concurrent)
5. Results cached in IndexedDB
6. Meshes created via time-sliced uploads (2 per frame)
7. Content providers generate additional content
8. LRU eviction if over chunk limit

### Unloading Flow

1. Chunks beyond unload radius are identified
2. Content providers dispose their content
3. Meshes are disposed (geometry, materials)
4. Chunks removed from memory
5. LRU list updated

### Cancellation

- Stale requests (chunks no longer needed) are cancelled
- Workers receive cancel messages and abort generation
- Prevents wasted work on chunks that will be unloaded

## Configuration

```typescript
const streamingManager = new StreamingManager(
  chunkSize: 128,           // Chunk size in meters
  rings: {
    full: 400,              // Full detail radius
    near: 800,              // High detail radius
    far: 1600,              // Low detail radius
    unloaded: 2400          // Unload radius
  },
  seed: 12345,              // World seed
  version: '1.0.0',         // Cache version
  maxLoadedChunks: 100      // Max chunks in memory
);
```

## Statistics

```typescript
const stats = streamingManager.getStats();
// {
//   loadedChunks: 45,
//   pendingRequests: 12,
//   queuedRequests: 8,
//   busyWorkers: 4,
//   idleWorkers: 0,
//   uploadQueueSize: 3
// }
```

## Performance Targets

| Metric                    | Target    | Notes                           |
| ------------------------- | --------- | ------------------------------- |
| Chunk generation          | < 10ms    | Per chunk in worker             |
| GPU upload                | < 2ms     | Per chunk, time-sliced          |
| Frame hitches (>33ms)     | 0         | No visible stuttering           |
| Memory usage              | < 500MB   | 100 chunks × ~5MB each          |
| Worker utilization        | > 80%     | Keep workers busy               |

## Stress Test

A stress test page (`/stress-test.html`) performs a scripted fly-through:

- Fast camera movement across terrain
- Reports hitches (frames > 33ms)
- Tracks loaded cells over time
- Measures memory before/after
- Outputs summary for analysis

## Future Improvements

1. **Adaptive ring sizes** based on FPS
2. **Predictive loading** based on camera velocity/direction
3. **Chunk compression** for smaller IndexedDB footprint
4. **Async mesh building** in workers
5. **Occlusion culling** to skip hidden chunks
6. **Texture streaming** for high-res textures
7. **Multi-threaded content generation** (vegetation, NPCs)

## Files

- `src/engine/streaming/PriorityQueue.ts` — Priority queue for chunk requests
- `src/engine/streaming/WorkerPool.ts` — Worker pool management
- `src/engine/streaming/ChunkCache.ts` — IndexedDB cache
- `src/engine/streaming/StreamingManager.ts` — Main streaming orchestrator
- `src/workers/terrain.worker.ts` — Updated worker with task/cancel support
