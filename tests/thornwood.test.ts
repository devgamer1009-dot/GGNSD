import { describe, it, expect } from 'vitest';
import {
  THORNWOOD_REGION,
  THORNWOOD_BIOMES,
  THORNWOOD_LANDMARKS,
  ELMSONG_SETTLEMENT,
  THORNWOOD_ENEMIES,
  THORNWOOD_QUESTS,
  THORNWOOD_AUDIO,
  THORNWOOD_COLOR_GRADING,
  THORNWOOD_WEATHER,
  validateThornwoodRegion,
} from '../src/content/regions/thornwood.js';

describe('Thornwood Region Data', () => {
  describe('Region Metadata', () => {
    it('should have valid region ID', () => {
      expect(THORNWOOD_REGION.id).toBe('thornwood');
    });

    it('should have valid bounds', () => {
      expect(THORNWOOD_REGION.bounds.minX).toBeLessThan(THORNWOOD_REGION.bounds.maxX);
      expect(THORNWOOD_REGION.bounds.minZ).toBeLessThan(THORNWOOD_REGION.bounds.maxZ);
    });

    it('should have center within bounds', () => {
      const { center, bounds } = THORNWOOD_REGION;
      expect(center.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(center.x).toBeLessThanOrEqual(bounds.maxX);
      expect(center.z).toBeGreaterThanOrEqual(bounds.minZ);
      expect(center.z).toBeLessThanOrEqual(bounds.maxZ);
    });

    it('should have valid difficulty rating', () => {
      expect(THORNWOOD_REGION.difficulty).toBeGreaterThanOrEqual(1);
      expect(THORNWOOD_REGION.difficulty).toBeLessThanOrEqual(5);
    });
  });

  describe('Biome Parameters', () => {
    it('should have three biomes', () => {
      expect(Object.keys(THORNWOOD_BIOMES)).toHaveLength(3);
    });

    it('should have valid vegetation densities', () => {
      for (const biome of Object.values(THORNWOOD_BIOMES)) {
        expect(biome.vegetation.treeDensity).toBeGreaterThanOrEqual(0);
        expect(biome.vegetation.treeDensity).toBeLessThanOrEqual(1);
        expect(biome.vegetation.grassDensity).toBeGreaterThanOrEqual(0);
        expect(biome.vegetation.grassDensity).toBeLessThanOrEqual(1);
      }
    });

    it('should have tree types with weights summing to 1', () => {
      for (const biome of Object.values(THORNWOOD_BIOMES)) {
        const totalWeight = biome.treeTypes.reduce((sum, t) => sum + t.weight, 0);
        expect(totalWeight).toBeCloseTo(1.0, 2);
      }
    });

    it('should have valid fog parameters', () => {
      for (const biome of Object.values(THORNWOOD_BIOMES)) {
        expect(biome.fog.density).toBeGreaterThanOrEqual(0);
        expect(biome.fog.density).toBeLessThanOrEqual(1);
        expect(biome.fog.startDistance).toBeLessThan(biome.fog.endDistance);
      }
    });
  });

  describe('Landmarks', () => {
    it('should have exactly 8 landmarks', () => {
      expect(THORNWOOD_LANDMARKS).toHaveLength(8);
    });

    it('should have unique IDs', () => {
      const ids = THORNWOOD_LANDMARKS.map(l => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid positions within region bounds', () => {
      const { bounds } = THORNWOOD_REGION;
      for (const landmark of THORNWOOD_LANDMARKS) {
        expect(landmark.position.x).toBeGreaterThanOrEqual(bounds.minX);
        expect(landmark.position.x).toBeLessThanOrEqual(bounds.maxX);
        expect(landmark.position.z).toBeGreaterThanOrEqual(bounds.minZ);
        expect(landmark.position.z).toBeLessThanOrEqual(bounds.maxZ);
      }
    });

    it('should have required fields', () => {
      for (const landmark of THORNWOOD_LANDMARKS) {
        expect(landmark.id).toBeDefined();
        expect(landmark.name).toBeDefined();
        expect(landmark.type).toBeDefined();
        expect(landmark.position).toBeDefined();
        expect(landmark.description).toBeDefined();
      }
    });

    it('should have at least one fast travel point', () => {
      const fastTravelPoints = THORNWOOD_LANDMARKS.filter(l => l.fastTravel);
      expect(fastTravelPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Elmsong Settlement', () => {
    it('should have valid settlement ID', () => {
      expect(ELMSONG_SETTLEMENT.id).toBe('elmsong');
    });

    it('should have at least 4 buildings', () => {
      expect(ELMSONG_SETTLEMENT.buildings.length).toBeGreaterThanOrEqual(4);
    });

    it('should have at least 4 NPCs', () => {
      expect(ELMSONG_SETTLEMENT.npcs.length).toBeGreaterThanOrEqual(4);
    });

    it('should have unique building IDs', () => {
      const ids = ELMSONG_SETTLEMENT.buildings.map(b => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique NPC IDs', () => {
      const ids = ELMSONG_SETTLEMENT.npcs.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have position within region bounds', () => {
      const { bounds } = THORNWOOD_REGION;
      expect(ELMSONG_SETTLEMENT.position.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(ELMSONG_SETTLEMENT.position.x).toBeLessThanOrEqual(bounds.maxX);
      expect(ELMSONG_SETTLEMENT.position.z).toBeGreaterThanOrEqual(bounds.minZ);
      expect(ELMSONG_SETTLEMENT.position.z).toBeLessThanOrEqual(bounds.maxZ);
    });
  });

  describe('Enemy Variants', () => {
    it('should have exactly 2 enemy types', () => {
      expect(THORNWOOD_ENEMIES).toHaveLength(2);
    });

    it('should have unique IDs', () => {
      const ids = THORNWOOD_ENEMIES.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid stats', () => {
      for (const enemy of THORNWOOD_ENEMIES) {
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.damage).toBeGreaterThan(0);
        expect(enemy.defense).toBeGreaterThanOrEqual(0);
        expect(enemy.speed).toBeGreaterThan(0);
      }
    });

    it('should have at least one ability', () => {
      for (const enemy of THORNWOOD_ENEMIES) {
        expect(enemy.abilities.length).toBeGreaterThan(0);
      }
    });

    it('should have spawn locations', () => {
      for (const enemy of THORNWOOD_ENEMIES) {
        expect(enemy.spawnLocations.length).toBeGreaterThan(0);
      }
    });

    it('should have loot tables', () => {
      for (const enemy of THORNWOOD_ENEMIES) {
        expect(enemy.loot.length).toBeGreaterThan(0);
      }
    });

    it('should have loot chances between 0 and 1', () => {
      for (const enemy of THORNWOOD_ENEMIES) {
        for (const loot of enemy.loot) {
          expect(loot.chance).toBeGreaterThanOrEqual(0);
          expect(loot.chance).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('Quests', () => {
    it('should have exactly 6 quests', () => {
      expect(THORNWOOD_QUESTS).toHaveLength(6);
    });

    it('should have unique IDs', () => {
      const ids = THORNWOOD_QUESTS.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have 3 main quests and 3 side quests', () => {
      const mainQuests = THORNWOOD_QUESTS.filter(q => q.type === 'main');
      const sideQuests = THORNWOOD_QUESTS.filter(q => q.type === 'side');
      expect(mainQuests).toHaveLength(3);
      expect(sideQuests).toHaveLength(3);
    });

    it('should have at least one objective per quest', () => {
      for (const quest of THORNWOOD_QUESTS) {
        expect(quest.objectives.length).toBeGreaterThan(0);
      }
    });

    it('should have rewards for all quests', () => {
      for (const quest of THORNWOOD_QUESTS) {
        expect(quest.rewards).toBeDefined();
        expect(quest.rewards.xp).toBeGreaterThan(0);
      }
    });

    it('should have valid quest givers', () => {
      const npcIds = ELMSONG_SETTLEMENT.npcs.map(n => n.id);
      for (const quest of THORNWOOD_QUESTS) {
        expect(npcIds).toContain(quest.giver);
      }
    });
  });

  describe('Audio Set', () => {
    it('should have at least 2 music tracks', () => {
      expect(Object.keys(THORNWOOD_AUDIO.music).length).toBeGreaterThanOrEqual(2);
    });

    it('should have at least 3 ambient sounds', () => {
      expect(THORNWOOD_AUDIO.ambience.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid music volumes', () => {
      for (const track of Object.values(THORNWOOD_AUDIO.music)) {
        expect(track.volume).toBeGreaterThanOrEqual(0);
        expect(track.volume).toBeLessThanOrEqual(1);
      }
    });

    it('should have valid ambient volumes', () => {
      for (const ambient of THORNWOOD_AUDIO.ambience) {
        expect(ambient.volume).toBeGreaterThanOrEqual(0);
        expect(ambient.volume).toBeLessThanOrEqual(1);
      }
    });

    it('should have required SFX', () => {
      expect(THORNWOOD_AUDIO.sfx.footstep_grass).toBeDefined();
      expect(THORNWOOD_AUDIO.sfx.thorn_sprite_attack).toBeDefined();
      expect(THORNWOOD_AUDIO.sfx.corrupted_bear_roar).toBeDefined();
    });
  });

  describe('Color Grading', () => {
    it('should have complete palette', () => {
      expect(THORNWOOD_COLOR_GRADING.palette.primary).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.palette.secondary).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.palette.accent).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.palette.shadow).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.palette.highlight).toBeDefined();
    });

    it('should have valid RGB values', () => {
      for (const color of Object.values(THORNWOOD_COLOR_GRADING.palette)) {
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(1);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(1);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(1);
      }
    });

    it('should have post-processing settings', () => {
      expect(THORNWOOD_COLOR_GRADING.postProcessing).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.postProcessing.colorCorrection).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.postProcessing.colorGrading).toBeDefined();
    });

    it('should have time-of-day variations', () => {
      expect(THORNWOOD_COLOR_GRADING.timeOfDay.dawn).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.timeOfDay.day).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.timeOfDay.dusk).toBeDefined();
      expect(THORNWOOD_COLOR_GRADING.timeOfDay.night).toBeDefined();
    });
  });

  describe('Weather Weights', () => {
    it('should have base weights summing to 1', () => {
      const sum = Object.values(THORNWOOD_WEATHER.baseWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have all weather types', () => {
      expect(THORNWOOD_WEATHER.baseWeights.clear).toBeDefined();
      expect(THORNWOOD_WEATHER.baseWeights.overcast).toBeDefined();
      expect(THORNWOOD_WEATHER.baseWeights.fog).toBeDefined();
      expect(THORNWOOD_WEATHER.baseWeights.rain).toBeDefined();
      expect(THORNWOOD_WEATHER.baseWeights.storm).toBeDefined();
      expect(THORNWOOD_WEATHER.baseWeights.snow).toBeDefined();
    });

    it('should have fog as common weather', () => {
      expect(THORNWOOD_WEATHER.baseWeights.fog).toBeGreaterThan(0.2);
    });

    it('should have valid time modifiers', () => {
      expect(THORNWOOD_WEATHER.timeModifiers.dawn).toBeDefined();
      expect(THORNWOOD_WEATHER.timeModifiers.day).toBeDefined();
      expect(THORNWOOD_WEATHER.timeModifiers.dusk).toBeDefined();
      expect(THORNWOOD_WEATHER.timeModifiers.night).toBeDefined();
    });

    it('should have weather effects defined', () => {
      expect(THORNWOOD_WEATHER.effects.fog).toBeDefined();
      expect(THORNWOOD_WEATHER.effects.rain).toBeDefined();
      expect(THORNWOOD_WEATHER.effects.storm).toBeDefined();
    });
  });

  describe('Full Validation', () => {
    it('should pass all validation checks', () => {
      const result = validateThornwoodRegion();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
