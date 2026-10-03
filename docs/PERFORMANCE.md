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

## Vegetation Instance Budgets

### Per-Tier Limits

| Tier | Trees | Grass Blades | Rocks | Props | Total Instances | Draw Calls |
|------|-------|--------------|-------|-------|-----------------|------------|
| Low | 50 | 1,000 | 20 | 5 | 1,075 | ~10 |
| Medium | 150 | 5,000 | 50 | 15 | 5,215 | ~25 |
| High | 500 | 20,000 | 100 | 30 | 20,630 | ~50 |

### Per-Chunk Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Max instances per chunk | 500 | Trees + rocks + props |
| Max grass blades per chunk | 10,000 | Near-field only |
| Max draw calls per chunk | 10 | Instanced rendering |

### Culling Efficiency

| Culling Type | Reduction | Time |
|--------------|-----------|------|
| Distance culling | ~40% | 0.1ms/chunk |
| Frustum culling | ~30% | 0.3ms/chunk |
| Combined | ~60% | 0.4ms/chunk |

### LOD Distribution

| Distance | LOD | Visible % | Detail |
|----------|-----|-----------|--------|
| 0-50m | 0 | 10% | Full mesh |
| 50-150m | 1 | 30% | Reduced mesh |
| 150-500m | 2 | 60% | Billboard |

### Memory Budget

| Component | Memory | Notes |
|-----------|--------|-------|
| Vegetation meshes | ~50 MB | Instanced, shared geometry |
| Grass meshes | ~30 MB | High density, simple geometry |
| Billboard textures | ~10 MB | 128x256 per asset |
| Total vegetation | ~90 MB | Within 512MB budget |

---

## HUMAN-GPU Measurements

> Paste benchmark results from `/bench.html` here. Format: one section per run.

### Template

```
Run: [date]
Hardware: [CPU, GPU, RAM]
Browser: [name + version]
Backend: [WebGPU | WebGL2]
Adapter: [vendor, device, architecture]
Build ID: [from bench output]

| Step            | Instances | Particles | Avg FPS | Avg ms | 1% Low ms |
| --------------- | --------- | --------- | ------- | ------ | --------- |
| 1k instances    | 1,000     | 0         |         |        |           |
| 10k instances   | 10,000    | 0         |         |        |           |
| 50k instances   | 50,000    | 0         |         |        |           |
| 200k instances  | 200,000   | 0         |         |        |           |
| + particles     | 200,000   | 100,000   |         |        |           |
```

_Awaiting human test results._
