# Environment Probe

> Generated P1 — CrownFall Foundation

## Runtime

| Tool       | Version / Status                     |
| ---------- | ------------------------------------ |
| Node.js    | Available (sandbox runtime)          |
| npm        | Available (sandbox runtime)          |
| TypeScript | 5.7+ (installed via devDependencies) |
| Vite       | 6.3+ (installed via devDependencies) |
| Vitest     | 2.0+ (installed P1)                  |
| ESLint     | 9.x flat config (installed P1)       |
| Prettier   | 3.3+ (installed P1)                  |
| dep-cruiser| 16+ (installed P1)                   |

## Build / Check

| Command           | Status         |
| ----------------- | -------------- |
| `npm run build`   | ✅ Vite build  |
| `npm run dev`     | ✅ Vite dev    |
| `npm run check`   | ✅ typecheck + lint + test + build (P1) |
| `npx vitest run`  | ✅ headless    |
| `npx tsc --noEmit`| ✅ strict      |

## Browser

- No headless browser in sandbox. Visual tests require human on local machine.
- `npm run dev` serves on `0.0.0.0:3000`.

## Filesystem Layout (post-P1)

```
src/engine/   — generic, never imports game
src/game/     — game logic, imports engine
src/content/  — static data (JSON/TS)
src/ui/       — React components
src/workers/  — Web Workers
src/debug/    — debug overlays
docs/         — project documentation
tests/        — vitest specs
```

## Notes

- Sandbox has no persistent browser; all rendering verified via build success + human test.
- No backend. Saves = IndexedDB. Heavy work = Web Workers.
