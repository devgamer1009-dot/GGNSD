/**
 * LOD Selection
 * P8 - Distance-based LOD selection with hysteresis
 */

import type { LODLevel } from './types.js';

/**
 * LOD selector with hysteresis to prevent flickering
 */
export class LODSelector {
  private hysteresisFactor: number;
  private currentLOD = new Map<string, number>();

  constructor(hysteresisFactor: number = 0.1) {
    this.hysteresisFactor = hysteresisFactor;
  }

  /**
   * Select LOD level based on distance
   */
  select(assetId: string, lodChain: LODLevel[], distance: number): number {
    const previousLOD = this.currentLOD.get(assetId) ?? 0;

    // Find appropriate LOD level
    let selectedLevel = 0;
    for (const lod of lodChain) {
      if (distance <= lod.maxDistance) {
        selectedLevel = lod.level;
        break;
      }
      selectedLevel = lod.level;
    }

    // Apply hysteresis to prevent flickering
    if (selectedLevel !== previousLOD) {
      const diff = Math.abs(selectedLevel - previousLOD);
      const threshold = diff * this.hysteresisFactor;

      // Only switch if distance change is significant
      if (diff > threshold) {
        this.currentLOD.set(assetId, selectedLevel);
        return selectedLevel;
      }

      return previousLOD;
    }

    return selectedLevel;
  }

  /**
   * Get current LOD for asset
   */
  getCurrentLOD(assetId: string): number {
    return this.currentLOD.get(assetId) ?? 0;
  }

  /**
   * Reset LOD tracking
   */
  reset(): void {
    this.currentLOD.clear();
  }

  /**
   * Set hysteresis factor
   */
  setHysteresis(factor: number): void {
    this.hysteresisFactor = factor;
  }
}

/**
 * Create default LOD chain for parametric assets
 */
export function createDefaultLODChain(assetId: string): LODLevel[] {
  return [
    { level: 0, maxDistance: 50, assetId: `${assetId}_lod0` },
    { level: 1, maxDistance: 100, assetId: `${assetId}_lod1` },
    { level: 2, maxDistance: 200, assetId: `${assetId}_lod2` },
    { level: 3, maxDistance: 500, assetId: `${assetId}_lod3` },
  ];
}
