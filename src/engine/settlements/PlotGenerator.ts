/**
 * Plot Generator
 * P13 - Deterministic plot placement with collision detection
 */

import { SeededRNG } from '../utils/SeededRNG.js';
import type { Plot, Road } from '../../content/settlements/schemas.js';
import { BuildingType, BUILDING_SCHEMAS } from '../../content/settlements/schemas.js';
import { RoadNetworkGenerator } from './RoadNetwork.js';

export interface PlotConfig {
  minDistanceFromRoad: number;
  minDistanceBetweenPlots: number;
  maxSlope: number;
}

const DEFAULT_PLOT_CONFIG: PlotConfig = {
  minDistanceFromRoad: 3,
  minDistanceBetweenPlots: 2,
  maxSlope: 15, // degrees
};

export class PlotGenerator {
  private rng: SeededRNG;
  private roadGen: RoadNetworkGenerator;
  private config: PlotConfig;

  constructor(seed: number, config: Partial<PlotConfig> = {}) {
    this.rng = new SeededRNG(seed);
    this.roadGen = new RoadNetworkGenerator(seed);
    this.config = { ...DEFAULT_PLOT_CONFIG, ...config };
  }

  /**
   * Generate plots for a settlement
   */
  generate(
    centerX: number,
    centerZ: number,
    radius: number,
    roads: Road[],
    buildingCount: { min: number; max: number },
    hasMarket: boolean,
    hasFarms: boolean
  ): Plot[] {
    const plots: Plot[] = [];
    const targetCount = this.rng.nextInt(buildingCount.min, buildingCount.max);

    // Determine building types to place
    const buildingTypes = this.selectBuildingTypes(targetCount, hasMarket, hasFarms);

    // Try to place each building
    for (const buildingType of buildingTypes) {
      const plot = this.tryPlacePlot(
        centerX,
        centerZ,
        radius,
        roads,
        plots,
        buildingType
      );

      if (plot) {
        plots.push(plot);
      }
    }

    return plots;
  }

  /**
   * Select building types based on settlement needs
   */
  private selectBuildingTypes(
    count: number,
    hasMarket: boolean,
    hasFarms: boolean
  ): BuildingType[] {
    const types: BuildingType[] = [];

    // Add special buildings first
    if (hasMarket) {
      types.push(BuildingType.MARKET);
    }

    if (hasFarms) {
      const farmCount = Math.floor(count * 0.2); // 20% farms
      for (let i = 0; i < farmCount; i++) {
        types.push(BuildingType.FARM);
      }
    }

    // Add tavern and smithy
    types.push(BuildingType.TAVERN);
    types.push(BuildingType.SMITHY);

    // Fill rest with houses
    const houseCount = count - types.length;
    for (let i = 0; i < houseCount; i++) {
      types.push(BuildingType.HOUSE);
    }

    // Shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = this.rng.nextInt(0, i);
      [types[i], types[j]] = [types[j]!, types[i]!];
    }

    return types;
  }

  /**
   * Try to place a single plot
   */
  private tryPlacePlot(
    centerX: number,
    centerZ: number,
    radius: number,
    roads: Road[],
    existingPlots: Plot[],
    buildingType: BuildingType
  ): Plot | null {
    const schema = BUILDING_SCHEMAS[buildingType];
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Random position within radius
      const angle = this.rng.nextFloat(0, Math.PI * 2);
      const distance = this.rng.nextFloat(10, radius - 10);
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;

      // Check if near road
      if (!this.roadGen.isPointNearRoad(x, z, roads, this.config.minDistanceFromRoad)) {
        continue;
      }

      // Check if overlaps with existing plots
      if (this.overlapsExistingPlots(x, z, schema.size.width, schema.size.depth, existingPlots)) {
        continue;
      }

      // Random rotation (aligned to road or random)
      const rotation = this.rng.nextFloat(0, Math.PI * 2);

      return {
        id: `plot_${existingPlots.length}`,
        position: { x, z },
        size: { width: schema.size.width, depth: schema.size.depth },
        rotation,
        buildingType,
        hasInterior: schema.hasInterior,
      };
    }

    return null; // Failed to place
  }

  /**
   * Check if plot overlaps with existing plots
   */
  private overlapsExistingPlots(
    x: number,
    z: number,
    width: number,
    depth: number,
    existingPlots: Plot[]
  ): boolean {
    for (const plot of existingPlots) {
      const dx = Math.abs(x - plot.position.x);
      const dz = Math.abs(z - plot.position.z);
      const minDx = (width + plot.size.width) / 2 + this.config.minDistanceBetweenPlots;
      const minDz = (depth + plot.size.depth) / 2 + this.config.minDistanceBetweenPlots;

      if (dx < minDx && dz < minDz) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate plots (no overlaps, slope limits)
   */
  validate(plots: Plot[], heightMap?: (x: number, z: number) => number): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for overlaps
    for (let i = 0; i < plots.length; i++) {
      for (let j = i + 1; j < plots.length; j++) {
        const p1 = plots[i]!;
        const p2 = plots[j]!;

        const dx = Math.abs(p1.position.x - p2.position.x);
        const dz = Math.abs(p1.position.z - p2.position.z);
        const minDx = (p1.size.width + p2.size.width) / 2;
        const minDz = (p1.size.depth + p2.size.depth) / 2;

        if (dx < minDx && dz < minDz) {
          errors.push(`Plots ${p1.id} and ${p2.id} overlap`);
        }
      }
    }

    // Check slope limits
    if (heightMap) {
      for (const plot of plots) {
        const schema = BUILDING_SCHEMAS[plot.buildingType];
        if (!schema.terrainFlatten) continue;

        // Sample height at corners
        const corners = [
          { x: plot.position.x - plot.size.width / 2, z: plot.position.z - plot.size.depth / 2 },
          { x: plot.position.x + plot.size.width / 2, z: plot.position.z - plot.size.depth / 2 },
          { x: plot.position.x - plot.size.width / 2, z: plot.position.z + plot.size.depth / 2 },
          { x: plot.position.x + plot.size.width / 2, z: plot.position.z + plot.size.depth / 2 },
        ];

        const heights = corners.map(c => heightMap(c.x, c.z));
        const minHeight = Math.min(...heights);
        const maxHeight = Math.max(...heights);
        const slope = Math.atan((maxHeight - minHeight) / Math.max(plot.size.width, plot.size.depth)) * (180 / Math.PI);

        if (slope > this.config.maxSlope) {
          errors.push(`Plot ${plot.id} exceeds max slope (${slope.toFixed(1)}° > ${this.config.maxSlope}°)`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
