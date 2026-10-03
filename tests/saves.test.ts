import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SaveManager } from '../src/engine/saves/SaveManager.js';
import { SaveDatabase } from '../src/engine/saves/SaveDatabase.js';
import { SaveMigrations } from '../src/engine/saves/SaveMigrations.js';
import { SaveValidator } from '../src/engine/saves/SaveValidator.js';
import { SaveExporter } from '../src/engine/saves/SaveExporter.js';
import { AutosaveSystem, SavePoint } from '../src/engine/saves/AutosaveSystem.js';
import { SettingsManager } from '../src/engine/saves/SettingsManager.js';
import { SaveData, CURRENT_SAVE_VERSION, DEFAULT_SETTINGS } from '../src/engine/saves/SaveTypes.js';

describe('SaveDatabase', () => {
  let db: SaveDatabase;

  beforeEach(async () => {
    db = new SaveDatabase();
    await db.init();
    await db.clear();
  });

  afterEach(() => {
    db.close();
  });

  it('should initialize database', async () => {
    expect(db).toBeDefined();
  });

  it('should save and load data', async () => {
    const testData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Test Save',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'test-checksum',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    await db.save(testData);
    const loaded = await db.load(1);

    expect(loaded).toBeDefined();
    expect(loaded?.slot.name).toBe('Test Save');
  });

  it('should return null for non-existent slot', async () => {
    const loaded = await db.load(999);
    expect(loaded).toBeNull();
  });

  it('should delete save slot', async () => {
    const testData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Test Save',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'test-checksum',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    await db.save(testData);
    await db.delete(1);
    const loaded = await db.load(1);

    expect(loaded).toBeNull();
  });

  it('should get all slots', async () => {
    const testData1: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Save 1',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'test-checksum-1',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    const testData2 = { ...testData1, slot: { ...testData1.slot, id: 2, name: 'Save 2' } };

    await db.save(testData1);
    await db.save(testData2);

    const slots = await db.getAllSlots();
    expect(slots.length).toBe(2);
    expect(slots[0]!.name).toBe('Save 1');
    expect(slots[1]!.name).toBe('Save 2');
  });
});

describe('SaveMigrations', () => {
  let migrations: SaveMigrations;

  beforeEach(() => {
    migrations = new SaveMigrations();
  });

  it('should detect when migration is needed', () => {
    expect(migrations.needsMigration('0.9.0')).toBe(true);
    expect(migrations.needsMigration(CURRENT_SAVE_VERSION)).toBe(false);
  });

  it('should migrate data to current version', () => {
    const oldData = {
      version: '0.9.0',
      player: { health: 100 },
    };

    const migrated = migrations.migrate(oldData);
    expect(migrated!.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated!.settings).toBeDefined();
  });

  it('should register custom migrations', () => {
    migrations.register({
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      migrate: (data) => ({ ...data, newField: 'added' }),
    });

    const migs = migrations.getMigrations();
    expect(migs.length).toBeGreaterThan(0);
  });
});

describe('SaveValidator', () => {
  let validator: SaveValidator;

  beforeEach(() => {
    validator = new SaveValidator();
  });

  it('should calculate checksum', async () => {
    const data = {
      version: CURRENT_SAVE_VERSION,
      player: { health: 100 },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [] },
      settings: DEFAULT_SETTINGS,
    } as any;

    const checksum = await validator.calculateChecksum(data);
    expect(checksum).toBeDefined();
    expect(checksum.length).toBe(64); // SHA-256 hex length
  });

  it('should validate structure', () => {
    const validData = {
      version: CURRENT_SAVE_VERSION,
      slot: { id: 1, name: 'Test', timestamp: Date.now(), playtime: 0, version: CURRENT_SAVE_VERSION, checksum: 'test' },
      player: { position: { x: 0, y: 0, z: 0 }, health: 100 },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [] },
      settings: DEFAULT_SETTINGS,
    };

    const result = validator.validateStructure(validData);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect invalid structure', () => {
    const invalidData = {
      version: CURRENT_SAVE_VERSION,
      // Missing required fields
    };

    const result = validator.validateStructure(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should create backup of corrupted save', async () => {
    const corruptedData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Corrupted Save',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'invalid-checksum',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    const backup = await validator.createBackup(corruptedData);
    expect(backup.slot.name).toContain('CORRUPTED BACKUP');
  });
});

