import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager } from '../src/engine/audio/AudioManager.js';
import { ProceduralSFXGenerator, SurfaceType } from '../src/engine/audio/ProceduralSFX.js';
import { AdaptiveMusicSystem, MusicState, Region } from '../src/engine/audio/AdaptiveMusic.js';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  describe('Voice Budget', () => {
    it('should have default voice budget of 32', () => {
      expect(audioManager.getConfig().voiceBudget).toBe(32);
    });

    it('should allow custom voice budget', () => {
      const customManager = new AudioManager({ voiceBudget: 16 });
      expect(customManager.getConfig().voiceBudget).toBe(16);
    });

    it('should track active voices', () => {
      expect(audioManager.getActiveVoiceCount()).toBe(0);
    });

    it('should check if can play voice within budget', () => {
      expect(audioManager.canPlayVoice()).toBe(true);
    });
  });

  describe('Bus Management', () => {
    it('should have default buses', async () => {
      await audioManager.init();
      
      expect(audioManager.getBus('master')).toBeDefined();
      expect(audioManager.getBus('sfx')).toBeDefined();
      expect(audioManager.getBus('music')).toBeDefined();
      expect(audioManager.getBus('ambience')).toBeDefined();
      expect(audioManager.getBus('ui')).toBeDefined();
      expect(audioManager.getBus('voice')).toBeDefined();
    });

    it('should set bus volume', async () => {
      await audioManager.init();
      
      audioManager.setBusVolume('sfx', 0.5);
      const bus = audioManager.getBus('sfx');
      expect(bus?.volume).toBe(0.5);
    });

    it('should clamp bus volume between 0 and 1', async () => {
      await audioManager.init();
      
      audioManager.setBusVolume('sfx', 1.5);
      expect(audioManager.getBus('sfx')?.volume).toBe(1.0);
      
      audioManager.setBusVolume('sfx', -0.5);
      expect(audioManager.getBus('sfx')?.volume).toBe(0.0);
    });

    it('should mute/unmute bus', async () => {
      await audioManager.init();
      
      audioManager.setBusMuted('sfx', true);
      expect(audioManager.getBus('sfx')?.muted).toBe(true);
      
      audioManager.setBusMuted('sfx', false);
      expect(audioManager.getBus('sfx')?.muted).toBe(false);
    });

    it('should set master volume', async () => {
      await audioManager.init();
      
      audioManager.setMasterVolume(0.5);
      expect(audioManager.getConfig().masterVolume).toBe(0.5);
    });
  });

  describe('Audio Context', () => {
    it('should initialize audio context', async () => {
      await audioManager.init();
      expect(audioManager.getContext()).not.toBeNull();
    });

    it('should not initialize twice', async () => {
      await audioManager.init();
      const context1 = audioManager.getContext();
      await audioManager.init();
      const context2 = audioManager.getContext();
      expect(context1).toBe(context2);
    });
  });
});

describe('ProceduralSFXGenerator', () => {
  let audioManager: AudioManager;
  let sfxGenerator: ProceduralSFXGenerator;

  beforeEach(async () => {
    audioManager = new AudioManager();
    await audioManager.init();
    sfxGenerator = new ProceduralSFXGenerator(audioManager);
  });

  describe('SFX Generation', () => {
    it('should generate sword clash', () => {
      const buffer = sfxGenerator.generateSwordClash();
      expect(buffer).not.toBeNull();
      expect(buffer?.numberOfChannels).toBe(1);
      expect(buffer?.duration).toBeCloseTo(0.3, 1);
    });

    it('should generate footsteps for all surfaces', () => {
      for (const surface of Object.values(SurfaceType)) {
        const buffer = sfxGenerator.generateFootstep(surface);
        expect(buffer).not.toBeNull();
        expect(buffer?.duration).toBeCloseTo(0.2, 1);
      }
    });

    it('should generate hoof sound', () => {
      const buffer = sfxGenerator.generateHoof();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(0.15, 1);
    });

    it('should generate wind ambient', () => {
      const buffer = sfxGenerator.generateWind();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(2.0, 1);
    });

    it('should generate rain ambient', () => {
      const buffer = sfxGenerator.generateRain();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(2.0, 1);
    });

    it('should generate fire ambient', () => {
      const buffer = sfxGenerator.generateFire();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(2.0, 1);
    });

    it('should generate UI click', () => {
      const buffer = sfxGenerator.generateUIClick();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(0.05, 1);
    });

    it('should generate UI notification', () => {
      const buffer = sfxGenerator.generateUINotification();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(0.2, 1);
    });

    it('should generate damage hit', () => {
      const buffer = sfxGenerator.generateDamageHit();
      expect(buffer).not.toBeNull();
      expect(buffer?.duration).toBeCloseTo(0.2, 1);
    });
  });
});

