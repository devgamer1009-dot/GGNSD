import { describe, it, expect, beforeEach } from 'vitest';
import { SettlementGenerator } from '../src/engine/settlements/SettlementGenerator.js';
import { RoadNetworkGenerator } from '../src/engine/settlements/RoadNetwork.js';
import { PlotGenerator } from '../src/engine/settlements/PlotGenerator.js';
import { SETTLEMENT_SCHEMAS } from '../src/content/settlements/schemas.js';

describe('Settlement System', () => {
  describe('RoadNetworkGenerator', () => {
    let roadGen: RoadNetworkGenerator;

    beforeEach(() => {
      roadGen = new RoadNetworkGenerator(12345);
    });

    it('should generate roads deterministically', () => {
      const roads1 = roadGen.generate(0, 0, 100);
      const roads2 = roadGen.generate(0, 0, 100);

      expect(roads1.length).toBe(roads2.length);
      expect(roads1[0]!.points).toEqual(roads2[0]!.points);
    });

    it('should generate different roads with different seeds', () => {
      const gen1 = new RoadNetworkGenerator(12345);
      const gen2 = new RoadNetworkGenerator(54321);

      const roads1 = gen1.generate(0, 0, 100);
      const roads2 = gen2.generate(0, 0, 100);

      expect(roads1[0]!.points).not.toEqual(roads2[0]!.points);
    });

    it('should generate main and branch roads', () => {
      const roads = roadGen.generate(0, 0, 100);
      
      const mainRoads = roads.filter(r => r.isMainRoad);
      const branchRoads = roads.filter(r => !r.isMainRoad);

      expect(mainRoads.length).toBeGreaterThan(0);
      expect(branchRoads.length).toBeGreaterThan(0);
    });

    it('should detect points near roads', () => {
      const roads = roadGen.generate(0, 0, 100);
      
      // Point at center should be near a road
      const isNear = roadGen.isPointNearRoad(0, 0, roads, 10);
      expect(isNear).toBe(true);

      // Point far away should not be near
      const isFar = roadGen.isPointNearRoad(1000, 1000, roads, 10);
      expect(isFar).toBe(false);
    });
  });

  describe('PlotGenerator', () => {
    let plotGen: PlotGenerator;
    let roadGen: RoadNetworkGenerator;

    beforeEach(() => {
      plotGen = new PlotGenerator(12345);
      roadGen = new RoadNetworkGenerator(12345);
    });

    it('should generate plots deterministically', () => {
      const roads = roadGen.generate(0, 0, 100);
      
      const plots1 = plotGen.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);
      const plots2 = plotGen.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);

      expect(plots1.length).toBe(plots2.length);
      expect(plots1[0]!.position).toEqual(plots2[0]!.position);
    });

    it('should generate different plots with different seeds', () => {
      const roads = roadGen.generate(0, 0, 100);
      const plotGen2 = new PlotGenerator(54321);

      const plots1 = plotGen.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);
      const plots2 = plotGen2.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);

      expect(plots1[0]!.position).not.toEqual(plots2[0]!.position);
    });

    it('should not generate overlapping plots', () => {
      const roads = roadGen.generate(0, 0, 100);
      const plots = plotGen.generate(0, 0, 100, roads, { min: 10, max: 15 }, true, true);

      const validation = plotGen.validate(plots);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should respect building count range', () => {
      const roads = roadGen.generate(0, 0, 100);
      const plots = plotGen.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);

      expect(plots.length).toBeGreaterThanOrEqual(5);
      expect(plots.length).toBeLessThanOrEqual(10);
    });

    it('should include market when requested', () => {
      const roads = roadGen.generate(0, 0, 100);
      const plots = plotGen.generate(0, 0, 100, roads, { min: 10, max: 15 }, true, false);

      const hasMarket = plots.some(p => p.buildingType === 'market');
      expect(hasMarket).toBe(true);
    });

    it('should include farms when requested', () => {
      const roads = roadGen.generate(0, 0, 100);
      const plots = plotGen.generate(0, 0, 100, roads, { min: 10, max: 15 }, false, true);

      const hasFarm = plots.some(p => p.buildingType === 'farm');
      expect(hasFarm).toBe(true);
    });
  });

  describe('SettlementGenerator', () => {
    let settlementGen: SettlementGenerator;

    beforeEach(() => {
      settlementGen = new SettlementGenerator(12345);
    });

    it('should generate settlement deterministically', () => {
      const config = SETTLEMENT_SCHEMAS.briarhollow!;
      
      const settlement1 = settlementGen.generate(config);
      const settlement2 = settlementGen.generate(config);

      expect(settlement1.plots.length).toBe(settlement2.plots.length);
      expect(settlement1.roads.length).toBe(settlement2.roads.length);
    });

    it('should generate different settlements with different seeds', () => {
      const gen1 = new SettlementGenerator(12345);
      const gen2 = new SettlementGenerator(54321);

      const config = SETTLEMENT_SCHEMAS.briarhollow!;
      
      const settlement1 = gen1.generate(config);
      const settlement2 = gen2.generate(config);

      expect(settlement1.plots[0]!.position).not.toEqual(settlement2.plots[0]!.position);
    });

    it('should validate settlement (no overlapping plots)', () => {
      const config = SETTLEMENT_SCHEMAS.briarhollow!;
      const settlement = settlementGen.generate(config);

      const validation = settlementGen.validate(settlement);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should generate meshes for settlement', () => {
      const config = SETTLEMENT_SCHEMAS.briarhollow!;
      const settlement = settlementGen.generate(config);

      const meshes = settlementGen.generateMeshes(settlement);
      expect(meshes.children.length).toBeGreaterThan(0);
    });

    it('should identify interiors', () => {
      const config = SETTLEMENT_SCHEMAS.briarhollow!;
      const settlement = settlementGen.generate(config);

      // Should have at least tavern and smithy
      expect(settlement.interiors.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate castle with walls', () => {
      const config = SETTLEMENT_SCHEMAS.highspire!;
      const settlement = settlementGen.generate(config);

      expect(config.hasWalls).toBe(true);
      expect(settlement.landmarks).toContain('castle_keep');
    });
  });

  describe('Slope Validation', () => {
    it('should detect plots on steep slopes', () => {
      const plotGen = new PlotGenerator(12345);
      
      // Create a mock height map with steep slope
      const heightMap = (x: number, z: number) => {
        return x * 0.5; // 45 degree slope
      };

      const roads = new RoadNetworkGenerator(12345).generate(0, 0, 100);
      const plots = plotGen.generate(0, 0, 100, roads, { min: 5, max: 10 }, true, true);

      const validation = plotGen.validate(plots, heightMap);
      
      // Should have slope errors
      expect(validation.errors.some(e => e.includes('slope'))).toBe(true);
    });
  });
});
