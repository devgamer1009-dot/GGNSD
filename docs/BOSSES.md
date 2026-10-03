# Boss System Documentation

## Overview

The boss system provides a complete multi-phase boss fight framework with telegraphed attacks, arena management, cinematic camera tracks, and phase transitions. Currently implemented: **Thornmother** (Thornwood regional guardian).

## Architecture

```
Boss System
├── BossFramework (core phase management)
│   ├── Phase transitions
│   ├── Attack selection
│   ├── Health tracking
│   └── Arena rules
├── TelegraphSystem (attack warnings)
│   ├── Visual telegraphs
│   ├── Timing management
│   └── Player detection
├── ArenaSystem (fight area)
│   ├── Boundary enforcement
│   ├── Hazard zones
│   ├── Obstacles
│   └── Buff zones
├── CinematicCamera (cutscenes)
│   ├── Camera path interpolation
│   ├── Dialogue timing
│   └── Music cues
└── Boss Implementations
    └── Thornmother (3 phases, 9 attacks)
```

## Core Components

### BossFramework

The core boss management system handling phases, attacks, and state.

**Key Features:**
- Multi-phase support with health thresholds
- Weighted attack selection based on priority
- Cooldown management
- Phase transition callbacks
- Arena rule updates per phase

**Usage:**
```typescript
const framework = new BossFramework(phases, maxHealth);
framework.start();

// Update each frame
const action = framework.update(deltaTime, playerPosition);

// Apply damage
const defeated = framework.takeDamage(100);
```

**Phase Structure:**
```typescript
interface BossPhase {
  id: string;
  name: string;
  healthThreshold: number; // 0-100 percentage
  attacks: BossAttack[];
  phaseTransition?: CinematicTrack;
  arenaRules?: ArenaRule[];
  musicTrack?: string;
  dialogue?: string[];
}
```

### TelegraphSystem

Manages attack warnings with visual and audio feedback.

**Key Features:**
- Configurable telegraph duration
- Visual indicators (colored circles on ground)
- Hitbox delay after telegraph
- Player detection within telegraph area

**Usage:**
```typescript
const telegraphSystem = new TelegraphSystem(scene);

// Create telegraph for attack
const id = telegraphSystem.createTelegraph(attack, position, radius);

// Update each frame
const events = telegraphSystem.update(currentTime);

// Check if player is in telegraph
const isInTelegraph = telegraphSystem.isPlayerInTelegraph(playerPos, id);
```

**Telegraph Structure:**
```typescript
interface Telegraph {
  duration: number; // seconds of warning
  visual: string; // effect name
  audio: string; // sound name
  hitboxDelay: number; // delay before actual hit
  color?: string; // telegraph color
}
```

### ArenaSystem

Manages the boss fight arena with boundaries and hazards.

**Key Features:**
- Circular boundary enforcement
- Hazard zones (damage areas)
- Obstacles (collision objects)
- Buff zones (healing/power areas)
- Dynamic rule updates per phase

**Usage:**
```typescript
const arenaSystem = new ArenaSystem(scene, {
  center: new THREE.Vector3(0, 0, 0),
  radius: 30,
  height: 20,
  rules: arenaRules,
});

// Check if player is in arena
const inArena = arenaSystem.isWithinBoundary(playerPos);

// Constrain player to arena
const constrainedPos = arenaSystem.constrainToArena(playerPos);

// Check hazards
const { inHazard, damage } = arenaSystem.isInHazard(playerPos);
```

**Arena Rules:**
```typescript
interface ArenaRule {
  type: 'boundary' | 'hazard' | 'obstacle' | 'buff_zone';
  position?: THREE.Vector3;
  radius?: number;
  damage?: number;
  effect?: string;
}
```

### CinematicCamera

Handles cinematic camera tracks for boss intros and phase transitions.

**Key Features:**
- Keyframe-based camera paths
- Smooth interpolation with easing
- Dialogue timing
- FOV animation
- Completion callbacks

**Usage:**
```typescript
const cinematicCamera = new CinematicCamera(camera);

// Play cinematic track
cinematicCamera.play(track, () => {
  console.log('Cinematic complete');
});

// Update each frame
cinematicCamera.update(currentTime);
```

**Cinematic Track:**
```typescript
interface CinematicTrack {
  duration: number;
  cameraPath: CameraKeyframe[];
  dialogue?: string[];
  musicCue?: string;
}

interface CameraKeyframe {
  time: number; // 0-1 progress
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
}
```

## Thornmother Boss

The Thornmother is the regional guardian of Thornwood, an ancient fey creature who commands the forest itself.

### Boss Data

