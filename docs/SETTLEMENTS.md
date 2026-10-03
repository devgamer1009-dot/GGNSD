# Settlement System

## Overview

The settlement system provides deterministic procedural generation of villages, towns, and cities. It integrates with the streaming system via CellContentProvider and generates roads, plots, buildings, and interiors.

## Architecture

```
SettlementGenerator (orchestrator)
├── RoadNetworkGenerator (L-system roads)
├── PlotGenerator (collision-free placement)
├── BuildingGenerator (modular kit)
├── TerrainFlattener (site preparation)
└── InteriorSystem (enterable buildings)
```

## Features

### Deterministic Generation
- Seeded random generation (same seed = same layout)
- Reproducible across sessions
- Version-controlled schemas

### Road Network
- Radial main roads from center
- Branch roads connecting main roads
- Slight curvature for natural look
- Configurable road count and width

### Plot System
- Collision-free placement
- Near-road placement (within threshold)
- Building type selection based on settlement needs
- Configurable spacing and density

### Building Types
- **House** - Small residential (8×10m)
- **Tavern** - Large with sign (12×15m, interior)
- **Smithy** - With chimney (10×12m, interior)
- **Market** - Open canopy (20×20m)
- **Farm** - Barn + fields (15×20m)
- **Church** - With tower (15×25m, interior)
- **Castle Keep** - Large with towers (30×30m, interior)
- **Castle Wall** - Wall segment (2×10m)
- **Gate** - Arched entrance (8×4m)
- **Bridge** - Over water (6×20m)

### Terrain Flattening
- Automatic flattening under buildings
- Smooth blend zones (2m transition)
- Preserves surrounding terrain
- Configurable per building type

### Interior System
- Enterable buildings as sub-cells
- Tavern: Bar, tables, lighting
- Smithy: Forge, anvil, lighting
- Church: Altar, pews, lighting
- Castle Keep: Multi-floor, throne room

## Settlement Types

### Village
- 8-12 buildings
- No walls
- Market + farms
- Example: Briarhollow

### Town
- 15-25 buildings
- Optional walls
- Market + farms + church
- Example: Goldacre

### City
- 30-50 buildings
- Walls with gates
- Multiple markets
- Example: Highspire

### Castle
- 30-50 buildings
- Walls + towers
- Castle keep
- Example: Highspire Castle

## Integration with Streaming

```typescript
// Register settlement provider
const settlementProvider: CellContentProvider = {
  id: 'settlements',
  async generateContent(chunkX, chunkZ, chunkData) {
    const settlementGen = new SettlementGenerator(worldSeed);
    const config = settlementGen.getSettlementConfig('briarhollow');
    
    if (config && isInChunk(config.position, chunkX, chunkZ)) {
      const settlement = settlementGen.generate(config);
      settlementGen.flattenTerrain(chunkData, settlement, worldOffsetX, worldOffsetZ);
      
      const meshes = settlementGen.generateMeshes(settlement);
      return meshes;
    }
    
    return null;
  },
  disposeContent(chunkX, chunkZ) {
    // Clean up settlement meshes
  }
};

streamingManager.registerContentProvider(settlementProvider);
```

## Authored Landmarks

### Highspire Castle
- Position: (0, 0) - Geographic center
- Type: Castle with walls
- Features:
  - Castle keep with 3 floors
  - 4 corner towers
  - Walls with battlements
  - Main gate
  - Throne room interior

### Briarhollow Village
- Position: (0, 0) - Greenmarch start
- Type: Village
- Features:
  - 8-12 buildings
  - Market square
  - Farms on outskirts
  - Tavern interior
  - Smithy interior

## Data-Driven Configuration

All settlement parameters in `src/content/settlements/schemas.ts`:

```typescript
export const SETTLEMENT_SCHEMAS = {
  briarhollow: {
    type: SettlementType.VILLAGE,
    name: 'Briarhollow',
    position: { x: 0, z: 0 },
    radius: 100,
    buildingCount: { min: 8, max: 12 },
    hasWalls: false,
    hasMarket: true,
    hasFarms: true,
  },
  highspire: {
    type: SettlementType.CASTLE,
    name: 'Highspire',
    position: { x: 0, z: 0 },
    radius: 300,
    buildingCount: { min: 30, max: 50 },
    hasWalls: true,
    hasMarket: true,
    hasFarms: false,
  },
};
```

## Testing

### Unit Tests

```bash
npm test tests/settlements.test.ts
```

**Coverage:**
- ✅ Deterministic generation (same seed = same layout)
- ✅ No overlapping plots
- ✅ Slope limit validation
- ✅ Road network generation
- ✅ Plot placement validation
- ✅ Building count ranges
- ✅ Interior identification

### Manual Testing

**Test Area:**
1. Run `npm run dev`
2. Navigate to Briarhollow (0, 0)
3. Walk through village
4. Enter tavern (if interior system implemented)
5. Check for issues:
   - Stuck points (collision issues)
   - Floating buildings (terrain not flattened)
   - Ugly seams (blend zones too sharp)
   - Overlapping buildings
   - Roads not connecting properly

## Performance

### Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Settlement generation | < 50ms | Per settlement |
| Road generation | < 10ms | Per settlement |
| Plot generation | < 20ms | Per settlement |
| Building generation | < 5ms | Per building |
| Terrain flattening | < 10ms | Per chunk |

### Optimizations

- Deterministic caching (avoid regeneration)
- LOD for distant settlements
- Instanced rendering for repeated elements
- Lazy interior loading (only when entering)

## Collision and Navigation

### Colliders
- Building boxes for collision
- Wall colliders for boundaries
- Road colliders for pathfinding

### Navigation Hints
- Road network for pathfinding
- Plot boundaries for NPC movement
- Interior doorways for transitions

## Known Limitations

1. **No interior transitions** - Can't enter buildings yet
2. **No NPC placement** - Settlements are empty
3. **No lighting** - Interiors need light probes
4. **No destruction** - Buildings are static
5. **Limited variety** - Only basic building types

## Future Improvements

- [ ] Interior transition system (doorways)
- [ ] NPC spawning and schedules
- [ ] Dynamic lighting in interiors
- [ ] More building types (shops, libraries)
- [ ] Settlement upgrades (player influence)
- [ ] Destructible buildings
- [ ] Settlement defense systems
- [ ] Economic simulation (shops, trading)
- [ ] Weather effects on settlements
- [ ] Settlement sounds (ambient noise)

## Files

- `src/engine/settlements/SettlementGenerator.ts` - Main orchestrator
- `src/engine/settlements/RoadNetwork.ts` - Road generation
- `src/engine/settlements/PlotGenerator.ts` - Plot placement
- `src/engine/settlements/BuildingGenerator.ts` - Building meshes
- `src/engine/settlements/TerrainFlattener.ts` - Terrain prep
- `src/engine/settlements/InteriorSystem.ts` - Interior meshes
- `src/content/settlements/schemas.ts` - Settlement data
- `tests/settlements.test.ts` - Unit tests
