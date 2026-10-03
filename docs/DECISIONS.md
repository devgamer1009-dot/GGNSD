# Decisions (ADR Log) — CrownFall

> Architecture Decision Records. Append-only.

## ADR-001: Use Vite + React + TypeScript

- **Date:** P1
- **Status:** Accepted
- **Context:** Need fast dev server, HMR, strict typing for a large codebase.
- **Decision:** Vite 6 + React 18 + TypeScript 5.7 strict.
- **Consequences:** Fast builds, excellent DX. React is UI-only (never owns sim).

## ADR-002: Strict Layer Enforcement via dep-cruiser

- **Date:** P1
- **Status:** Accepted
- **Context:** Engine must never import game. Manual review insufficient at scale.
- **Decision:** dependency-cruiser config (`.depcruise.cjs`) + ESLint `no-restricted-imports`.
- **Consequences:** CI blocks violations. Proven in P1 by intentional break + fix.

## ADR-003: Vitest for Testing

- **Date:** P1
- **Status:** Accepted
- **Context:** Need fast, TS-native test runner compatible with Vite.
- **Decision:** Vitest 2.x with node environment.
- **Consequences:** Shared config with Vite. Fast execution.

## ADR-004: Flat ESLint Config (v9)

- **Date:** P1
- **Status:** Accepted
- **Context:** ESLint 9 deprecates .eslintrc. Flat config is the future.
- **Decision:** `eslint.config.js` with typescript-eslint + react plugins.
- **Consequences:** Modern config format. No legacy `.eslintrc` files.

## ADR-005: IndexedDB for Saves

- **Date:** P1
- **Status:** Accepted
- **Context:** No backend. Need persistent storage for game saves.
- **Decision:** IndexedDB via a save-system in engine layer. Never localStorage for game data.
- **Consequences:** Async API. Must use worker for large saves to avoid main-thread blocking.

## ADR-006: Three.js WebGPURenderer with WebGL2 Fallback

- **Date:** P3
- **Status:** Accepted
- **Context:** Need a modern 3D renderer with WebGPU + TSL support and automatic WebGL2 fallback.
- **Decision:** Three.js r186 `WebGPURenderer` from `three/webgpu`. Automatic WebGL2 backend fallback.
- **Docs:** https://threejs.org/docs/pages/WebGPURenderer.html, https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- **Key facts:**
  - Import: `import * as THREE from 'three/webgpu'`
  - TSL: `import { ... } from 'three/tsl'`
  - Init: `await renderer.init()` or `setAnimationLoop()`
  - Backend detection: `renderer.backend.isWebGPUBackend` (after init)
  - Force WebGL2: `new WebGPURenderer({ forceWebGL: true })`
  - Timestamp queries: `timestamp-query` feature (WebGPU) or `EXT_disjoint_timer_query_webgl2` (WebGL2)
- **Consequences:**
  - No `ShaderMaterial` / `onBeforeCompile` — must use TSL node materials
  - No `EffectComposer` — use `RenderPipeline` for post-processing
  - Async initialization required before first render
  - One codebase covers both WebGPU and WebGL2

## ADR-007: Custom Minimal ECS Instead of bitECS

- **Date:** P4
- **Status:** Accepted
- **Context:** bitECS 0.4 API is complex with TypeScript strict mode. The new API uses `registerComponent`, `query`, and typed component references that don't integrate cleanly with strict TypeScript.
- **Decision:** Implement a custom minimal ECS with class-based components and a simple World API.
- **Trade-offs:**
  - ✅ Full TypeScript support with strict mode
  - ✅ Simple, debuggable API
  - ✅ Easy to extend and modify
  - ❌ Less performance than bitECS (not using SoA/bitmasks)
  - ❌ Fewer advanced features (no automatic query caching)
- **Consequences:**
  - Components are classes that implement `Component` interface
  - World manages entities and components with Maps
  - Query system iterates entities (O(n) per query)
  - Sufficient for current scale (<1000 entities)
  - Can migrate to bitECS later if performance becomes critical

## ADR-008: 128m Chunk Size for Terrain

- **Date:** P5
- **Status:** Accepted
- **Context:** Need to choose chunk size for procedural terrain generation. Balances memory usage, generation time, LOD transitions, and view distance.
- **Decision:** 128m chunks with 4 LOD levels (128, 64, 32, 16 resolution).
- **Justification:**
  - **Memory**: 128×128 heightmap = 16KB (Float32Array). Acceptable for hundreds of chunks.
  - **Generation time**: ~5-10ms per chunk in worker. Fast enough for streaming.
  - **LOD transitions**: 128m provides good granularity for 4 LOD levels.
  - **View distance**: 800m = ~6 chunks radius. Manageable memory footprint.
- **Alternatives considered:**
  - 64m: Too many chunks, overhead dominates
  - 256m: Too coarse, LOD transitions too jarring
  - 512m: Generation too slow, memory spikes
- **Consequences:**
  - Chunk loading/unloading every ~128m of camera movement
  - LOD switching at 200m, 400m, 800m, 1600m distances
  - Zero-copy typed array transfer from worker (heights, normals, biomes)
  - Shared heightAt(x,z) API works across all LOD levels

## ADR-009: Streaming System Architecture

- **Date:** P6
- **Status:** Accepted
- **Context:** Need efficient chunk streaming for large open world. Must handle priority loading, worker pooling, caching, and memory management.
- **Decision:** Custom streaming system with priority queue, worker pool, IndexedDB cache, LRU eviction, and CellContentProvider interface.
- **Key components:**
  - **PriorityQueue**: Orders chunks by distance + velocity bonus
  - **WorkerPool**: 4 workers with task cancellation support
  - **ChunkCache**: IndexedDB with 7-day expiration
  - **StreamingManager**: Orchestrates loading/unloading with time-sliced uploads
  - **CellContentProvider**: Extensible interface for vegetation/NPCs/settlements
- **Player-centered rings:**
  - Full (400m): LOD 0, 128×128
  - Near (800m): LOD 1, 64×64
  - Far (1600m): LOD 2, 32×32
  - Unloaded (2400m): LOD 3, 16×16, then unload
- **Performance targets:**
  - Max 2 GPU uploads per frame (time-sliced)
  - Max 100 chunks in memory (LRU eviction)
  - 4 concurrent worker tasks
- **Alternatives considered:**
  - Simple distance-based loading: No priority, no caching, poor performance
  - Third-party streaming library: Less control, harder to integrate with custom ECS
- **Consequences:**
  - Smooth streaming with no frame hitches
  - Efficient memory usage with bounded chunk count
  - Extensible content system via CellContentProvider
  - Persistent cache reduces regeneration on reload
