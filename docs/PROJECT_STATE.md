# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P18 — Saves + Settings** ✅ COMPLETE

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
- **Asset Pipeline (P8):**
  - Manifest-driven assets with IDs (no hardcoded paths)
  - GLTF + Meshopt + KTX2 loaders (verified Three.js r186 APIs)
  - 13 parametric generators (rocks, trees, houses, walls, props)
  - Validation system (broken refs, size/triangle budgets)
  - LOD selection with hysteresis (distance-based)
  - Versioned cache keys (IndexedDB backend)
  - Asset gallery page: `/assets/gallery.html`
  - Sample manifest with all parametric assets
- **Player Movement (P9):**
  - Character state machine (8 states: idle, walk, sprint, jump, fall, steep-slope slide, swim, dodge)
  - Rapier physics integration (WASM, main thread)
  - Heightfield terrain colliders from streaming chunks
  - Third-person camera with orbit, collision, and lock-on
  - Physics debug visualization (F4 toggle)
  - State transition table with extensibility for climb/glide/mount
  - Input via actions only (no direct key bindings)
- **Vegetation System (P10):**
  - Instanced vegetation per cell via CellContentProvider
  - Deterministic placement from biome density maps
  - CPU-based frustum culling (ADR-011)
  - LOD system with billboard impostors for far trees
  - Vertex-shader wind animation (environment wind API)
  - Near-field grass system (up to 10k blades per chunk)
  - Rock and prop placement with slope/water exclusion rules
  - Instance budgets per tier (Low/Medium/High)
- **Character System (P11):**
  - GPU skinning with 11-bone skeleton
  - Animation state machine with blending (tied to MOVEMENT.md states)
  - Procedural low-poly humanoid (fallback when CC0 unavailable)
  - Animation LOD (full skeleton → reduced → billboard)
  - Foot IK for ground alignment (nearby characters only)
  - Horse system with walk/trot/gallop gaits
  - Mount/dismount system with smooth transitions
  - Rider camera mode for mounted characters
  - Instanced crowd system for distant NPCs (up to 100 members)
  - CC0 asset support (Quaternius, Kenney; NOT Mixamo)
- **Combat System (P12):**
  - Data-driven combat (tuning in src/content/combat/schemas.ts)
  - Sword + shield (light/heavy attacks, 3-hit combos, block, parry)
  - Bow (aim, shoot, arrow physics)
  - 3 spells (fire, frost, ward) with cooldowns
  - Input buffering for combo chaining
  - Dodge with i-frames
  - Stamina system (consumption, regeneration, exhaustion)
  - Stagger/break meters
  - Hit detection via sweep tests
  - Visual feedback (hit-stop, camera shake, GPU particles)
  - 3 enemy types (swordsman, archer, brute) with telegraphed AI
  - Schema-validated combat data
- **Settlement System (P13):**
  - Deterministic settlement generation (seeded RNG)
  - Road network (radial main roads + branches)
  - Plot system (collision-free placement)
  - 10 building types from modular kit
  - Terrain flattening under buildings
  - Interior system (tavern, smithy, church, castle keep)
  - Authored landmarks (Highspire castle, Briarhollow village)
  - Integration with streaming via CellContentProvider
  - Schema-validated settlement data
- **AI System (P14):**
  - NavMesh system (recast-navigation, per-chunk generation)
  - Behavior trees (sequence, selector, action, condition, inverter, repeater)
  - NPC schedules (time-based activities: work, eat, sleep, socialize)
  - Wildlife system (herds, predators, prey, weather reactions)
  - Faction system (reputation tracking, relations)
  - Dynamic events (bandit raids, merchant caravans, wolf attacks)
  - AI LOD (full/reduced/statistical based on distance)
  - Time-sliced updates (1.5ms/frame budget)
  - Priority-based update scheduling
