/**
 * Save Version Compatibility Checker
 * P24 - Validates save file versions and handles migrations
 */

import { SaveData, CURRENT_SAVE_VERSION } from '../saves/SaveTypes.js';
import { SaveMigrations } from '../saves/SaveMigrations.js';

export interface CompatibilityCheck {
  compatible: boolean;
  currentVersion: string;
  saveVersion: string;
  needsMigration: boolean;
  canMigrate: boolean;
  migrationPath?: string[];
  error?: string;
}

export class SaveCompatibilityChecker {
  private migrations: SaveMigrations;

  constructor() {
    this.migrations = new SaveMigrations();
  }

  /**
   * Check if a save file is compatible with current version
   */
  checkCompatibility(saveData: any): CompatibilityCheck {
    const saveVersion = saveData.version || '0.0.0';
    const currentVersion = CURRENT_SAVE_VERSION;

    // Same version - fully compatible
    if (saveVersion === currentVersion) {
      return {
        compatible: true,
        currentVersion,
        saveVersion,
        needsMigration: false,
        canMigrate: true
      };
    }

    // Check if save is newer than current (forward compatibility)
    if (this.compareVersions(saveVersion, currentVersion) > 0) {
      return {
        compatible: false,
        currentVersion,
        saveVersion,
        needsMigration: false,
        canMigrate: false,
        error: `Save file is from a newer version (${saveVersion}) than the current game version (${currentVersion}). Please update the game.`
      };
    }

    // Save is older - check if migration is possible
    const needsMigration = true;
    const migrationPath = this.findMigrationPath(saveVersion, currentVersion);

    if (!migrationPath) {
      return {
        compatible: false,
        currentVersion,
        saveVersion,
        needsMigration: true,
        canMigrate: false,
        error: `No migration path found from version ${saveVersion} to ${currentVersion}`
      };
    }

    return {
      compatible: false, // Not directly compatible, but can be migrated
      currentVersion,
      saveVersion,
      needsMigration: true,
      canMigrate: true,
      migrationPath
    };
  }

  /**
   * Find migration path between versions
   */
  private findMigrationPath(fromVersion: string, toVersion: string): string[] | null {
    const allMigrations = this.migrations.getMigrations();
    const path: string[] = [fromVersion];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      const nextMigration = allMigrations.find(m => m.fromVersion === currentVersion);
      
      if (!nextMigration) {
        return null; // No migration available
      }

      path.push(nextMigration.toVersion);
      currentVersion = nextMigration.toVersion;

      // Prevent infinite loops
      if (path.length > 100) {
        return null;
      }
    }

    return path;
  }

  /**
   * Migrate save data to current version
   */
  migrateSave(saveData: any): SaveData | null {
    const compatibility = this.checkCompatibility(saveData);

    if (!compatibility.canMigrate) {
      console.error('[SaveCompatibility] Cannot migrate save:', compatibility.error);
      return null;
    }

    if (!compatibility.needsMigration) {
      return saveData as SaveData;
    }

    try {
      console.log('[SaveCompatibility] Migrating save from', compatibility.saveVersion, 'to', compatibility.currentVersion);
      console.log('[SaveCompatibility] Migration path:', compatibility.migrationPath?.join(' -> '));

      const migratedData = this.migrations.migrate(saveData);
      
      console.log('[SaveCompatibility] Migration successful');
      return migratedData;
    } catch (error) {
      console.error('[SaveCompatibility] Migration failed:', error);
      return null;
    }
  }

  /**
   * Compare two version strings
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
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
   * Get all available migrations
   */
  getAvailableMigrations(): Array<{ from: string; to: string }> {
    return this.migrations.getMigrations().map(m => ({
      from: m.fromVersion,
      to: m.toVersion
    }));
  }

  /**
   * Validate save data structure
   */
  validateSaveStructure(saveData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!saveData.version) {
      errors.push('Missing version field');
    }

    if (!saveData.slot) {
      errors.push('Missing slot metadata');
    } else {
      if (!saveData.slot.id) errors.push('Missing slot ID');
      if (!saveData.slot.name) errors.push('Missing slot name');
      if (!saveData.slot.timestamp) errors.push('Missing slot timestamp');
    }

    if (!saveData.player) {
      errors.push('Missing player data');
    }

    if (!saveData.inventory) {
      errors.push('Missing inventory data');
    }

    if (!saveData.quests) {
      errors.push('Missing quests data');
    }

    if (!saveData.world) {
      errors.push('Missing world data');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create backup before migration
   */
  createBackup(saveData: SaveData): SaveData {
    return {
      ...saveData,
      slot: {
        ...saveData.slot,
        name: `${saveData.slot.name} (Backup ${new Date().toISOString()})`,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Utility function to check and migrate a save
 */
export function checkAndMigrateSave(saveData: any): {
  success: boolean;
  data: SaveData | null;
  compatibility: CompatibilityCheck;
} {
  const checker = new SaveCompatibilityChecker();
  const compatibility = checker.checkCompatibility(saveData);

  if (compatibility.compatible) {
    return {
      success: true,
      data: saveData as SaveData,
      compatibility
    };
  }

  if (!compatibility.canMigrate) {
    return {
      success: false,
      data: null,
      compatibility
    };
  }

  const migratedData = checker.migrateSave(saveData);

  return {
    success: migratedData !== null,
    data: migratedData,
    compatibility
  };
}
