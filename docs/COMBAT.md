# Combat System

## Overview

The combat system provides data-driven melee, ranged, and magical combat with combo chains, blocking, parrying, and visual feedback. All combat parameters are tunable via data files in `src/content/combat/`.

## Architecture

```
CombatSystem (orchestrator)
├── CombatState (health, stamina, stagger)
├── DamageSystem (damage calculation, modifiers)
├── InputBuffer (combo buffering)
├── HitDetection (sweep tests, raycasts)
├── SwordSystem (melee attacks, combos, block, parry)
├── BowSystem (ranged attacks, arrow physics)
├── SpellSystem (fire, frost, ward spells)
├── EnemyAI (telegraphed state machines)
└── VisualFeedback (hit-stop, camera shake, particles)
```

## Weapons

### Sword + Shield

**Stats:**
- Base Damage: 25
- Stamina Cost: 15 (light), 30 (heavy)
- Attack Speed: 1.2 attacks/sec
- Range: 2.5m
- Combo Window: 0.8s

**Combo System:**
- 3-hit light combo (1-2-3)
- 3rd hit becomes heavy attack
- Input buffering during recovery
- Combo multiplier: +10% per hit

**Timing Windows:**
- Light Attack: 0.2s windup, 0.15s active, 0.3s recovery
- Heavy Attack: 0.5s windup, 0.2s active, 0.5s recovery

**Block:**
- Damage reduction: 70%
- Stamina drain on hit
- No stamina regen while blocking

**Parry:**
- Window: 0.3s
- Stamina cost: 7.5 (half of light attack)
- Negates 100% damage
- Staggers attacker

### Bow

**Stats:**
- Base Damage: 30
- Stamina Cost: 20
- Attack Speed: 0.8 attacks/sec
- Range: 30m
- Arrow Speed: 50 m/s

**Aiming:**
- Hold to aim (up to 1.0s for full power)
- Damage scales with aim time
- Visual indicator shows aim progress

**Arrow Physics:**
- Projectiles with velocity
- Gravity affects trajectory
- Lifetime: 5 seconds
- Hit detection via raycast

### Spells

#### Fireball
- Mana Cost: 30
- Cooldown: 3.0s
- Damage: 40
- Radius: 3.0m
- Effect: Burn (DoT)
- Instant detonation

#### Frost Nova
- Mana Cost: 25
- Cooldown: 5.0s
- Damage: 20
- Radius: 5.0m
- Duration: 3.0s
- Effect: Slow (50% movement reduction)

#### Ward
- Mana Cost: 40
- Cooldown: 10.0s
- Duration: 5.0s
- Effect: Shield (absorbs damage)

## Combat Mechanics

### Stamina System

**Regeneration:**
- Rate: 20 per second
- No regen while staggered or blocking
- Caps at max stamina

**Consumption:**
- Light Attack: 15
- Heavy Attack: 30
- Block: 0 (passive)
- Parry: 7.5
- Bow Shot: 20
- Dodge: 20

**Exhaustion:**
- Cannot attack/dodge with < required stamina
- Visual indicator when low

### Stagger System

**Stagger Damage:**
- Applied on hit (50% of damage)
- Sword: 20 per hit
- Bow: 15 per hit
- Spells: varies

**Stagger Threshold:**
- Player: 60
- Swordsman: 60
- Archer: 40
- Brute: 100

**Staggered State:**
- Cannot act for 2 seconds
- No stamina regen
- Takes 1.5x damage
- Visual indicator (dazed animation)

**Decay:**
- Rate: 10 per second
- Stops when staggered

### Hit Detection

**Melee (Sword):**
- Sphere sweep test
- Radius: weapon range
- Distance: 2.0m forward
- Excludes attacker

**Ranged (Bow):**
- Raycast from arrow position
- Max distance: 1.0m per frame
- Excludes attacker

**Spells:**
- Distance check in radius
- Area of effect
- Excludes caster

### Damage Calculation

```typescript
finalDamage = baseDamage * comboMultiplier * critMultiplier * defenseMultiplier
```

**Modifiers:**
- Combo: +10% per hit (max +30%)
- Critical: 1.5x (10% chance)
- Block: 0.3x (70% reduction)
- Parry: 0x (100% negation)
- Staggered: 1.5x (vulnerable)

## Enemy AI

### Swordsman

**Behavior:**
- Aggro Range: 15m
- Attack Range: 3m
- Retreat at: 30% health
- Telegraph Time: 0.8s

**State Machine:**
```
IDLE → CHASE → TELEGRAPH → ATTACK → RECOVERY → CHASE
                ↓
            STAGGERED (2s)
```

**Attack Pattern:**
- 2-3 hit combos
- Occasional heavy attack
- Blocks player attacks (30% chance)

### Archer

**Behavior:**
- Aggro Range: 25m
- Attack Range: 20m
- Retreat at: 40% health
- Telegraph Time: 1.2s

**State Machine:**
```
IDLE → CHASE → TELEGRAPH → ATTACK → RECOVERY → RETREAT
                                              ↓
                                          STAGGERED
```

**Attack Pattern:**
- Keeps distance (15-20m)
- Aimed shots (1.2s telegraph)
- Retreats when player approaches

### Brute

**Behavior:**
- Aggro Range: 12m
- Attack Range: 4m
- Retreat at: 20% health
- Telegraph Time: 1.5s

**State Machine:**
```
IDLE → CHASE → TELEGRAPH → ATTACK → RECOVERY → CHASE
                ↓
            STAGGERED (2s)
```

**Attack Pattern:**
- Heavy, slow attacks
- High damage (40 per hit)
- High stagger threshold (100)
- Rarely blocks

## Visual Feedback

### Hit-Stop

