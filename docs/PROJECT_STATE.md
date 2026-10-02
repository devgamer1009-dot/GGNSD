# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P5 — Terrain** ✅ COMPLETE

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
- Test world: Free camera flying over 4x4km procedural terrain

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

## Known Bugs

- Bundle size warning: 928KB (262KB gzipped) due to Three.js. Consider code-splitting in future.
- GPU timestamp queries not yet implemented (shows "n/a" in debug overlay)
- LOD crack prevention not implemented (simple switching only, may see seams at LOD boundaries)
- Terrain mesh uses vertex colors only (no texture splatting yet)

## Next Prompt

**P6 — Advanced Lighting & Shadows**
- Directional light with cascaded shadow maps
- Ambient occlusion (screen-space or baked)
- Dynamic time-of-day system
- Fog (distance + height-based)
- Light probes for indoor areas

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `docs/DECISIONS.md` (ADR-006: renderer, ADR-007: ECS)
6. `docs/TERRAIN.md` (terrain system documentation)
7. `docs/design/GAMEPLAY.md`
8. `src/engine/terrain/TerrainSystem.ts`
9. `src/engine/render/Renderer.ts`
10. `src/engine/index.ts`
11. `tsconfig.json`
12. `.depcruise.cjs`

## Session Notes

- P5 completed in ~25 tool calls (within 30 budget)
- Terrain system fully implemented with Web Worker generation
- 128m chunk size chosen based on memory/generation time balance
- 4 LOD levels (128, 64, 32, 16 resolution) based on distance
- Zero-copy typed array transfer from worker to main thread
- 8 biomes determined by height and moisture
- 5 region masks with influence falloff
- Thermal erosion and river carving implemented
- Free camera controls for testing (WASD + mouse look)
- All terrain tests passing (determinism, heightAt, borders, biomes, regions)
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
