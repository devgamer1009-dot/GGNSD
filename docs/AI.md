# AI System

## Overview

The AI system provides complete world life simulation with navigation meshes, behavior trees, NPC schedules, wildlife, factions, and dynamic events. All AI updates are time-sliced to maintain the 1.5ms/frame budget.

## Architecture

```
AISystem (orchestrator)
├── NavMeshSystem (recast-navigation)
│   ├── Per-chunk navmesh generation
│   ├── Pathfinding queries
│   └── Worker-based generation (future)
├── NPCSystem
│   ├── ScheduleSystem (time-based activities)
│   ├── BehaviorTree (decision making)
│   └── NPC entities
├── WildlifeSystem
│   ├── Herd behavior
│   ├── Predator/prey dynamics
│   └── Weather reactions
├── FactionSystem (reputation tracking)
├── EventSystem (dynamic events)
├── AILodManager (distance-based AI quality)
└── AIUpdateScheduler (time-sliced updates)
```

## Navigation System

### NavMesh Generation

Uses `recast-navigation` library for industry-standard navigation meshes:

```typescript
const navMesh = new NavMeshSystem();
await navMesh.init();

// Generate for terrain chunk
navMesh.generateChunkNavMesh(chunkData, worldOffsetX, worldOffsetZ);

// Find path
const path = navMesh.findPath(start, end, chunkX, chunkZ);
```

### Configuration

```typescript
const config = {
  cellSize: 0.3,           // Voxel size
  cellHeight: 0.2,         // Voxel height
  agentHeight: 1.8,        // NPC height
  agentRadius: 0.3,        // NPC radius
  agentMaxClimb: 0.5,      // Max step height
  agentMaxSlope: 45,       // Max walkable slope
  tiled: false,            // Use tiled navmesh
  tileSize: 32,            // Tile size (if tiled)
};
```

### Features

- Per-chunk navmesh generation
- Pathfinding between points
- Closest point queries
- Automatic cleanup when chunks unload

## Behavior Trees

### Node Types

**Sequence** - Executes children in order, fails on first failure
```typescript
const sequence = new Sequence(blackboard, [
  new Condition(bb, () => isHungry()),
  new Action(bb, () => goToKitchen()),
  new Action(bb, () => eatFood()),
]);
```

**Selector** - Tries children until one succeeds
```typescript
const selector = new Selector(blackboard, [
  new Condition(bb, () => isDangerous()),
  new Action(bb, () => flee()),
  new Action(bb, () => wander()),
]);
```

**Action** - Executes a function
```typescript
const action = new Action(blackboard, (bb, dt) => {
  bb.npc.moveTowards(bb.target);
  return NodeStatus.SUCCESS;
});
```

**Condition** - Tests a condition
```typescript
const condition = new Condition(blackboard, (bb) => {
  return bb.health < 50;
});
```

**Inverter** - Inverts child result
```typescript
const inverter = new Inverter(blackboard, childNode);
```

**Repeater** - Repeats child N times
```typescript
const repeater = new Repeater(blackboard, childNode, 5);
```

**RandomSelector** - Randomly selects child
```typescript
const random = new RandomSelector(blackboard, children);
```

### Node Status

- `SUCCESS` - Node completed successfully
- `FAILURE` - Node failed
- `RUNNING` - Node still running

## NPC Schedules

### Activity Types

- `SLEEP` - Night time (22:00 - 06:00)
- `WORK` - Day time (08:00 - 18:00)
- `EAT` - Meal times (06:00-08:00, 12:00-13:00, 20:00-22:00)
- `SOCIALIZE` - Evening (18:00 - 20:00)
- `WANDER` - Free time
- `IDLE` - No activity

### Default Schedules

**Villager:**
- 00:00-06:00: Sleep
- 06:00-08:00: Eat
- 08:00-12:00: Work
- 12:00-13:00: Eat
- 13:00-18:00: Work
- 18:00-20:00: Socialize
- 20:00-22:00: Eat
- 22:00-24:00: Sleep

**Merchant:**
- 07:00-08:00: Setup shop
- 08:00-18:00: Open shop
- 18:00-19:00: Close shop

**Guard:**
- 07:00-19:00: Patrol

### Time System

