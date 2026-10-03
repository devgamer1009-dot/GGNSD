# Vegetation System

## Overview

The vegetation system provides instanced, deterministic vegetation placement with LOD, wind animation, and culling. It integrates with the streaming system via CellContentProvider and uses biome density maps for realistic distribution.

## Architecture

```
VegetationSystem (orchestrator)
├── VegetationProvider (CellContentProvider)
│   ├── PlacementSystem (deterministic placement)
│   ├── VegetationLOD (LOD + billboards)
│   ├── VegetationCulling (frustum + distance)
│   └── WindShader (vertex animation)
├── GrassSystem (near-field grass)
└── RockPropPlacer (rocks + props with rules)
```

## Features

### Deterministic Placement
- Seeded random placement (same seed = same vegetation)
- Biome-based density maps
- Weighted asset selection per biome
- Exclusion rules (slope, water, spacing)

### LOD System
- **LOD 0 (0-50m)**: Full detail mesh
- **LOD 1 (50-150m)**: Reduced poly mesh
- **LOD 2 (150-500m)**: Billboard impostor
- Automatic LOD switching based on camera distance

### Wind Animation
- Vertex shader-based wind animation
- Uses environment wind API (strength + direction)
- Different frequencies for trees vs grass
- Height-based displacement (more at top)

### Culling
- **Frustum culling**: CPU-based per-chunk culling
- **Distance culling**: Max render distance (500m default)
- Combined culling for optimal performance

### Grass System
- High-density near-field grass (up to 50 blades/m²)
- Wind-animated vertex shader
- Biome-based density
- Max distance: 100m

### Rock & Prop Placement
- Slope-based exclusion (0-60° default)
- Distance from trees (min 2m)
- Biome-weighted asset selection
- Deterministic placement

## Biome Density Maps

| Biome | Trees/100m² | Grass/100m² | Rocks/100m² | Props/100m² |
|-------|-------------|-------------|-------------|-------------|
| Ocean | 0 | 0 | 0.5 | 0 |
| Beach | 0.2 | 0.5 | 1.0 | 0.1 |
| Plains | 2.0 | 15.0 | 0.5 | 0.3 |
| Forest | 8.0 | 10.0 | 1.0 | 0.5 |
| Hills | 3.0 | 12.0 | 3.0 | 0.4 |
| Mountains | 1.0 | 5.0 | 8.0 | 0.2 |
| Snow | 0.5 | 2.0 | 4.0 | 0.1 |
| Desert | 0.1 | 0.3 | 2.0 | 0.2 |

## Asset Distribution

### Trees by Biome
- **Forest**: Pine 50%, Oak 30%, Birch 20%
- **Mountains**: Pine 100%
- **Plains**: Oak 60%, Birch 40%
- **Beach**: Pine 30%, Oak 70%

### Rocks by Biome
- **Mountains**: Small 30%, Medium 50%, Large 20%
- **Hills**: Small 50%, Medium 40%, Large 10%
- **Plains**: Small 80%, Medium 20%

## Integration with Streaming

```typescript
// Register vegetation provider
const vegetationProvider = new VegetationProvider(
  assetManager,
  weatherSystem,
  camera,
  scene,
  { worldSeed: 12345 }
);

streamingManager.registerContentProvider(vegetationProvider);

// Update each frame
vegetationSystem.update(deltaTime);
```

## Performance Budgets

| Tier | Trees | Grass Blades | Rocks | Props | Total Instances |
|------|-------|--------------|-------|-------|-----------------|
| Low | 50 | 1,000 | 20 | 5 | 1,075 |
| Medium | 150 | 5,000 | 50 | 15 | 5,215 |
| High | 500 | 20,000 | 100 | 30 | 20,630 |

**Per-chunk limits:**
- Max 500 instances per chunk
- Grass: up to 10,000 blades per chunk
- Culling reduces visible instances by ~60%

## Wind Shader

### Tree Wind
```glsl
// Height-based displacement
float heightFactor = smoothstep(0.0, 2.0, position.y);

// Wave pattern
float wave = sin(uTime * uWindFrequency + position.x * 0.5);

// Apply displacement
displaced.x += uWindDirection.x * wave * uWindAmplitude * uWindStrength * heightFactor;
```

### Grass Wind
- Faster frequency (3.0 vs 2.0)
- Larger amplitude (0.15 vs 0.1)
- More chaotic pattern

## Culling Strategy

**ADR-011: CPU Culling over Compute Shaders**

**Decision**: Use CPU-based frustum culling instead of WebGPU compute shaders.

**Rationale**:
- WebGPU compute shaders not fully supported in all browsers
- CPU culling is fast enough (< 0.5ms for 10k instances)
- Simpler implementation and debugging
- Better compatibility with existing Three.js pipeline

**Performance**:
- Frustum culling: ~0.3ms per chunk
- Distance culling: ~0.1ms per chunk
- Combined: ~0.4ms per chunk
- Reduces draw calls by ~60%

## Exclusion Rules

### Trees
- Min slope: 0°
- Max slope: 45°
- No water biomes (Ocean, Beach)
- Min spacing: 2m

### Rocks
- Min slope: 0°
- Max slope: 60°
- Min distance from trees: 2m
- Min spacing: 3m

### Props
- Min slope: 0°
- Max slope: 45°
- Min distance from trees: 2m
- Min distance from water: 3m

### Grass
- No water biomes
- Height-based density (more on flat terrain)

## Testing

### Determinism Tests
```typescript
// Same seed = same vegetation
const instances1 = generateVegetation(chunk, 12345);
const instances2 = generateVegetation(chunk, 12345);
expect(instances1).toEqual(instances2);

// Different seed = different vegetation
const instances3 = generateVegetation(chunk, 54321);
expect(instances1).not.toEqual(instances3);
```

### Exclusion Tests
```typescript
// No vegetation in ocean
chunk.biomes.fill(BiomeType.Ocean);
const instances = generateVegetation(chunk, 12345);
expect(instances.length).toBe(0);

// Rocks respect tree distance
const rocks = generateRocksAndProps(chunk, 12345, treePositions);
for (const rock of rocks) {
  for (const tree of treePositions) {
    const distance = getDistance(rock, tree);
    expect(distance).toBeGreaterThanOrEqual(2.0);
  }
}
```

## Debug Visualization

Press **F5** to toggle vegetation debug:
- Green boxes: Tree positions
- Blue boxes: Rock positions
- Yellow boxes: Prop positions
- Red overlay: Culled instances

## Configuration

```typescript
const config: VegetationSystemConfig = {
  worldSeed: 12345,
  enableTrees: true,
  enableGrass: true,
  enableRocks: true,
  enableProps: true,
  enableWind: true,
  enableCulling: true,
  maxInstancesPerChunk: 500,
};
```

## Files

- `src/engine/vegetation/VegetationSystem.ts` - Main orchestrator
- `src/engine/vegetation/VegetationProvider.ts` - CellContentProvider
- `src/engine/vegetation/PlacementSystem.ts` - Deterministic placement
- `src/engine/vegetation/BiomeDensityMaps.ts` - Density maps
- `src/engine/vegetation/VegetationLOD.ts` - LOD + billboards
- `src/engine/vegetation/WindShader.ts` - Wind animation
- `src/engine/vegetation/VegetationCulling.ts` - Culling systems
- `src/engine/vegetation/GrassSystem.ts` - Near-field grass
- `src/engine/vegetation/RockPropPlacer.ts` - Rocks + props
- `tests/vegetation.test.ts` - Unit tests