**Trigger:** Damage > 20
**Duration:** 0.1s
**Time Scale:** 0.2x
**Purpose:** Emphasize impactful hits

### Camera Shake

**Trigger:** On hit
**Intensity:** 0.1-0.3 (based on damage)
**Duration:** 0.2-0.4s
**Purpose:** Convey impact force

### Hit Particles

**Trigger:** On hit
**Count:** 10 particles
**Lifetime:** 1.0-1.5s
**Color:** Red (physical), Blue (frost), Orange (fire)
**Purpose:** Visual hit confirmation

## Data-Driven Tuning

All combat parameters are in `src/content/combat/schemas.ts`:

```typescript
// Weapon stats
export const WEAPON_SCHEMAS = {
  sword: { baseDamage: 25, staminaCost: 15, ... },
  bow: { baseDamage: 30, staminaCost: 20, ... },
};

// Spell stats
export const SPELL_SCHEMAS = {
  fire: { manaCost: 30, cooldown: 3.0, ... },
  frost: { manaCost: 25, cooldown: 5.0, ... },
  ward: { manaCost: 40, cooldown: 10.0, ... },
};

// Enemy stats
export const ENEMY_SCHEMAS = {
  swordsman: { health: 100, damage: 20, ... },
  archer: { health: 70, damage: 25, ... },
  brute: { health: 200, damage: 40, ... },
};
```

## Integration

### Player Combat

```typescript
// Initialize combat system
const combatSystem = new CombatSystem(scene, physicsWorld);
combatSystem.registerCombatant('player', 100, 80, 60);

// Player actions
combatSystem.playerLightAttack();
combatSystem.playerHeavyAttack();
combatSystem.playerBlock(true);
combatSystem.playerParry();
combatSystem.playerShootArrow(origin, direction);
combatSystem.playerCastFire(position);

// Update each frame
combatSystem.update(deltaTime);

// Get visual feedback
const timeScale = combatSystem.getTimeScale();
const cameraOffset = combatSystem.getCameraOffset();
```

### Enemy Spawning

```typescript
// Spawn enemies
combatSystem.spawnEnemy('enemy1', 'swordsman');
combatSystem.spawnEnemy('enemy2', 'archer');
combatSystem.spawnEnemy('enemy3', 'brute');

// Register combat states
combatSystem.registerCombatant('enemy1', 100, 80, 60);
combatSystem.registerCombatant('enemy2', 70, 60, 40);
combatSystem.registerCombatant('enemy3', 200, 120, 100);
```

## Testing

### Unit Tests

```bash
npm test tests/combat.test.ts
```

**Coverage:**
- ✅ Damage calculations
- ✅ Stamina consumption/regen
- ✅ Stagger application/decay
- ✅ Parry timing windows
- ✅ Combo buffering
- ✅ Input buffer management

### Manual Testing

**Test Area Setup:**
1. Spawn 3 enemies: swordsman, archer, brute
2. Equip sword + shield
3. Test all combat actions

**Test Checklist:**
- [ ] Light attack hits enemy
- [ ] Heavy attack hits enemy
- [ ] 3-hit combo chains smoothly
- [ ] Block reduces damage
- [ ] Parry negates damage (timing window)
- [ ] Dodge has i-frames
- [ ] Stamina depletes on attacks
- [ ] Stamina regens when not attacking
- [ ] Stagger builds on hits
- [ ] Enemy staggers when threshold reached
- [ ] Enemy telegraphs attacks (readable)
- [ ] Hit-stop triggers on big hits
- [ ] Camera shake on hits
- [ ] Particles spawn on hits
- [ ] Bow aims and shoots
- [ ] Spells cast with cooldowns
- [ ] Lock-on works in combat
- [ ] No input lag (responsive)
- [ ] Combos feel satisfying
- [ ] Enemy AI is fair (not unfair)

## Performance

### Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Combat update | 1.0ms | All systems |
| Hit detection | 0.2ms | Sweep tests |
| Enemy AI | 0.3ms | 10 enemies |
| Visual feedback | 0.2ms | Particles, shake |

### Optimizations

- Input buffer cleanup each frame
- Particle pooling (reuse dead particles)
- Enemy AI only updates visible enemies
- Hit detection uses spatial partitioning (future)

## Known Limitations

1. **No animation integration** - Combat states don't drive animations yet
2. **Simple enemy AI** - No flanking, no group tactics
3. **No status effects** - Burn/slow effects not implemented
4. **No equipment system** - Weapons are hardcoded
5. **No multiplayer** - Single-player only

## Future Improvements

- [ ] Animation-driven combat (motion matching)
- [ ] Status effects (burn, freeze, poison)
- [ ] Equipment system (weapon upgrades)
- [ ] More enemy types (mage, assassin)
- [ ] Group AI tactics (flanking, surrounding)
- [ ] Environmental hazards (traps, hazards)
- [ ] Combo finishers (special moves)
- [ ] Counter-attack system
- [ ] Weapon arts (special abilities)
- [ ] Boss fights (multi-phase)

## Files

- `src/engine/combat/CombatSystem.ts` - Main orchestrator
- `src/engine/combat/CombatState.ts` - Health, stamina, stagger
- `src/engine/combat/DamageSystem.ts` - Damage calculation
- `src/engine/combat/InputBuffer.ts` - Combo buffering
- `src/engine/combat/HitDetection.ts` - Sweep tests
- `src/engine/combat/SwordSystem.ts` - Melee combat
- `src/engine/combat/BowSystem.ts` - Ranged combat
- `src/engine/combat/SpellSystem.ts` - Magic combat
- `src/engine/combat/EnemyAI.ts` - Enemy behavior
- `src/engine/combat/VisualFeedback.ts` - Hit effects
- `src/content/combat/schemas.ts` - Combat data
- `tests/combat.test.ts` - Unit tests
