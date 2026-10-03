/**
 * Road Network Generator
 * P13 - Deterministic road generation using L-system-like approach
 */

import { SeededRNG } from '../utils/SeededRNG.js';
import type { Road } from '../../content/settlements/schemas.js';

export interface RoadNetworkConfig {
  mainRoadCount: number;
  branchRoadCount: number;
  roadWidth: number;
  branchRoadWidth: number;
  maxRoadLength: number;
  minRoadLength: number;
}

const DEFAULT_ROAD_CONFIG: RoadNetworkConfig = {
  mainRoadCount: 4,
  branchRoadCount: 8,
  roadWidth: 4,
  branchRoadWidth: 2,
  maxRoadLength: 80,
  minRoadLength: 20,
};

export class RoadNetworkGenerator {
  private config: RoadNetworkConfig;
  private rng: SeededRNG;

  constructor(seed: number, config: Partial<RoadNetworkConfig> = {}) {
    this.config = { ...DEFAULT_ROAD_CONFIG, ...config };
    this.rng = new SeededRNG(seed);
  }

  /**
   * Generate road network for a settlement
   */
  generate(centerX: number, centerZ: number, radius: number): Road[] {
    const roads: Road[] = [];
    let roadId = 0;

    // Generate main roads (radial from center)
    for (let i = 0; i < this.config.mainRoadCount; i++) {
      const angle = (i / this.config.mainRoadCount) * Math.PI * 2;
      const length = this.rng.nextFloat(
        this.config.minRoadLength,
        Math.min(this.config.maxRoadLength, radius)
      );

      const road = this.generateRadialRoad(
        roadId++,
        centerX,
        centerZ,
        angle,
        length,
        this.config.roadWidth,
        true
      );
      roads.push(road);
    }

    // Generate branch roads (connecting main roads)
    for (let i = 0; i < this.config.branchRoadCount; i++) {
      const parentRoad = roads[this.rng.nextInt(0, roads.length - 1)]!;
      const t = this.rng.nextFloat(0.3, 0.7); // Position along parent road
      const parentPoint = this.getPointAlongRoad(parentRoad, t);
      
      const angleOffset = this.rng.nextFloat(-Math.PI / 4, Math.PI / 4);
      const baseAngle = this.getRoadAngleAtPoint(parentRoad, t);
      const angle = baseAngle + angleOffset + Math.PI / 2; // Perpendicular
      
      const length = this.rng.nextFloat(
        this.config.minRoadLength * 0.5,
        this.config.maxRoadLength * 0.5
      );

      const road = this.generateRadialRoad(
        roadId++,
        parentPoint.x,
        parentPoint.z,
        angle,
        length,
        this.config.branchRoadWidth,
        false
      );
      roads.push(road);
    }

    return roads;
  }

  /**
   * Generate a single radial road
   */
  private generateRadialRoad(
    id: number,
    startX: number,
    startZ: number,
    angle: number,
    length: number,
    width: number,
    isMainRoad: boolean
  ): Road {
    const points: Array<{ x: number; z: number }> = [];
    const segments = Math.ceil(length / 5); // One point every 5 meters

    let currentX = startX;
    let currentZ = startZ;
    let currentAngle = angle;

    for (let i = 0; i <= segments; i++) {
      points.push({ x: currentX, z: currentZ });

      // Add slight curvature
      const curvature = this.rng.nextFloat(-0.1, 0.1);
      currentAngle += curvature;

      const segmentLength = length / segments;
      currentX += Math.cos(currentAngle) * segmentLength;
      currentZ += Math.sin(currentAngle) * segmentLength;
    }

    return {
      id: `road_${id}`,
      points,
      width,
      isMainRoad,
    };
  }

  /**
   * Get point along road at parameter t (0-1)
   */
  private getPointAlongRoad(road: Road, t: number): { x: number; z: number } {
    const points = road.points;
    const index = t * (points.length - 1);
    const i = Math.floor(index);
    const frac = index - i;

    if (i >= points.length - 1) {
      return points[points.length - 1]!;
    }

    const p0 = points[i]!;
    const p1 = points[i + 1]!;

    return {
      x: p0.x + (p1.x - p0.x) * frac,
      z: p0.z + (p1.z - p0.z) * frac,
    };
  }

  /**
   * Get road angle at point
   */
  private getRoadAngleAtPoint(road: Road, t: number): number {
    const points = road.points;
    const index = t * (points.length - 1);
    const i = Math.floor(index);

    if (i >= points.length - 1) {
      const p0 = points[i - 1]!;
      const p1 = points[i]!;
      return Math.atan2(p1.z - p0.z, p1.x - p0.x);
    }

    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    return Math.atan2(p1.z - p0.z, p1.x - p0.x);
  }

  /**
   * Check if point is near a road
   */
  isPointNearRoad(x: number, z: number, roads: Road[], threshold: number = 5): boolean {
    for (const road of roads) {
      for (let i = 0; i < road.points.length - 1; i++) {
        const p0 = road.points[i]!;
        const p1 = road.points[i + 1]!;

        const dist = this.distanceToLineSegment(x, z, p0.x, p0.z, p1.x, p1.z);
        if (dist < threshold) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ): number {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lengthSquared = dx * dx + dz * dz;

    if (lengthSquared === 0) {
      return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
    }

    let t = ((px - x1) * dx + (pz - z1) * dz) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestZ = z1 + t * dz;

    return Math.sqrt((px - closestX) ** 2 + (pz - closestZ) ** 2);
  }
}
