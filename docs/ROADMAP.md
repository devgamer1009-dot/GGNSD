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
- [x] **P11** — Character system (GPU skinning, animation state machine, procedural humanoid, horse with gaits, mount/dismount, rider camera, instanced crowds) ✅
- [x] **P12** — Combat system (sword/shield, bow, spells, combos, block/parry, stamina, stagger, hit detection, enemy AI, visual feedback) ✅
- [x] **P13** — Settlement system (deterministic generation, road network, plots, 10 building types, terrain flattening, interiors, landmarks) ✅
- [x] **P14** — World Life AI (navmesh, behavior trees, NPC schedules, wildlife, factions, events, AI LOD, time-sliced updates) ✅
- [x] **P15** — Quest system (schema-validated graph, dialogue, journal, inventory, crafting, merchants, world flags, 6 SLICE quests, validator, bot) ✅
- [x] **P16** — UI system (DOM+CSS, HUD, menus, inventory, map, journal, dialogue, photo mode, accessibility, keyboard+gamepad) ✅

## UI & UX (P17–P18)

- [x] **P17** — Audio system (Web Audio API, mixer buses, spatialization, procedural SFX, adaptive music, reverb zones) ✅
- [x] **P18** — Save/Load system (IndexedDB, migrations, checksums, autosave, export/import, settings) ✅

## Polish (P19–P21)

- [ ] **P19** — Performance optimization pass
- [ ] **P20** — Content creation (quests, NPCs, items)
- [ ] **P21** — Beta release, bug fixes, balance
