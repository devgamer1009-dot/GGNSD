/**
 * GPU upload queue
 * Time-sliced upload management to prevent frame hitches
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export interface UploadTask {
  chunkData: TerrainChunkData;
  resolve: () => void;
}

export class UploadQueue {
  private queue: UploadTask[] = [];
  private budgetPerFrame: number;

  constructor(budgetPerFrame: number = 2) {
    this.budgetPerFrame = budgetPerFrame;
  }

  /**
   * Add upload task to queue
   */
  enqueue(chunkData: TerrainChunkData): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ chunkData, resolve });
    });
  }

  /**
   * Process queued uploads (call once per frame)
   */
  process(): void {
    let processed = 0;
    
    while (this.queue.length > 0 && processed < this.budgetPerFrame) {
      const task = this.queue.shift()!;
      task.resolve();
      processed++;
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all pending uploads
   */
  clear(): void {
    // Resolve all pending tasks to prevent memory leaks
    for (const task of this.queue) {
      task.resolve();
    }
    this.queue = [];
  }

  /**
   * Set budget per frame
   */
  setBudget(budget: number): void {
    this.budgetPerFrame = budget;
  }

  /**
   * Get current budget
   */
  getBudget(): number {
    return this.budgetPerFrame;
  }
}
