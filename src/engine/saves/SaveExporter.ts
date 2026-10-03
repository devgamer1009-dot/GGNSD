/**
 * Save Exporter
 * P18 - Export/import saves as files
 */

import { SaveData } from './SaveTypes.js';

export class SaveExporter {
  /**
   * Export save data to JSON file
   */
  exportToFile(saveData: SaveData, filename?: string): void {
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `crownfall-save-${saveData.slot.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import save data from JSON file
   */
  async importFromFile(file: File): Promise<SaveData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const saveData = JSON.parse(jsonString) as SaveData;
          resolve(saveData);
        } catch (error) {
          reject(new Error('Failed to parse save file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Export save data to base64 string (for sharing)
   */
  exportToBase64(saveData: SaveData): string {
    const jsonString = JSON.stringify(saveData);
    return btoa(jsonString);
  }

  /**
   * Import save data from base64 string
   */
  importFromBase64(base64: string): SaveData {
    try {
      const jsonString = atob(base64);
      return JSON.parse(jsonString) as SaveData;
    } catch (error) {
      throw new Error('Failed to parse base64 save data');
    }
  }

  /**
   * Validate imported save data structure
   */
  validateImportedData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required top-level fields
    if (!data.version) errors.push('Missing version');
    if (!data.slot) errors.push('Missing slot');
    if (!data.player) errors.push('Missing player data');
    if (!data.inventory) errors.push('Missing inventory data');
    if (!data.quests) errors.push('Missing quests data');
    if (!data.world) errors.push('Missing world data');

    // Check slot structure
    if (data.slot) {
      if (typeof data.slot.id !== 'number') errors.push('Invalid slot ID');
      if (typeof data.slot.name !== 'string') errors.push('Invalid slot name');
      if (typeof data.slot.timestamp !== 'number') errors.push('Invalid slot timestamp');
    }

    // Check player structure
    if (data.player) {
      if (!data.player.position) errors.push('Missing player position');
      if (typeof data.player.health !== 'number') errors.push('Invalid player health');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
