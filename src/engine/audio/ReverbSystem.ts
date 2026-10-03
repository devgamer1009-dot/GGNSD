/**
 * Reverb Zones - Interior reverb effects
 * P17 - Convolution reverb for interior spaces
 */

import { AudioManager } from './AudioManager.js';

export enum ReverbType {
  SMALL_ROOM = 'small_room',
  LARGE_ROOM = 'large_room',
  HALL = 'hall',
  CAVE = 'cave',
  CATHEDRAL = 'cathedral',
}

export interface ReverbZone {
  id: string;
  type: ReverbType;
  position: { x: number; y: number; z: number };
  radius: number;
  wetLevel: number; // 0-1
}

export class ReverbSystem {
  private audioManager: AudioManager;
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private currentZone: ReverbZone | null = null;
  private zones: Map<string, ReverbZone> = new Map();
  private impulseResponses: Map<ReverbType, AudioBuffer> = new Map();

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  /**
   * Initialize reverb system
   */
  async init(): Promise<void> {
    const context = this.audioManager.getContext();
    if (!context) return;

    // Create convolver
    this.convolver = context.createConvolver();
    
    // Create wet/dry mix
    this.wetGain = context.createGain();
    this.dryGain = context.createGain();
    
    this.wetGain.gain.value = 0;
    this.dryGain.gain.value = 1;

    // Connect: convolver -> wetGain -> master
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.audioManager.getBus('master')!.gainNode);

    // Generate impulse responses
    await this.generateImpulseResponses();
  }

  /**
   * Generate impulse responses for different reverb types
   */
  private async generateImpulseResponses(): Promise<void> {
    const context = this.audioManager.getContext();
    if (!context) return;

    const types: ReverbType[] = [
      ReverbType.SMALL_ROOM,
      ReverbType.LARGE_ROOM,
      ReverbType.HALL,
      ReverbType.CAVE,
      ReverbType.CATHEDRAL,
    ];

    for (const type of types) {
      const ir = this.generateImpulseResponse(type);
      this.impulseResponses.set(type, ir);
    }
  }

  /**
   * Generate impulse response for reverb type
   */
  private generateImpulseResponse(type: ReverbType): AudioBuffer {
    const context = this.audioManager.getContext()!;
    
    const configs = {
      [ReverbType.SMALL_ROOM]: { duration: 0.8, decay: 3, diffusion: 0.7 },
      [ReverbType.LARGE_ROOM]: { duration: 1.5, decay: 2.5, diffusion: 0.8 },
      [ReverbType.HALL]: { duration: 2.5, decay: 2, diffusion: 0.9 },
      [ReverbType.CAVE]: { duration: 3.0, decay: 1.5, diffusion: 0.6 },
      [ReverbType.CATHEDRAL]: { duration: 4.0, decay: 1.8, diffusion: 0.95 },
    };

    const config = configs[type];
    const sampleRate = context.sampleRate;
    const length = Math.floor(config.duration * sampleRate);
    const impulse = context.createBuffer(2, length, sampleRate);
    
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Generate exponentially decaying noise
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.exp(-t * config.decay * 5);
      
      // Early reflections
      const early = i < length * 0.1 ? Math.random() * 2 - 1 : 0;
      
      // Late reverb (diffuse)
      const late = (Math.random() * 2 - 1) * config.diffusion;
      
      const value = (early * 0.3 + late * 0.7) * decay;
      
      left[i] = value;
      right[i] = value * (0.9 + Math.random() * 0.2); // Slight stereo variation
    }

    return impulse;
  }

  /**
   * Add a reverb zone
   */
  addZone(zone: ReverbZone): void {
    this.zones.set(zone.id, zone);
  }

  /**
   * Remove a reverb zone
   */
  removeZone(id: string): void {
    this.zones.delete(id);
    if (this.currentZone?.id === id) {
      this.currentZone = null;
      this.setWetLevel(0);
    }
  }

  /**
   * Update listener position and check zone entry/exit
   */
  updateListener(position: { x: number; y: number; z: number }): void {
    let closestZone: ReverbZone | null = null;
    let closestDistance = Infinity;

    // Find closest zone within radius
    for (const zone of this.zones.values()) {
      const dx = position.x - zone.position.x;
      const dy = position.y - zone.position.y;
      const dz = position.z - zone.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < zone.radius && distance < closestDistance) {
        closestZone = zone;
        closestDistance = distance;
      }
    }

    // Zone changed
    if (closestZone !== this.currentZone) {
      if (closestZone) {
        this.enterZone(closestZone);
      } else {
        this.exitZone();
      }
    }
  }

  /**
   * Enter a reverb zone
   */
  private enterZone(zone: ReverbZone): void {
    this.currentZone = zone;
    
    const context = this.audioManager.getContext();
    if (!context || !this.convolver) return;

    // Set impulse response
    const ir = this.impulseResponses.get(zone.type);
    if (ir) {
      this.convolver.buffer = ir;
    }

    // Fade in wet signal
    this.setWetLevel(zone.wetLevel);
  }

  /**
   * Exit reverb zone
   */
  private exitZone(): void {
    this.currentZone = null;
    this.setWetLevel(0);
  }

  /**
   * Set wet/dry mix level
   */
  private setWetLevel(level: number): void {
    const context = this.audioManager.getContext();
    if (!context || !this.wetGain || !this.dryGain) return;

    const now = context.currentTime;
    this.wetGain.gain.linearRampToValueAtTime(level, now + 0.5);
    this.dryGain.gain.linearRampToValueAtTime(1 - level * 0.3, now + 0.5);
  }

  /**
   * Get convolver node (for connecting audio sources)
   */
  getConvolver(): ConvolverNode | null {
    return this.convolver;
  }

  /**
   * Get current zone
   */
  getCurrentZone(): ReverbZone | null {
    return this.currentZone;
  }

  /**
   * Check if in reverb zone
   */
  isInReverbZone(): boolean {
    return this.currentZone !== null;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.convolver) {
      this.convolver.disconnect();
      this.convolver = null;
    }
    if (this.wetGain) {
      this.wetGain.disconnect();
      this.wetGain = null;
    }
    if (this.dryGain) {
      this.dryGain.disconnect();
      this.dryGain = null;
    }
    this.zones.clear();
    this.impulseResponses.clear();
  }
}
