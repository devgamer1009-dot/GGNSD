# Environment System

## Overview

The environment system provides a complete dynamic environment for CrownFall, including time of day, weather, atmospheric effects, and visual phenomena. All systems work together to create a living, breathing world.

## Architecture

```
EnvironmentManager (orchestrator)
├── TimeSystem (24-minute day cycle)
├── WeatherSystem (state machine + transitions)
├── SkySystem (atmospheric scattering, clouds, fog)
├── WaterSystem (Gerstner waves, depth color, foam)
├── ShadowSystem (cascaded shadow maps)
└── ParticleSystem (rain, snow)
```

## Quality Tiers

Each subsystem supports three quality levels:

| System   | Low      | Medium   | High     |
|----------|----------|----------|----------|
| Sky      | 16 seg   | 32 seg   | 64 seg   |
| Water    | 32×32    | 64×64    | 128×128  |
| Shadows  | 2 cascades, 1024² | 3 cascades, 2048² | 4 cascades, 4096² |
| Particles| 2k rain, 1k snow | 5k rain, 3k snow | 10k rain, 6k snow |

## Time System

### 24-Minute Day Cycle

The game world operates on a 24-minute day cycle (1440 seconds):

- **Night**: 0-300s, 1140-1440s (19:00-05:00)
- **Dawn**: 300-420s (05:00-07:00)
- **Day**: 420-1020s (07:00-17:00)
- **Sunset**: 1020-1140s (17:00-19:00)

### Sun and Moon

- **Sun**: Follows parabolic arc from east to west
- **Moon**: Opposite position to sun
- **Ambient light**: Varies by time of day
- **Sky color**: Transitions through dawn/day/sunset/night palettes

### API

```typescript
// Get sun direction (normalized vector)
const sunDir = environment.getSunDirection(); // [x, y, z]

// Get current day phase
const phase = environment.getDayPhase(); // 'dawn' | 'day' | 'sunset' | 'night'

// Get formatted time string
const timeStr = environment.getTimeString(); // "14:30"

// Set time directly (0-1440 seconds)
environment.setTime(720); // Noon
```

## Weather System

### Weather States

| State      | Cloud Cover | Precipitation | Fog   | Wet |
|------------|-------------|---------------|-------|-----|
| CLEAR      | 0.1         | 0             | 0     | No  |
| OVERCAST   | 0.8         | 0             | 0.1   | No  |
| RAIN       | 0.9         | 0.7           | 0.2   | Yes |
| STORM      | 1.0         | 1.0           | 0.3   | Yes |
| FOG        | 0.5         | 0             | 0.8   | No  |
| SNOW       | 0.7         | 0.5           | 0.15  | No  |

### Weather Transitions

Weather changes smoothly over time:

```typescript
// Gradual transition (5 seconds)
environment.setWeather(WeatherState.RAIN, 5.0);

// Instant change
environment.forceWeather(WeatherState.STORM);
```

During transitions, parameters (cloud cover, precipitation, fog) interpolate smoothly.

### Region-Specific Weather

**Ironcrag** (northeast region) automatically converts rain to snow:

```typescript
// Enable/disable Ironcrag snow
environment.setIroncragSnow(true);

// Query weather at specific position
const weather = environment.getWeatherAtPosition(1200, -1000); // SNOW in Ironcrag
```

### Wind Field

Wind is a shared field that affects particles, water, and vegetation:

```typescript
// Get wind at position and time
const wind = environment.getWind(x, z, time);
// Returns: { x, z, strength, direction }

// Set base wind
environment.setBaseWind(5.0, Math.PI / 4); // Strength, direction (radians)
```

Wind characteristics:
- **Base strength**: Configurable (default 2.0)
- **Gusts**: Sinusoidal variation over time
- **Spatial variation**: Simple noise-like pattern
- **Weather influence**: Storm = 2x, Rain = 1.3x

### API

```typescript
// Get current weather state
const state = environment.getWeatherState();

// Get weather at position (region-aware)
const localWeather = environment.getWeatherAtPosition(x, z);

// Check if surfaces are wet
const isWet = environment.isWet();
const wetness = environment.getWetness(); // 0-1

// Get fog density
const fogDensity = environment.getFogDensity(); // 0-1

// Get cloud cover
const clouds = environment.getCloudCover(); // 0-1
```

## Sky System

### Atmospheric Scattering

Simplified Rayleigh + Mie scattering:
- **Rayleigh**: Blue sky, wavelength-dependent
- **Mie**: Sun glow, forward scattering
- **Sun intensity**: Affects scattering strength

### Clouds