- **Quest System (P15):**
  - Schema-validated quest graph (7 step types, choices, rewards)
  - Dialogue system with reputation effects
  - Journal system (quest tracking)
  - Inventory and gear (items, equipment, stacking)
  - Loot system (quest rewards, merchant inventory)
  - Merchants with reputation-based pricing
  - Crafting system (forge, cooking, alchemy)
  - Persistent world flags (quest prerequisites, world state)
  - 6 SLICE quests authored as data (Briarhollow starting area)
  - Quest validator (no unreachable steps, no missing references)
  - Headless quest bot (automated testing)
- **UI System (P16):**
  - DOM + CSS only, no UI framework owning simulation state
  - Main menu, pause menu, settings, death/respawn, loading screens
  - HUD (health, stamina, mana, compass with POIs, quest tracker, prompts)
  - Inventory/gear screen with equipment slots
  - Map screen with fog-of-war placeholder
  - Journal screen with quest list
  - Dialogue screen with choices
  - Photo mode (free camera, DoF, time-of-day, filters, high-res capture)
  - Accessibility (scalable UI, colorblind palettes, subtitles, reduced shake, hold-to-toggle, rebinding)
   - Keyboard and gamepad navigation everywhere
   - Screen navigation system with back history
- **Audio System (P17):**
  - Native Web Audio API only (no external libraries)
  - Mixer buses (master, sfx, music, ambience, ui, voice)
  - Voice budget management (32 simultaneous sounds)
  - 3D spatialization with HRTF panning
  - Procedural SFX generation (swords, footsteps per surface, hooves, wind, rain, fire, UI)
  - Adaptive layered music (explore, tension, combat, boss states)
  - Region-specific music scales (Greenmarch, Thornwood, Ironcrag, Saltfen, Ashfell)
  - Interior reverb zones (small room, large room, hall, cave, cathedral)
  - Crossfade transitions between music states
  - Audio documentation at `docs/AUDIO.md`
  - Audio tests passing (voice budget, bus management, SFX generation, music transitions)
- **Save System (P18):**
  - Versioned IndexedDB saves with automatic migrations
  - Multiple save slots (unlimited)
  - Autosave at safe points (quest complete, location discovered, time interval, game pause)
  - SHA-256 checksum validation with corruption detection
  - Automatic backup creation on corruption
  - Save export/import as JSON files
  - Base64 export/import for sharing
  - Settings storage (graphics, audio, controls, accessibility)
  - Graphics tier auto-detection with user override
  - Live settings switching with change notifications
  - Key rebinding system
  - Playtime tracking
  - Save system documentation at `docs/SAVES.md`
  - Save tests passing (migrations, corruption detection, round-trip preservation)
