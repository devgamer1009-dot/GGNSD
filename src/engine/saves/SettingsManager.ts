/**
 * Settings Manager
 * P18 - Settings storage and management
 */

import { SettingsSaveData, DEFAULT_SETTINGS } from './SaveTypes.js';

export class SettingsManager {
  private settings: SettingsSaveData;
  private onChangeCallbacks: Array<() => void> = [];

  constructor(initialSettings?: Partial<SettingsSaveData>) {
    this.settings = this.mergeSettings(DEFAULT_SETTINGS, initialSettings || {});
  }

  /**
   * Merge settings with defaults
   */
  private mergeSettings(defaults: SettingsSaveData, overrides: Partial<SettingsSaveData>): SettingsSaveData {
    return {
      graphics: { ...defaults.graphics, ...overrides.graphics },
      audio: { ...defaults.audio, ...overrides.audio },
      controls: { ...defaults.controls, ...overrides.controls },
      accessibility: { ...defaults.accessibility, ...overrides.accessibility },
    };
  }

  /**
   * Get all settings
   */
  getSettings(): SettingsSaveData {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<SettingsSaveData>): void {
    this.settings = this.mergeSettings(this.settings, updates);
    this.notifyChange();
  }

  /**
   * Get graphics settings
   */
  getGraphicsSettings(): SettingsSaveData['graphics'] {
    return { ...this.settings.graphics };
  }

  /**
   * Update graphics settings
   */
  updateGraphicsSettings(updates: Partial<SettingsSaveData['graphics']>): void {
    this.settings.graphics = { ...this.settings.graphics, ...updates };
    this.notifyChange();
  }

  /**
   * Get audio settings
   */
  getAudioSettings(): SettingsSaveData['audio'] {
    return { ...this.settings.audio };
  }

  /**
   * Update audio settings
   */
  updateAudioSettings(updates: Partial<SettingsSaveData['audio']>): void {
    this.settings.audio = { ...this.settings.audio, ...updates };
    this.notifyChange();
  }

  /**
   * Get control settings
   */
  getControlSettings(): SettingsSaveData['controls'] {
    return { ...this.settings.controls };
  }

  /**
   * Update control settings
   */
  updateControlSettings(updates: Partial<SettingsSaveData['controls']>): void {
    this.settings.controls = { ...this.settings.controls, ...updates };
    this.notifyChange();
  }

  /**
   * Get accessibility settings
   */
  getAccessibilitySettings(): SettingsSaveData['accessibility'] {
    return { ...this.settings.accessibility };
  }

  /**
   * Update accessibility settings
   */
  updateAccessibilitySettings(updates: Partial<SettingsSaveData['accessibility']>): void {
    this.settings.accessibility = { ...this.settings.accessibility, ...updates };
    this.notifyChange();
  }

  /**
   * Rebind a key
   */
  rebindKey(action: string, key: string): void {
    this.settings.controls.keyBindings[action] = key;
    this.notifyChange();
  }

  /**
   * Get key binding for action
   */
  getKeyBinding(action: string): string | undefined {
    return this.settings.controls.keyBindings[action];
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.notifyChange();
  }

  /**
   * Auto-detect graphics tier based on hardware
   */
  async autoDetectGraphicsTier(): Promise<'low' | 'medium' | 'high' | 'ultra'> {
    // Simple heuristic based on device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return 'low';
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Check for high-end GPUs
    const isHighEnd = /RTX|RX 6|RX 7/i.test(renderer);
    const isMidRange = /GTX 10|GTX 16|RX 5/i.test(renderer);
    
    // Check device memory
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    if (isHighEnd && deviceMemory >= 8) {
      return 'ultra';
    } else if (isHighEnd || (isMidRange && deviceMemory >= 8)) {
      return 'high';
    } else if (isMidRange || deviceMemory >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Apply auto-detected graphics tier
   */
  async applyAutoDetectGraphics(): Promise<void> {
    const tier = await this.autoDetectGraphicsTier();
    this.settings.graphics.tier = tier;
    this.settings.graphics.autoDetect = true;
    this.notifyChange();
  }

  /**
   * Register change callback
   */
  onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * Notify settings change
   */
  private notifyChange(): void {
    for (const callback of this.onChangeCallbacks) {
      callback();
    }
  }

  /**
   * Export settings to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  importFromJSON(json: string): void {
    try {
      const imported = JSON.parse(json);
      this.settings = this.mergeSettings(DEFAULT_SETTINGS, imported);
      this.notifyChange();
    } catch (error) {
      throw new Error('Failed to import settings: invalid JSON');
    }
  }
}
