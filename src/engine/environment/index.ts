/**
 * Environment Module - Complete environment system for CrownFall
 * Includes time, weather, sky, water, shadows, and particles
 */

export { TimeSystem, DayPhase } from './TimeSystem.js';
export type { CelestialPosition } from './TimeSystem.js';

export { WeatherSystem, WeatherState } from './WeatherSystem.js';
export type { WindSample, WeatherTransition } from './WeatherSystem.js';

export { SkySystem, SkyQuality } from './SkySystem.js';

export { WaterSystem, WaterQuality } from './WaterSystem.js';

export { ShadowSystem, ShadowQuality } from './ShadowSystem.js';
export type { CascadeConfig } from './ShadowSystem.js';

export { ParticleSystem, ParticleQuality } from './ParticleSystem.js';

export { EnvironmentManager } from './EnvironmentManager.js';
export type { EnvironmentQuality, EnvironmentAPI } from './EnvironmentManager.js';

export { EnvironmentDebugPanel } from './DebugPanel.js';
