# Save System Documentation

## Overview

The save system provides persistent storage for game state using IndexedDB. It supports versioned saves with automatic migrations, corruption detection, multiple save slots, autosave, and export/import functionality.

## Architecture

```
SaveManager (orchestrator)
├── SaveDatabase (IndexedDB wrapper)
├── SaveMigrations (version upgrades)
├── SaveValidator (checksum & validation)
├── SaveExporter (file export/import)
├── AutosaveSystem (automatic saves)
└── SettingsManager (game settings)
```

## Core Components

### SaveManager

Main orchestrator that coordinates all save system components.

**Key Methods:**
- `init()` - Initialize the save system
- `save(slotId, name)` - Save game to slot
- `load(slotId)` - Load game from slot
- `deleteSlot(slotId)` - Delete save slot
- `getAllSlots()` - Get all save slots
- `exportSave(slotId)` - Export save to file
- `importSave(file, slotId)` - Import save from file

**Usage:**
```typescript
const saveManager = new SaveManager();
await saveManager.init();

// Save game
await saveManager.save(1, 'My Save');

// Load game
const saveData = await saveManager.load(1);

// Get all slots
const slots = await saveManager.getAllSlots();
```

### SaveDatabase

IndexedDB wrapper for persistent storage.

**Features:**
- Versioned database schema
- CRUD operations for save slots
- Transaction-based operations

**Storage Structure:**
```typescript
{
  slot: {
    id: number,
    name: string,
    timestamp: number,
    playtime: number,
    version: string,
    checksum: string
  },
  player: { ... },
  inventory: { ... },
  quests: { ... },
  world: { ... },
  settings: { ... }
}
```

### SaveMigrations

Handles version upgrades for save data.

**Migration Flow:**
1. Detect save version
2. Apply migrations in sequence
3. Update to current version
4. Recalculate checksum

**Example Migration:**
```typescript
migrations.register({
  fromVersion: '0.9.0',
  toVersion: '1.0.0',
  migrate: (data) => {
    // Add new fields
    data.newField = 'default';
    return data;
  }
});
```

### SaveValidator

Validates save data integrity.

**Features:**
- SHA-256 checksum calculation
- Structure validation
- Corruption detection
- Backup creation for corrupted saves

**Validation Process:**
1. Validate structure (required fields)
2. Calculate checksum
3. Compare with stored checksum
4. Create backup if corrupted

### SaveExporter

Export/import saves as files.

**Supported Formats:**
- JSON files (`.json`)
- Base64 strings (for sharing)

**Usage:**
```typescript
// Export to file
saveManager.exportSave(1);

// Import from file
const file = inputElement.files[0];
await saveManager.importSave(file, 2);

// Export to base64
const base64 = exporter.exportToBase64(saveData);

// Import from base64
const saveData = exporter.importFromBase64(base64);
```

### AutosaveSystem

Automatic saves at safe points.

**Save Points:**
- `MANUAL` - Manual save
- `QUEST_COMPLETE` - After quest completion
- `LOCATION_DISCOVERED` - After discovering location
- `TIME_INTERVAL` - Periodic saves
- `GAME_PAUSE` - When pausing game

**Configuration:**
```typescript
const autosave = new AutosaveSystem({
  enabled: true,
  intervalSeconds: 300, // 5 minutes
  minTimeBetweenSaves: 30 // 30 seconds
});
```

**Usage:**
```typescript
// Setup callback
autosave.onSave(async (savePoint) => {
  await saveManager.save(1, `Autosave (${savePoint})`);
});

// Trigger saves
await autosave.onQuestComplete();
await autosave.onLocationDiscovered();
await autosave.onGamePause();
```

### SettingsManager

Manages game settings with persistence.

**Settings Categories:**
- Graphics (tier, auto-detect, custom settings)
- Audio (volumes for master, sfx, music, ambience)
- Controls (key bindings, mouse sensitivity)
- Accessibility (UI scale, colorblind mode, subtitles)

**Features:**
- Default settings
- Live updates with change notifications
- Auto-detect graphics tier
- Export/import settings

**Usage:**
```typescript
const settings = saveManager.getSettingsManager();

// Get settings
const graphics = settings.getGraphicsSettings();

// Update settings
settings.updateGraphicsSettings({ tier: 'high' });

// Rebind key
settings.rebindKey('jump', 'Space');

// Listen for changes
settings.onChange(() => {
  console.log('Settings changed');
});

// Auto-detect graphics
await settings.applyAutoDetectGraphics();
```

## Save Data Structure

### Player Data
```typescript
{
  position: { x, y, z },
  rotation: number,
  health: number,
  maxHealth: number,
  stamina: number,
  maxStamina: number,
  mana: number,
  maxMana: number,
  level: number,
  xp: number,
  gold: number
}
```

### Inventory Data
```typescript
{
  items: Array<{
    itemId: string,
    count: number,
    equipped: boolean
  }>
}
```

### Quest Data
```typescript
{
  activeQuests: Array<{
    questId: string,
    currentStepId: string,
    progress: Record<string, number>
  }>,
  completedQuests: string[]
}
```

### World Data
```typescript
{
  flags: string[],
  factionReputation: Record<string, number>,
  discoveredLocations: string[],
  timeOfDay: number,
  weatherState: string
}
```

### Settings Data
```typescript
{
  graphics: {
    tier: 'low' | 'medium' | 'high' | 'ultra',
    autoDetect: boolean,
    customSettings?: Record<string, any>
  },
  audio: {
    masterVolume: number,
    sfxVolume: number,
    musicVolume: number,
    ambienceVolume: number
  },
  controls: {
    keyBindings: Record<string, string>,
    mouseSensitivity: number,
    invertY: boolean
  },
  accessibility: {
    uiScale: number,
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia',
    subtitlesEnabled: boolean,
    reducedShake: boolean,
    holdToToggle: boolean
  }
}
```

