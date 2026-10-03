/**
 * UI System - Core Manager
 * P16 - DOM + CSS UI without owning simulation state
 */

export interface UIState {
  currentScreen: UIScreen;
  previousScreen: UIScreen | null;
  isPaused: boolean;
  isPhotoMode: boolean;
}

export enum UIScreen {
  NONE = 'none',
  MAIN_MENU = 'main_menu',
  PAUSE = 'pause',
  INVENTORY = 'inventory',
  SKILLS = 'skills',
  MAP = 'map',
  JOURNAL = 'journal',
  CRAFTING = 'crafting',
  DIALOGUE = 'dialogue',
  SETTINGS = 'settings',
  DEATH = 'death',
  LOADING = 'loading',
}

export interface AccessibilitySettings {
  uiScale: number; // 0.5 - 2.0
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  subtitlesEnabled: boolean;
  reducedShake: boolean;
  holdToToggle: boolean;
  holdDuration: number; // seconds
}

export interface KeyBinding {
  action: string;
  key: string;
  gamepadButton?: number;
}

export class UIManager {
  private state: UIState = {
    currentScreen: UIScreen.NONE,
    previousScreen: null,
    isPaused: false,
    isPhotoMode: false,
  };

  private accessibility: AccessibilitySettings = {
    uiScale: 1.0,
    colorblindMode: 'none',
    subtitlesEnabled: true,
    reducedShake: false,
    holdToToggle: false,
    holdDuration: 0.5,
  };

  private keyBindings: Map<string, KeyBinding> = new Map();
  private screenChangeCallbacks: Array<(screen: UIScreen) => void> = [];

  constructor() {
    this.loadDefaultBindings();
  }

  /**
   * Load default key bindings
   */
  private loadDefaultBindings(): void {
    const defaults: KeyBinding[] = [
      { action: 'open_inventory', key: 'i', gamepadButton: 3 }, // Y button
      { action: 'open_skills', key: 'k', gamepadButton: 2 }, // X button
      { action: 'open_map', key: 'm', gamepadButton: 1 }, // B button
      { action: 'open_journal', key: 'j', gamepadButton: 0 }, // A button
      { action: 'open_crafting', key: 'c' },
      { action: 'pause', key: 'escape', gamepadButton: 9 }, // Start button
      { action: 'photo_mode', key: 'p' },
    ];

    defaults.forEach(binding => {
      this.keyBindings.set(binding.action, binding);
    });
  }

  /**
   * Navigate to screen
   */
  navigateTo(screen: UIScreen): void {
    if (screen === this.state.currentScreen) return;

    this.state.previousScreen = this.state.currentScreen;
    this.state.currentScreen = screen;

    // Notify callbacks
    this.screenChangeCallbacks.forEach(cb => cb(screen));
  }

  /**
   * Go back to previous screen
   */
  goBack(): void {
    if (this.state.previousScreen) {
      this.navigateTo(this.state.previousScreen);
    } else {
      this.navigateTo(UIScreen.NONE);
    }
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): UIScreen {
    return this.state.currentScreen;
  }

  /**
   * Set pause state
   */
  setPaused(paused: boolean): void {
    this.state.isPaused = paused;
    if (paused) {
      this.navigateTo(UIScreen.PAUSE);
    }
  }

  /**
   * Toggle photo mode
   */
  togglePhotoMode(): void {
    this.state.isPhotoMode = !this.state.isPhotoMode;
  }

  /**
   * Check if photo mode is active
   */
  isPhotoModeActive(): boolean {
    return this.state.isPhotoMode;
  }

  /**
   * Update accessibility settings
   */
  updateAccessibility(settings: Partial<AccessibilitySettings>): void {
    this.accessibility = { ...this.accessibility, ...settings };
  }

  /**
   * Get accessibility settings
   */
  getAccessibility(): AccessibilitySettings {
    return { ...this.accessibility };
  }

  /**
   * Rebind key
   */
  rebindKey(action: string, newKey: string): void {
    const binding = this.keyBindings.get(action);
    if (binding) {
      binding.key = newKey;
    }
  }

  /**
   * Get key binding for action
   */
  getKeyBinding(action: string): KeyBinding | undefined {
    return this.keyBindings.get(action);
  }

  /**
   * Register screen change callback
   */
  onScreenChange(callback: (screen: UIScreen) => void): void {
    this.screenChangeCallbacks.push(callback);
  }

  /**
   * Get UI state
   */
  getState(): UIState {
    return { ...this.state };
  }
}
