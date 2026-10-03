# Audio System

## Overview

The audio system provides a complete audio solution using native Web Audio API. It features mixer buses, 3D spatialization, procedural SFX generation, adaptive music, and interior reverb zones.

## Architecture

```
AudioSystem (orchestrator)
├── AudioManager (core audio context, buses, voice management)
├── SpatialAudioSystem (3D audio positioning)
├── ProceduralSFXGenerator (synthesized sound effects)
├── AdaptiveMusicSystem (procedural layered music)
└── ReverbSystem (interior reverb zones)
```

## Mixer Buses

### Default Buses

| Bus | Purpose | Default Volume |
|-----|---------|----------------|
| master | Master output | 0.7 |
| sfx | Sound effects | 1.0 |
| music | Music tracks | 1.0 |
| ambience | Ambient sounds | 1.0 |
| ui | UI sounds | 1.0 |
| voice | Character voices | 1.0 |

### Bus Management

```typescript
// Set bus volume
audioSystem.setBusVolume('sfx', 0.8);

// Mute bus
audioSystem.setBusMuted('music', true);

// Set master volume
audioSystem.setMasterVolume(0.5);
```

## Voice Budget

### Configuration

```typescript
const audioManager = new AudioManager({
  voiceBudget: 32, // Max simultaneous sounds
  memoryBudget: 100, // Max MB for audio buffers
});
```

### Voice Tracking

```typescript
// Check if can play new sound
if (audioManager.canPlayVoice()) {
  // Play sound
}

// Get active voice count
const activeVoices = audioManager.getActiveVoiceCount();
```

## Spatialization

### 3D Audio Positioning

```typescript
// Update listener position (player)
spatialAudio.updateListener(
  { x: 0, y: 0, z: 0 },
  {
    forward: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 }
  }
);

// Play spatialized sound
spatialAudio.playSpatial(
  buffer,
  { x: 10, y: 0, z: 5 },
  {
    bus: 'sfx',
    maxDistance: 50,
    rolloffFactor: 1,
    volume: 0.8,
  }
);
```

### Distance Attenuation

```typescript
// Calculate attenuation
const attenuation = spatialAudio.calculateAttenuation(
  distance,
  maxDistance,
  rolloffFactor
);
```

## Procedural SFX

### Available Sounds

#### Combat
- **Sword Clash** - Metallic impact sound
- **Damage Hit** - Impact thud with noise

#### Movement
- **Footsteps** - Per surface type:
  - Grass (soft, low-frequency)
  - Stone (hard, high-frequency)
  - Wood (medium, warm)
  - Water (splashy, low)
  - Sand (soft, muffled)
  - Snow (crunchy, high)
- **Hooves** - Horse movement sounds

#### Ambient
- **Wind** - Loopable ambient wind
- **Rain** - Loopable rain with droplets
- **Fire** - Loopable crackling fire

#### UI
- **Click** - Short UI click
- **Notification** - Two-tone notification

### Usage

```typescript
// Play footstep
audioSystem.playFootstep(SurfaceType.STONE, position);

// Play sword clash
audioSystem.playSwordClash(position);

// Play hoof
audioSystem.playHoof(position);

// Start ambient wind
audioSystem.startWind(position);

// Start ambient rain
audioSystem.startRain(position);

// Start ambient fire
audioSystem.startFire(position);

// Play UI sounds
audioSystem.playUIClick();
audioSystem.playUINotification();

// Play damage hit
audioSystem.playDamageHit(position);
```

### Synthesis Details

#### Sword Clash
- Duration: 0.3s
- Metallic noise with exponential decay
- Resonant frequencies: 2000Hz, 3500Hz, 5000Hz

#### Footsteps
- Duration: 0.2s
- Surface-specific characteristics:
  - Low-frequency thud
  - Noise component
  - Decay rate varies by surface

#### Wind
- Duration: 2.0s (loopable)
- Low-pass filtered noise
- Slow modulation (0.3Hz)

#### Rain
- Duration: 2.0s (loopable)
- High-frequency noise
- Random droplet sounds

#### Fire
- Duration: 2.0s (loopable)
- Crackling noise
- Random crackle events

## Adaptive Music

### Music States

| State | Description | Tempo |
|-------|-------------|-------|
| EXPLORE | Peaceful exploration | 70-80 BPM |
| TENSION | Building tension | 75-85 BPM |
| COMBAT | Active combat | 90-100 BPM |
| BOSS | Boss fight | 100-120 BPM |

### Regions

| Region | Scale | Mood |
|--------|-------|------|
| GREENMARCH | C Major | Bright, peaceful |
| THORNWOOD | A Minor | Mysterious, dark |
| IRONCRAG | G Dorian | Epic, strong |
| SALTFEN | F Phrygian | Tense, exotic |
| ASHFELL | E Harmonic Minor | Dramatic, intense |

### Music Layers

| Layer | Purpose | Volume |
|-------|---------|--------|
| Base | Pad/drone foundation | 0.4 |
| Melody | Main melodic line | 0.3 |
| Harmony | Chord progression | 0.3 |
| Percussion | Rhythmic elements | 0.3 |

### Usage

```typescript
// Set music state
audioSystem.setMusicState(MusicState.COMBAT);

// Set region
audioSystem.setMusicRegion(Region.THORNWOOD);

// Stop music
audioSystem.stopMusic();
```

### Crossfading

```typescript
// Set crossfade duration
musicSystem.setCrossfadeDuration(3.0); // 3 seconds
```

### Procedural Generation