Procedural clouds using FBM noise:
- **Coverage**: Controlled by weather system
- **Movement**: Driven by wind field
- **Quality tiers**: Affect opacity and detail

### Fog

Distance-based fog that matches sky color:
- **Near plane**: 100m
- **Far plane**: 2000m - (fogDensity * 1500m)
- **Color**: Desaturated sky color

## Water System

### Gerstner Waves

Realistic ocean waves using Gerstner wave function:
- **Multiple layers**: 3 wave layers with different frequencies
- **Wind influence**: Amplitude and speed affected by wind
- **Quality tiers**: Affect mesh resolution

### Visual Effects

- **Depth color**: Darker in deep water
- **Fresnel reflection**: Sky reflection at grazing angles
- **Specular highlights**: Sun reflection on waves
- **Foam**: Generated at wave peaks

### API

```typescript
// Set water level
environment.setWaterLevel(0);

// Set wave parameters
environment.setWaveParameters(
  amplitude,  // Wave height
  frequency,  // Wave frequency
  speed       // Wave speed
);
```

## Shadow System

### Cascaded Shadow Maps

Stabilized cascaded shadows prevent shimmering:
- **Snap-to-grid**: Shadow map snaps to world grid
- **Multiple cascades**: 2-4 cascades based on quality
- **Bias**: Per-cascade bias to prevent acne

### Cascade Configuration

| Quality | Cascades | Resolution | Distances          |
|---------|----------|------------|--------------------|
| Low     | 2        | 1024²      | 50m, 150m          |
| Medium  | 3        | 2048²      | 50m, 150m, 400m    |
| High    | 4        | 4096²      | 50m, 150m, 400m, 1000m |

### API

```typescript
// Enable/disable shadows
environment.setShadowsEnabled(true);
```

## Particle System

### Rain

- **Direction**: Falls with wind influence
- **Speed**: 15-20 m/s
- **Appearance**: Blue-tinted, additive blending
- **Count**: 2k-10k based on quality

### Snow

- **Movement**: Slow fall with drift
- **Swaying**: Sinusoidal motion
- **Appearance**: White, additive blending
- **Count**: 1k-6k based on quality

### Behavior

- Particles spawn around camera
- Reset when falling below ground
- Wind affects horizontal movement
- Intensity controlled by weather precipitation

## Integration with Streaming

The environment system works seamlessly with the streaming system:

1. **No full-world assumption**: All queries work with local coordinates
2. **Wind field**: Sampled at any position, no global state
3. **Weather**: Can vary by region (Ironcrag snow)
4. **Performance**: Systems update independently of chunk loading

## Debug Panel

The `EnvironmentDebugPanel` React component provides UI controls:

### Time Controls
- Time slider (0-1440s)
- Quick buttons: Dawn, Day, Sunset, Night

### Weather Controls
- Weather state buttons (CLEAR, OVERCAST, RAIN, STORM, FOG, SNOW)

### Quality Controls
- Sky quality (LOW, MEDIUM, HIGH)
- Water quality
- Shadow quality
- Particle quality

### Visual Controls
- Water level slider
- Wave amplitude slider
- Wind strength slider
- Shadow toggle
- Ironcrag snow toggle

### Status Display
- Current time
- Sun direction
- Day phase
- Fog density
- Wetness

## Performance

### Frame Budget

Environment systems target <2ms per frame:
- TimeSystem: ~0.01ms
- WeatherSystem: ~0.05ms
- SkySystem: ~0.1ms
- WaterSystem: ~0.2ms
- ShadowSystem: ~0.5ms
- ParticleSystem: ~1.0ms

### Optimization

- **Zero allocations**: All systems reuse buffers
- **Quality tiers**: Scale detail based on hardware
- **Culling**: Particles only spawn near camera
- **LOD**: Shadow cascades reduce distant detail

## Testing

Tests cover:
- Time progression and day phases
- Weather state transitions
- Wind field sampling
- Region-specific weather
- Wetness and precipitation

Run tests:
```bash
npm test tests/environment.test.ts
```

## Files

- `src/engine/environment/TimeSystem.ts` - Day/night cycle
- `src/engine/environment/WeatherSystem.ts` - Weather states and transitions
- `src/engine/environment/SkySystem.ts` - Sky rendering
- `src/engine/environment/WaterSystem.ts` - Water rendering
- `src/engine/environment/ShadowSystem.ts` - Shadow maps
- `src/engine/environment/ParticleSystem.ts` - Rain and snow
- `src/engine/environment/EnvironmentManager.ts` - Orchestrator
- `src/engine/environment/DebugPanel.tsx` - UI controls
- `tests/environment.test.ts` - Unit tests
