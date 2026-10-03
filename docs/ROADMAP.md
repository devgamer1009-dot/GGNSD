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
- [ ] **P8** — Post-processing pipeline (bloom, tonemap, SSAO)

## World (P9–P12)

- [ ] **P9** — Vegetation system (trees, grass, rocks, CellContentProvider, LOD, instancing)
- [ ] **P10** — Camera system (perspective, ortho, controls)
- [ ] **P11** — Water bodies (lakes, rivers with flow)
- [ ] **P12** — Structure placement (buildings, ruins, waypoints)

## Gameplay (P13–P17)

- [ ] **P13** — Player controller (movement, camera)
- [ ] **P14** — NPC system (AI, pathfinding)
- [ ] **P15** — Combat system (melee, ranged, damage)
- [ ] **P16** — Inventory & items
- [ ] **P17** — Quest system

## UI & UX (P18–P20)

- [ ] **P18** — HUD (health, stamina, minimap)
- [ ] **P19** — Menus (main, pause, settings)
- [ ] **P20** — Dialog system

## Polish (P21–P25)

- [ ] **P21** — Audio system (SFX, music, ambient)
- [ ] **P22** — Save/Load system (IndexedDB, worker)
- [ ] **P23** — Performance optimization pass
- [ ] **P24** — Content creation (quests, NPCs, items)
- [ ] **P25** — Beta release, bug fixes, balance