**Location:** Thornmother's Grove (-1400, 0, -1000)  
**Level:** 15  
**Health:** 1500  
**Phases:** 3

### Phase 1: Nature's Wrath (100% - 66% health)

**Attacks:**
1. **Vine Whip** (Priority: 10)
   - Type: Melee
   - Range: 8m
   - Damage: 25
   - Telegraph: 1.5s (green)
   - Cooldown: 4s

2. **Root Slam** (Priority: 5)
   - Type: AoE
   - Area: 10m
   - Damage: 40
   - Telegraph: 2.0s (brown)
   - Cooldown: 8s

3. **Spore Cloud** (Priority: 7)
   - Type: Ranged
   - Range: 20m
   - Projectiles: 5
   - Damage: 15
   - Telegraph: 1.8s (light green)
   - Cooldown: 6s

**Arena:** Standard circular arena (30m radius)

### Phase 2: Fey Magic (66% - 33% health)

**New Attacks:**
1. **Illusion Duplicates** (Priority: 6)
   - Type: Summon
   - Summons: 3 duplicates
   - Duration: 10s
   - Damage: 20
   - Telegraph: 2.5s (purple)
   - Cooldown: 12s
   - **Only below 66% health**

2. **Fey Enchantment** (Priority: 8)
   - Type: Ranged
   - Range: 25m
   - Damage: 30
   - Telegraph: 2.0s (light purple)
   - Cooldown: 10s
   - **Only below 66% health**

3. **Teleport Strike** (Priority: 9)
   - Type: Melee
   - Range: 5m
   - Damage: 35
   - Telegraph: 1.0s (purple)
   - Cooldown: 7s
   - **Only below 66% health**

**Arena:** Adds 2 rot pool hazards (5m radius, 10 damage)

**Transition Cinematic:** 3s camera orbit with dialogue

### Phase 3: Corruption Unleashed (33% - 0% health)

**New Attacks:**
1. **Rot Tendrils** (Priority: 10)
   - Type: AoE (lingering)
   - Area: 15m
   - Duration: 5s
   - Damage: 35
   - Telegraph: 2.5s (dark green)
   - Cooldown: 8s
   - **Only below 33% health**

2. **Blight Explosion** (Priority: 5)
   - Type: AoE (arena-wide)
   - Area: 25m (entire arena)
   - Damage: 60
   - Telegraph: 3.0s (dark purple)
   - Cooldown: 15s
   - **Only below 33% health**

3. **Nature's Final Stand** (Priority: 12)
   - Type: Melee
   - Range: 10m
   - Damage: 45
   - Telegraph: 2.0s (dark red)
   - Cooldown: 6s
   - **Only below 33% health**

**Arena:** Smaller arena (20m radius), 3 rot pool hazards (6m radius, 15 damage)

**Transition Cinematic:** 4s dramatic camera movement with dialogue

### Loot Table

| Item | Chance | Quantity |
|------|--------|----------|
| Root Shard | 100% | 1 |
| Thornmother's Staff | 50% | 1 |
| Fey Essence | 80% | 2-4 |
| Ancient Bark | 100% | 3-5 |
| Gold | 100% | 200-300 |

## Attack Patterns

### Melee Attacks
- **Range:** 5-10m
- **Telegraph:** Colored circle at player position
- **Hitbox:** Activates after telegraph delay
- **Damage:** Single target

### Ranged Attacks
- **Range:** 15-25m
- **Telegraph:** Small circles at impact points
- **Projectiles:** 1-5 projectiles
- **Damage:** Single target per projectile

### AoE Attacks
- **Area:** 10-25m radius
- **Telegraph:** Large circle showing area
- **Hitbox:** Entire area after delay
- **Damage:** All players in area

### Summon Attacks
- **Summons:** 1-3 entities
- **Duration:** 5-15s
- **Telegraph:** Special visual effect
- **Behavior:** Summons attack independently

## Design Principles

### Telegraph Timing

**Short Telegraphs (1.0-1.5s):**
- Fast attacks (vine whip, teleport strike)
- Require quick reactions
- High priority attacks

**Medium Telegraphs (1.5-2.5s):**
- Standard attacks (root slam, spore cloud)
- Balance between reaction time and difficulty
- Medium priority attacks

**Long Telegraphs (2.5-3.0s):**
- Dangerous attacks (blight explosion, rot tendrils)
- Give players time to position
- High damage or large area

### Attack Selection

**Priority System:**
- Higher priority = more likely to be selected
- Weighted random selection
- Cooldowns prevent spam
- Health restrictions gate powerful attacks

**Phase Progression:**
- Phase 1: Basic attacks, learn patterns
- Phase 2: Add complexity (summons, teleport)
- Phase 3: Desperation moves, high damage

