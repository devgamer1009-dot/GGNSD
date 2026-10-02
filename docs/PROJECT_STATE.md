# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P3 — Renderer + Benchmark** ✅ COMPLETE

## What Exists

- Vite 6 + React 18 + TypeScript 5.7 strict
- ESLint 9 (flat config) + Prettier 3.3 + Vitest 2.0
- `npm run check` = typecheck + lint + test + build
- Layer structure: engine, game, content, ui, workers, debug
- Layer enforcement: dependency-cruiser + ESLint restricted imports
- Docs: ARCHITECTURE, CONVENTIONS, PERFORMANCE, DECISIONS, ROADMAP, ENVIRONMENT
- Design Bible: WORLD.md, GAMEPLAY.md, CONTENT_PLAN.md (all <150 lines)
- **Renderer (P3):** Three.js r186 WebGPURenderer with WebGL2 fallback
- **Capability detection:** GPU adapter info, backend detection
- **Debug overlay (F3):** FPS, frame ms, 1% low, draw calls, triangles, backend, GPU
- **Benchmark page:** `/bench.html` with stress test (1k→200k instances + particles)
- Boot screen: 3D cube with "boot OK" + backend info

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

## Known Bugs

- Bundle size warning: 928KB (262KB gzipped) due to Three.js. Consider code-splitting in future.
- GPU timestamp queries not yet implemented (shows "n/a" in debug overlay)

## Next Prompt

**P4 — Math Library**
- Vec2, Vec3, Mat4 with object pools
- AABB, ray, transform utilities
- Zero-allocation design
- Unit tests for all operations

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `docs/DECISIONS.md` (ADR-006: renderer)
6. `docs/design/GAMEPLAY.md` (for math requirements)
7. `src/engine/index.ts`
8. `src/engine/render/Renderer.ts`
9. `tsconfig.json`
10. `.depcruise.cjs`

## Session Notes

- P3 completed in ~30 tool calls (within 30 budget)
- Installed: three@0.186.1, @types/three, @webgpu/types, stats-gl
- Renderer: Three.js WebGPURenderer with automatic WebGL2 fallback
- Capability detection: GPU adapter info, backend detection
- Debug overlay (F3): FPS, frame ms, 1% low, draw calls, triangles, backend, GPU
- Benchmark page: `/bench.html` with CDN-loaded Three.js, stress test (1k→200k instances + particles)
- ADR-006 logged: Three.js WebGPURenderer decision
- PERFORMANCE.md: HUMAN-GPU section added (awaiting human test results)
- Build: 928KB (262KB gzipped) — large due to Three.js, expected
- No images used (all procedural)
- No TODO left behind
