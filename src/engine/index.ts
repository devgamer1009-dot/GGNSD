/**
 * Engine layer — generic systems that never import from game.
 *
 * Layers allowed to import: (none — engine is the bottom)
 * Layers that may import engine: game, ui, workers, debug
 */
export const ENGINE_VERSION = '0.1.0';

// Core modules
export * from './math/index.js';
export * from './ecs/index.js';
export * from './events/index.js';
export * from './input/index.js';
export * from './utils/index.js';
export * from './scene/index.js';
export * from './loop/index.js';
export * from './debug/index.js';

// Render module
export * from './render/index.js';

// Terrain module
export * from './terrain/index.js';

// Streaming module
export * from './streaming/index.js';

// Environment module
export * from './environment/index.js';

// Asset module
export * from './assets/index.js';

// Physics module
export * from './physics/index.js';

// Camera module
export * from './camera/index.js';

// Vegetation module
export * from './vegetation/index.js';

// Characters module
export * from './characters/index.js';

// Combat module
export * from './combat/index.js';

// Settlements module
export * from './settlements/index.js';
