/**
 * Audio Manager - Core audio system with mixer buses
 * P17 - Native Web Audio API implementation
 */

export interface AudioBus {
  name: string;
  gainNode: GainNode;
  volume: number;
  muted: boolean;
}

export interface AudioConfig {
  masterVolume: number;
  voiceBudget: number; // Max simultaneous sounds
  memoryBudget: number; // Max MB for audio buffers
}

export class AudioManager {
  private context: AudioContext | null = null;
  private masterBus: AudioBus;
  private buses: Map<string, AudioBus> = new Map();
  private activeVoices: Set<AudioBufferSourceNode> = new Set();
  private config: AudioConfig;

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      masterVolume: 0.7,
      voiceBudget: 32,
      memoryBudget: 100, // MB
      ...config,
    };

    this.masterBus = this.createBus('master');
    this.createDefaultBuses();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.masterBus.gainNode.connect(this.context.destination);
    this.masterBus.gainNode.gain.value = this.config.masterVolume;

    // Connect all buses to master
    for (const bus of this.buses.values()) {
      bus.gainNode.connect(this.masterBus.gainNode);
    }

    console.log('[AudioManager] Initialized');
  }

  /**
   * Create default audio buses
   */
  private createDefaultBuses(): void {
    this.createBus('sfx');
    this.createBus('music');
    this.createBus('ambience');
    this.createBus('ui');
    this.createBus('voice');
  }

  /**
   * Create a new audio bus
   */
  private createBus(name: string): AudioBus {
    const gainNode = this.context 
      ? this.context.createGain()
      : null as any; // Will be created on init

    const bus: AudioBus = {
      name,
      gainNode,
      volume: 1.0,
      muted: false,
    };

    this.buses.set(name, bus);
    return bus;
  }

  /**
   * Get audio bus by name
   */
  getBus(name: string): AudioBus | undefined {
    return this.buses.get(name);
  }

  /**
   * Set bus volume
   */
  setBusVolume(name: string, volume: number): void {
    const bus = this.buses.get(name);
    if (bus) {
      bus.volume = Math.max(0, Math.min(1, volume));
      if (this.context) {
        bus.gainNode.gain.value = bus.muted ? 0 : bus.volume;
      }
    }
  }

  /**
   * Mute/unmute bus
   */
  setBusMuted(name: string, muted: boolean): void {
    const bus = this.buses.get(name);
    if (bus) {
      bus.muted = muted;
      if (this.context) {
        bus.gainNode.gain.value = muted ? 0 : bus.volume;
      }
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.context) {
      this.masterBus.gainNode.gain.value = this.config.masterVolume;
    }
  }

  /**
   * Check if we can play a new sound (voice budget)
   */
  canPlayVoice(): boolean {
    return this.activeVoices.size < this.config.voiceBudget;
  }

  /**
   * Register active voice
   */
  registerVoice(source: AudioBufferSourceNode): void {
    this.activeVoices.add(source);
    
    // Auto-remove when finished
    source.onended = () => {
      this.activeVoices.delete(source);
    };
  }

  /**
   * Get active voice count
   */
  getActiveVoiceCount(): number {
    return this.activeVoices.size;
  }

  /**
   * Get audio context
   */
  getContext(): AudioContext | null {
    return this.context;
  }

  /**
   * Get config
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Resume audio context (after user interaction)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Suspend audio context
   */
  async suspend(): Promise<void> {
    if (this.context) {
      await this.context.suspend();
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Stop all active voices
    for (const voice of this.activeVoices) {
      voice.stop();
    }
    this.activeVoices.clear();

    // Close context
    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.buses.clear();
  }
}
