/**
 * AI LOD and Update Scheduler
 * P14 - AI level of detail and time-sliced updates
 */

export enum AILodLevel {
  FULL = 'full',       // Full AI, near player
  REDUCED = 'reduced', // Simplified AI, medium distance
  STATISTICAL = 'statistical', // No AI, just statistics, far distance
}

export class AILodManager {
  private fullDistance: number = 50;
  private reducedDistance: number = 150;
  private statisticalDistance: number = 300;

  /**
   * Get LOD level based on distance
   */
  getLodLevel(distance: number): AILodLevel {
    if (distance <= this.fullDistance) {
      return AILodLevel.FULL;
    } else if (distance <= this.reducedDistance) {
      return AILodLevel.REDUCED;
    } else if (distance <= this.statisticalDistance) {
      return AILodLevel.STATISTICAL;
    }
    return AILodLevel.STATISTICAL;
  }

  /**
   * Set distance thresholds
   */
  setDistances(full: number, reduced: number, statistical: number): void {
    this.fullDistance = full;
    this.reducedDistance = reduced;
    this.statisticalDistance = statistical;
  }
}

export class AIUpdateScheduler {
  private budgetMs: number = 1.5; // 1.5ms per frame
  private entities: Array<{ id: string; updateFn: (dt: number) => void; priority: number }> = [];
  private lastUpdateTime: number = 0;

  /**
   * Register entity for updates
   */
  registerEntity(id: string, updateFn: (dt: number) => void, priority: number = 1): void {
    this.entities.push({ id, updateFn, priority });
    // Sort by priority (higher priority first)
    this.entities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unregister entity
   */
  unregisterEntity(id: string): void {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  /**
   * Update entities within time budget
   */
  update(deltaTime: number): { updated: number; skipped: number; timeUsed: number } {
    const startTime = performance.now();
    let updated = 0;
    let skipped = 0;

    for (const entity of this.entities) {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;

      // Check if we've exceeded budget
      if (elapsed >= this.budgetMs) {
        skipped = this.entities.length - updated;
        break;
      }

      // Update entity
      entity.updateFn(deltaTime);
      updated++;
    }

    const timeUsed = performance.now() - startTime;
    this.lastUpdateTime = timeUsed;

    return { updated, skipped, timeUsed };
  }

  /**
   * Set time budget
   */
  setBudget(budgetMs: number): void {
    this.budgetMs = budgetMs;
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.length;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities = [];
  }
}
