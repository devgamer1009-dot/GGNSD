/**
 * NavMesh System
 * P14 - Navigation mesh generation and pathfinding using recast-navigation
 */

import { init, NavMeshQuery } from 'recast-navigation';
import { generateSoloNavMesh, generateTiledNavMesh } from 'recast-navigation/generators';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export interface NavMeshConfig {
  cellSize: number;
  cellHeight: number;
  agentHeight: number;
  agentRadius: number;
  agentMaxClimb: number;
  agentMaxSlope: number;
  regionMinSize: number;
  regionMergeSize: number;
  edgeMaxLen: number;
  edgeMaxError: number;
  vertsPerPoly: number;
  detailSampleDist: number;
  detailSampleMaxError: number;
  tiled: boolean;
  tileSize: number;
}

const DEFAULT_NAVMESH_CONFIG: NavMeshConfig = {
  cellSize: 0.3,
  cellHeight: 0.2,
  agentHeight: 1.8,
  agentRadius: 0.3,
  agentMaxClimb: 0.5,
  agentMaxSlope: 45,
  regionMinSize: 8,
  regionMergeSize: 20,
  edgeMaxLen: 12,
  edgeMaxError: 1.3,
  vertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
  tiled: false,
  tileSize: 32,
};

export class NavMeshSystem {
  private initialized: boolean = false;
  private navMesh: any = null;
  private navMeshQuery: NavMeshQuery | null = null;
  private config: NavMeshConfig;
  private chunkNavMeshes: Map<string, any> = new Map();

  constructor(config: Partial<NavMeshConfig> = {}) {
    this.config = { ...DEFAULT_NAVMESH_CONFIG, ...config };
  }

  /**
   * Initialize the navigation system
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    await init();
    this.initialized = true;
  }

  /**
   * Generate navmesh for a terrain chunk
   */
  generateChunkNavMesh(chunkData: TerrainChunkData, worldOffsetX: number, worldOffsetZ: number): void {
    if (!this.initialized) {
      throw new Error('NavMeshSystem not initialized');
    }

    const { heights, resolution, size } = chunkData;
    const verticesPerSide = resolution + 1;

    // Generate positions and indices from heightmap
    const positions: number[] = [];
    const indices: number[] = [];

    // Create vertices
    for (let z = 0; z < verticesPerSide; z++) {
      for (let x = 0; x < verticesPerSide; x++) {
        const idx = z * verticesPerSide + x;
        const worldX = worldOffsetX + (x / resolution) * size;
        const worldZ = worldOffsetZ + (z / resolution) * size;
        const worldY = heights[idx]! * 200; // Scale height

        positions.push(worldX, worldY, worldZ);
      }
    }

    // Create triangles
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const topLeft = z * verticesPerSide + x;
        const topRight = topLeft + 1;
        const bottomLeft = (z + 1) * verticesPerSide + x;
        const bottomRight = bottomLeft + 1;

        // Two triangles per quad
        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    // Generate navmesh
    const chunkKey = `${chunkData.chunkX},${chunkData.chunkZ}`;
    
    if (this.config.tiled) {
      const { success, navMesh } = generateTiledNavMesh(
        new Float32Array(positions),
        new Uint32Array(indices),
        this.config
      );

      if (success && navMesh) {
        this.chunkNavMeshes.set(chunkKey, navMesh);
      }
    } else {
      const { success, navMesh } = generateSoloNavMesh(
        new Float32Array(positions),
        new Uint32Array(indices),
        this.config
      );

      if (success && navMesh) {
        this.chunkNavMeshes.set(chunkKey, navMesh);
      }
    }
  }

  /**
   * Remove navmesh for a chunk
   */
  removeChunkNavMesh(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    const navMesh = this.chunkNavMeshes.get(chunkKey);
    
    if (navMesh) {
      navMesh.dispose();
      this.chunkNavMeshes.delete(chunkKey);
    }
  }

  /**
   * Find path between two points
   */
  findPath(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    chunkX: number,
    chunkZ: number
  ): Array<{ x: number; y: number; z: number }> | null {
    const chunkKey = `${chunkX},${chunkZ}`;
    const navMesh = this.chunkNavMeshes.get(chunkKey);
    
    if (!navMesh) {
      return null;
    }

    const query = new NavMeshQuery(navMesh);
    const { success, path } = query.computePath(start, end);

    if (success && path) {
      return path.map(p => ({ x: p.x, y: p.y, z: p.z }));
    }

    return null;
  }

  /**
   * Find closest point on navmesh
   */
  findClosestPoint(
    position: { x: number; y: number; z: number },
    chunkX: number,
    chunkZ: number
  ): { x: number; y: number; z: number } | null {
    const chunkKey = `${chunkX},${chunkZ}`;
    const navMesh = this.chunkNavMeshes.get(chunkKey);
    
    if (!navMesh) {
      return null;
    }

    const query = new NavMeshQuery(navMesh);
    const { success, point } = query.findClosestPoint(position);

    if (success && point) {
      return { x: point.x, y: point.y, z: point.z };
    }

    return null;
  }

  /**
   * Check if navmesh exists for chunk
   */
  hasNavMesh(chunkX: number, chunkZ: number): boolean {
    const chunkKey = `${chunkX},${chunkZ}`;
    return this.chunkNavMeshes.has(chunkKey);
  }

  /**
   * Get navmesh count
   */
  getNavMeshCount(): number {
    return this.chunkNavMeshes.size;
  }

  /**
   * Dispose all navmeshes
   */
  dispose(): void {
    for (const navMesh of this.chunkNavMeshes.values()) {
      navMesh.dispose();
    }
    this.chunkNavMeshes.clear();
    this.navMeshQuery = null;
  }
}
