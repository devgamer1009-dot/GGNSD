/**
 * Audio System - Main orchestrator
 * P17 - Complete audio system integration
 */

import { AudioManager } from './AudioManager.js';
import { SpatialAudioSystem } from './SpatialAudio.js';
import { ProceduralSFXGenerator, SurfaceType } from './ProceduralSFX.js';
import { AdaptiveMusicSystem, MusicState, Region } from './AdaptiveMusic.js';
import { ReverbSystem, ReverbType, ReverbZone } from './ReverbSystem.js';

export class AudioSystem {
  private audioManager: AudioManager;
  private spatialAudio: SpatialAudioSystem;
  private sfxGenerator: ProceduralSFXGenerator;
  private musicSystem: AdaptiveMusicSystem;
  private reverbSystem: ReverbSystem;

  // Cached audio buffers
  private sfxBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.audioManager = new AudioManager();
    this.spatialAudio = new SpatialAudioSystem(this.audioManager);
    this.sfxGenerator = new ProceduralSFXGenerator(this.audioManager);
    this.musicSystem = new AdaptiveMusicSystem(this.audioManager);
    this.reverbSystem = new ReverbSystem(this.audioManager);
  }

  /**
   * Initialize audio system
   */
  async init(): Promise<void> {
    await this.audioManager.init();
    await this.reverbSystem.init();
    
    // Pre-generate common SFX
    this.pregenerateSFX();
    
    console.log('[AudioSystem] Initialized');
  }

  /**
   * Pre-generate common sound effects
   */
  private pregenerateSFX(): void {
    // Generate and cache common sounds
    const swordClash = this.sfxGenerator.generateSwordClash();
    if (swordClash) this.sfxBuffers.set('sword_clash', swordClash);

    const hoof = this.sfxGenerator.generateHoof();
    if (hoof) this.sfxBuffers.set('hoof', hoof);

    const wind = this.sfxGenerator.generateWind();
    if (wind) this.sfxBuffers.set('wind', wind);

    const rain = this.sfxGenerator.generateRain();
    if (rain) this.sfxBuffers.set('rain', rain);

    const fire = this.sfxGenerator.generateFire();
    if (fire) this.sfxBuffers.set('fire', fire);

    const uiClick = this.sfxGenerator.generateUIClick();
    if (uiClick) this.sfxBuffers.set('ui_click', uiClick);

    const uiNotification = this.sfxGenerator.generateUINotification();
    if (uiNotification) this.sfxBuffers.set('ui_notification', uiNotification);

    const damageHit = this.sfxGenerator.generateDamageHit();
    if (damageHit) this.sfxBuffers.set('damage_hit', damageHit);

    // Generate footsteps for each surface
    for (const surface of Object.values(SurfaceType)) {
      const footstep = this.sfxGenerator.generateFootstep(surface);
      if (footstep) this.sfxBuffers.set(`footstep_${surface}`, footstep);
    }
  }

  /**
   * Play a cached SFX
   */
  playSFX(name: string, position?: { x: number; y: number; z: number }, options: { volume?: number; loop?: boolean } = {}): void {
    const buffer = this.sfxBuffers.get(name);
    if (!buffer) {
      console.warn(`[AudioSystem] SFX not found: ${name}`);
      return;
    }

    if (position) {
      this.spatialAudio.playSpatial(buffer, position, {
        bus: 'sfx',
        volume: options.volume,
        loop: options.loop,
      });
    } else {
      // Play non-spatialized
      const context = this.audioManager.getContext();
      if (!context) return;

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = options.loop ?? false;

      const gainNode = context.createGain();
      gainNode.gain.value = options.volume ?? 1.0;

      source.connect(gainNode);
      gainNode.connect(this.audioManager.getBus('sfx')!.gainNode);

      this.audioManager.registerVoice(source);
      source.start();
    }
  }

  /**
   * Play footstep sound
   */
  playFootstep(surface: SurfaceType, position: { x: number; y: number; z: number }): void {
    this.playSFX(`footstep_${surface}`, position, { volume: 0.5 });
  }

  /**
   * Play sword clash
   */
  playSwordClash(position: { x: number; y: number; z: number }): void {
    this.playSFX('sword_clash', position, { volume: 0.8 });
  }

  /**
   * Play hoof sound
   */
  playHoof(position: { x: number; y: number; z: number }): void {
    this.playSFX('hoof', position, { volume: 0.6 });
  }

  /**
   * Play UI click
   */
  playUIClick(): void {
    this.playSFX('ui_click', undefined, { volume: 0.5 });
  }

  /**
   * Play UI notification
   */
  playUINotification(): void {
    this.playSFX('ui_notification', undefined, { volume: 0.6 });
  }

  /**
   * Play damage hit
   */
  playDamageHit(position: { x: number; y: number; z: number }): void {
    this.playSFX('damage_hit', position, { volume: 0.7 });
  }

  /**
   * Start ambient wind
   */
  startWind(position: { x: number; y: number; z: number }): void {
    this.playSFX('wind', position, { volume: 0.3, loop: true });
  }

  /**
   * Start ambient rain
   */
  startRain(position: { x: number; y: number; z: number }): void {
    this.playSFX('rain', position, { volume: 0.4, loop: true });
  }

  /**
   * Start ambient fire
   */
  startFire(position: { x: number; y: number; z: number }): void {
    this.playSFX('fire', position, { volume: 0.5, loop: true });
  }

  /**
   * Set music state
   */
  setMusicState(state: MusicState): void {
    this.musicSystem.setState(state);
  }

  /**
   * Set music region
   */
  setMusicRegion(region: Region): void {
    this.musicSystem.setRegion(region);
  }

  /**
   * Stop music
   */
  stopMusic(): void {
    this.musicSystem.stop();
  }

  /**
   * Update listener position and orientation
   */
  updateListener(
    position: { x: number; y: number; z: number },
    orientation?: { forward: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }
  ): void {
    this.spatialAudio.updateListener(position, orientation);
    this.reverbSystem.updateListener(position);
  }

  /**
   * Add reverb zone
   */
  addReverbZone(zone: ReverbZone): void {
    this.reverbSystem.addZone(zone);
  }

  /**
   * Remove reverb zone
   */
  removeReverbZone(id: string): void {
    this.reverbSystem.removeZone(id);
  }

  /**
   * Set bus volume
   */
  setBusVolume(busName: string, volume: number): void {
    this.audioManager.setBusVolume(busName, volume);
  }

  /**
   * Mute/unmute bus
   */
  setBusMuted(busName: string, muted: boolean): void {
    this.audioManager.setBusMuted(busName, muted);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.audioManager.setMasterVolume(volume);
  }

  /**
   * Get active voice count
   */
  getActiveVoiceCount(): number {
    return this.audioManager.getActiveVoiceCount();
  }

  /**
   * Get voice budget
   */
  getVoiceBudget(): number {
    return this.audioManager.getConfig().voiceBudget;
  }

  /**
   * Resume audio context
   */
  async resume(): Promise<void> {
    await this.audioManager.resume();
  }

  /**
   * Suspend audio context
   */
  async suspend(): Promise<void> {
    await this.audioManager.suspend();
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.musicSystem.stop();
    this.reverbSystem.dispose();
    this.audioManager.dispose();
    this.sfxBuffers.clear();
  }

  /**
   * Get sub-systems for advanced usage
   */
  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  getSpatialAudio(): SpatialAudioSystem {
    return this.spatialAudio;
  }

  getMusicSystem(): AdaptiveMusicSystem {
    return this.musicSystem;
  }

  getReverbSystem(): ReverbSystem {
    return this.reverbSystem;
  }
}
