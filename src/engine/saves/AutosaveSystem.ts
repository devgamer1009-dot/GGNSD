/**
 * Autosave System
 * P18 - Autosave at safe points
 */

export enum SavePoint {
  MANUAL = 'manual',
  QUEST_COMPLETE = 'quest_complete',
  LOCATION_DISCOVERED = 'location_discovered',
  TIME_INTERVAL = 'time_interval',
  GAME_PAUSE = 'game_pause',
}

export interface AutosaveConfig {
  enabled: boolean;
  intervalSeconds: number; // For TIME_INTERVAL save points
  minTimeBetweenSaves: number; // Minimum seconds between autosaves
}

export class AutosaveSystem {
  private config: AutosaveConfig;
  private lastSaveTime: number = 0;
  private timeIntervalHandle: number | null = null;
  private onSaveCallback: ((savePoint: SavePoint) => Promise<void>) | null = null;

  constructor(config: Partial<AutosaveConfig> = {}) {
    this.config = {
      enabled: true,
      intervalSeconds: 300, // 5 minutes
      minTimeBetweenSaves: 30, // 30 seconds
      ...config,
    };
  }

  /**
   * Set save callback
   */
  onSave(callback: (savePoint: SavePoint) => Promise<void>): void {
    this.onSaveCallback = callback;
  }

  /**
   * Start time-based autosave
   */
  startTimeAutosave(): void {
    if (this.timeIntervalHandle !== null) return;

    this.timeIntervalHandle = window.setInterval(() => {
      this.triggerSave(SavePoint.TIME_INTERVAL);
    }, this.config.intervalSeconds * 1000);
  }

  /**
   * Stop time-based autosave
   */
  stopTimeAutosave(): void {
    if (this.timeIntervalHandle !== null) {
      window.clearInterval(this.timeIntervalHandle);
      this.timeIntervalHandle = null;
    }
  }

  /**
   * Trigger save at specific save point
   */
  async triggerSave(savePoint: SavePoint): Promise<boolean> {
    if (!this.config.enabled) return false;

    // Check minimum time between saves
    const now = Date.now();
    const timeSinceLastSave = (now - this.lastSaveTime) / 1000;
    
    if (timeSinceLastSave < this.config.minTimeBetweenSaves) {
      console.log(`[Autosave] Skipped ${savePoint} - too soon since last save (${timeSinceLastSave.toFixed(1)}s)`);
      return false;
    }

    if (!this.onSaveCallback) {
      console.warn('[Autosave] No save callback registered');
      return false;
    }

    try {
      await this.onSaveCallback(savePoint);
      this.lastSaveTime = now;
      console.log(`[Autosave] Saved at ${savePoint}`);
      return true;
    } catch (error) {
      console.error('[Autosave] Failed to save:', error);
      return false;
    }
  }

  /**
   * Trigger save on quest completion
   */
  async onQuestComplete(): Promise<boolean> {
    return this.triggerSave(SavePoint.QUEST_COMPLETE);
  }

  /**
   * Trigger save on location discovery
   */
  async onLocationDiscovered(): Promise<boolean> {
    return this.triggerSave(SavePoint.LOCATION_DISCOVERED);
  }

  /**
   * Trigger save on game pause
   */
  async onGamePause(): Promise<boolean> {
    return this.triggerSave(SavePoint.GAME_PAUSE);
  }

  /**
   * Enable/disable autosave
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stopTimeAutosave();
    } else if (this.config.intervalSeconds > 0) {
      this.startTimeAutosave();
    }
  }

  /**
   * Check if autosave is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set autosave interval
   */
  setInterval(seconds: number): void {
    this.config.intervalSeconds = seconds;
    
    // Restart interval if running
    if (this.timeIntervalHandle !== null) {
      this.stopTimeAutosave();
      if (this.config.enabled) {
        this.startTimeAutosave();
      }
    }
  }

  /**
   * Get time since last save
   */
  getTimeSinceLastSave(): number {
    return (Date.now() - this.lastSaveTime) / 1000;
  }

  /**
   * Dispose autosave system
   */
  dispose(): void {
    this.stopTimeAutosave();
    this.onSaveCallback = null;
  }
}
