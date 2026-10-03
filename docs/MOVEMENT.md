# Movement System

## Overview

The movement system implements a character state machine with physics-based movement using Rapier. It supports multiple movement states, slope detection, water swimming, and is designed for easy extension (climb, glide, mount).

## Architecture

```
Input System → Character State Machine → Physics World → Camera System
     ↓                    ↓                    ↓              ↓
  Actions            State Logic         Collisions      Follow/Lock-on
```

## Character States

| State | Description | Entry Conditions | Exit Conditions |
|-------|-------------|------------------|-----------------|
| **IDLE** | Standing still | Default, landed | Moving, jumping, falling, swimming, dodging |
| **WALK** | Normal movement | Moving + grounded | Stop, sprint, jump, fall, swim, dodge |
| **SPRINT** | Fast movement | Sprint + grounded | Stop, walk, jump, fall, swim, dodge |
| **JUMP** | Upward movement | Jump + grounded | Falling, landing, swimming |
| **FALL** | Downward movement | Not grounded | Landing, swimming, steep slope |
| **STEEP_SLOPE_SLIDE** | Sliding on steep slopes | Grounded + slope > 45° | Gentle slope, falling, swimming |
| **SWIM** | Underwater movement | In water | Leave water |
| **DODGE** | Quick evasive movement | Dodge input + cooldown ready | Dodge complete |

### Future States (Designed for Extension)

- **CLIMB** - Climbing walls/ledges
- **GLIDE** - Gliding through air
- **MOUNT** - Mounting horses/vehicles

## State Transition Table

```
FROM → TO                  | IDLE | WALK | SPRINT | JUMP | FALL | SLIDE | SWIM | DODGE
---------------------------|------|------|--------|------|------|-------|------|------
IDLE                       |  -   |  ✓   |   ✓    |  ✓   |  ✓   |   -   |  ✓   |  ✓
WALK                       |  ✓   |  -   |   ✓    |  ✓   |  ✓   |   -   |  ✓   |  ✓
SPRINT                     |  ✓   |  ✓   |   -    |  ✓   |  ✓   |   -   |  ✓   |  ✓
JUMP                       |  ✓   |  ✓   |   -    |  -   |  ✓   |   -   |  ✓   |  -
FALL                       |  ✓   |  ✓   |   ✓    |  -   |  -   |   ✓   |  ✓   |  -
STEEP_SLOPE_SLIDE          |  ✓   |  ✓   |   -    |  -   |  ✓   |   -   |  ✓   |  -
SWIM                       |  ✓   |  ✓   |   -    |  -   |  ✓   |   -   |  -   |  -
DODGE                      |  ✓   |  ✓   |   -    |  -   |  ✓   |   -   |  -   |  -
```

## Physics Integration

### Rapier Configuration

- **Gravity**: (0, -9.81, 0) m/s²
- **Character Collider**: Capsule (height: 1.8m, radius: 0.3m)
- **Terrain Colliders**: Heightfield from terrain chunks
- **Fixed Timestep**: 1/60s for stability

### Character Controller

```typescript
// Create character
const character = physicsWorld.createCharacter('player', {
  x: 0, y: 10, z: 0
}, 1.8, 0.3);

// Apply movement
physicsWorld.applyMovement('player', {
  x: moveX * speed,
  y: 0,
  z: moveZ * speed
});

// Apply jump
physicsWorld.applyJump('player', 5.0);
```

### Terrain Colliders

Terrain chunks are converted to Rapier heightfield colliders:

```typescript
// Create terrain collider from chunk
physicsWorld.createTerrainCollider(
  'chunk_0_0',
  chunkData,
  { x: worldOffsetX, z: worldOffsetZ }
);
```

## Third-Person Camera

### Features

- **Orbit**: Mouse-controlled rotation around character
- **Collision**: Prevents camera from clipping through terrain
- **Lock-on**: Target specific enemies/NPCs
- **Smooth Follow**: Interpolated camera movement

### Configuration

```typescript
const cameraConfig = {
  distance: 5.0,        // Distance from character
  height: 2.0,          // Height offset
  minDistance: 2.0,     // Minimum zoom
  maxDistance: 10.0,    // Maximum zoom
  minPitch: -0.5,       // Minimum vertical angle
  maxPitch: 1.2,        // Maximum vertical angle
  sensitivity: 0.002,   // Mouse sensitivity
  smoothing: 0.1,       // Follow smoothing
};
```

### Lock-on System

```typescript
// Lock on to target
camera.toggleLockOn(targetCharacter);

// Check if locked on
if (camera.isLockOnActive()) {
  // Camera follows target
}
```