## Versioning

Current version: `1.0.0`

**Version Format:** `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes (requires migration)
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

**Migration Example:**
```typescript
// From 0.9.0 to 1.0.0
migrations.register({
  fromVersion: '0.9.0',
  toVersion: '1.0.0',
  migrate: (data) => {
    // Add settings if missing
    if (!data.settings) {
      data.settings = DEFAULT_SETTINGS;
    }
    return data;
  }
});
```

## Corruption Detection

**Checksum Algorithm:** SHA-256

**Process:**
1. Serialize save data (excluding slot metadata)
2. Calculate SHA-256 hash
3. Store hash in slot metadata
4. On load, recalculate and compare

**Recovery:**
- If checksum mismatch, create backup
- Backup is saved with "(CORRUPTED BACKUP)" suffix
- Original save is not loaded

## Autosave Strategy

**Safe Points:**
- Quest completion
- Location discovery
- Game pause
- Time intervals (configurable)

**Protection:**
- Minimum time between saves (default: 30s)
- Prevents save spam
- Configurable interval (default: 5min)

## Settings Auto-Detection

**Graphics Tier Detection:**
```typescript
async autoDetectGraphicsTier(): Promise<'low' | 'medium' | 'high' | 'ultra'> {
  // Check WebGL capabilities
  // Check GPU renderer
  // Check device memory
  // Return appropriate tier
}
```

**Detection Criteria:**
- GPU renderer (RTX/RX 6/7 = high-end)
- Device memory (8GB+ = high/ultra)
- WebGL2 support

## Testing

### Unit Tests
```bash
npm test tests/saves.test.ts
```

**Coverage:**
- Database operations (save, load, delete)
- Migration system
- Checksum validation
- Export/import functionality
- Autosave system
- Settings management
- Round-trip preservation

### Manual Testing

**Test Scenario:**
1. Start new game
2. Play for a few minutes
3. Save to slot 1
4. Close browser tab
5. Reopen game
6. Load slot 1
7. Verify all data preserved

**Corruption Test:**
1. Save game
2. Manually edit IndexedDB (corrupt checksum)
3. Try to load
4. Verify backup created
5. Verify original not loaded

**Export/Import Test:**
1. Save game
2. Export to file
3. Delete save
4. Import from file
5. Verify data matches

## Performance

**Benchmarks:**
- Save operation: ~50ms
- Load operation: ~30ms
- Checksum calculation: ~10ms
- Migration: ~20ms per version

**Optimizations:**
- Async operations (non-blocking)
- Transaction batching
- Lazy loading of save data
- Checksum caching

## Browser Compatibility

**Requirements:**
- IndexedDB support
- Web Crypto API (for SHA-256)
- File API (for export/import)

**Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 14+
- Edge 79+

## Known Limitations

1. **Storage Quota** - Limited by browser (typically 50MB+)
2. **No Cloud Sync** - Local storage only
3. **No Encryption** - Saves are plain JSON
4. **Single Device** - No cross-device sync
5. **Manual Migration** - Must register migrations manually

## Future Improvements

- [ ] Cloud save sync
- [ ] Save encryption
- [ ] Save compression
- [ ] Save versioning UI
- [ ] Save comparison tool
- [ ] Automatic backup rotation
- [ ] Save slot locking
- [ ] Save notes/descriptions
- [ ] Save thumbnails (screenshots)
- [ ] Cloud save conflict resolution

## Integration Guide

### Basic Integration

```typescript
// 1. Initialize save system
const saveManager = new SaveManager();
await saveManager.init();

// 2. Setup autosave
const autosave = saveManager.getAutosaveSystem();
autosave.onSave(async (savePoint) => {
  await saveManager.save(1, `Autosave (${savePoint})`);
});
autosave.startTimeAutosave();

// 3. Save on important events
await saveManager.save(1, 'Manual Save');

// 4. Load on game start
const saveData = await saveManager.load(1);
if (saveData) {
  // Apply loaded data to game systems
}
```

### Settings Integration

```typescript
const settings = saveManager.getSettingsManager();

// Apply settings to game systems
const graphics = settings.getGraphicsSettings();
renderer.setQuality(graphics.tier);

const audio = settings.getAudioSettings();
audioSystem.setMasterVolume(audio.masterVolume);

// Listen for changes
settings.onChange(() => {
  const newSettings = settings.getSettings();
  // Apply to game systems
});
```

### Autosave Integration

```typescript
// Trigger on quest completion
questSystem.onQuestComplete(async () => {
  await autosave.onQuestComplete();
});

// Trigger on location discovery
worldSystem.onLocationDiscovered(async () => {
  await autosave.onLocationDiscovered();
});

// Trigger on pause
gameLoop.onPause(async () => {
  await autosave.onGamePause();
});
```

## Files

- `src/engine/saves/SaveTypes.ts` - Type definitions
- `src/engine/saves/SaveDatabase.ts` - IndexedDB wrapper
- `src/engine/saves/SaveMigrations.ts` - Version migrations
- `src/engine/saves/SaveValidator.ts` - Checksum validation
- `src/engine/saves/SaveExporter.ts` - File export/import
- `src/engine/saves/AutosaveSystem.ts` - Autosave logic
- `src/engine/saves/SettingsManager.ts` - Settings management
- `src/engine/saves/SaveManager.ts` - Main orchestrator
- `src/engine/saves/index.ts` - Module exports
- `tests/saves.test.ts` - Unit tests
