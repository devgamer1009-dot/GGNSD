import { describe, it, expect, beforeEach } from 'vitest';
import { AssetManager } from '../src/engine/assets/manager.js';
import { AssetValidator } from '../src/engine/assets/validation.js';
import { ParametricGenerators } from '../src/engine/assets/parametric.js';
import { LODSelector, createDefaultLODChain } from '../src/engine/assets/lod.js';
import { AssetCache } from '../src/engine/assets/cache.js';
import { SAMPLE_MANIFEST } from '../src/engine/assets/sample-manifest.js';
import { AssetType } from '../src/engine/assets/types.js';

describe('ParametricGenerators', () => {
  let generators: ParametricGenerators;

  beforeEach(() => {
    generators = new ParametricGenerators();
  });

  it('should have default generators registered', () => {
    expect(generators.has('rock_small')).toBe(true);
    expect(generators.has('tree_pine')).toBe(true);
    expect(generators.has('house_small')).toBe(true);
    expect(generators.has('prop_barrel')).toBe(true);
  });

  it('should generate assets with different seeds', () => {
    const rock1 = generators.generate('rock_small', 12345);
    const rock2 = generators.generate('rock_small', 54321);

    // Both should be valid Object3D
    expect(rock1).toBeDefined();
    expect(rock2).toBeDefined();
    expect(rock1.type).toBe('Group');
    expect(rock2.type).toBe('Group');
  });

  it('should generate same asset with same seed', () => {
    const rock1 = generators.generate('rock_small', 12345);
    const rock2 = generators.generate('rock_small', 12345);

    // Should have same structure
    expect(rock1.children.length).toBe(rock2.children.length);
  });

  it('should throw for unknown generator', () => {
    expect(() => generators.generate('unknown_asset')).toThrow();
  });

  it('should list all generator names', () => {
    const names = generators.getNames();
    expect(names).toContain('rock_small');
    expect(names).toContain('tree_pine');
    expect(names).toContain('house_small');
    expect(names.length).toBeGreaterThan(10);
  });
});

describe('AssetValidator', () => {
  let validator: AssetValidator;

  beforeEach(() => {
    validator = new AssetValidator();
  });

  it('should validate sample manifest', () => {
    const result = validator.validate(SAMPLE_MANIFEST);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.stats.totalAssets).toBeGreaterThan(0);
  });

  it('should detect broken references', () => {
    const badManifest = {
      version: '1.0.0',
      assets: {
        test: {
          id: 'test',
          type: AssetType.PARAMETRIC,
          source: 'rock_small',
          version: '1.0.0',
          lod: [
            { level: 0, maxDistance: 50, assetId: 'nonexistent_lod' },
          ],
        },
      },
    };

    const result = validator.validate(badManifest);
    expect(result.stats.brokenReferences.length).toBeGreaterThan(0);
  });

  it('should detect unknown generators', () => {
    const badManifest = {
      version: '1.0.0',
      assets: {
        test: {
          id: 'test',
          type: AssetType.PARAMETRIC,
          source: 'unknown_generator',
          version: '1.0.0',
        },
      },
    };

    const result = validator.validate(badManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about budget violations', () => {
    const largeManifest = {
      version: '1.0.0',
      assets: {
        test: {
          id: 'test',
          type: AssetType.PARAMETRIC,
          source: 'rock_small',
          version: '1.0.0',
          metadata: {
            triangles: 100000, // Over budget
          },
        },
      },
    };

    const result = validator.validate(largeManifest);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should validate single asset', () => {
    const result = validator.validateAsset('rock_small', SAMPLE_MANIFEST);
    expect(result.valid).toBe(true);
  });

  it('should fail validation for missing asset', () => {
    const result = validator.validateAsset('nonexistent', SAMPLE_MANIFEST);
    expect(result.valid).toBe(false);
  });
});

describe('LODSelector', () => {
  let selector: LODSelector;

  beforeEach(() => {
    selector = new LODSelector(0.1);
  });

  it('should select LOD 0 for close distance', () => {
    const lodChain = createDefaultLODChain('test');
    const level = selector.select('test', lodChain, 10);
    expect(level).toBe(0);
  });

  it('should select LOD 1 for medium distance', () => {
    const lodChain = createDefaultLODChain('test');
    const level = selector.select('test', lodChain, 75);
    expect(level).toBe(1);
  });

  it('should select LOD 2 for far distance', () => {
    const lodChain = createDefaultLODChain('test');
    const level = selector.select('test', lodChain, 150);
    expect(level).toBe(2);
  });

  it('should select LOD 3 for very far distance', () => {
    const lodChain = createDefaultLODChain('test');
    const level = selector.select('test', lodChain, 300);
    expect(level).toBe(3);
  });

  it('should track current LOD', () => {
    const lodChain = createDefaultLODChain('test');
    selector.select('test', lodChain, 10);
    expect(selector.getCurrentLOD('test')).toBe(0);
  });

  it('should reset LOD tracking', () => {
    const lodChain = createDefaultLODChain('test');
    selector.select('test', lodChain, 10);
    selector.reset();
    expect(selector.getCurrentLOD('test')).toBe(0); // Default
  });
});

