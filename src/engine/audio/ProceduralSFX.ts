/**
 * Procedural SFX Generator - Synthesize sound effects
 * P17 - Web Audio API synthesis
 */

import { AudioManager } from './AudioManager.js';

export enum SurfaceType {
  GRASS = 'grass',
  STONE = 'stone',
  WOOD = 'wood',
  WATER = 'water',
  SAND = 'sand',
  SNOW = 'snow',
}

export class ProceduralSFXGenerator {
  private audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  /**
   * Generate sword clash sound
   */
  generateSwordClash(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.3;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Metallic noise with decay
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 10);
      
      // High-frequency metallic noise
      const noise = (Math.random() * 2 - 1) * decay;
      
      // Add resonant frequencies
      const freq1 = 2000;
      const freq2 = 3500;
      const freq3 = 5000;
      const resonance = 
        Math.sin(2 * Math.PI * freq1 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.2 +
        Math.sin(2 * Math.PI * freq3 * t) * 0.1;
      
      data[i] = (noise * 0.7 + resonance * decay) * 0.5;
    }

    return buffer;
  }

  /**
   * Generate footstep sound based on surface type
   */
  generateFootstep(surface: SurfaceType): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.2;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Different characteristics per surface
    const configs = {
      [SurfaceType.GRASS]: { noise: 0.3, freq: 200, decay: 8, thud: 0.4 },
      [SurfaceType.STONE]: { noise: 0.5, freq: 400, decay: 12, thud: 0.6 },
      [SurfaceType.WOOD]: { noise: 0.4, freq: 300, decay: 10, thud: 0.5 },
      [SurfaceType.WATER]: { noise: 0.2, freq: 150, decay: 6, thud: 0.3 },
      [SurfaceType.SAND]: { noise: 0.25, freq: 180, decay: 7, thud: 0.35 },
      [SurfaceType.SNOW]: { noise: 0.15, freq: 120, decay: 5, thud: 0.25 },
    };

    const config = configs[surface];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * config.decay);
      
      // Low-frequency thud
      const thud = Math.sin(2 * Math.PI * config.freq * t) * config.thud * decay;
      
      // Noise component
      const noise = (Math.random() * 2 - 1) * config.noise * decay;
      
      data[i] = (thud + noise) * 0.6;
    }

    return buffer;
  }

  /**
   * Generate horse hoof sound
   */
  generateHoof(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.15;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 15);
      
      // Sharp impact
      const impact = Math.sin(2 * Math.PI * 250 * t) * 0.6 * decay;
      
      // Click component
      const click = (Math.random() * 2 - 1) * 0.4 * decay;
      
      data[i] = (impact + click) * 0.7;
    }

    return buffer;
  }

  /**
   * Generate wind ambient sound (loopable)
   */
  generateWind(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 2.0;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Low-pass filtered noise
    let prev = 0;
    const cutoff = 0.02;

    for (let i = 0; i < data.length; i++) {
      const noise = Math.random() * 2 - 1;
      prev = prev + cutoff * (noise - prev);
      
      // Add slow modulation
      const t = i / sampleRate;
      const modulation = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.3 * t);
      
      data[i] = prev * 0.3 * modulation;
    }

    return buffer;
  }

  /**
   * Generate rain ambient sound (loopable)
   */
  generateRain(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 2.0;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // High-frequency noise with random drops
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      
      // Base noise
      let value = (Math.random() * 2 - 1) * 0.1;
      
      // Random droplet sounds
      if (Math.random() < 0.001) {
        const dropDecay = Math.exp(-((i % 1000) / 1000) * 20);
        value += Math.sin(2 * Math.PI * 3000 * (i % 1000) / sampleRate) * 0.3 * dropDecay;
      }
      
      data[i] = value;
    }

    return buffer;
  }

  /**
   * Generate fire ambient sound (loopable)
   */
  generateFire(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 2.0;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Crackling noise
    let prev = 0;
    const cutoff = 0.1;

    for (let i = 0; i < data.length; i++) {
      const noise = Math.random() * 2 - 1;
      prev = prev + cutoff * (noise - prev);
      
      // Add crackles
      const t = i / sampleRate;
      let crackle = 0;
      if (Math.random() < 0.005) {
        crackle = (Math.random() * 2 - 1) * 0.5;
      }
      
      data[i] = (prev * 0.4 + crackle) * 0.6;
    }

    return buffer;
  }

  /**
   * Generate UI click sound
   */
  generateUIClick(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.05;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 50);
      
      // Short click
      const click = Math.sin(2 * Math.PI * 1000 * t) * decay;
      
      data[i] = click * 0.3;
    }

    return buffer;
  }

  /**
   * Generate UI notification sound
   */
  generateUINotification(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.2;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 8);
      
      // Two-tone notification
      const tone1 = Math.sin(2 * Math.PI * 800 * t) * 0.4;
      const tone2 = Math.sin(2 * Math.PI * 1200 * t) * 0.3;
      
      data[i] = (tone1 + tone2) * decay;
    }

    return buffer;
  }

  /**
   * Generate damage hit sound
   */
  generateDamageHit(): AudioBuffer | null {
    const context = this.audioManager.getContext();
    if (!context) return null;

    const duration = 0.2;
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 12);
      
      // Impact thud
      const thud = Math.sin(2 * Math.PI * 150 * t) * 0.6;
      
      // Noise component
      const noise = (Math.random() * 2 - 1) * 0.4;
      
      data[i] = (thud + noise) * decay * 0.5;
    }

    return buffer;
  }
}