Music is generated procedurally using:
- **Scales** - Region-specific musical scales
- **Patterns** - State-specific melodic patterns
- **Layers** - Base, melody, harmony, percussion
- **Crossfades** - Smooth transitions between states

## Reverb Zones

### Reverb Types

| Type | Duration | Decay | Use Case |
|------|----------|-------|----------|
| SMALL_ROOM | 0.8s | 3.0 | Small interiors |
| LARGE_ROOM | 1.5s | 2.5 | Large rooms |
| HALL | 2.5s | 2.0 | Halls, cathedrals |
| CAVE | 3.0s | 1.5 | Caves, caverns |
| CATHEDRAL | 4.0s | 1.8 | Large sacred spaces |

### Zone Management

```typescript
// Add reverb zone
audioSystem.addReverbZone({
  id: 'tavern_interior',
  type: ReverbType.SMALL_ROOM,
  position: { x: 100, y: 0, z: 50 },
  radius: 20,
  wetLevel: 0.4,
});

// Remove reverb zone
audioSystem.removeReverbZone('tavern_interior');

// Update listener (automatic zone detection)
audioSystem.updateListener(position);
```

### Impulse Response Generation

Reverb impulse responses are generated procedurally:
- Exponentially decaying noise
- Early reflections (first 10%)
- Late diffuse reverb
- Stereo variation

## Integration

### Complete Setup

```typescript
import { AudioSystem } from './engine/audio/AudioSystem.js';

const audioSystem = new AudioSystem();
await audioSystem.init();

// Update listener each frame
audioSystem.updateListener(
  playerPosition,
  playerOrientation
);

// Play sounds
audioSystem.playFootstep(SurfaceType.STONE, playerPosition);
audioSystem.playSwordClash(enemyPosition);
audioSystem.setMusicState(MusicState.COMBAT);
```

### With Game Loop

```typescript
function gameLoop(deltaTime: number) {
  // Update audio listener
  audioSystem.updateListener(
    { x: player.x, y: player.y, z: player.z },
    {
      forward: { x: player.forwardX, y: 0, z: player.forwardZ },
      up: { x: 0, y: 1, z: 0 }
    }
  );
  
  // Play movement sounds
  if (player.isMoving) {
    const surface = getSurfaceAt(player.x, player.z);
    audioSystem.playFootstep(surface, player.position);
  }
  
  // Update music based on game state
  if (inCombat) {
    audioSystem.setMusicState(MusicState.COMBAT);
  } else if (nearEnemy) {
    audioSystem.setMusicState(MusicState.TENSION);
  } else {
    audioSystem.setMusicState(MusicState.EXPLORE);
  }
  
  // Update music region
  const region = getRegionAt(player.x, player.z);
  audioSystem.setMusicRegion(region);
}
```

## Performance

### Budgets

| Metric | Budget | Notes |
|--------|--------|-------|
| Voice count | 32 | Max simultaneous sounds |
| Memory | 100 MB | Max audio buffer memory |
| SFX generation | < 5ms | Per sound effect |
| Music generation | < 50ms | Per layer rebuild |
| Reverb IR generation | < 100ms | Per reverb type |

### Optimization

- **Pre-generated SFX** - Common sounds cached on init
- **Voice budget** - Prevents audio overload
- **Looping ambience** - Long loops reduce generation
- **Lazy music generation** - Only generate when state/region changes

## Testing

### Unit Tests

```bash
npm test tests/audio.test.ts
```

**Coverage:**
- ✅ Voice budget logic
- ✅ Bus management
- ✅ SFX generation (all types)
- ✅ Music state transitions
- ✅ Region changes
- ✅ Crossfade configuration

### Manual Testing

**Test Scenario:**
1. Walk through Greenmarch (explore music)
2. Approach enemies (tension music)
3. Enter combat (combat music)
4. Fight boss (boss music)
5. Enter tavern (reverb zone)
6. Walk on different surfaces (footsteps)
7. Trigger UI sounds

**Check:**
- [ ] No harsh sounds
- [ ] Music loops seamlessly
- [ ] Mix is balanced
- [ ] Spatialization works
- [ ] Reverb zones activate
- [ ] Voice budget respected

## Known Limitations

1. **No audio file loading** - Only procedural generation
2. **No audio compression** - Uncompressed buffers
3. **No audio streaming** - All in memory
4. **Simple reverb** - Algorithmic, not convolution
5. **No audio occlusion** - Sound travels through walls
6. **No doppler effect** - Moving sources not pitch-shifted

## Future Improvements

- [ ] Audio file loading (OGG, MP3, WAV)
- [ ] Audio compression
- [ ] Audio streaming for long tracks
- [ ] Audio occlusion (raycasting)
- [ ] Doppler effect for moving sources
- [ ] Audio reflections (early reflections)
- [ ] HRTF improvements
- [ ] Audio ducking (lower music during dialogue)
- [ ] Audio triggers (zone-based sounds)
- [ ] Audio mixing presets

## Files

- `src/engine/audio/AudioManager.ts` - Core audio management
- `src/engine/audio/SpatialAudio.ts` - 3D spatialization
- `src/engine/audio/ProceduralSFX.ts` - SFX synthesis
- `src/engine/audio/AdaptiveMusic.ts` - Procedural music
- `src/engine/audio/ReverbSystem.ts` - Reverb zones
- `src/engine/audio/AudioSystem.ts` - Main orchestrator
- `src/engine/audio/index.ts` - Module exports
- `tests/audio.test.ts` - Unit tests