```typescript
const scheduleSystem = new ScheduleSystem();
scheduleSystem.updateTime(deltaTime, 60); // 1 real second = 1 game minute

const currentTime = scheduleSystem.getCurrentTime(); // 0-24
const isNight = scheduleSystem.isNight();
const activity = scheduleSystem.getCurrentActivity('villager');
```

## Wildlife System

### Wildlife Types

- **Deer** - Prey, grazes, flees from player
- **Rabbit** - Prey, small, fast
- **Wolf** - Predator, hunts in packs
- **Bear** - Predator, large, slow

### Behaviors

- **GRAZE** - Eat grass (prey, low alertness)
- **WANDER** - Random movement
- **FLEE** - Run from player (prey, high alertness)
- **HUNT** - Chase player (predator, high alertness)
- **SLEEP** - Night time behavior

### Alertness System

```typescript
// Alertness increases when player is nearby
if (distanceToPlayer < 20) {
  alertness += deltaTime * 0.5;
} else {
  alertness -= deltaTime * 0.2;
}

// Behavior changes based on alertness
if (alertness > 0.5 && isPrey) {
  behavior = WildlifeBehavior.FLEE;
}
```

### Weather Reactions

```typescript
// Animals slow down in bad weather
if (weather === 'storm' || weather === 'snow') {
  speed *= 0.7;
}
```

### Spawning Herds

```typescript
wildlifeSystem.spawnHerd(WildlifeType.DEER, centerX, centerZ, 10);
wildlifeSystem.spawnHerd(WildlifeType.WOLF, centerX, centerZ, 3);
```

## Faction System

### Factions

- **Villagers** - Local population
- **Merchants** - Traders and shopkeepers
- **Guards** - Law enforcement
- **Bandits** - Hostile by default (-50 reputation)

### Reputation System

```typescript
// Modify reputation
factionSystem.modifyReputation(FactionType.VILLAGERS, 10);

// Get reputation (-100 to 100)
const rep = factionSystem.getReputation(FactionType.VILLAGERS);

// Get relation
const relation = factionSystem.getFactionRelation(FactionType.VILLAGERS);
// Returns: 'hostile' | 'neutral' | 'friendly'
```

### Relation Thresholds

- **Hostile**: reputation < -30
- **Neutral**: -30 <= reputation <= 30
- **Friendly**: reputation > 30

## Dynamic Events

### Event Types

- **Bandit Raid** - Hostile NPCs attack settlement
- **Merchant Caravan** - Traders arrive with goods
- **Wolf Attack** - Wildlife attacks NPCs
- **Festival** - Celebration event

### Event Lifecycle

```typescript
// Events spawn automatically every 5-10 minutes
eventSystem.update(deltaTime, playerPosition);

// Get active events
const activeEvents = eventSystem.getActiveEvents();

// Events expire after duration (60 seconds)
```

### Event Structure

```typescript
interface GameEvent {
  id: string;
  type: EventType;
  location: { x: number; z: number };
  startTime: number;
  duration: number;
  active: boolean;
}
```

## AI LOD System

### LOD Levels

- **FULL** (0-50m) - Full behavior tree, pathfinding, animations
- **REDUCED** (50-150m) - Simplified behavior, no pathfinding
- **STATISTICAL** (150-300m) - No AI, just position updates

### Distance Thresholds

```typescript
const lodManager = new AILodManager();
const lodLevel = lodManager.getLodLevel(distance);

// Custom thresholds
lodManager.setDistances(30, 100, 200);
```

## Time-Sliced Updates

### Budget

- **Target**: 1.5ms per frame
- **Priority-based**: Higher priority entities update first
- **Graceful degradation**: Low priority entities skipped if over budget

### Usage

```typescript
const scheduler = new AIUpdateScheduler();
scheduler.setBudget(1.5); // 1.5ms

// Register entities with priority
scheduler.registerEntity('npc_1', updateFn, 10); // High priority
scheduler.registerEntity('npc_2', updateFn, 5);  // Medium priority
scheduler.registerEntity('npc_3', updateFn, 1);  // Low priority

// Update (respects budget)
const result = scheduler.update(deltaTime);
// { updated: 50, skipped: 10, timeUsed: 1.3 }
```

## Integration

### Complete Setup

