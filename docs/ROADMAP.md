# Roadmap — CrownFall

> Phases P1–P24. Each phase = one session of work.

## Foundation (P1–P4)

- [x] **P1** — Project scaffold, tooling, docs, layer enforcement ✅
- [x] **P2** — Design Bible (WORLD, GAMEPLAY, CONTENT_PLAN) ✅
- [x] **P3** — Renderer + Benchmark (Three.js WebGPU + WebGL2 fallback, /bench.html) ✅
- [x] **P4** — Engine Core (ECS, events, input, RNG, game loop, math, debug console) ✅

## Rendering (P5–P8)

- [x] **P5** — Procedural terrain generation (worker, fBm, ridged, erosion, rivers, biomes, regions, LOD) ✅
- [x] **P6** — Streaming system (priority queue, worker pool, time-sliced uploads, LRU, IndexedDB cache, CellContentProvider) ✅
- [x] **P7** — Environment system (24-min day cycle, weather states, sky scattering, Gerstner water, cascaded shadows, rain/snow particles, wind field, quality tiers) ✅
- [x] **P8** — Asset pipeline (manifest-driven, GLTF+Meshopt+KTX2 loaders, 13 parametric generators, validation, LOD selection, versioned cache, gallery page) ✅

## World (P9–P12)

- [x] **P9** — Player movement (character state machine, Rapier physics, heightfield colliders, third-person camera, lock-on, debug visualization) ✅
- [x] **P10** — Vegetation system (instanced placement, biome density, LOD + billboards, wind shader, culling, grass, rocks/props) ✅
- [ ] **P11** — Water bodies (lakes, rivers with flow, buoyancy)
- [ ] **P12** — Structure placement (buildings, ruins, waypoints)

## Gameplay (P13–P17)

- [ ] **P13** — NPC system (AI, pathfinding)
- [ ] **P14** — Combat system (melee, ranged, damage)
- [ ] **P15** — Inventory & items
- [ ] **P16** — Quest system
- [ ] **P17** — Dialog system

## UI & UX (P18–P20)

- [ ] **P18** — HUD (health, stamina, minimap)
- [ ] **P19** — Menus (main, pause, settings)
- [ ] **P20** — Audio system (SFX, music, ambient)

## Polish (P21–P24)

- [ ] **P21** — Save/Load system (IndexedDB, worker)
- [ ] **P22** — Performance optimization pass
- [ ] **P23** — Content creation (quests, NPCs, items)
- [ ] **P24** — Beta release, bug fixes, balance