- Test world: Free camera flying over 4x4km procedural terrain- Stress test page: `/stress-test.html` with scripted fly-through

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
- ✅ Asset pipeline tests pass (manifest validation, parametric generators, LOD selection, caching)
- ✅ Asset gallery page renders all parametric assets with 3D previews
- ✅ Physics system initialized (Rapier WASM)
- ✅ Character state machine (8 states, transitions working)
- ✅ Third-person camera (orbit, zoom, lock-on)
- ✅ Physics debug visualization (F4 toggle)
- ✅ Movement tests pass (state transitions, slope detection)
- ✅ Vegetation placement determinism verified (same seed = same output)
- ✅ Vegetation exclusion rules working (slope, water, spacing)
- ✅ Vegetation tests pass (determinism, exclusion, biome density)
- ✅ Animation state machine transitions working
- ✅ Blend weights sum to 1.0 (verified in tests)
- ✅ Animation tests pass (transitions, blending, completion)
- ✅ Combat damage calculations verified
- ✅ Stamina consumption/regeneration working
- ✅ Parry timing windows tested
- ✅ Combo input buffering tested
- ✅ Combat tests pass (damage, stamina, parry, combos)
- ✅ Settlement generation deterministic (same seed = same layout)
- ✅ No overlapping plots (collision detection)
- ✅ Slope limit validation working
- ✅ Settlement tests pass (determinism, validation, meshes)
- ✅ AI schedule logic tested (time progression, activities)
- ✅ Behavior tree execution tested (sequence, selector, actions)
- ✅ AI LOD levels working (distance-based)
- ✅ Time-sliced updates tested (budget enforcement)
- ✅ Faction reputation system tested
- ✅ Event system tested (spawn, expire, active tracking)
- ✅ AI tests pass (determinism, schedules, behavior trees)
- ✅ Quest validator working (no unreachable steps, no missing references)
- ✅ Quest bot completing quests automatically
- ✅ Inventory system tested (items, equipment, stacking)
- ✅ Crafting system tested (recipes, craft items)
- ✅ Merchant system tested (reputation-based pricing)
- ✅ World flags tested (set, unset, check, export/import)
- ✅ Quest tests pass (management, steps, choices, rewards, requirements)
- ✅ UI tests pass (navigation, pause, photo mode, accessibility, key bindings)
- ✅ Audio system initialized (Web Audio API)
- ✅ Mixer buses working (master, sfx, music, ambience, ui, voice)
- ✅ Voice budget management tested
- ✅ Spatial audio positioning working
- ✅ Procedural SFX generation (all types)
- ✅ Adaptive music state transitions
- ✅ Region-specific music scales
- ✅ Reverb zones (interior effects)
- ✅ Audio tests pass (voice budget, bus management, SFX, music)
- ✅ Save system initialized (IndexedDB)
- ✅ Multiple save slots working
- ✅ Save/load round-trip verified
- ✅ Migration system tested
- ✅ Checksum validation working
- ✅ Corruption detection and backup creation
- ✅ Export/import functionality tested
- ✅ Autosave system working
- ✅ Settings management tested
- ✅ Save tests pass (migrations, corruption, round-trip)

## Known Bugs

- Bundle size warning: 928KB (262KB gzipped) due to Three.js. Consider code-splitting in future.
- GPU timestamp queries not yet implemented (shows "n/a" in debug overlay)
- LOD crack prevention not implemented (simple switching only, may see seams at LOD boundaries)
- Terrain mesh uses vertex colors only (no texture splatting yet)

## Next Prompt

**P19 — Performance Optimization**
- Frame time profiling and optimization
- Memory usage optimization
- Draw call batching
- LOD system improvements
- Asset streaming optimization

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `docs/DECISIONS.md` (ADR-006 through ADR-011)
6. `docs/TERRAIN.md` (terrain system documentation)
7. `docs/STREAMING.md` (streaming system documentation)
8. `docs/ENVIRONMENT.md` (environment system documentation)
9. `docs/ASSETS.md` (asset pipeline documentation)
10. `docs/MOVEMENT.md` (player movement documentation)
11. `docs/VEGETATION.md` (vegetation system documentation)
12. `docs/CHARACTERS.md` (character system documentation)
13. `docs/COMBAT.md` (combat system documentation)
14. `docs/SETTLEMENTS.md` (settlement system documentation)
15. `docs/AI.md` (AI system documentation)
16. `docs/QUESTS.md` (quest system documentation)
17. `docs/UI.md` (UI system documentation)
18. `docs/design/GAMEPLAY.md`
14. `src/engine/characters/CharacterSystem.ts` (character orchestrator)
15. `src/engine/characters/AnimationStateMachine.ts` (animation states)
16. `src/engine/characters/Horse.ts` (horse system)
17. `src/engine/vegetation/VegetationSystem.ts` (vegetation orchestrator)
18. `src/engine/vegetation/VegetationProvider.ts` (CellContentProvider)
19. `src/engine/physics/PhysicsWorld.ts` (physics integration)
20. `src/engine/physics/CharacterStateMachine.ts` (state machine)
21. `src/engine/camera/ThirdPersonCamera.ts` (camera system)
22. `src/engine/assets/manager.ts` (asset manager)
23. `src/engine/streaming/StreamingManager.ts`
24. `src/engine/terrain/TerrainSystem.ts`
25. `src/engine/environment/EnvironmentManager.ts`
26. `src/engine/render/Renderer.ts`
27. `src/engine/index.ts`
28. `tsconfig.json`
29. `.depcruise.cjs`

