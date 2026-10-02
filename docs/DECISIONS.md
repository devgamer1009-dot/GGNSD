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