```typescript
const aiSystem = new AISystem(scene);
await aiSystem.init();

// Generate navmesh for terrain
aiSystem.generateChunkNavMesh(chunkData, offsetX, offsetZ);

// Spawn NPCs
aiSystem.addNPC({
  id: 'npc_1',
  type: 'villager',
  position: { x: 0, y: 0, z: 0 },
  homeLocation: { x: 0, z: 0 },
  workLocation: { x: 10, z: 10 },
  speed: 2,
});

// Spawn wildlife
aiSystem.spawnWildlifeHerd(WildlifeType.DEER, 50, 50, 10);

// Update each frame
aiSystem.update(deltaTime);

// Set player position for AI reactions
aiSystem.setPlayerPosition(player.position);

// Set weather for wildlife reactions
aiSystem.setWeather('rain');
```

### Streaming Integration

```typescript
// In CellContentProvider
async generateContent(chunkX, chunkZ, chunkData) {
  // Generate navmesh
  aiSystem.generateChunkNavMesh(chunkData, offsetX, offsetZ);
  
  // Spawn NPCs in settlements
  if (hasSettlement(chunkX, chunkZ)) {
    aiSystem.spawnVillageNPCs(centerX, centerZ, 20);
  }
  
  // Spawn wildlife
  if (biome === 'forest') {
    aiSystem.spawnWildlifeHerd(WildlifeType.DEER, centerX, centerZ, 5);
  }
}

disposeContent(chunkX, chunkZ) {
  aiSystem.removeChunkNavMesh(chunkX, chunkZ);
}
```

## Performance

### Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Total AI update | 1.5ms | Time-sliced |
| NavMesh queries | 0.3ms | Per frame |
| NPC updates | 0.5ms | Time-sliced |
| Wildlife updates | 0.3ms | Time-sliced |
| Event updates | 0.1ms | Per frame |

### Optimizations

- **Time-sliced updates**: Stay within 1.5ms budget
- **AI LOD**: Reduce updates for distant entities
- **Priority scheduling**: Important entities update first
- **Chunk-based navmesh**: Only generate for loaded chunks
- **Lazy initialization**: Only create behavior trees when needed

## Testing

### Unit Tests

```bash
npm test tests/ai.test.ts
```

**Coverage:**
- ✅ Schedule logic (time progression, activities)
- ✅ Behavior tree execution (sequence, selector, actions)
- ✅ AI LOD levels (distance-based)
- ✅ Time-sliced updates (budget enforcement)
- ✅ Faction reputation (modify, clamp, relations)
- ✅ Event system (spawn, expire, active tracking)
- ✅ Determinism (same inputs = same outputs)

### Manual Testing

**Test Area:**
1. Run `npm run dev`
2. Navigate to Briarhollow village
3. Watch for full in-game day (24 minutes real time)

**Test Checklist:**
- [ ] NPCs follow schedules (work during day, sleep at night)
- [ ] NPCs move smoothly (no jitter)
- [ ] NPCs path correctly (no stuck points)
- [ ] Wildlife reacts to player (flee/graze)
- [ ] Wildlife reacts to weather (slow in storms)
- [ ] Events spawn periodically
- [ ] No frame drops during AI updates
- [ ] AI stays within 1.5ms budget

## Known Limitations

1. **No worker-based navmesh** - Currently on main thread (future optimization)
2. **Simple behavior trees** - Complex behaviors need more nodes
3. **No crowd simulation** - NPCs don't avoid each other
4. **Limited wildlife AI** - No pack hunting, migration
5. **No persistent events** - Events don't save/load

## Future Improvements

- [ ] Worker-based navmesh generation
- [ ] Crowd simulation for NPCs
- [ ] More complex behavior trees
- [ ] Wildlife migration patterns
- [ ] Persistent event system
- [ ] NPC dialogue system
- [ ] Quest integration
- [ ] Memory system for NPCs
- [ ] Emotional state system
- [ ] Dynamic weather reactions

## Files

- `src/engine/ai/AISystem.ts` - Main orchestrator
- `src/engine/ai/NavMeshSystem.ts` - Navigation meshes
- `src/engine/ai/BehaviorTree.ts` - Behavior tree nodes
- `src/engine/ai/ScheduleSystem.ts` - NPC schedules
- `src/engine/ai/NPCSystem.ts` - NPC management
- `src/engine/ai/WildlifeSystem.ts` - Wildlife AI
- `src/engine/ai/FactionEventSystem.ts` - Factions and events
- `src/engine/ai/AILodManager.ts` - LOD and scheduling
- `tests/ai.test.ts` - Unit tests