## Session Notes

- **P16 completed** - UI system implemented
  - DOM + CSS only, no UI framework owning simulation state
  - Complete HUD (health, stamina, mana, compass, quest tracker, prompts)
  - All menu screens (main, pause, settings, death, loading)
  - Game screens (inventory, map, journal, dialogue)
  - Photo mode with free camera, DoF, time-of-day, filters, high-res capture
  - Full accessibility (scalable UI, colorblind palettes, subtitles, reduced shake, hold-to-toggle, rebinding)
  - Keyboard and gamepad navigation
  - UI documentation at `docs/UI.md`
  - UI tests passing (navigation, pause, photo mode, accessibility)

- **P15 completed** - Quest system implemented
  - Schema-validated quest graph with 7 step types
  - Dialogue system with choices affecting reputation
  - Journal system for quest tracking
  - Inventory and gear system (items, equipment, stacking)
  - Crafting system (forge, cooking, alchemy)
  - Merchant system with reputation-based pricing
  - Persistent world flags for quest prerequisites
  - 6 SLICE quests authored as data (Briarhollow starting area)
  - Quest validator (no unreachable steps, no missing references)
  - Headless quest bot for automated testing
  - Quest documentation at `docs/QUESTS.md`
  - Quest tests passing (management, steps, choices, rewards, requirements)

- **P14 completed** - World Life AI system implemented
  - NavMesh system using recast-navigation library
  - Behavior tree system (sequence, selector, action, condition, inverter, repeater, random)
  - NPC schedule system (time-based activities: sleep, work, eat, socialize, wander)
  - Wildlife system (herds, predators, prey, weather reactions, alertness)
  - Faction system (reputation tracking, relations: hostile/neutral/friendly)
  - Dynamic event system (bandit raids, merchant caravans, wolf attacks)
  - AI LOD manager (full/reduced/statistical based on distance)
  - Time-sliced update scheduler (1.5ms/frame budget, priority-based)
  - AI documentation at `docs/AI.md`
  - AI tests passing (schedules, behavior trees, LOD, factions, events, determinism)

- **P13 completed** - Settlement system implemented
  - Deterministic settlement generation with seeded RNG
  - Road network (radial main roads + branches)
  - Plot system with collision-free placement
  - 10 building types from modular kit
  - Terrain flattening under buildings with smooth blend zones
  - Interior system (tavern, smithy, church, castle keep)
  - Authored landmarks (Highspire castle, Briarhollow village)
  - Integration with streaming via CellContentProvider
  - Settlement documentation at `docs/SETTLEMENTS.md`
  - Settlement tests passing (determinism, validation, meshes)

- **P12 completed** - Combat system implemented
  - Data-driven combat with schema validation
  - Sword + shield with 3-hit combos and input buffering
  - Bow with aiming and arrow physics
  - 3 spells (fire, frost, ward) with cooldowns
  - Block and parry system with timing windows
  - Stamina and stagger systems
  - Hit detection via sweep tests
  - Visual feedback (hit-stop, camera shake, particles)
  - 3 enemy types with telegraphed AI state machines
  - Combat documentation at `docs/COMBAT.md`
  - Combat tests passing (damage, stamina, parry, combos)

- **P11 completed** - Character system implemented
  - GPU skinning with 11-bone skeleton
  - Animation state machine with blending (tied to MOVEMENT.md states)
  - Procedural low-poly humanoid (fallback when CC0 unavailable)
  - Animation LOD (full skeleton → reduced → billboard)
  - Foot IK for ground alignment (nearby characters only)
  - Horse system with walk/trot/gallop gaits
  - Mount/dismount system with smooth transitions
  - Rider camera mode for mounted characters
  - Instanced crowd system for distant NPCs (up to 100 members)
  - CC0 asset support (Quaternius, Kenney; NOT Mixamo)
  - Character documentation at `docs/CHARACTERS.md`
  - Animation tests passing (transitions, blending, completion)

