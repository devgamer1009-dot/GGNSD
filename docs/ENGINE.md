# Engine Architecture

## Entity Lifecycle

Entities are created via `world.createEntity()` and return a unique numeric ID. Components are added with `world.addComponent(entity, component)` and removed with `world.removeComponent(entity, ComponentClass)`. Entities are destroyed with `world.destroyEntity(entity)`, which automatically removes all components.

```typescript
const entity = world.createEntity();
world.addComponent(entity, new Position(0, 0, 0));
world.addComponent(entity, new Velocity(1, 0, 0));

// Query entities with specific components
const movingEntities = world.query(Position, Velocity);
```

## System Order

Systems execute in registration order during each game tick. The recommended order is:

1. **Input System** — Poll input devices, update action states
2. **AI System** — Process NPC decisions and behaviors
3. **Physics System** — Apply forces, resolve collisions
4. **Movement System** — Update positions based on velocities
5. **Animation System** — Update animation states
6. **Render System** — Sync ECS state to Three.js scene graph

Systems are plain functions that receive the world and delta time:

```typescript
function movementSystem(world: World, dt: number) {
  const entities = world.query(Position, Velocity);
  for (const entity of entities) {
    const pos = world.getComponent(entity, Position);
    const vel = world.getComponent(entity, Velocity);
    if (pos && vel) {
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      pos.z += vel.z * dt;
    }
  }
}
```

## Resource Lifetime

Resources (textures, geometries, materials) are reference-counted. When a resource is loaded, it's stored in the resource manager with a refcount of 1. Additional references increment the count. When the count reaches 0, the resource is automatically disposed.

```typescript
const texture = resourceManager.load('texture', 'assets/brick.png');
// refcount = 1

resourceManager.acquire(texture);
// refcount = 2

resourceManager.release(texture);
// refcount = 1

resourceManager.release(texture);
// refcount = 0, texture disposed
```

## State Separation

The engine maintains strict separation between different state types:

- **Engine State** — Core systems (ECS, input, events, resources)
- **Game State** — Game-specific logic, entities, components
- **Render State** — Three.js scene graph, materials, geometries
- **Persistent State** — Save data, player progress
- **Transient State** — Frame-local data, temporary calculations

This separation ensures clean boundaries and prevents coupling between systems.

## How Future Systems Plug In

New systems follow a consistent pattern:

1. **Define Components** — Create component classes that implement `Component`
2. **Create System Function** — Write a function that queries entities and updates components
3. **Register in Game Loop** — Add the system to the update loop in the desired order
4. **Emit Events** — Use the event bus to communicate between systems without direct coupling

Example:

```typescript
// 1. Define component
class Health implements Component {
  constructor(public current: number, public max: number) {}
}

// 2. Create system
function damageSystem(world: World, events: EventBus) {
  events.on('damage', ({ entity, amount }) => {
    const health = world.getComponent(entity, Health);
    if (health) {
      health.current -= amount;
      if (health.current <= 0) {
        events.emit('death', { entity });
      }
    }
  });
}

// 3. Register in game loop
gameLoop.start({
  update: (dt) => {
    inputSystem.update();
    movementSystem(world, dt);
    damageSystem(world, events);
    renderSystem(world, scene);
  },
  render: (alpha) => {
    renderer.render(scene, camera);
  }
});
```

## Performance Guidelines

- **Zero allocations in frame loops** — Reuse objects, use object pools
- **Batch operations** — Query once per system, iterate results
- **Avoid deep nesting** — Keep systems flat and focused
- **Use typed arrays** — Prefer Float32Array over object arrays for math
- **Profile before optimizing** — Use the debug overlay (F3) to identify bottlenecks

## Debugging

- **F3** — Toggle debug overlay (FPS, frame time, draw calls)
- **`** — Toggle debug console (run commands like `pos`, `entities`)
- **Console** — Engine logs initialization, errors, and warnings

## Testing

All engine systems have unit tests in `tests/`:

- `tests/math.test.ts` — Vec2, Vec3, Mat4 operations
- `tests/ecs.test.ts` — Entity lifecycle, component management
- `tests/events.test.ts` — Event bus pub/sub
- `tests/rng.test.ts` — Seeded random number generation

Run tests with `npm test`.
