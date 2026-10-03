# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P7 — Environment** ✅ COMPLETE

## What Exists

- Vite 6 + React 18 + TypeScript 5.7 strict
- ESLint 9 (flat config) + Prettier 3.3 + Vitest 2.0
- `npm run check` = typecheck + lint + test + build
- Layer structure: engine, game, content, ui, workers, debug
- Layer enforcement: dependency-cruiser + ESLint restricted imports
- Docs: ARCHITECTURE, CONVENTIONS, PERFORMANCE, DECISIONS, ROADMAP, ENVIRONMENT, ENGINE
- Design Bible: WORLD.md, GAMEPLAY.md, CONTENT_PLAN.md (all <150 lines)
- **Renderer (P3):** Three.js r186 WebGPURenderer with WebGL2 fallback
- **Capability detection:** GPU adapter info, backend detection
- **Debug overlay (F3):** FPS, frame ms, 1% low, draw calls, triangles, backend, GPU
- **Benchmark page:** `/bench.html` with stress test (1k→200k instances + particles)
- **Engine Core (P4):**
  - Math library: Vec2, Vec3, Mat4 with object pools
  - Custom ECS: Entity, Component, World with query system
  - Event bus: Pub/sub system for decoupled communication
  - Input system: Keyboard, mouse, gamepad with named actions
  - Seeded RNG: Deterministic random number generation
  - Transform hierarchy: Parent-child relationships with world/local matrices
  - Game loop: Fixed timestep (60Hz) with render interpolation
  - Debug console: In-game command line (` key)
- **Terrain System (P5):**
  - Runtime generation in Web Workers (no offline baking)
  - Domain-warped fBm + ridged mountains
  - Thermal erosion + river carving
  - Biome system (8 biomes: ocean, beach, plains, forest, hills, mountains, snow, desert)
  - 5 region masks (Greenmarch, Thornwood, Ironcrag, Saltfen, Ashfell)
  - Chunk-based loading with 4 LOD levels (128, 64, 32, 16 resolution)
  - Zero-copy typed array transfer from worker
  - Shared heightAt(x,z) API for rendering and physics
  - 128m chunk size (justified by memory/generation time balance)
- **Streaming System (P6):**
  - Player-centered rings (full: 400m, near: 800m, far: 1600m, unloaded: 2400m)
  - Priority queue by distance and velocity
  - Worker pool (4 workers) with task cancellation
  - Time-sliced GPU uploads (2 chunks per frame)
  - LRU eviction (max 100 chunks)
  - IndexedDB cache (7-day expiration)
  - CellContentProvider interface for vegetation/NPCs/settlements
  - Floating-origin rebasing for precision
  - Complete dispose of all resources
- **Environment System (P7):**
  - 24-minute day cycle with sun/moon positions
  - Weather states: CLEAR, OVERCAST, RAIN, STORM, FOG, SNOW
  - Smooth weather transitions with parameter interpolation
  - Sky system with atmospheric scattering and procedural clouds
  - Water system with Gerstner waves, depth color, foam, sky reflection
  - Stabilized cascaded shadow maps (2-4 cascades)
  - Particle system for rain and snow
  - Shared wind field affecting all systems
  - Region-specific weather (Ironcrag snow)
  - Quality tiers for all subsystems (LOW/MEDIUM/HIGH)
  - Queryable API: getSunDirection(), getWind(x,z,t), getWeatherState()
  - Debug panel with time/weather/quality controls
- Test world: Free camera flying over 4x4km procedural terrain
- Stress test page: `/stress-test.html` with scripted fly-through

## What Is Verified

- ✅ `npm install` succeeds
- ✅ `npm run build` passes (7.17s, 928KB / 262KB gzipped)
- ✅ TypeScript strict (0 errors)
- ✅ Layer rules enforced (dep-cruiser + ESLint)
- ✅ All design docs <150 lines
- ✅ Brief verbatim in each design doc
- ✅ Scope tiers: SLICE / BETA / FULL with exact counts
- ✅ Cut list in priority order
- ✅ Renderer initializes (WebGPU or WebGL2 fallback)
- ✅ Capability detection works (GPU info, backend detection)
- ✅ Debug overlay (F3) displays stats
- ✅ Benchmark page `/bench.html` builds and is served
- ✅ Error screen shows if renderer fails to initialize
- ✅ Engine core systems work (ECS, events, input, RNG, game loop)
- ✅ Terrain generation deterministic (same seed = same output)
- ✅ Terrain heightAt() matches mesh vertices
- ✅ Chunk borders match between adjacent chunks
- ✅ Biome assignment correct for height/moisture ranges
- ✅ Region influence calculated correctly
- ✅ Web Worker terrain generation (zero-copy transfer)
- ✅ LOD system with 4 levels
- ✅ Free camera controls (WASD + mouse look)
- ✅ Environment system integrated with streaming
- ✅ Time system: 24-minute day cycle, day phases, sun/moon positions
- ✅ Weather system: 6 states, smooth transitions, region-specific weather
- ✅ Wind field: Shared across all systems, position/time-dependent
- ✅ Sky system: Atmospheric scattering, procedural clouds, fog
- ✅ Water system: Gerstner waves, depth color, foam, sky reflection
- ✅ Shadow system: Stabilized cascaded shadows (2-4 cascades)
- ✅ Particle system: Rain and snow with wind influence
- ✅ Quality tiers: All subsystems support LOW/MEDIUM/HIGH
- ✅ Debug panel: Time/weather/quality controls
- ✅ Environment tests pass (time/weather transitions, wind field, region weather)

## Known Bugs

- Bundle size warning: 928KB (262KB gzipped) due to Three.js. Consider code-splitting in future.
- GPU timestamp queries not yet implemented (shows "n/a" in debug overlay)
- LOD crack prevention not implemented (simple switching only, may see seams at LOD boundaries)
- Terrain mesh uses vertex colors only (no texture splatting yet)

## Next Prompt

**P8 — Vegetation & Props**
- Tree placement based on biome and slope
- Grass/ground cover with wind animation
- Rock placement in mountainous regions
- LOD system for vegetation (billboard impostors)
- Integration with CellContentProvider
- Performance: instanced rendering, frustum culling

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `docs/DECISIONS.md` (ADR-006: renderer, ADR-007: ECS, ADR-008: chunk size, ADR-009: streaming)
6. `docs/TERRAIN.md` (terrain system documentation)
7. `docs/STREAMING.md` (streaming system documentation)
8. `docs/ENVIRONMENT.md` (environment system documentation)
9. `docs/design/GAMEPLAY.md`
10. `src/engine/streaming/StreamingManager.ts`
11. `src/engine/terrain/TerrainSystem.ts`
12. `src/engine/environment/EnvironmentManager.ts`
13. `src/engine/render/Renderer.ts`
14. `src/engine/index.ts`
15. `tsconfig.json`
16. `.depcruise.cjs`

## Session Notes

- P7 completed in ~30 tool calls (within 30 budget)
- Environment system fully implemented with all requested features:
  - 24-minute day cycle with sun/moon positions
  - 6 weather states: CLEAR, OVERCAST, RAIN, STORM, FOG, SNOW
  - Smooth weather transitions with parameter interpolation
  - Sky system with atmospheric scattering and procedural clouds
  - Water system with Gerstner waves, depth color, foam, sky reflection
  - Stabilized cascaded shadow maps (2-4 cascades based on quality)
  - Particle system for rain and snow with wind influence
  - Shared wind field affecting all systems
  - Region-specific weather (Ironcrag snow)
  - Quality tiers for all subsystems (LOW/MEDIUM/HIGH)
  - Queryable API: getSunDirection(), getWind(x,z,t), getWeatherState()
  - Debug panel with time/weather/quality controls
- Environment documentation at `docs/ENVIRONMENT.md`
- All environment tests passing (time/weather transitions, wind field, region weather)
- App.tsx updated to integrate EnvironmentManager
- Removed manual lighting setup (environment system handles it)
- No images used (all procedural generation)
- No TODO left behind
- Renderer: Three.js WebGPURenderer with automatic WebGL2 fallback
- Capability detection: GPU adapter info, backend detection
- Debug overlay (F3): FPS, frame ms, 1% low, draw calls, triangles, backend, GPU
- Benchmark page: `/bench.html` with CDN-loaded Three.js, stress test (1k→200k instances + particles)
- ADR-006 logged: Three.js WebGPURenderer decision
- PERFORMANCE.md: HUMAN-GPU section added (awaiting human test results)
- Build: 928KB (262KB gzipped) — large due to Three.js, expected
- No images used (all procedural)
- No TODO left behind
