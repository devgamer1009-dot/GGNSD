/**
 * Render module exports
 * Engine layer — never imports game
 */

export { Renderer, type RendererOptions, type RendererInfo } from './Renderer.js';
export { DebugOverlay } from './DebugOverlay.js';
export { detectCapabilities, isWebGPUSupported, isWebGL2Supported, type GPUCapabilities } from './CapabilityDetector.js';
