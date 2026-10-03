/**
 * Save Validator
 * P18 - Checksum validation and corruption detection
 */

import { SaveData } from './SaveTypes.js';

export class SaveValidator {
  /**
   * Calculate checksum for save data
   */
  async calculateChecksum(data: Omit<SaveData, 'slot'>): Promise<string> {
    // Create a copy without the slot (which contains the checksum)
    const dataToHash = {
      version: data.version,
      player: data.player,
      inventory: data.inventory,
      quests: data.quests,
      world: data.world,
      settings: data.settings,
    };

    const jsonString = JSON.stringify(dataToHash);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Validate save data checksum
   */
  async validateChecksum(saveData: SaveData): Promise<boolean> {
    const calculatedChecksum = await this.calculateChecksum(saveData);
    return calculatedChecksum === saveData.slot.checksum;
  }

  /**
   * Validate save data structure
   */
  validateStructure(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!data.version) errors.push('Missing version');
    if (!data.slot) errors.push('Missing slot');
    if (!data.player) errors.push('Missing player data');
    if (!data.inventory) errors.push('Missing inventory data');
    if (!data.quests) errors.push('Missing quests data');
    if (!data.world) errors.push('Missing world data');
    if (!data.settings) errors.push('Missing settings data');

    // Validate player data
    if (data.player) {
      if (typeof data.player.health !== 'number') errors.push('Invalid player health');
      if (typeof data.player.position.x !== 'number') errors.push('Invalid player position');
    }

    // Validate inventory
    if (data.inventory) {
      if (!Array.isArray(data.inventory.items)) errors.push('Invalid inventory items');
    }

    // Validate quests
    if (data.quests) {
      if (!Array.isArray(data.quests.activeQuests)) errors.push('Invalid active quests');
      if (!Array.isArray(data.quests.completedQuests)) errors.push('Invalid completed quests');
    }

    // Validate world
    if (data.world) {
      if (!Array.isArray(data.world.flags)) errors.push('Invalid world flags');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Full validation (structure + checksum)
   */
  async validate(saveData: any): Promise<{ valid: boolean; errors: string[] }> {
    const structureValidation = this.validateStructure(saveData);
    
    if (!structureValidation.valid) {
      return structureValidation;
    }

    const checksumValid = await this.validateChecksum(saveData);
    
    if (!checksumValid) {
      return {
        valid: false,
        errors: ['Checksum mismatch - save data may be corrupted'],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Create backup of corrupted save
   */
  async createBackup(saveData: SaveData): Promise<SaveData> {
    const backup = { ...saveData };
    backup.slot = {
      ...saveData.slot,
      name: `${saveData.slot.name} (CORRUPTED BACKUP)`,
      timestamp: Date.now(),
    };
    return backup;
  }
}
