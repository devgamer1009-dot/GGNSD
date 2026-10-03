/**
 * Save Migrations
 * P18 - Version migration system for save data
 */

import { Migration, SaveData, CURRENT_SAVE_VERSION } from './SaveTypes.js';

export class SaveMigrations {
  private migrations: Migration[] = [];

  constructor() {
    this.registerDefaultMigrations();
  }

  /**
   * Register default migrations
   */
  private registerDefaultMigrations(): void {
    // Example: Migration from 0.9.0 to 1.0.0
    this.register({
      fromVersion: '0.9.0',
      toVersion: '1.0.0',
      migrate: (data: any) => {
        // Add new fields introduced in 1.0.0
        if (!data.settings) {
          data.settings = {
            graphics: { tier: 'medium', autoDetect: true },
            audio: { masterVolume: 0.7, sfxVolume: 1.0, musicVolume: 1.0, ambienceVolume: 1.0 },
            controls: { keyBindings: {}, mouseSensitivity: 50, invertY: false },
            accessibility: { uiScale: 1.0, colorblindMode: 'none', subtitlesEnabled: true, reducedShake: false, holdToToggle: false },
          };
        }
        return data;
      },
    });

    // Future migrations would be added here
    // this.register({
    //   fromVersion: '1.0.0',
    //   toVersion: '1.1.0',
    //   migrate: (data: any) => { ... }
    // });
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
    // Sort migrations by version
    this.migrations.sort((a, b) => {
      return this.compareVersions(a.fromVersion, b.fromVersion);
    });
  }

  /**
   * Migrate save data to current version
   */
  migrate(data: any): SaveData {
    let currentData = { ...data };
    let currentVersion = currentData.version || '0.0.0';

    // Apply migrations in order
    while (currentVersion !== CURRENT_SAVE_VERSION) {
      const migration = this.migrations.find(m => m.fromVersion === currentVersion);
      
      if (!migration) {
        throw new Error(`No migration found from version ${currentVersion} to ${CURRENT_SAVE_VERSION}`);
      }

      currentData = migration.migrate(currentData);
      currentData.version = migration.toVersion;
      currentVersion = migration.toVersion;
    }

    return currentData as SaveData;
  }

  /**
   * Check if migration is needed
   */
  needsMigration(version: string): boolean {
    return this.compareVersions(version, CURRENT_SAVE_VERSION) < 0;
  }

  /**
   * Compare two version strings
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;

      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }

    return 0;
  }

  /**
   * Get all registered migrations
   */
  getMigrations(): Migration[] {
    return [...this.migrations];
  }
}
