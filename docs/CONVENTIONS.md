# Conventions — CrownFall

## Code

- TypeScript strict mode. No `any` without explicit `// @ts-expect-error` + reason.
- One concern per file, max 250 lines.
- No TODO left behind — file an issue or delete it.
- Engine code never imports game code. Enforced by dep-cruiser + ESLint.
- Use `const` by default. `let` only when reassignment is required.
- Prefer named exports over default exports (except React components).

## Naming

| Thing           | Convention           | Example              |
| --------------- | -------------------- | -------------------- |
| Files           | kebab-case           | `vec2.ts`            |
| Types / Classes | PascalCase           | `Vec2`, `EntityManager` |
| Functions       | camelCase            | `computeDamage()`    |
| Constants       | SCREAMING_SNAKE_CASE | `MAX_HEALTH`         |
| Enums           | PascalCase           | `DamageType.Fire`    |

## Commits

- Conventional: `feat(engine): add vec2 pool`
- Scope = layer name (engine, game, ui, content, workers, debug, docs)

## Testing

- Unit tests in `tests/` mirroring `src/` structure.
- Every engine system has ≥1 test.
- No test may be weakened to pass CI.

## Performance

- Zero allocations in frame loops (use object pools).
- All perf numbers are TARGET until measured on real hardware.
- Profile before optimizing. No premature optimization.

## Documentation

- Every doc < 120 lines.
- ADRs in `docs/DECISIONS.md` (Architecture Decision Records).
- Update `PROJECT_STATE.md` at end of every session.