describe('SaveExporter', () => {
  let exporter: SaveExporter;

  beforeEach(() => {
    exporter = new SaveExporter();
  });

  it('should export to base64', () => {
    const testData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Test Save',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'test-checksum',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    const base64 = exporter.exportToBase64(testData);
    expect(base64).toBeDefined();
    expect(base64.length).toBeGreaterThan(0);
  });

  it('should import from base64', () => {
    const testData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      slot: {
        id: 1,
        name: 'Test Save',
        timestamp: Date.now(),
        playtime: 100,
        version: CURRENT_SAVE_VERSION,
        checksum: 'test-checksum',
      },
      player: {
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
      },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [], factionReputation: {}, discoveredLocations: [], timeOfDay: 12, weatherState: 'clear' },
      settings: DEFAULT_SETTINGS,
    };

    const base64 = exporter.exportToBase64(testData);
    const imported = exporter.importFromBase64(base64);

    expect(imported.slot.name).toBe('Test Save');
  });

  it('should validate imported data', () => {
    const validData = {
      version: CURRENT_SAVE_VERSION,
      slot: { id: 1, name: 'Test', timestamp: Date.now(), playtime: 0, version: CURRENT_SAVE_VERSION, checksum: 'test' },
      player: { position: { x: 0, y: 0, z: 0 }, health: 100 },
      inventory: { items: [] },
      quests: { activeQuests: [], completedQuests: [] },
      world: { flags: [] },
    };

    const result = exporter.validateImportedData(validData);
    expect(result.valid).toBe(true);
  });

  it('should detect invalid imported data', () => {
    const invalidData = {
      version: CURRENT_SAVE_VERSION,
      // Missing required fields
    };

    const result = exporter.validateImportedData(invalidData);
    expect(result.valid).toBe(false);
  });
});

describe('AutosaveSystem', () => {
  let autosave: AutosaveSystem;

  beforeEach(() => {
    autosave = new AutosaveSystem({ enabled: true, minTimeBetweenSaves: 0 });
  });

  afterEach(() => {
    autosave.dispose();
  });

  it('should be enabled by default', () => {
    expect(autosave.isEnabled()).toBe(true);
  });

  it('should trigger save callback', async () => {
    let saveCalled = false;
    autosave.onSave(async () => {
      saveCalled = true;
    });

    await autosave.triggerSave(SavePoint.MANUAL);
    expect(saveCalled).toBe(true);
  });

  it('should respect minimum time between saves', async () => {
    const autosaveWithMinTime = new AutosaveSystem({ enabled: true, minTimeBetweenSaves: 10 });
    let saveCount = 0;
    
    autosaveWithMinTime.onSave(async () => {
      saveCount++;
    });

    await autosaveWithMinTime.triggerSave(SavePoint.MANUAL);
    await autosaveWithMinTime.triggerSave(SavePoint.MANUAL);

    expect(saveCount).toBe(1);
    autosaveWithMinTime.dispose();
  });

  it('should not save when disabled', async () => {
    autosave.setEnabled(false);
    let saveCalled = false;
    
    autosave.onSave(async () => {
      saveCalled = true;
    });

    await autosave.triggerSave(SavePoint.MANUAL);
    expect(saveCalled).toBe(false);
  });
});

