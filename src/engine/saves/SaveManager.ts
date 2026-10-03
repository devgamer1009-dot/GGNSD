/**
 * Save Manager
 * P18 - Main orchestrator for save/load system
 */

import { SaveDatabase } from './SaveDatabase.js';
import { SaveMigrations } from './SaveMigrations.js';
import { SaveValidator } from './SaveValidator.js';
import { SaveExporter } from './SaveExporter.js';
import { AutosaveSystem, SavePoint } from './AutosaveSystem.js';
import { SettingsManager } from './SettingsManager.js';
import { 
  SaveData, 
  SaveSlot, 
  PlayerSaveData, 
  InventorySaveData, 
  QuestSaveData, 
  WorldSaveData,
  SettingsSaveData,
  CURRENT_SAVE_VERSION 
} from './SaveTypes.js';

export class SaveManager {
  private database: SaveDatabase;
  private migrations: SaveMigrations;
  private validator: SaveValidator;
  private exporter: SaveExporter;
  private autosave: AutosaveSystem;
  private settings: SettingsManager;

  private currentSlotId: number = 1;
  private playtime: number = 0;
  private playtimeInterval: number | null = null;

  constructor() {
    this.database = new SaveDatabase();
    this.migrations = new SaveMigrations();
    this.validator = new SaveValidator();
    this.exporter = new SaveExporter();
    this.autosave = new AutosaveSystem();
    this.settings = new SettingsManager();
  }

  /**
   * Initialize save system
   */
  async init(): Promise<void> {
    await this.database.init();
    
    // Setup autosave callback
    this.autosave.onSave(async (savePoint) => {
      await this.save(this.currentSlotId, `Autosave (${savePoint})`);
    });

    // Start playtime tracking
    this.startPlaytimeTracking();

    console.log('[SaveManager] Initialized');
  }

  /**
   * Save game to slot
   */
  async save(slotId: number, name: string): Promise<void> {
    // Gather current game state
    const playerData = this.gatherPlayerData();
    const inventoryData = this.gatherInventoryData();
    const questData = this.gatherQuestData();
    const worldData = this.gatherWorldData();
    const settingsData = this.settings.getSettings();

    // Create save data
    const saveDataWithoutChecksum = {
      version: CURRENT_SAVE_VERSION,
      player: playerData,
      inventory: inventoryData,
      quests: questData,
      world: worldData,
      settings: settingsData,
    };

    // Calculate checksum
    const checksum = await this.validator.calculateChecksum(saveDataWithoutChecksum);

    // Create slot metadata
    const slot: SaveSlot = {
      id: slotId,
      name,
      timestamp: Date.now(),
      playtime: this.playtime,
      version: CURRENT_SAVE_VERSION,
      checksum,
    };

    // Create complete save data
    const saveData: SaveData = {
      ...saveDataWithoutChecksum,
      slot,
    };

    // Save to database
    await this.database.save(saveData);
    this.currentSlotId = slotId;

    console.log(`[SaveManager] Saved to slot ${slotId}: ${name}`);
  }

  /**
   * Load game from slot
   */
  async load(slotId: number): Promise<SaveData | null> {
    const saveData = await this.database.load(slotId);
    
    if (!saveData) {
      console.log(`[SaveManager] No save found in slot ${slotId}`);
      return null;
    }

    // Check if migration is needed
    if (this.migrations.needsMigration(saveData.version)) {
      console.log(`[SaveManager] Migrating save from ${saveData.version} to ${CURRENT_SAVE_VERSION}`);
      try {
        const migratedData = this.migrations.migrate(saveData);
        
        // Recalculate checksum after migration
        const newChecksum = await this.validator.calculateChecksum(migratedData);
        migratedData.slot.checksum = newChecksum;
        migratedData.slot.version = CURRENT_SAVE_VERSION;
        
        // Save migrated data
        await this.database.save(migratedData);
        
        this.applyLoadedData(migratedData);
        this.currentSlotId = slotId;
        
        console.log(`[SaveManager] Loaded and migrated slot ${slotId}`);
        return migratedData;
      } catch (error) {
        console.error('[SaveManager] Migration failed:', error);
        return null;
      }
    }

    // Validate checksum
    const isValid = await this.validator.validateChecksum(saveData);
    if (!isValid) {
      console.error('[SaveManager] Checksum validation failed - save may be corrupted');
      
      // Create backup
      const backup = await this.validator.createBackup(saveData);
      await this.database.save(backup);
      
      return null;
    }

    // Apply loaded data
    this.applyLoadedData(saveData);
    this.currentSlotId = slotId;

    console.log(`[SaveManager] Loaded slot ${slotId}`);
    return saveData;
  }

