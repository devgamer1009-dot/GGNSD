/**
 * Engine layer — generic systems that never import from game.
 *
 * Layers allowed to import: (none — engine is the bottom)
 * Layers that may import engine: game, ui, workers, debug
 */
export const ENGINE_VERSION = '0.1.0';

// Render module
export * from './render/index.js';
