# Character System

## Overview

The character system provides rigged characters with GPU skinning, animation state machine with blending, LOD, foot IK, instanced crowds, and horse mounting. It integrates with the movement system (MOVEMENT.md) and uses CC0 assets when available, falling back to procedural generation.

## Architecture

```
CharacterSystem (orchestrator)
├── AnimationStateMachine (state-based animation with blending)
├── MountSystem (mount/dismount logic)
├── RiderCamera (camera mode for mounted characters)
├── Horse (horse character with gaits)
├── CrowdSystem (instanced distant NPCs)
└── ProceduralHumanoid (fallback character)
```

## Character Assets

### CC0 Sources (Preferred)

When network allows, use these CC0 sources:

| Source | URL | License | Notes |
|--------|-----|---------|-------|
| Quaternius | https://quaternius.com | CC0 | Low-poly characters, animals |
| Kenney | https://kenney.nl | CC0 | Game assets, characters |

**NOT ALLOWED:**
- Mixamo (license is NOT CC0)

### Fallback: Procedural Humanoid

When CC0 assets unavailable, use procedural low-poly humanoid:

```typescript
import { createProceduralHumanoid } from './engine/characters/ProceduralHumanoid.js';

const { mesh, skeleton, bones } = createProceduralHumanoid();
scene.add(mesh);
```

**Features:**
- Low-poly (~500 triangles)
- 11-bone skeleton
- GPU skinning support
- Code-driven animation

## Animation State Machine

### Integration with Movement States

The animation state machine is tied to MOVEMENT.md states:

| Movement State | Animation | Duration | Loop |
|----------------|-----------|----------|------|
| IDLE | idle | 2.0s | Yes |
| WALK | walk | 1.0s | Yes |
| SPRINT | sprint | 0.6s | Yes |
| JUMP | jump | 0.8s | No |
| FALL | fall | 0.5s | Yes |
| STEEP_SLOPE_SLIDE | slide | 1.0s | Yes |
| SWIM | swim | 1.5s | Yes |
| DODGE | dodge | 0.5s | No |
| MOUNT | mount | 1.0s | No |

### Blending

Transitions between states use smooth blending:

```typescript
const animSM = new AnimationStateMachine();

// Update with movement state
animSM.update(deltaTime, movementState);

// Get blend weights
const weights = animSM.getBlendWeights();
// { current: 0.7, previous: 0.3 }

// Validate weights sum to 1
animSM.validateBlendWeights(); // true
```

**Blend Durations:**
- Fast transitions (combat): 0.1s
- Medium transitions (movement): 0.2s
- Slow transitions (state changes): 0.3-0.4s

### Animation LOD

Animation quality scales with distance:

| Distance | LOD | Animation Quality |
|----------|-----|-------------------|
| 0-50m | 0 | Full skeleton, all bones |
| 50-150m | 1 | Reduced bones, simplified |
| 150-500m | 2 | Billboard, no animation |

## GPU Skinning

### Implementation

```typescript
// Create skinned mesh
const geometry = createHumanoidGeometry();
const skeleton = new THREE.Skeleton(bones);
const material = new THREE.MeshStandardMaterial({ skinning: true });

const mesh = new THREE.SkinnedMesh(geometry, material);
mesh.add(skeleton.bones[0]);
mesh.bind(skeleton);
```

### Bone Structure

```
root
├── spine
│   ├── head
│   ├── leftUpperArm
│   │   └── leftLowerArm
│   └── rightUpperArm
│       └── rightLowerArm
├── leftUpperLeg
│   └── leftLowerLeg
└── rightUpperLeg
    └── rightLowerLeg
```

### Applying Poses

```typescript
import { applyPose, resetToTPose } from './engine/characters/ProceduralHumanoid.js';

// Apply custom pose
applyPose(bones, {
  leftUpperArm: { rotation: new THREE.Euler(0, 0, Math.PI / 4) },
  rightUpperArm: { rotation: new THREE.Euler(0, 0, -Math.PI / 4) },
});

// Reset to T-pose
resetToTPose(bones);
```

## Foot IK

### Implementation

Simple foot IK for ground alignment:

```typescript
// Raycast down from foot
const ray = new THREE.Ray(footPosition, { x: 0, y: -1, z: 0 });
const hit = physicsWorld.castRay(ray, 1.0);

if (hit) {
  // Adjust foot position
  footPosition.y = hit.position.y;
  
  // Adjust leg bend
  const legBend = calculateLegBend(hipPosition, footPosition);
  applyLegBend(legBend);
}
```

**Performance:**
- Only for nearby characters (< 50m)
- Disabled for LOD 1+
- Cost: ~0.1ms per character

## Horse System

### Gaits

| Gait | Speed | Animation | Use Case |
|------|-------|-----------|----------|
| IDLE | 0 m/s | Standing | Not moving |
| WALK | 2 m/s | 4-beat | Slow movement |
| TROT | 5 m/s | 2-beat | Medium speed |
| GALLOP | 12 m/s | 4-beat | Fast speed |

### Horse Controls

