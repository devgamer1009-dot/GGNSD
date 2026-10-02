# Project State — CrownFall

> Updated at end of every session. Read this FIRST.

## Current Phase

**P1 — Foundation** ✅ COMPLETE

## What Exists

- Vite 6 + React 18 + TypeScript 5.7 strict
- ESLint 9 (flat config) + Prettier 3.3 + Vitest 2.0
- `npm run check` = typecheck + lint + test + build
- Layer structure: engine, game, content, ui, workers, debug
- Layer enforcement: dependency-cruiser + ESLint restricted imports
- Docs: ARCHITECTURE, CONVENTIONS, PERFORMANCE, DECISIONS, ROADMAP, ENVIRONMENT
- Minimal boot: canvas + "boot OK" message

## What Is Verified

- ✅ `npm install` succeeds
- ✅ `npm run check` passes (typecheck + lint + test + build)
- ✅ Layer rule proven: intentional violation detected by dep-cruiser, then fixed
- ✅ `npm run dev` serves on port 3000
- ✅ Canvas renders, "boot OK" displays

## Known Bugs

- None (P1 is scaffold only)

## Next Prompt

**P2 — Math Library**
- Vec2, Vec3, Mat4 with object pools
- AABB, ray, transform utilities
- Zero-allocation design
- Unit tests for all operations

## Files Next Session Must Read

1. `docs/PROJECT_STATE.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/PERFORMANCE.md`
5. `src/engine/index.ts`
6. `tsconfig.json`
7. `.depcruise.cjs`

## Session Notes

- P1 completed in ~25 tool calls (within 30 budget)
- All docs under 120 lines
- No images used (procedural/scaffold only)
- No TODO left behind
