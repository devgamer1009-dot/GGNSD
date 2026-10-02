# Terrain System

## Overview

The terrain system generates procedural terrain at runtime using Web Workers. All generation happens off the main thread to maintain 60fps performance.

## Architecture

```
Main Thread                    Worker Thread
    │                              │
    ├─ TerrainSystem               │
    │   └─ ChunkManager            │
    │       └─ Request chunk ──────┼─► TerrainGenerator
    │                              │   ├─ Noise (fBm, ridged)
    │                              │   ├─ Domain warping
    │   ◄──── Transfer arrays ─────┤   ├─ Erosion
    │       (zero-copy)            │   ├─ River carving
    │                              │   └─ Biome assignment
    ├─ Build mesh from data        │
    └─ Render                      │
```

## Chunk Size Justification

**128m chunks** chosen based on:
- **Memory**: 128×128 heightmap = 16KB (Float32Array). Acceptable for hundreds of chunks.
- **Generation time**: ~5-10ms per chunk in worker. Fast enough for streaming.
- **LOD transitions**: 128m provides good granularity for 4 LOD levels.
- **View distance**: 800m = ~6 chunks radius. Manageable memory footprint.

**Alternative sizes considered**:
- 64m: Too many chunks, overhead dominates
- 256m: Too coarse, LOD transitions too jarring
- 512m: Generation too slow, memory spikes

## Noise Functions

### Perlin Noise
Classic gradient noise. Base building block for all terrain features.

### Fractal Brownian Motion (fBm)
Multiple octaves of Perlin noise summed together. Creates natural-looking terrain with detail at multiple scales.

```typescript
fbm(x, y, octaves=6, lacunarity=2.0, persistence=0.5)
```

### Ridged Multifractal
Creates sharp ridges and mountain ranges. Used for mountainous regions.

```typescript
ridged(x, y, octaves=4, lacunarity=2.0, persistence=0.5)
```

### Domain Warping
Warps the input coordinates before sampling noise. Creates organic, flowing terrain features.

```typescript
domainWarp(x, y, warpStrength=0.5, warpOctaves=3)
```

## Erosion

### Thermal Erosion
Simulates material sliding down steep slopes. Prevents unrealistic vertical cliffs.

- **Talus angle**: 0.05 (maximum slope before erosion)
- **Iterations**: 5 per chunk
- **Effect**: Smooths steep areas, creates scree slopes

### River Carving
Carves rivers along flow paths from high to low points.

- **Steps**: 100 per river
- **Depth**: 0.05 (5% of height range)
- **Width**: 3 cells (center + neighbors)

## Biomes

Biomes are determined by height and moisture:

| Biome      | Height Range | Moisture Range | Color          |
|------------|--------------|----------------|----------------|
| Ocean      | < 0          | Any            | Blue           |
| Beach      | 0 - 0.05     | Any            | Sand           |
| Plains     | 0.05 - 0.3   | 0.3 - 0.7      | Green          |
| Forest     | 0.1 - 0.5    | > 0.5          | Dark green     |
| Hills      | 0.3 - 0.6    | Any            | Brown-green    |
| Mountains  | 0.6 - 0.85   | Any            | Grey           |
| Snow       | > 0.85       | Any            | White          |
| Desert     | 0.05 - 0.4   | < 0.3          | Yellow-brown   |

## Regions

Five regions defined as circular masks with influence falloff:

1. **Greenmarch** (center): Plains and forests, moderate terrain
2. **Thornwood** (northwest): Dense forests, high moisture
3. **Ironcrag** (northeast): Mountains, low moisture
4. **Saltfen** (southwest): Marshes, very high moisture, low terrain
5. **Ashfell** (southeast): Volcanic, low moisture, high terrain

Each region modifies height and moisture multipliers based on distance from center.

## LOD System

Four LOD levels based on distance from camera:

| LOD | Resolution | Max Distance | Use Case        |
|-----|------------|--------------|-----------------|
| 0   | 128×128    | 200m         | Close terrain   |
| 1   | 64×64      | 400m         | Medium distance |
| 2   | 32×32      | 800m         | Far terrain     |
| 3   | 16×16      | 1600m        | Very far        |

**Crack prevention**: Currently using simple LOD switching. Future improvement: vertex snapping or skirt geometry to prevent cracks between LOD levels.

## Data Flow

### Generation (Worker)
1. Initialize noise with seed
2. Generate base heightmap (fBm + domain warping)
3. Add ridged mountains where appropriate
4. Apply region modifiers
5. Generate moisture map
6. Apply thermal erosion
7. Carve rivers
8. Calculate normals
9. Assign biomes
10. Transfer typed arrays to main thread (zero-copy)

### Rendering (Main Thread)
1. Receive chunk data
2. Build BufferGeometry from typed arrays
3. Assign vertex colors based on biomes
4. Create mesh with shared material
5. Add to scene
6. Update as camera moves

### Height Queries
```typescript
const height = terrainSystem.heightAt(worldX, worldZ);
```

Used by:
- **Physics**: Ground collision detection
- **Game logic**: Entity placement, pathfinding
- **Rendering**: Camera height clamping

## Performance

### Targets
- **Generation**: < 10ms per chunk (worker)
- **Mesh build**: < 5ms per chunk (main thread)
- **Memory**: < 100MB for full view distance
- **FPS**: 60fps with 50+ chunks loaded

### Optimizations
- **Zero-copy transfer**: Typed arrays transferred, not copied
- **Shared material**: All chunks use same material instance
- **Chunk culling**: Unload chunks beyond 1500m
- **LOD**: Reduce detail for distant chunks
- **Worker offload**: All generation off main thread

## Testing

### Determinism
Same seed produces identical terrain:
```typescript
const chunk1 = generateChunk({ seed: 12345, ... });
const chunk2 = generateChunk({ seed: 12345, ... });
expect(chunk1.heights).toEqual(chunk2.heights);
```

### Height Consistency
`heightAt()` matches mesh vertices:
```typescript
const height = heightAt(chunk, worldX, worldZ, worldSize);
expect(height).toBeCloseTo(chunk.heights[gridIndex]);
```

### Border Matching
Adjacent chunks have matching heights at borders:
```typescript
const height1 = heightAt(chunk1, rightEdge, z, worldSize);
const height2 = heightAt(chunk2, leftEdge, z, worldSize);
expect(Math.abs(height1 - height2)).toBeLessThan(0.1);
```

## Future Improvements

1. **Crack-free LOD**: Vertex snapping or skirt geometry
2. **Triplanar mapping**: Blend textures on cliffs
3. **Hydraulic erosion**: More realistic water erosion
4. **Caves**: 3D noise for cave systems
5. **Vegetation**: Instanced meshes for trees/grass
6. **Texture splatting**: Multi-texture blending based on slope/biome
7. **Tessellation**: GPU-based LOD refinement
8. **Async mesh building**: Build meshes in worker, transfer to main

## Files

- `src/engine/terrain/Noise.ts` — Noise functions (Perlin, fBm, ridged, domain warp)
- `src/engine/terrain/Biome.ts` — Biome system and region masks
- `src/engine/terrain/TerrainGenerator.ts` — Core generation logic
- `src/engine/terrain/ChunkManager.ts` — Chunk loading/unloading, LOD
- `src/engine/terrain/TerrainSystem.ts` — High-level API
- `src/workers/terrain.worker.ts` — Worker thread
- `tests/terrain.test.ts` — Unit tests