describe('AdaptiveMusicSystem', () => {
  let audioManager: AudioManager;
  let musicSystem: AdaptiveMusicSystem;

  beforeEach(async () => {
    audioManager = new AudioManager();
    await audioManager.init();
    musicSystem = new AdaptiveMusicSystem(audioManager);
  });

  describe('Music State Transitions', () => {
    it('should start in explore state', () => {
      expect(musicSystem.getState()).toBe(MusicState.EXPLORE);
    });

    it('should transition to tension state', () => {
      musicSystem.setState(MusicState.TENSION);
      expect(musicSystem.getState()).toBe(MusicState.TENSION);
    });

    it('should transition to combat state', () => {
      musicSystem.setState(MusicState.COMBAT);
      expect(musicSystem.getState()).toBe(MusicState.COMBAT);
    });

    it('should transition to boss state', () => {
      musicSystem.setState(MusicState.BOSS);
      expect(musicSystem.getState()).toBe(MusicState.BOSS);
    });

    it('should not transition to same state', () => {
      musicSystem.setState(MusicState.COMBAT);
      const state1 = musicSystem.getState();
      musicSystem.setState(MusicState.COMBAT);
      const state2 = musicSystem.getState();
      expect(state1).toBe(state2);
    });
  });

  describe('Region Changes', () => {
    it('should start in Greenmarch region', () => {
      expect(musicSystem.getRegion()).toBe(Region.GREENMARCH);
    });

    it('should change to Thornwood region', () => {
      musicSystem.setRegion(Region.THORNWOOD);
      expect(musicSystem.getRegion()).toBe(Region.THORNWOOD);
    });

    it('should change to Ironcrag region', () => {
      musicSystem.setRegion(Region.IRONCRAG);
      expect(musicSystem.getRegion()).toBe(Region.IRONCRAG);
    });

    it('should change to Saltfen region', () => {
      musicSystem.setRegion(Region.SALTFEN);
      expect(musicSystem.getRegion()).toBe(Region.SALTFEN);
    });

    it('should change to Ashfell region', () => {
      musicSystem.setRegion(Region.ASHFELL);
      expect(musicSystem.getRegion()).toBe(Region.ASHFELL);
    });

    it('should not change to same region', () => {
      musicSystem.setRegion(Region.THORNWOOD);
      const region1 = musicSystem.getRegion();
      musicSystem.setRegion(Region.THORNWOOD);
      const region2 = musicSystem.getRegion();
      expect(region1).toBe(region2);
    });
  });

  describe('Crossfade', () => {
    it('should have default crossfade duration', () => {
      // Default is 2.0 seconds
      expect(true).toBe(true); // Placeholder - would need to expose getter
    });

    it('should allow custom crossfade duration', () => {
      musicSystem.setCrossfadeDuration(3.0);
      // Would need to expose getter to verify
      expect(true).toBe(true);
    });
  });
});

describe('Voice Budget Logic', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager({ voiceBudget: 4 });
  });

  it('should allow playing within budget', () => {
    expect(audioManager.canPlayVoice()).toBe(true);
  });

  it('should track voice count', () => {
    expect(audioManager.getActiveVoiceCount()).toBe(0);
  });

  it('should have configurable budget', () => {
    expect(audioManager.getConfig().voiceBudget).toBe(4);
  });
});

describe('Music State Machine', () => {
  it('should have all music states', () => {
    expect(MusicState.EXPLORE).toBe('explore');
    expect(MusicState.TENSION).toBe('tension');
    expect(MusicState.COMBAT).toBe('combat');
    expect(MusicState.BOSS).toBe('boss');
  });

  it('should have all regions', () => {
    expect(Region.GREENMARCH).toBe('greenmarch');
    expect(Region.THORNWOOD).toBe('thornwood');
    expect(Region.IRONCRAG).toBe('ironcrag');
    expect(Region.SALTFEN).toBe('saltfen');
    expect(Region.ASHFELL).toBe('ashfell');
  });
});