describe('SettingsManager', () => {
  let settings: SettingsManager;

  beforeEach(() => {
    settings = new SettingsManager();
  });

  it('should have default settings', () => {
    const currentSettings = settings.getSettings();
    expect(currentSettings.graphics.tier).toBe('medium');
    expect(currentSettings.audio.masterVolume).toBe(0.7);
  });

  it('should update settings', () => {
    settings.updateSettings({
      graphics: { tier: 'high', autoDetect: false },
    });

    const currentSettings = settings.getSettings();
    expect(currentSettings.graphics.tier).toBe('high');
  });

  it('should rebind keys', () => {
    settings.rebindKey('jump', 'Space');
    const binding = settings.getKeyBinding('jump');
    expect(binding).toBe('Space');
  });

  it('should reset to defaults', () => {
    settings.updateSettings({
      graphics: { tier: 'ultra', autoDetect: false },
    });

    settings.resetToDefaults();
    const currentSettings = settings.getSettings();
    expect(currentSettings.graphics.tier).toBe('medium');
  });

  it('should notify on change', () => {
    let changeCalled = false;
    settings.onChange(() => {
      changeCalled = true;
    });

    settings.updateSettings({
      graphics: { tier: 'high', autoDetect: false },
    });

    expect(changeCalled).toBe(true);
  });

  it('should export to JSON', () => {
    const json = settings.exportToJSON();
    expect(json).toBeDefined();
    expect(json.length).toBeGreaterThan(0);
  });

  it('should import from JSON', () => {
    const json = JSON.stringify({
      graphics: { tier: 'high', autoDetect: false },
    });

    settings.importFromJSON(json);
    const currentSettings = settings.getSettings();
    expect(currentSettings.graphics.tier).toBe('high');
  });
});

describe('SaveManager Integration', () => {
  let saveManager: SaveManager;

  beforeEach(async () => {
    saveManager = new SaveManager();
    await saveManager.init();
  });

  afterEach(() => {
    saveManager.dispose();
  });

  it('should initialize successfully', () => {
    expect(saveManager).toBeDefined();
  });

  it('should save and load game', async () => {
    await saveManager.save(1, 'Test Save');
    const loaded = await saveManager.load(1);

    expect(loaded).toBeDefined();
    expect(loaded?.slot.name).toBe('Test Save');
  });

  it('should get all save slots', async () => {
    await saveManager.save(1, 'Save 1');
    await saveManager.save(2, 'Save 2');

    const slots = await saveManager.getAllSlots();
    expect(slots.length).toBe(2);
  });

  it('should delete save slot', async () => {
    await saveManager.save(1, 'Test Save');
    await saveManager.deleteSlot(1);

    const loaded = await saveManager.load(1);
    expect(loaded).toBeNull();
  });

  it('should track playtime', async () => {
    await saveManager.save(1, 'Test Save');
    const playtime = saveManager.getPlaytime();
    expect(playtime).toBeGreaterThanOrEqual(0);
  });

  it('should format playtime correctly', () => {
    expect(saveManager.formatPlaytime(3661)).toBe('1h 1m 1s');
    expect(saveManager.formatPlaytime(61)).toBe('1m 1s');
    expect(saveManager.formatPlaytime(1)).toBe('1s');
  });

  it('should get settings manager', () => {
    const settings = saveManager.getSettingsManager();
    expect(settings).toBeDefined();
  });

  it('should get autosave system', () => {
    const autosave = saveManager.getAutosaveSystem();
    expect(autosave).toBeDefined();
  });
});

describe('Round-trip Tests', () => {
  let saveManager: SaveManager;

  beforeEach(async () => {
    saveManager = new SaveManager();
    await saveManager.init();
  });

  afterEach(() => {
    saveManager.dispose();
  });

  it('should preserve world flags through save/load', async () => {
    // This test would integrate with actual world flags system
    await saveManager.save(1, 'Flag Test');
    const loaded = await saveManager.load(1);

    expect(loaded).toBeDefined();
    expect(loaded?.world.flags).toBeDefined();
  });

  it('should preserve inventory through save/load', async () => {
    // This test would integrate with actual inventory system
    await saveManager.save(1, 'Inventory Test');
    const loaded = await saveManager.load(1);

    expect(loaded).toBeDefined();
    expect(loaded?.inventory.items).toBeDefined();
  });

  it('should preserve settings through save/load', async () => {
    const settings = saveManager.getSettingsManager();
    settings.updateSettings({
      graphics: { tier: 'high', autoDetect: false },
      audio: { masterVolume: 0.5, sfxVolume: 0.8, musicVolume: 0.7, ambienceVolume: 0.6 },
    });

    await saveManager.save(1, 'Settings Test');
    const loaded = await saveManager.load(1);

    expect(loaded).toBeDefined();
    expect(loaded?.settings.graphics.tier).toBe('high');
    expect(loaded?.settings.audio.masterVolume).toBe(0.5);
  });
});
