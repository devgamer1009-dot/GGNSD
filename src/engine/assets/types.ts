/**
 * Asset Pipeline Types
 * P8 - Manifest-driven asset system
 */

import type * as THREE from 'three';

/**
 * Asset types supported by the pipeline
 */
export enum AssetType {
  MODEL = 'model',
  TEXTURE = 'texture',
  MATERIAL = 'material',
  PARAMETRIC = 'parametric',
}

/**
 * LOD level definition
 */
export interface LODLevel {
  level: number; // 0 = highest detail
  maxDistance: number; // Switch to this LOD at this distance
  assetId: string; // Reference to LOD asset
}

/**
 * Asset manifest entry
 */
export interface AssetManifestEntry {
  id: string; // Unique identifier (no hardcoded paths)
  type: AssetType;
  source: string; // File path or generator name
  version: string; // Cache version key
  lod?: LODLevel[]; // Optional LOD chain
  metadata?: {
    triangles?: number;
    size?: number; // bytes
    tags?: string[];
  };
}

/**
 * Asset manifest
 */
export interface AssetManifest {
  version: string;
  assets: Record<string, AssetManifestEntry>;
}

/**
 * Loaded asset with metadata
 */
export interface LoadedAsset {
  id: string;
  data: THREE.Object3D | THREE.Texture | THREE.Material;
  type: AssetType;
  refCount: number;
  lodChain?: Map<number, THREE.Object3D>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalAssets: number;
    totalTriangles: number;
    totalSize: number;
    brokenReferences: string[];
  };
}

/**
 * Budget limits
 */
export interface AssetBudget {
  maxTrianglesPerAsset: number;
  maxTrianglesPerScene: number;
  maxTextureSize: number;
  maxAssetSize: number; // bytes
}

/**
 * Default budget limits
 */
export const DEFAULT_BUDGET: AssetBudget = {
  maxTrianglesPerAsset: 10000,
  maxTrianglesPerScene: 1000000,
  maxTextureSize: 2048,
  maxAssetSize: 10 * 1024 * 1024, // 10MB
};
