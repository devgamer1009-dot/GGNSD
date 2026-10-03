/**
 * Terrain Flattening System
 * P13 - Flatten terrain under buildings for proper placement
 */

import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import type { Plot } from '../../content/settlements/schemas.js';
import { BUILDING_SCHEMAS } from '../../content/settlements/schemas.js';

export class TerrainFlattener {
  /**
   * Flatten terrain under plots
   */
  flattenTerrainForPlots(
    chunkData: TerrainChunkData,
    plots: Plot[],
    worldOffsetX: number,
    worldOffsetZ: number
  ): void {
    const { heights, resolution, size } = chunkData;
    const verticesPerSide = resolution + 1;

    for (const plot of plots) {
      const schema = BUILDING_SCHEMAS[plot.buildingType];
      if (!schema.terrainFlatten) continue;

      // Calculate plot bounds in chunk-local coordinates
      const plotMinX = plot.position.x - plot.size.width / 2 - worldOffsetX;
      const plotMaxX = plot.position.x + plot.size.width / 2 - worldOffsetX;
      const plotMinZ = plot.position.z - plot.size.depth / 2 - worldOffsetZ;
      const plotMaxZ = plot.position.z + plot.size.depth / 2 - worldOffsetZ;

      // Skip if plot is outside chunk
      if (plotMaxX < 0 || plotMinX > size || plotMaxZ < 0 || plotMinZ > size) {
        continue;
      }

      // Calculate target height (average of plot area)
      const targetHeight = this.calculateAverageHeight(
        heights,
        verticesPerSide,
        plotMinX,
        plotMaxX,
        plotMinZ,
        plotMaxZ,
        size,
        resolution
      );

      // Flatten terrain
      this.flattenArea(
        heights,
        verticesPerSide,
        plotMinX,
        plotMaxX,
        plotMinZ,
        plotMaxZ,
        targetHeight,
        size,
        resolution
      );
    }
  }

  /**
   * Calculate average height in area
   */
  private calculateAverageHeight(
    heights: Float32Array,
    verticesPerSide: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    size: number,
    resolution: number
  ): number {
    let totalHeight = 0;
    let count = 0;

    const gridMinX = Math.max(0, Math.floor((minX / size) * resolution));
    const gridMaxX = Math.min(resolution, Math.ceil((maxX / size) * resolution));
    const gridMinZ = Math.max(0, Math.floor((minZ / size) * resolution));
    const gridMaxZ = Math.min(resolution, Math.ceil((maxZ / size) * resolution));

    for (let z = gridMinZ; z <= gridMaxZ; z++) {
      for (let x = gridMinX; x <= gridMaxX; x++) {
        const idx = z * verticesPerSide + x;
        totalHeight += heights[idx]!;
        count++;
      }
    }

    return count > 0 ? totalHeight / count : 0;
  }

  /**
   * Flatten terrain in area to target height
   */
  private flattenArea(
    heights: Float32Array,
    verticesPerSide: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    targetHeight: number,
    size: number,
    resolution: number
  ): void {
    const gridMinX = Math.max(0, Math.floor((minX / size) * resolution));
    const gridMaxX = Math.min(resolution, Math.ceil((maxX / size) * resolution));
    const gridMinZ = Math.max(0, Math.floor((minZ / size) * resolution));
    const gridMaxZ = Math.min(resolution, Math.ceil((maxZ / size) * resolution));

    for (let z = gridMinZ; z <= gridMaxZ; z++) {
      for (let x = gridMinX; x <= gridMaxX; x++) {
        const idx = z * verticesPerSide + x;

        // Calculate distance from edge for smooth blending
        const worldX = (x / resolution) * size;
        const worldZ = (z / resolution) * size;

        const distFromLeft = worldX - minX;
        const distFromRight = maxX - worldX;
        const distFromTop = worldZ - minZ;
        const distFromBottom = maxZ - worldZ;

        const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);
        const blendWidth = 2; // 2 meter blend zone

        let blendFactor = 1.0;
        if (minDist < blendWidth) {
          blendFactor = minDist / blendWidth;
          blendFactor = blendFactor * blendFactor * (3 - 2 * blendFactor); // Smoothstep
        }

        // Blend between original height and target height
        const originalHeight = heights[idx]!;
        heights[idx] = originalHeight + (targetHeight - originalHeight) * blendFactor;
      }
    }
  }

  /**
   * Create ramp from flattened area to surrounding terrain
   */
  createRamps(
    heights: Float32Array,
    verticesPerSide: number,
    plot: Plot,
    worldOffsetX: number,
    worldOffsetZ: number,
    size: number,
    resolution: number
  ): void {
    // This would create smooth transitions at plot edges
    // For now, the blend zone in flattenArea handles this
  }
}