describe('AssetCache', () => {
  let cache: AssetCache;

  beforeEach(() => {
    cache = new AssetCache();
  });

  it('should generate versioned keys', () => {
    const key = cache.makeKey('rock_small', '1.0.0');
    expect(key).toBe('rock_small:1.0.0');
  });

  it('should store and retrieve assets', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 1,
    };

    cache.set('test', '1.0.0', mockAsset);
    const retrieved = cache.get('test', '1.0.0');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test');
  });

  it('should check if asset exists', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 1,
    };

    cache.set('test', '1.0.0', mockAsset);
    expect(cache.has('test', '1.0.0')).toBe(true);
    expect(cache.has('test', '2.0.0')).toBe(false);
  });

  it('should increment ref count on acquire', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 1,
    };

    cache.set('test', '1.0.0', mockAsset);
    cache.acquire('test', '1.0.0');

    const retrieved = cache.get('test', '1.0.0');
    expect(retrieved?.refCount).toBe(2);
  });

  it('should decrement ref count on release', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 2,
    };

    cache.set('test', '1.0.0', mockAsset);
    cache.release('test', '1.0.0');

    const retrieved = cache.get('test', '1.0.0');
    expect(retrieved?.refCount).toBe(1);
  });

  it('should remove asset when ref count reaches zero', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 1,
    };

    cache.set('test', '1.0.0', mockAsset);
    cache.release('test', '1.0.0');

    expect(cache.has('test', '1.0.0')).toBe(false);
  });

  it('should get cache statistics', () => {
    const mockAsset = {
      id: 'test',
      data: {} as any,
      type: AssetType.PARAMETRIC,
      refCount: 1,
    };

    cache.set('test1', '1.0.0', mockAsset);
    cache.set('test2', '1.0.0', mockAsset);

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.assets).toContain('test1:1.0.0');
    expect(stats.assets).toContain('test2:1.0.0');
  });
});

describe('AssetManager', () => {
  let manager: AssetManager;

  beforeEach(async () => {
    manager = new AssetManager();
    await manager.init();
  });

  it('should initialize successfully', () => {
    expect(manager).toBeDefined();
  });

  it('should load manifest', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    const validation = manager.validate();
    expect(validation.valid).toBe(true);
  });

  it('should load parametric asset', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    const asset = await manager.load('rock_small');

    expect(asset).toBeDefined();
    expect(asset.id).toBe('rock_small');
    expect(asset.type).toBe(AssetType.PARAMETRIC);
    expect(asset.refCount).toBe(1);
  });

  it('should cache loaded assets', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    
    const asset1 = await manager.load('rock_small');
    const asset2 = await manager.load('rock_small');

    // Should be same instance (cached)
    expect(asset1).toBe(asset2);
    expect(asset1.refCount).toBe(2);
  });

  it('should get asset without loading', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    await manager.load('rock_small');

    const asset = manager.get('rock_small');
    expect(asset).toBeDefined();
  });

  it('should unload asset', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    await manager.load('rock_small');

    manager.unload('rock_small');
    const asset = manager.get('rock_small');
    expect(asset).toBeUndefined();
  });

  it('should generate parametric asset directly', () => {
    const rock = manager.generateParametric('rock_small', 12345);
    expect(rock).toBeDefined();
    expect(rock.type).toBe('Group');
  });

  it('should list parametric generators', () => {
    const generators = manager.getParametricGenerators();
    expect(generators).toContain('rock_small');
    expect(generators).toContain('tree_pine');
    expect(generators.length).toBeGreaterThan(10);
  });

  it('should get cache statistics', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    await manager.load('rock_small');
    await manager.load('tree_pine');

    const stats = manager.getCacheStats();
    expect(stats.size).toBe(2);
  });

  it('should throw for unknown asset', async () => {
    await manager.loadManifest(SAMPLE_MANIFEST);
    
    await expect(manager.load('unknown_asset')).rejects.toThrow();
  });

  it('should throw if manifest not loaded', async () => {
    await expect(manager.load('rock_small')).rejects.toThrow();
  });
});