## Debug Visualization

Press **F4** to toggle physics debug view:

- **Green lines**: Static colliders (terrain)
- **Red lines**: Dynamic colliders (characters)
- **State overlay**: Current state, velocity, grounded status

### Debug UI

```
Character State:
State: walk
Previous: idle
Time: 1.23s

Physics:
ID: player
Pos: (10.5, 2.3, -5.2)
Vel: (1.2, 0.0, -0.8)
Grounded: true
Slope: 12.5°
```

## Input Mapping

| Action | Default Key | State Effect |
|--------|-------------|--------------|
| Move Forward | W | → WALK/SPRINT |
| Move Backward | S | → WALK/SPRINT |
| Move Left | A | → WALK/SPRINT |
| Move Right | D | → WALK/SPRINT |
| Sprint | Shift | → SPRINT |
| Jump | Space | → JUMP |
| Dodge | Ctrl | → DODGE |
| Lock-on | Tab | Toggle lock-on |
| Camera Orbit | Mouse | Rotate camera |
| Camera Zoom | Scroll | Adjust distance |

## Slope Handling

### Slope Angle Detection

The system calculates slope angle from the terrain normal:

```typescript
const ray = new RAPIER.Ray(position, { x: 0, y: -1, z: 0 });
const hit = world.castRay(ray, 1.0, true);
if (hit) {
  const normal = hit.normal;
  const slopeAngle = Math.acos(normal.y) * (180 / Math.PI);
}
```

### Slope Thresholds

- **0-30°**: Normal walking
- **30-45°**: Reduced speed
- **>45°**: Automatic slide (STEEP_SLOPE_SLIDE state)

## Water Detection

Water is detected via collision with water volume colliders:

```typescript
// Check if character is in water
const isInWater = checkWaterCollision(character);
stateMachine.setInWater(isInWater);
```

## Performance

### Targets

- **Physics step**: < 2ms per frame
- **State machine**: < 0.1ms per frame
- **Camera update**: < 0.5ms per frame
- **Debug render**: < 1ms per frame (when enabled)

### Optimizations

- Fixed timestep physics (60Hz)
- Batched terrain collider updates
- Simplified slope calculation
- Conditional debug rendering

## Testing

### Unit Tests

```bash
npm test tests/movement.test.ts
```

**Coverage:**
- State transitions (all 8 states)
- Slope detection (gentle vs steep)
- Water state transitions
- Dodge mechanics
- State time tracking
- Previous state tracking

### Manual Testing

**Test Area** (`/test-area.html`):
- Slopes (15°, 30°, 45°, 60°)
- Steps (0.5m, 1m, 2m)
- Obstacles (walls, pillars)
- Water volumes
- Various surfaces

**Test Checklist:**
- [ ] Walk on flat ground
- [ ] Sprint on flat ground
- [ ] Jump and land
- [ ] Walk up gentle slope (30°)
- [ ] Slide on steep slope (60°)
- [ ] Enter/exit water
- [ ] Dodge left/right
- [ ] Lock-on to target
- [ ] Camera orbit
- [ ] Camera zoom
- [ ] No clipping through terrain
- [ ] No floaty movement
- [ ] No sticky controls

## Extending the System

### Adding New States

1. Add state to `CharacterState` enum
2. Add transitions in `setupTransitions()`
3. Implement state-specific logic
4. Update debug visualization

Example - Adding CLIMB state:

```typescript
// 1. Add to enum
export enum CharacterState {
  // ... existing states
  CLIMB = 'climb',
}

// 2. Add transitions
this.addTransition(CharacterState.IDLE, CharacterState.CLIMB, 
  () => this.isNearWall() && this.isClimbing());

// 3. Implement logic
private isNearWall(): boolean {
  // Raycast forward to detect wall
}

private isClimbing(): boolean {
  // Check input
}
```

### Adding New Physics Features

1. Extend `PhysicsWorld` class
2. Add new collider types
3. Update character controller
4. Test with debug visualization

## Known Limitations

- No dynamic terrain deformation
- Simplified slope calculation (no surface normal)
- No animation blending (state-based only)
- Lock-on requires manual target selection
- Water detection via collision (not volume)

## Future Improvements

- [ ] Animation state machine integration
- [ ] Inverse kinematics for foot placement
- [ ] Dynamic terrain destruction
- [ ] Surface material detection (ice, mud, etc.)
- [ ] Wall-running state
- [ ] Vaulting/climbing animations
- [ ] Swimming depth layers
- [ ] Underwater physics (buoyancy)
