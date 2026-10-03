/**
 * Save System Types
 * P18 - Data structures for save/load system
 */

export interface SaveSlot {
  id: number;
  name: string;
  timestamp: number;
  playtime: number; // seconds
  version: string;
  checksum: string;
}

export interface PlayerSaveData {
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  gold: number;
}

export interface InventorySaveData {
  items: Array<{
    itemId: string;
    count: number;
    equipped: boolean;
  }>;
}

export interface QuestSaveData {
  activeQuests: Array<{
    questId: string;
    currentStepId: string;
    progress: Record<string, number>;
  }>;
  completedQuests: string[];
}

export interface WorldSaveData {
  flags: string[];
  factionReputation: Record<string, number>;
  discoveredLocations: string[];
  timeOfDay: number;
  weatherState: string;
}

export interface SettingsSaveData {
  graphics: {
    tier: 'low' | 'medium' | 'high' | 'ultra';
    autoDetect: boolean;
    customSettings?: Record<string, any>;
  };
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    ambienceVolume: number;
  };
  controls: {
    keyBindings: Record<string, string>;
    mouseSensitivity: number;
    invertY: boolean;
  };
  accessibility: {
    uiScale: number;
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    subtitlesEnabled: boolean;
    reducedShake: boolean;
    holdToToggle: boolean;
  };
}

export interface SaveData {
  version: string;
  slot: SaveSlot;
  player: PlayerSaveData;
  inventory: InventorySaveData;
  quests: QuestSaveData;
  world: WorldSaveData;
  settings: SettingsSaveData;
}

export interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

export const CURRENT_SAVE_VERSION = '1.0.0';

export const DEFAULT_SETTINGS: SettingsSaveData = {
  graphics: {
    tier: 'medium',
    autoDetect: true,
  },
  audio: {
    masterVolume: 0.7,
    sfxVolume: 1.0,
    musicVolume: 1.0,
    ambienceVolume: 1.0,
  },
  controls: {
    keyBindings: {},
    mouseSensitivity: 50,
    invertY: false,
  },
  accessibility: {
    uiScale: 1.0,
    colorblindMode: 'none',
    subtitlesEnabled: true,
    reducedShake: false,
    holdToToggle: false,
  },
};
