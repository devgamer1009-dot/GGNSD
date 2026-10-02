# Performance — CrownFall

> All numbers are TARGET until measured on real hardware.

## Frame Budget (60 fps = 16.67ms)

| Phase           | Budget (ms) | Notes                        |
| --------------- | ----------- | ---------------------------- |
| Simulation      | 4.0         | Fixed tick, worker offloaded |
| Render (CPU)    | 3.0         | Culling, sort, upload        |
| Render (GPU)    | 8.0         | Draw calls, shaders          |
| UI (React)      | 1.0         | Diff + commit                |
| Overhead        | 0.67        | GC, events, misc             |
| **Total**       | **16.67**   |                              |

## Targets

| Metric                    | Target            | Status   |
| ------------------------- | ----------------- | -------- |
| High-end 60fps            | ≥ 60 fps          | TARGET   |
| Low-tier (4GB VRAM laptop)| ≥ 30 fps floor    | TARGET   |
| JS per frame              | ≤ 5 ms            | TARGET   |
| Allocations in frame loop | 0                 | TARGET   |
| Main thread blocking      | 0 ms > 16ms       | TARGET   |
| Initial load (FCP)        | < 2s on 4G        | TARGET   |
| Bundle size (gzipped)     | < 500 KB          | TARGET   |

## Rules

1. **Zero alloc in frame loops.** Use object pools for Vec2, Vec3, Entity refs.
2. **No main-thread blocking.** Heavy work → Web Workers.
3. **No GC spikes.** Pre-allocate arrays. Reuse buffers.
4. **Measure before optimizing.** Use `performance.mark()` / `performance.measure()`.
5. **Render separate from sim.** Sim runs on fixed tick; render interpolates.

## Measurement Method

When reporting results, always state:
- Hardware (CPU, GPU, RAM)
- Browser + version
- Scene complexity (entity count, draw calls)
- Tool used (Chrome DevTools, about:performance, etc.)

## Anti-Patterns (banned)

- `new Vec3()` inside render/sim loops → use pool
- `Array.filter().map()` chains on large arrays per frame → use in-place loops
- `JSON.stringify()` on main thread → use worker
- `document.querySelector()` per frame → cache refs
