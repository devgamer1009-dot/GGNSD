# Architecture — CrownFall

> Layers, threads, state ownership.

## Layers (strict dependency direction ↓)

```
┌─────────────────────────────────────────┐
│  UI (React)  — presentation only        │  ← never owns sim state
├─────────────────────────────────────────┤
│  Game          — rules, entities, AI    │  ← imports engine, content
├─────────────────────────────────────────┤
│  Content       — static data / configs  │  ← imports engine only
├─────────────────────────────────────────┤
│  Engine        — generic systems        │  ← imports NOTHING above
│  (math, ECS, renderer, input, audio,    │
│   physics, save/load, worker bridge)    │
└─────────────────────────────────────────┘
```

**Enforcement:** `dependency-cruiser` (`.depcruise.cjs`) + ESLint `no-restricted-imports`.

## Threads

| Thread       | Purpose                                |
| ------------ | -------------------------------------- |
| Main         | Rendering (WebGL), input, UI (React)   |
| Worker: sim  | Fixed-tick simulation (AI, physics)    |
| Worker: gen  | Procedural generation (terrain, loot)  |
| Worker: save | IndexedDB serialization (off main)     |

Communication: structured-cloned messages. No shared memory.

## State Ownership

| State          | Owner       | Persistence        |
| -------------- | ----------- | ------------------ |
| Simulation     | Game/Engine | Transient (per-tick) |
| Render cache   | Renderer    | Transient           |
| Persistent     | Save system | IndexedDB           |
| UI local       | React       | Transient           |

**Rule:** Simulation is SEPARATE from rendering. Render reads a snapshot; it never mutates sim state.

## Key Principles

1. Engine is generic — zero game-specific code.
2. UI frameworks (React) NEVER own simulation state.
3. Simulation runs on fixed timestep; rendering interpolates.
4. Heavy work runs in Web Workers; main thread stays <5ms/frame.
5. All saves go through IndexedDB; never localStorage for game data.