  /**
   * Delete save slot
   */
  async deleteSlot(slotId: number): Promise<void> {
    await this.database.delete(slotId);
    console.log(`[SaveManager] Deleted slot ${slotId}`);
  }

  /**
   * Get all save slots
   */
  async getAllSlots(): Promise<SaveSlot[]> {
    return await this.database.getAllSlots();
  }

  /**
   * Export save to file
   */
  async exportSave(slotId: number): Promise<void> {
    const saveData = await this.database.load(slotId);
    if (!saveData) {
      throw new Error(`No save found in slot ${slotId}`);
    }
    this.exporter.exportToFile(saveData);
  }

  /**
   * Import save from file
   */
  async importSave(file: File, slotId: number): Promise<void> {
    const saveData = await this.exporter.importFromFile(file);
    
    // Validate imported data
    const validation = this.exporter.validateImportedData(saveData);
    if (!validation.valid) {
      throw new Error(`Invalid save file: ${validation.errors.join(', ')}`);
    }

    // Validate checksum
    const checksumValid = await this.validator.validateChecksum(saveData);
    if (!checksumValid) {
      throw new Error('Save file checksum validation failed - file may be corrupted');
    }

    // Update slot ID
    saveData.slot.id = slotId;
    saveData.slot.name = `Imported: ${saveData.slot.name}`;

    // Save to database
    await this.database.save(saveData);
    console.log(`[SaveManager] Imported save to slot ${slotId}`);
  }

  /**
   * Apply loaded data to game systems
   */
  private applyLoadedData(saveData: SaveData): void {
    // Apply player data
    this.applyPlayerData(saveData.player);
    
    // Apply inventory
    this.applyInventoryData(saveData.inventory);
    
    // Apply quests
    this.applyQuestData(saveData.quests);
    
    // Apply world state
    this.applyWorldData(saveData.world);
    
    // Apply settings
    this.settings.updateSettings(saveData.settings);
    
    // Restore playtime
    this.playtime = saveData.slot.playtime;
  }

  /**
   * Gather player data from game systems
   */
  private gatherPlayerData(): PlayerSaveData {
    // This would integrate with actual game systems
    // For now, return placeholder data
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      mana: 100,
      maxMana: 100,
      level: 1,
      xp: 0,
      gold: 0,
    };
  }

  /**
   * Gather inventory data
   */
  private gatherInventoryData(): InventorySaveData {
    // This would integrate with actual inventory system
    return {
      items: [],
    };
  }

  /**
   * Gather quest data
   */
  private gatherQuestData(): QuestSaveData {
    // This would integrate with actual quest system
    return {
      activeQuests: [],
      completedQuests: [],
    };
  }

  /**
   * Gather world data
   */
  private gatherWorldData(): WorldSaveData {
    // This would integrate with actual world systems
    return {
      flags: [],
      factionReputation: {},
      discoveredLocations: [],
      timeOfDay: 12,
      weatherState: 'clear',
    };
  }

  /**
   * Apply player data to game systems
   */
  private applyPlayerData(data: PlayerSaveData): void {
    // This would integrate with actual game systems
    console.log('[SaveManager] Applied player data');
  }

  /**
   * Apply inventory data
   */
  private applyInventoryData(data: InventorySaveData): void {
    // This would integrate with actual inventory system
    console.log('[SaveManager] Applied inventory data');
  }

  /**
   * Apply quest data
   */
  private applyQuestData(data: QuestSaveData): void {
    // This would integrate with actual quest system
    console.log('[SaveManager] Applied quest data');
  }

  /**
   * Apply world data
   */
  private applyWorldData(data: WorldSaveData): void {
    // This would integrate with actual world systems
    console.log('[SaveManager] Applied world data');
  }

  /**
   * Start playtime tracking
   */
  private startPlaytimeTracking(): void {
    this.playtimeInterval = window.setInterval(() => {
      this.playtime += 1;
    }, 1000);
  }

  /**
   * Get current playtime
   */
  getPlaytime(): number {
    return this.playtime;
  }

  /**
   * Format playtime as string
   */
  formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get settings manager
   */
  getSettingsManager(): SettingsManager {
    return this.settings;
  }

  /**
   * Get autosave system
   */
  getAutosaveSystem(): AutosaveSystem {
    return this.autosave;
  }

  /**
   * Get current slot ID
   */
  getCurrentSlotId(): number {
    return this.currentSlotId;
  }

  /**
   * Dispose save system
   */
  dispose(): void {
    if (this.playtimeInterval !== null) {
      window.clearInterval(this.playtimeInterval);
    }
    this.autosave.dispose();
    this.database.close();
  }
}
