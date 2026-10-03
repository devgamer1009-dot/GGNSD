/**
 * Asset Manager
 * P8 - Main asset pipeline orchestrator
 */

import type * as THREE from 'three';
import type { AssetManifest, AssetManifestEntry, LoadedAsset } from './types.js';
import { AssetType } from './types.js';
import { AssetLoaders } from './loaders.js';
import { ParametricGenerators } from './parametric.js';
import { AssetValidator } from './validation.js';
import { LODSelector } from './lod.js';
import { AssetCache } from './cache.js';

/**
 * Asset manager - orchestrates the entire asset pipeline
 */
export class AssetManager {
  private manifest: AssetManifest | null = null;
  private loaders: AssetLoaders;
  private generators: ParametricGenerators;
  private validator: AssetValidator;
  private lodSelector: LODSelector;
  private cache: AssetCache;
  private initialized = false;

  constructor() {
    this.loaders = new AssetLoaders();
    this.generators = new ParametricGenerators();
    this.validator = new AssetValidator();
    this.lodSelector = new LODSelector();
    this.cache = new AssetCache();
  }

  /**
   * Initialize asset manager
   */
  async init(renderer?: THREE.WebGLRenderer): Promise<void> {
    if (this.initialized) return;

    await this.loaders.init(renderer);
    await this.cache.init();

    this.initialized = true;
    console.log('[AssetManager] Initialized');
  }

  /**
   * Load asset manifest
   */
  async loadManifest(manifest: AssetManifest): Promise<void> {
    // Validate manifest
    const result = this.validator.validate(manifest);
    if (!result.valid) {
      throw new Error(`Invalid manifest: ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      console.warn('[AssetManager] Manifest warnings:', result.warnings);
    }

    this.manifest = manifest;
    console.log(`[AssetManager] Loaded manifest with ${result.stats.totalAssets} assets`);
  }

  /**
   * Load asset by ID
   */
  async load(id: string): Promise<LoadedAsset> {
    if (!this.manifest) {
      throw new Error('Manifest not loaded');
    }

    const entry = this.manifest.assets[id];
    if (!entry) {
      throw new Error(`Asset not found in manifest: ${id}`);
    }

    // Check cache first
    const cached = this.cache.get(id, entry.version);
    if (cached) {
      this.cache.acquire(id, entry.version);
      return cached;
    }

    // Load asset based on type
    let data: THREE.Object3D | THREE.Texture | THREE.Material;

    switch (entry.type) {
      case AssetType.MODEL:
        data = await this.loaders.loadGLTF(entry.source);
        break;

      case AssetType.TEXTURE:
        data = await this.loaders.loadTexture(entry.source);
        break;

      case AssetType.PARAMETRIC:
        data = this.generators.generate(entry.source);
        break;

      default:
        throw new Error(`Unsupported asset type: ${entry.type}`);
    }

    // Create loaded asset
    const asset: LoadedAsset = {
      id,
      data,
      type: entry.type,
      refCount: 1,
    };

    // Load LOD chain if present
    if (entry.lod) {
      asset.lodChain = new Map();
      for (const lod of entry.lod) {
        try {
          const lodAsset = await this.load(lod.assetId);
          asset.lodChain.set(lod.level, lodAsset.data as THREE.Object3D);
        } catch (error) {
          console.warn(`[AssetManager] Failed to load LOD ${lod.level} for ${id}:`, error);
        }
      }
    }

    // Cache asset
    this.cache.set(id, entry.version, asset);

    return asset;
  }

  /**
   * Unload asset by ID
   */
  unload(id: string): void {
    if (!this.manifest) return;

    const entry = this.manifest.assets[id];
    if (!entry) return;

    const disposed = this.cache.release(id, entry.version);
    if (disposed) {
      console.log(`[AssetManager] Unloaded asset: ${id}`);
    }
  }

  /**
   * Get asset by ID (must be loaded first)
   */
  get(id: string): LoadedAsset | undefined {
    if (!this.manifest) return undefined;

    const entry = this.manifest.assets[id];
    if (!entry) return undefined;

    return this.cache.get(id, entry.version);
  }

  /**
   * Get LOD for asset based on distance
   */
  getLOD(id: string, distance: number): THREE.Object3D | undefined {
    const asset = this.get(id);
    if (!asset || !asset.lodChain) return undefined;

    if (!this.manifest) return undefined;
    const entry = this.manifest.assets[id];
    if (!entry || !entry.lod) return undefined;

    const lodLevel = this.lodSelector.select(id, entry.lod, distance);
    return asset.lodChain.get(lodLevel);
  }

  /**
   * Validate manifest
   */
  validate(): ReturnType<AssetValidator['validate']> {
    if (!this.manifest) {
      return {
        valid: false,
        errors: ['Manifest not loaded'],
        warnings: [],
        stats: { totalAssets: 0, totalTriangles: 0, totalSize: 0, brokenReferences: [] },
      };
    }

    return this.validator.validate(this.manifest);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): ReturnType<AssetCache['getStats']> {
    return this.cache.getStats();
  }

  /**
   * Get all parametric generator names
   */
  getParametricGenerators(): string[] {
    return this.generators.getNames();
  }

  /**
   * Generate parametric asset directly (without manifest)
   */
  generateParametric(name: string, seed: number = 12345): THREE.Object3D {
    return this.generators.generate(name, seed);
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.cache.clear();
    this.loaders.dispose();
    this.cache.close();
    this.lodSelector.reset();
  }
}
