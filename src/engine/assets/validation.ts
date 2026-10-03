/**
 * Asset Validation
 * P8 - Validate manifests, check budgets, detect broken references
 */

import type { AssetManifest, AssetBudget, ValidationResult } from './types.js';
import { DEFAULT_BUDGET } from './types.js';
import { ParametricGenerators } from './parametric.js';

/**
 * Asset validator
 */
export class AssetValidator {
  private budget: AssetBudget;
  private generators: ParametricGenerators;

  constructor(budget: AssetBudget = DEFAULT_BUDGET) {
    this.budget = budget;
    this.generators = new ParametricGenerators();
  }

  /**
   * Validate entire manifest
   */
  validate(manifest: AssetManifest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const brokenReferences: string[] = [];
    let totalTriangles = 0;
    let totalSize = 0;

    // Check each asset
    for (const [id, asset] of Object.entries(manifest.assets)) {
      // Check for broken references
      if (asset.lod) {
        for (const lod of asset.lod) {
          if (!manifest.assets[lod.assetId]) {
            brokenReferences.push(`Asset ${id} references missing LOD asset: ${lod.assetId}`);
          }
        }
      }

      // Check parametric generators
      if (asset.type === 'parametric') {
        if (!this.generators.has(asset.source)) {
          errors.push(`Asset ${id} references unknown generator: ${asset.source}`);
        }
      }

      // Check budgets
      if (asset.metadata?.triangles) {
        totalTriangles += asset.metadata.triangles;
        if (asset.metadata.triangles > this.budget.maxTrianglesPerAsset) {
          warnings.push(
            `Asset ${id} exceeds triangle budget: ${asset.metadata.triangles} > ${this.budget.maxTrianglesPerAsset}`
          );
        }
      }

      if (asset.metadata?.size) {
        totalSize += asset.metadata.size;
        if (asset.metadata.size > this.budget.maxAssetSize) {
          warnings.push(
            `Asset ${id} exceeds size budget: ${asset.metadata.size} > ${this.budget.maxAssetSize}`
          );
        }
      }
    }

    // Check total scene budget
    if (totalTriangles > this.budget.maxTrianglesPerScene) {
      warnings.push(
        `Total triangles exceed scene budget: ${totalTriangles} > ${this.budget.maxTrianglesPerScene}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalAssets: Object.keys(manifest.assets).length,
        totalTriangles,
        totalSize,
        brokenReferences,
      },
    };
  }

  /**
   * Validate single asset
   */
  validateAsset(id: string, manifest: AssetManifest): { valid: boolean; errors: string[] } {
    const asset = manifest.assets[id];
    if (!asset) {
      return { valid: false, errors: [`Asset not found: ${id}`] };
    }

    const errors: string[] = [];

    // Check parametric generator
    if (asset.type === 'parametric' && !this.generators.has(asset.source)) {
      errors.push(`Unknown generator: ${asset.source}`);
    }

    // Check LOD references
    if (asset.lod) {
      for (const lod of asset.lod) {
        if (!manifest.assets[lod.assetId]) {
          errors.push(`Missing LOD reference: ${lod.assetId}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get budget limits
   */
  getBudget(): AssetBudget {
    return { ...this.budget };
  }

  /**
   * Set budget limits
   */
  setBudget(budget: Partial<AssetBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }
}