```typescript
const horse = new Horse();

// Update with input
horse.update(deltaTime, {
  moveX: input.x,
  moveZ: input.z,
  sprint: input.sprint,
});

// Get state
const state = horse.getState();
// { position, rotation, gait, isMounted }
```

### Mount/Dismount

```typescript
import { MountSystem } from './engine/characters/MountSystem.js';

const mountSystem = new MountSystem();

// Try to mount nearest horse
const mounted = mountSystem.tryMount(horses, playerPosition);

// Dismount
mountSystem.tryDismount();

// Check state
const state = mountSystem.getMountState();
// MountState.DISMOUNTED | MOUNTING | MOUNTED | DISMOUNTING
```

### Rider Camera

```typescript
import { RiderCamera } from './engine/characters/RiderCamera.js';

const riderCamera = new RiderCamera(camera);

// Activate when mounted
riderCamera.activate(riderPosition, horseRotation);

// Update each frame
riderCamera.update(deltaTime, riderPosition, horseRotation, horseVelocity);

// Deactivate when dismounted
riderCamera.deactivate();
```

**Configuration:**
```typescript
const config = {
  distance: 4.0,           // Distance from rider
  height: 2.0,             // Height offset
  lookAheadDistance: 2.0,  // Look-ahead for turns
  smoothing: 0.15,         // Camera smoothing
  turnSmoothing: 0.1,      // Turn smoothing
};
```

## Crowd System

### Instanced Rendering

For distant NPCs, use instanced rendering:

```typescript
import { CrowdSystem, createCrowdGeometry, createCrowdMaterial } from './engine/characters/CrowdSystem.js';

const crowd = new CrowdSystem({
  maxMembers: 100,
  spawnRadius: 50.0,
});

// Initialize with geometry
const geometry = createCrowdGeometry();
const material = createCrowdMaterial();
crowd.initialize(geometry, material);

// Spawn crowd
crowd.spawnCrowd(centerPosition, 50);

// Update animation
crowd.update(deltaTime);

// Add to scene
scene.add(crowd.getInstancedMesh());
```

### Performance

| Metric | Value |
|--------|-------|
| Max members | 100 |
| Triangles per member | ~200 |
| Total triangles | ~20,000 |
| Draw calls | 1 (instanced) |
| Animation cost | ~0.2ms |

### Crowd Types

- **Villager**: Default, neutral appearance
- **Soldier**: Armor, weapons
- **Merchant**: Carrying goods

## Integration with Movement System

### Character State Flow

```
Movement State → Animation State Machine → Animation Blending → GPU Skinning
      ↓                    ↓                       ↓                  ↓
  Physics            Clip Selection          Weight Calc         Bone Update
```

### Example Integration

```typescript
// In game loop
const movementState = characterStateMachine.getState();
characterSystem.update(deltaTime, movementState, input);

// Character system handles:
// 1. Animation state machine update
// 2. Mount/dismount logic
// 3. Horse control (if mounted)
// 4. Camera mode switching
// 5. Crowd updates
```

## Testing

### Animation State Machine Tests

```bash
npm test tests/animation.test.ts
```

**Coverage:**
- ✅ State transitions
- ✅ Blend weights sum to 1.0
- ✅ Animation completion detection
- ✅ Looping vs non-looping
- ✅ Time advancement

### Manual Testing

**Test Checklist:**
- [ ] Walk animation blends smoothly
- [ ] Sprint animation is faster
- [ ] Jump animation plays once
- [ ] Mount/dismount transitions work
- [ ] Horse gaits switch correctly
- [ ] Rider camera follows smoothly
- [ ] Crowd animates efficiently
- [ ] No foot sliding
- [ ] No popping blends
- [ ] Horse turns are smooth

## Performance Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Animation update | 0.5ms | Per character |
| GPU skinning | 1.0ms | Per character |
| Foot IK | 0.1ms | Only nearby characters |
| Crowd update | 0.2ms | All members |
| Mount logic | 0.05ms | Per mount/dismount |

## Files

- `src/engine/characters/CharacterSystem.ts` - Main orchestrator
- `src/engine/characters/AnimationStateMachine.ts` - Animation states
- `src/engine/characters/ProceduralHumanoid.ts` - Fallback character
- `src/engine/characters/Horse.ts` - Horse with gaits
- `src/engine/characters/MountSystem.ts` - Mount/dismount
- `src/engine/characters/RiderCamera.ts` - Mounted camera
- `src/engine/characters/CrowdSystem.ts` - Instanced crowds
- `tests/animation.test.ts` - Animation tests

## License Logging

When using CC0 assets, log them in `docs/ASSETS.md`:

```markdown
### [Asset Name]
- **Source:** [URL]
- **License:** CC0
- **Used in:** [file or feature]
- **Modified:** [yes/no]
```

## Future Improvements

- [ ] More animation states (attack, cast, interact)
- [ ] Facial animation / lip sync
- [ ] Cloth simulation
- [ ] Hair physics
- [ ] More horse breeds
- [ ] Vehicle mounting (cars, boats)
- [ ] Animation retargeting
- [ ] Motion matching