### Arena Design

**Phase 1:** Open arena, learn movement
**Phase 2:** Add hazards, restrict safe zones
**Phase 3:** Smaller arena, more hazards, high tension

## Testing

### Unit Tests

```bash
npm test tests/bosses.test.ts
```

**Coverage:**
- ✅ Phase transitions (health thresholds)
- ✅ Attack selection (priority, cooldowns, restrictions)
- ✅ Telegraph timing (duration, hitbox activation)
- ✅ Arena boundaries (constraining, hazards)
- ✅ Damage and defeat logic

### Manual Testing

**Test Scenario:**
1. Enter Thornmother's Grove
2. Trigger boss intro cinematic
3. Fight through all 3 phases
4. Observe telegraphs and dodge attacks
5. Defeat boss and receive loot

**What to Check:**
- [ ] Phase transitions trigger at correct health
- [ ] Telegraphs are visible and readable
- [ ] Attacks deal correct damage
- [ ] Arena boundaries work correctly
- [ ] Hazards damage player
- [ ] Cinematic cameras play correctly
- [ ] Boss defeats at 0 health
- [ ] Loot drops correctly

## Integration

### Basic Integration

```typescript
import { Thornmother } from './engine/bosses/Thornmother.js';

// Create boss
const boss = new Thornmother(scene, camera, bossPosition);

// Setup callbacks
boss.setOnStateChange((state) => {
  console.log('Boss state:', state);
});

boss.setOnDamage((damage) => {
  console.log('Boss took damage:', damage);
});

boss.setOnLoot((loot) => {
  console.log('Boss dropped loot:', loot);
});

// Start fight
boss.startFight();

// Update each frame
boss.update(deltaTime, playerPosition, currentTime);

// Apply damage
boss.takeDamage(100);
```

### With Combat System

```typescript
// In combat update loop
if (boss.getState() === BossState.FIGHTING) {
  const action = boss.update(deltaTime, playerPosition, currentTime);
  
  if (action) {
    // Create telegraph
    telegraphSystem.createTelegraph(
      action.attack,
      playerPosition,
      action.attack.pattern.areaOfEffect || 5
    );
  }
}

// Check telegraph hits
const events = telegraphSystem.update(currentTime);
for (const event of events) {
  if (event.type === 'hitbox_active') {
    if (telegraphSystem.isPlayerInTelegraph(playerPosition, event.telegraphId)) {
      player.takeDamage(event.attack.damage);
    }
  }
}
```

### With Arena System

```typescript
// Constrain player to arena
if (!boss.isPlayerInArena(playerPosition)) {
  playerPosition = arenaSystem.constrainToArena(playerPosition);
}

// Check hazards
const { inHazard, damage } = boss.isPlayerInHazard(playerPosition);
if (inHazard) {
  player.takeDamage(damage * deltaTime);
}
```

## Performance

### Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Boss AI update | < 0.5ms | Phase logic, attack selection |
| Telegraph update | < 0.2ms | Per active telegraph |
| Arena checks | < 0.1ms | Boundary, hazard, obstacle |
| Cinematic update | < 0.3ms | Camera interpolation |

### Optimization

- Telegraph meshes use simple geometry (rings, circles)
- Arena checks use distance calculations (no raycasting)
- Cinematic camera uses linear interpolation
- Attack selection uses weighted random (O(n))

## Known Limitations

1. **No multiplayer support** - Single player only
2. **No attack animations** - Telegraphs only, no boss animations
3. **No sound effects** - Audio system not integrated
4. **No particle effects** - Visual telegraphs only
5. **No death animations** - Instant defeat

## Future Improvements

- [ ] Boss animations (attack, phase transition, defeat)
- [ ] Particle effects for telegraphs
- [ ] Sound effect integration
- [ ] Multiplayer boss fights
- [ ] More boss types (dragon, etc.)
- [ ] Boss health bars UI
- [ ] Attack pattern learning (AI adaptation)
- [ ] Cooperative mechanics (multi-player roles)
- [ ] Boss achievements
- [ ] Replay system (boss fight recordings)

## Files

- `src/engine/bosses/BossFramework.ts` - Core boss logic
- `src/engine/bosses/TelegraphSystem.ts` - Attack warnings
- `src/engine/bosses/ArenaSystem.ts` - Arena management
- `src/engine/bosses/CinematicCamera.ts` - Camera tracks
- `src/engine/bosses/Thornmother.ts` - Boss implementation
- `src/content/bosses/thornmother.ts` - Boss data
- `src/engine/bosses/index.ts` - Module exports
- `tests/bosses.test.ts` - Unit tests