- **P10 completed** - Vegetation system implemented
  - Instanced vegetation per cell via CellContentProvider
  - Deterministic placement from biome density maps
  - CPU-based frustum culling (ADR-011: CPU over compute shaders)
  - LOD system with billboard impostors for far trees
  - Vertex-shader wind animation using environment wind API
  - Near-field grass system (up to 10k blades per chunk)
  - Rock and prop placement with slope/water exclusion rules
  - Instance budgets per tier documented in PERFORMANCE.md
  - Vegetation documentation at `docs/VEGETATION.md`
  - Vegetation tests passing (determinism, exclusion, biome density)

- **P9 completed** - Player movement system implemented
  - Character state machine with 8 states (idle, walk, sprint, jump, fall, steep-slope slide, swim, dodge)
  - Rapier physics integration (WASM, main thread, no worker needed)
  - Heightfield terrain colliders from streaming chunks
  - Third-person camera with orbit, collision, and lock-on
  - Physics debug visualization (F4 toggle)
  - State transition table with extensibility for future states (climb, glide, mount)
  - Input via actions only (no direct key bindings)
  - Movement documentation at `docs/MOVEMENT.md`
  - Movement tests passing (state transitions, slope detection)
  - Installed @dimforge/rapier3d-compat for physics

- **AUDIT completed** - Comprehensive code audit performed
  - Fixed 3 critical/high priority issues
  - StreamingManager refactored from 515 → 300 lines (42% reduction)
  - Asset module export bug fixed
  - LODLevel naming collision resolved
  - Full audit report at `docs/AUDIT_REPORT.md`

- P8 completed in ~25 tool calls (within 30 budget)
- Asset pipeline fully implemented with all requested features:
  - Manifest-driven assets with IDs (no hardcoded paths)
  - GLTF + Meshopt + KTX2 loaders (verified Three.js r186 APIs)
  - 13 parametric generators (rocks, trees, houses, walls, props)
  - Validation system (broken refs, size/triangle budgets)
  - LOD selection with hysteresis (distance-based)
  - Versioned cache keys (IndexedDB backend)
  - Asset gallery page: `/assets/gallery.html`
  - Sample manifest with all parametric assets
- Asset pipeline documentation at `docs/ASSETS.md`
- All asset pipeline tests passing (manifest validation, parametric generators, LOD selection, caching)
- Gallery page renders all parametric assets with 3D previews
- Installed meshoptimizer package for compressed glTF support
- No images used (all procedural generation)
- No TODO left behind

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

- **P17 completed** - Audio system implemented
  - Native Web Audio API only (no external libraries)
  - Mixer buses (master, sfx, music, ambience, ui, voice)
  - Voice budget management (32 simultaneous sounds)
  - 3D spatialization with HRTF panning
  - Procedural SFX generation (swords, footsteps per surface, hooves, wind, rain, fire, UI)
  - Adaptive layered music (explore, tension, combat, boss states)
  - Region-specific music scales (Greenmarch, Thornwood, Ironcrag, Saltfen, Ashfell)
  - Interior reverb zones (small room, large room, hall, cave, cathedral)
  - Crossfade transitions between music states
  - Audio documentation at `docs/AUDIO.md`
  - Audio tests passing (voice budget, bus management, SFX generation, music transitions)
- No images used (all procedural)
- No TODO left behind

- **P18 completed** - Save/Load system implemented
  - Versioned IndexedDB saves with automatic migrations
  - Multiple save slots (unlimited)
  - Autosave at safe points (quest complete, location discovered, time interval, game pause)
  - SHA-256 checksum validation with corruption detection
  - Automatic backup creation on corruption
  - Save export/import as JSON files
  - Base64 export/import for sharing
  - Settings storage (graphics, audio, controls, accessibility)
  - Graphics tier auto-detection with user override
  - Live settings switching with change notifications
  - Key rebinding system
  - Playtime tracking
  - Save system documentation at `docs/SAVES.md`
  - Save tests passing (migrations, corruption detection, round-trip preservation)
