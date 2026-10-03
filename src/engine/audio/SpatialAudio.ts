/**
 * Spatial Audio System - 3D audio positioning
 * P17 - Web Audio API spatialization
 */

import { AudioManager } from './AudioManager.js';

export interface SpatialAudioConfig {
  listenerPosition: { x: number; y: number; z: number };
  listenerOrientation: { forward: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } };
  maxDistance: number;
  rolloffFactor: number;
}

export class SpatialAudioSystem {
  private audioManager: AudioManager;
  private config: SpatialAudioConfig;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.config = {
      listenerPosition: { x: 0, y: 0, z: 0 },
      listenerOrientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 },
      },
      maxDistance: 100,
      rolloffFactor: 1,
    };
  }

  /**
   * Update listener position (typically player position)
   */
  updateListener(position: { x: number; y: number; z: number }, orientation?: { forward: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }): void {
    this.config.listenerPosition = position;
    if (orientation) {
      this.config.listenerOrientation = orientation;
    }

    const context = this.audioManager.getContext();
    if (!context) return;

    const listener = context.listener;
    
    // Set position
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
    }

    // Set orientation
    if (orientation && listener.forwardX) {
      listener.forwardX.value = orientation.forward.x;
      listener.forwardY.value = orientation.forward.y;
      listener.forwardZ.value = orientation.forward.z;
      listener.upX.value = orientation.up.x;
      listener.upY.value = orientation.up.y;
      listener.upZ.value = orientation.up.z;
    }
  }

  /**
   * Create a spatialized audio source
   */
  createSpatialSource(
    buffer: AudioBuffer,
    position: { x: number; y: number; z: number },
    options: {
      bus?: string;
      maxDistance?: number;
      rolloffFactor?: number;
      loop?: boolean;
      volume?: number;
    } = {}
  ): { source: AudioBufferSourceNode; panner: PannerNode } | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    // Check voice budget
    if (!this.audioManager.canPlayVoice()) {
      console.warn('[SpatialAudio] Voice budget exceeded');
      return null;
    }

    // Create source
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;

    // Create panner for 3D positioning
    const panner = context.createPanner();
    panner.panningModel = 'HRTF'; // High-quality binaural rendering
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = options.maxDistance ?? this.config.maxDistance;
    panner.rolloffFactor = options.rolloffFactor ?? this.config.rolloffFactor;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;

    // Set position
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    }

    // Create volume node
    const volumeNode = context.createGain();
    volumeNode.gain.value = options.volume ?? 1.0;

    // Connect: source -> panner -> volume -> bus -> master
    source.connect(panner);
    panner.connect(volumeNode);

    // Connect to bus
    const busName = options.bus ?? 'sfx';
    const bus = this.audioManager.getBus(busName);
    if (bus) {
      volumeNode.connect(bus.gainNode);
    } else {
      volumeNode.connect(this.audioManager.getBus('master')!.gainNode);
    }

    // Register voice
    this.audioManager.registerVoice(source);

    return { source, panner };
  }

  /**
   * Play spatialized sound
   */
  playSpatial(
    buffer: AudioBuffer,
    position: { x: number; y: number; z: number },
    options: {
      bus?: string;
      maxDistance?: number;
      rolloffFactor?: number;
      loop?: boolean;
      volume?: number;
    } = {}
  ): { source: AudioBufferSourceNode; panner: PannerNode } | null {
    const result = this.createSpatialSource(buffer, position, options);
    if (result) {
      result.source.start();
    }
    return result;
  }

  /**
   * Calculate distance attenuation
   */
  calculateAttenuation(distance: number, maxDistance: number, rolloffFactor: number): number {
    if (distance <= 1) return 1;
    return 1 / (1 + rolloffFactor * (distance - 1));
  }

  /**
   * Update spatial source position
   */
  updateSourcePosition(panner: PannerNode, position: { x: number; y: number; z: number }): void {
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    }
  }

  /**
   * Get listener position
   */
  getListenerPosition(): { x: number; y: number; z: number } {
    return { ...this.config.listenerPosition };
  }

  /**
   * Set max distance for spatialization
   */
  setMaxDistance(distance: number): void {
    this.config.maxDistance = distance;
  }

  /**
   * Set rolloff factor
   */
  setRolloffFactor(factor: number): void {
    this.config.rolloffFactor = factor;
  }
}
