/**
 * Settlement Generator
 * P13 - Main orchestrator for deterministic settlement generation
 */

import * as THREE from 'three';
import { SeededRNG } from '../utils/SeededRNG.js';
import type { Settlement, SettlementConfig, Plot, Road } from '../../content/settlements/schemas.js';
import { SETTLEMENT_SCHEMAS, BuildingType } from '../../content/settlements/schemas.js';
import { RoadNetworkGenerator } from './RoadNetwork.js';
import { PlotGenerator } from './PlotGenerator.js';
import { BuildingGenerator } from './BuildingGenerator.js';
import { TerrainFlattener } from './TerrainFlattener.js';
import { InteriorSystem, InteriorType } from './InteriorSystem.js';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export class SettlementGenerator {
  private rng: SeededRNG;
  private roadGen: RoadNetworkGenerator;
  private plotGen: PlotGenerator;
  private buildingGen: BuildingGenerator;
  private terrainFlattener: TerrainFlattener;
  private interiorSystem: InteriorSystem;

  constructor(seed: number) {
    this.rng = new SeededRNG(seed);
    this.roadGen = new RoadNetworkGenerator(seed);
    this.plotGen = new PlotGenerator(seed);
    this.buildingGen = new BuildingGenerator();
    this.terrainFlattener = new TerrainFlattener();
    this.interiorSystem = new InteriorSystem();
  }

  /**
   * Generate complete settlement
   */
  generate(config: SettlementConfig): Settlement {
    const settlement: Settlement = {
      id: `settlement_${config.name.toLowerCase().replace(/\s+/g, '_')}`,
      config,
      plots: [],
      roads: [],
      landmarks: [],
      interiors: [],
    };

    // Generate road network
    settlement.roads = this.roadGen.generate(
      config.position.x,
      config.position.z,
      config.radius
    );

    // Generate plots
    settlement.plots = this.plotGen.generate(
      config.position.x,
      config.position.z,
      config.radius,
      settlement.roads,
      config.buildingCount,
      config.hasMarket,
      config.hasFarms
    );

    // Add special landmarks
    if (config.type === 'castle') {
      settlement.landmarks.push('castle_keep');
    }

    // Identify interiors
    for (const plot of settlement.plots) {
      if (plot.hasInterior) {
        settlement.interiors.push(plot.id);
      }
    }

    return settlement;
  }

  /**
   * Generate settlement meshes
   */
  generateMeshes(settlement: Settlement): THREE.Group {
    const group = new THREE.Group();
    group.name = settlement.id;

    // Generate roads
    const roadGroup = this.generateRoadMeshes(settlement.roads);
    group.add(roadGroup);

    // Generate buildings
    for (const plot of settlement.plots) {
      const building = this.buildingGen.generate(plot);
      group.add(building);
    }

    return group;
  }

  /**
   * Generate road meshes
   */
  private generateRoadMeshes(roads: Road[]): THREE.Group {
    const group = new THREE.Group();
    group.name = 'roads';

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 1.0,
    });

    for (const road of roads) {
      // Create road segments
      for (let i = 0; i < road.points.length - 1; i++) {
        const p0 = road.points[i]!;
        const p1 = road.points[i + 1]!;

        const dx = p1.x - p0.x;
        const dz = p1.z - p0.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);

        const geometry = new THREE.PlaneGeometry(length, road.width);
        const mesh = new THREE.Mesh(geometry, roadMaterial);

        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -angle;
        mesh.position.set(
          (p0.x + p1.x) / 2,
          0.02, // Slightly above terrain
          (p0.z + p1.z) / 2
        );
        mesh.receiveShadow = true;

        group.add(mesh);
      }
    }

    return group;
  }

  /**
   * Flatten terrain for settlement
   */
  flattenTerrain(
    chunkData: TerrainChunkData,
    settlement: Settlement,
    worldOffsetX: number,
    worldOffsetZ: number
  ): void {
    this.terrainFlattener.flattenTerrainForPlots(
      chunkData,
      settlement.plots,
      worldOffsetX,
      worldOffsetZ
    );
  }

  /**
   * Generate interior mesh
   */
  generateInterior(plotId: string, interiorType: InteriorType): THREE.Group {
    return this.interiorSystem.generateInterior(interiorType);
  }

  /**
   * Get settlement by name
   */
  getSettlementConfig(name: string): SettlementConfig | undefined {
    return SETTLEMENT_SCHEMAS[name];
  }

  /**
   * Validate settlement
   */
  validate(settlement: Settlement): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate plots
    const plotValidation = this.plotGen.validate(settlement.plots);
    errors.push(...plotValidation.errors);

    // Check for overlapping plots
    for (let i = 0; i < settlement.plots.length; i++) {
      for (let j = i + 1; j < settlement.plots.length; j++) {
        const p1 = settlement.plots[i]!;
        const p2 = settlement.plots[j]!;

        const dx = Math.abs(p1.position.x - p2.position.x);
        const dz = Math.abs(p1.position.z - p2.position.z);
        const minDx = (p1.size.width + p2.size.width) / 2;
        const minDz = (p1.size.depth + p2.size.depth) / 2;

        if (dx < minDx && dz < minDz) {
          errors.push(`Plots ${p1.id} and ${p2.id} overlap`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all building types
   */
  getBuildingTypes(): BuildingType[] {
    return Object.values(BuildingType);
  }

  /**
   * Get all interior types
   */
  getInteriorTypes(): InteriorType[] {
    return Object.values(InteriorType);
  }
}
