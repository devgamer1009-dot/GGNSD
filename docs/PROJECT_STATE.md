# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P2 — Design Bible** ✅ COMPLETE

## What Exists

- Vite 6 + React 18 + TypeScript 5.7 strict
- ESLint 9 (flat config) + Prettier 3.3 + Vitest 2.0
- `npm run check` = typecheck + lint + test + build
- Layer structure: engine, game, content, ui, workers, debug
- Layer enforcement: dependency-cruiser + ESLint restricted imports
- Docs: ARCHITECTURE, CONVENTIONS, PERFORMANCE, DECISIONS, ROADMAP, ENVIRONMENT
- Design Bible: WORLD.md, GAMEPLAY.md, CONTENT_PLAN.md (all <150 lines)
- Minimal boot: canvas + "boot OK" message

## What Is Verified

- ✅ `npm install` succeeds
- ✅ `npm run check` passes (typecheck + lint + test + build)
- ✅ Layer rule proven: intentional violation detected by dep-cruiser, then fixed
- ✅ `npm run dev` serves on port 3000
- ✅ Canvas renders, "boot OK" displays
- ✅ Design Bible complete: 3 files, all under 150 lines
- ✅ Brief verbatim in each design doc
- ✅ Scope tiers defined: SLICE / BETA / FULL with exact counts
- ✅ Cut list in priority order

## Known Bugs

- None (P2 is design docs only)

## Next Prompt

**P3 — Math Library**
- Vec2, Vec3, Mat4 with object pools
- AABB, ray, transform utilities
- Zero-allocation design
- Unit tests for all operations

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `docs/design/GAMEPLAY.md` (for math requirements)
6. `src/engine/index.ts`
7. `tsconfig.json`
8. `.depcruise.cjs`

## Session Notes

- P2 completed in ~30 tool calls (within 30 budget)
- Design Bible: 3 files (WORLD, GAMEPLAY, CONTENT_PLAN)
- All design docs under 150 lines
- Brief verbatim preserved in each file
- Scope tiers: SLICE (Greenmarch, 30 min), BETA (3 regions, 4-6 hrs), FULL (5 regions, 20-30 hrs)
- Cut list: 10 items in priority order (photo filters → dragon)
- No images used (design docs only)
- No TODO left behind
