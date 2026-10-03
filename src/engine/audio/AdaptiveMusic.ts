/**
 * Adaptive Music System - Procedural layered music
 * P17 - Dynamic music based on region and state
 */

import { AudioManager } from './AudioManager.js';

export enum MusicState {
  EXPLORE = 'explore',
  TENSION = 'tension',
  COMBAT = 'combat',
  BOSS = 'boss',
}

export enum Region {
  GREENMARCH = 'greenmarch',
  THORNWOOD = 'thornwood',
  IRONCRAG = 'ironcrag',
  SALTFEN = 'saltfen',
  ASHFELL = 'ashfell',
}

export interface MusicScale {
  notes: number[]; // Frequencies in Hz
  tempo: number; // BPM
}

export interface MusicLayer {
  name: string;
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  targetVolume: number;
  currentVolume: number;
}

export class AdaptiveMusicSystem {
  private audioManager: AudioManager;
  private currentState: MusicState = MusicState.EXPLORE;
  private currentRegion: Region = Region.GREENMARCH;
  private layers: Map<string, MusicLayer> = new Map();
  private scales: Map<Region, MusicScale> = new Map();
  private crossfadeDuration: number = 2.0; // seconds

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.initializeScales();
  }

  /**
   * Initialize musical scales for each region
   */
  private initializeScales(): void {
    // Greenmarch - Major scale (bright, peaceful)
    this.scales.set(Region.GREENMARCH, {
      notes: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // C major
      tempo: 80,
    });

    // Thornwood - Minor scale (mysterious, dark)
    this.scales.set(Region.THORNWOOD, {
      notes: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00], // A minor
      tempo: 70,
    });

    // Ironcrag - Dorian mode (epic, strong)
    this.scales.set(Region.IRONCRAG, {
      notes: [196.00, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23, 392.00], // G dorian
      tempo: 90,
    });

    // Saltfen - Phrygian mode (tense, exotic)
    this.scales.set(Region.SALTFEN, {
      notes: [174.61, 185.00, 207.65, 233.08, 261.63, 277.18, 311.13, 349.23], // F phrygian
      tempo: 75,
    });

    // Ashfell - Harmonic minor (dramatic, intense)
    this.scales.set(Region.ASHFELL, {
      notes: [164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 311.13, 329.63], // E harmonic minor
      tempo: 100,
    });
  }

  /**
   * Generate a music layer buffer
   */
  private generateLayerBuffer(
    layerType: 'base' | 'melody' | 'harmony' | 'percussion',
    state: MusicState,
    region: Region
  ): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const scale = this.scales.get(region)!;
    const duration = 8.0; // 8 second loop
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(2, duration * sampleRate, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    const beatDuration = 60 / scale.tempo;
    const samplesPerBeat = Math.floor(beatDuration * sampleRate);

    switch (layerType) {
      case 'base':
        this.generateBaseLayer(leftChannel, rightChannel, scale, state, samplesPerBeat);
        break;
      case 'melody':
        this.generateMelodyLayer(leftChannel, rightChannel, scale, state, samplesPerBeat);
        break;
      case 'harmony':
        this.generateHarmonyLayer(leftChannel, rightChannel, scale, state, samplesPerBeat);
        break;
      case 'percussion':
        this.generatePercussionLayer(leftChannel, rightChannel, scale, state, samplesPerBeat);
        break;
    }

    return buffer;
  }

  /**
   * Generate base layer (pad/drone)
   */
  private generateBaseLayer(
    left: Float32Array,
    right: Float32Array,
    scale: MusicScale,
    state: MusicState,
    samplesPerBeat: number
  ): void {
    const rootFreq = scale.notes[0]!;
    const fifthFreq = scale.notes[4]!;

    for (let i = 0; i < left.length; i++) {
      const t = i / left.length;
      
      // Slow pad with root and fifth
      const pad = 
        Math.sin(2 * Math.PI * rootFreq * t * 8) * 0.3 +
        Math.sin(2 * Math.PI * fifthFreq * t * 8) * 0.2;
      
      // Add subtle modulation
      const modulation = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.1 * t * 8);
      
      const value = pad * modulation * 0.4;
      left[i] = value;
      right[i] = value;
    }
  }

  /**
   * Generate melody layer
   */
  private generateMelodyLayer(
    left: Float32Array,
    right: Float32Array,
    scale: MusicScale,
    state: MusicState,
    samplesPerBeat: number
  ): void {
    // Simple melody pattern based on state
    const patterns: Record<MusicState, number[]> = {
      [MusicState.EXPLORE]: [0, 2, 4, 5, 4, 2, 0, 3],
      [MusicState.TENSION]: [0, 3, 5, 7, 5, 3, 0, 2],
      [MusicState.COMBAT]: [0, 4, 7, 4, 0, 5, 7, 5],
      [MusicState.BOSS]: [0, 7, 5, 7, 0, 4, 7, 4],
    };

    const pattern = patterns[state];
    const noteLength = samplesPerBeat;

    for (let beat = 0; beat < pattern.length; beat++) {
      const noteIndex = pattern[beat]!;
      const freq = scale.notes[noteIndex]!;
      const startSample = beat * noteLength;

      for (let i = 0; i < noteLength && startSample + i < left.length; i++) {
        const t = i / noteLength;
        const envelope = Math.sin(Math.PI * t); // Attack-decay envelope
        
        const tone = Math.sin(2 * Math.PI * freq * (startSample + i) / left.length * 8) * envelope;
        
        // Pan slightly
        const pan = (noteIndex % 2 === 0) ? 0.3 : -0.3;
        
        left[startSample + i] = tone * (0.5 - pan * 0.5) * 0.3;
        right[startSample + i] = tone * (0.5 + pan * 0.5) * 0.3;
      }
    }
  }

  /**
   * Generate harmony layer
   */
  private generateHarmonyLayer(
    left: Float32Array,
    right: Float32Array,
    scale: MusicScale,
    state: MusicState,
    samplesPerBeat: number
  ): void {
    // Chord progression
    const chords: Record<MusicState, number[][]> = {
      [MusicState.EXPLORE]: [[0, 2, 4], [3, 5, 7], [4, 6, 0], [0, 2, 4]],
      [MusicState.TENSION]: [[0, 3, 5], [2, 4, 6], [5, 7, 2], [0, 3, 5]],
      [MusicState.COMBAT]: [[0, 4, 7], [5, 0, 4], [7, 2, 5], [0, 4, 7]],
      [MusicState.BOSS]: [[0, 5, 7], [7, 0, 4], [5, 7, 2], [0, 5, 7]],
    };

    const progression = chords[state];
    const chordLength = samplesPerBeat * 2;

    for (let chord = 0; chord < progression.length; chord++) {
      const notes = progression[chord]!;
      const startSample = chord * chordLength;

      for (let i = 0; i < chordLength && startSample + i < left.length; i++) {
        const t = i / chordLength;
        const envelope = Math.sin(Math.PI * t) * 0.5;

        let value = 0;
        for (const noteIndex of notes) {
          const freq = scale.notes[noteIndex]!;
          value += Math.sin(2 * Math.PI * freq * (startSample + i) / left.length * 8);
        }
        value = (value / notes.length) * envelope * 0.2;

        left[startSample + i] = value * 0.7;
        right[startSample + i] = value * 0.7;
      }
    }
  }

  /**
   * Generate percussion layer
   */
  private generatePercussionLayer(
    left: Float32Array,
    right: Float32Array,
    scale: MusicScale,
    state: MusicState,
    samplesPerBeat: number
  ): void {
    // Percussion patterns based on state
    const patterns: Record<MusicState, number[]> = {
      [MusicState.EXPLORE]: [1, 0, 0, 0, 1, 0, 0, 0],
      [MusicState.TENSION]: [1, 0, 1, 0, 1, 0, 1, 0],
      [MusicState.COMBAT]: [1, 1, 1, 1, 1, 1, 1, 1],
      [MusicState.BOSS]: [1, 1, 1, 0, 1, 1, 1, 1],
    };

    const pattern = patterns[state];
    const beatLength = samplesPerBeat;

    for (let beat = 0; beat < pattern.length; beat++) {
      if (pattern[beat] === 0) continue;

      const startSample = beat * beatLength;
      const hitDuration = Math.floor(beatLength * 0.1);

      for (let i = 0; i < hitDuration && startSample + i < left.length; i++) {
        const t = i / hitDuration;
        const decay = Math.exp(-t * 10);
        
        // Kick drum sound
        const freq = 100 * (1 - t * 0.5);
        const kick = Math.sin(2 * Math.PI * freq * i / left.length * 8) * decay;
        
        left[startSample + i] = kick * 0.4;
        right[startSample + i] = kick * 0.4;
      }
    }
  }

  /**
   * Set music state
   */
  setState(state: MusicState): void {
    if (state === this.currentState) return;

    this.currentState = state;
    this.rebuildLayers();
  }

  /**
   * Set region
   */
  setRegion(region: Region): void {
    if (region === this.currentRegion) return;

    this.currentRegion = region;
    this.rebuildLayers();
  }

  /**
   * Rebuild all music layers
   */
  private rebuildLayers(): void {
    // Stop existing layers
    for (const layer of this.layers.values()) {
      if (layer.source) {
        layer.source.stop();
      }
    }
    this.layers.clear();

    // Generate new layers
    const layerTypes: Array<'base' | 'melody' | 'harmony' | 'percussion'> = [
      'base', 'melody', 'harmony', 'percussion'
    ];

    for (const layerType of layerTypes) {
      const buffer = this.generateLayerBuffer(layerType, this.currentState, this.currentRegion);
      if (!buffer) continue;

      const context = this.audioManager.getContext()!;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = context.createGain();
      gainNode.gain.value = 0;

      source.connect(gainNode);
      gainNode.connect(this.audioManager.getBus('music')!.gainNode);

      const layer: MusicLayer = {
        name: layerType,
        buffer,
        source,
        gainNode,
        targetVolume: layerType === 'base' ? 0.4 : 0.3,
        currentVolume: 0,
      };

      this.layers.set(layerType, layer);
      source.start();
    }

    // Fade in
    this.fadeInLayers();
  }

  /**
   * Fade in all layers
   */
  private fadeInLayers(): void {
    const context = this.audioManager.getContext();
    if (!context) return;

    const startTime = context.currentTime;

    for (const layer of this.layers.values()) {
      layer.gainNode.gain.setValueAtTime(0, startTime);
      layer.gainNode.gain.linearRampToValueAtTime(layer.targetVolume, startTime + this.crossfadeDuration);
      layer.currentVolume = layer.targetVolume;
    }
  }

  /**
   * Fade out all layers
   */
  private fadeOutLayers(): void {
    const context = this.audioManager.getContext();
    if (!context) return;

    const startTime = context.currentTime;

    for (const layer of this.layers.values()) {
      layer.gainNode.gain.setValueAtTime(layer.currentVolume, startTime);
      layer.gainNode.gain.linearRampToValueAtTime(0, startTime + this.crossfadeDuration);
      layer.currentVolume = 0;
    }
  }

  /**
   * Stop all music
   */
  stop(): void {
    this.fadeOutLayers();
    
    setTimeout(() => {
      for (const layer of this.layers.values()) {
        if (layer.source) {
          layer.source.stop();
        }
      }
      this.layers.clear();
    }, this.crossfadeDuration * 1000);
  }

  /**
   * Get current state
   */
  getState(): MusicState {
    return this.currentState;
  }

  /**
   * Get current region
   */
  getRegion(): Region {
    return this.currentRegion;
  }

  /**
   * Set crossfade duration
   */
  setCrossfadeDuration(duration: number): void {
    this.crossfadeDuration = duration;
  }
}
