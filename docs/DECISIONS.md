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
