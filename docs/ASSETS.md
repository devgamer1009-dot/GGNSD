# Assets — CrownFall

> Asset pipeline documentation and license log.

## Asset Pipeline (P8)

### Overview

CrownFall uses a **procedural-first** asset pipeline. All assets are either:
1. Generated parametrically in code (preferred)
2. Loaded from external CC0 sources (when necessary)

No hand-authored art. Everything is data-driven and versioned.

### Pipeline Stages

```
SOURCE → VALIDATE → PROCESS → PACKAGE → LOAD → CACHE → USE
```

1. **SOURCE**: Asset defined in manifest (no hardcoded paths)
2. **VALIDATE**: Check budgets, references, triangle counts
3. **PROCESS**: Generate/load asset data
4. **PACKAGE**: Create versioned cache entry
5. **LOAD**: Load via appropriate loader (GLTF, parametric, etc.)
6. **CACHE**: Store in IndexedDB with version key
7. **USE**: Reference by ID, automatic LOD selection

### Asset Types

| Type | Loader | Source | Notes |
|------|--------|--------|-------|
| `parametric` | Code generator | Procedural | Preferred, zero file size |
| `model` | GLTFLoader + Meshopt | .glb/.gltf | Compressed meshes |
| `texture` | TextureLoader / KTX2Loader | .png/.ktx2 | KTX2 preferred for GPU |
| `material` | Code | Shader code | TSL node materials |

### Manifest Format

Assets are defined in a manifest, never hardcoded:

```typescript
{
  id: 'rock_small',           // Unique ID (no paths!)
  type: 'parametric',         // Asset type
  source: 'rock_small',       // Generator name or file path
  version: '1.0.0',           // Cache version key
  lod: [                      // Optional LOD chain
    { level: 0, maxDistance: 50, assetId: 'rock_small_lod0' },
    { level: 1, maxDistance: 100, assetId: 'rock_small_lod1' },
  ],
  metadata: {
    triangles: 60,            // Triangle count
    size: 1024,               // Bytes (for external assets)
    tags: ['rock', 'small'],  // Searchable tags
  }
}
```

### Parametric Generators

Built-in procedural generators (no external files):

| Generator | Description | Triangles |
|-----------|-------------|-----------|
| `rock_small` | Small rock | 60 |
| `rock_medium` | Medium rock | 240 |
| `rock_large` | Large rock | 960 |
| `tree_pine` | Pine tree | 320 |
| `tree_oak` | Oak tree | 480 |
| `tree_birch` | Birch tree | 360 |
| `house_small` | Small house | 240 |
| `house_medium` | Medium house | 360 |
| `wall_stone` | Stone wall | 12 |
| `wall_wood` | Wooden wall | 12 |
| `prop_barrel` | Barrel | 192 |
| `prop_crate` | Crate | 12 |
| `prop_chest` | Chest | 36 |

### Budget Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Triangles per asset | 10,000 | Prevents oversized assets |
| Triangles per scene | 1,000,000 | Total scene budget |
| Texture size | 2048×2048 | Max texture dimension |
| Asset file size | 10 MB | Max external asset size |

### LOD Selection

Distance-based LOD with hysteresis to prevent flickering:

```typescript
LOD 0: 0-50m    (full detail)
LOD 1: 50-100m  (medium detail)
LOD 2: 100-200m (low detail)
LOD 3: 200-500m (billboard/minimal)
```

### Validation

The validator checks:
- ✅ All LOD references exist
- ✅ All parametric generators exist
- ✅ Triangle counts within budget
- ✅ File sizes within budget
- ✅ No broken references

Run validation:
```typescript
const result = assetManager.validate();
if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

### Cache Keys

Assets are cached with versioned keys: `{id}:{version}`

Example: `rock_small:1.0.0`

Changing the version invalidates the cache automatically.

### Asset Gallery

View all assets: `/assets/gallery.html`

Shows:
- 3D preview of each asset
- Metadata (type, source, version, triangles)
- Tags for categorization
- Validation status

### Loaders

| Loader | Format | Compression | Notes |
|--------|--------|-------------|-------|
| GLTFLoader | .glb/.gltf | Meshopt | Draco support optional |
| KTX2Loader | .ktx2 | Basis Universal | GPU-compressed textures |
| TextureLoader | .png/.jpg | None | Fallback for non-KTX2 |

### Usage Example

```typescript
import { AssetManager } from './engine/assets/manager.js';
import { SAMPLE_MANIFEST } from './engine/assets/sample-manifest.js';

const assetManager = new AssetManager();
await assetManager.init(renderer);
await assetManager.loadManifest(SAMPLE_MANIFEST);

// Load asset by ID
const rock = await assetManager.load('rock_small');
scene.add(rock.data);

// Get LOD based on distance
const lodMesh = assetManager.getLOD('rock_small', distance);

// Unload when done
assetManager.unload('rock_small');
```

### Rules for Future Sessions

1. **Never hardcode asset paths** — Always use manifest IDs
2. **Prefer parametric** — Generate in code when possible
3. **CC0 only** — External assets must be CC0 or explicit license
4. **Version everything** — Update version when asset changes
5. **Validate before shipping** — Run validation script
6. **Respect budgets** — Stay within triangle/size limits
7. **Log licenses** — Document all external sources in this file
8. **Test in gallery** — Verify assets render correctly

---

## Session Log

### P1 — Foundation

- **No images used.** Boot screen uses procedural canvas rendering (starfield).
- All visuals are code-generated (CSS, Canvas 2D API).

### P2 — Design Bible

- **No images used.** Design docs only.

### P3 — Renderer + Benchmark

- **No images used.** All 3D rendering is procedural (Three.js).
- Benchmark page uses CDN-loaded Three.js (no local assets).
- All visuals: code-generated (WebGPU/WebGL2 shaders, geometry, materials).

### P4 — Engine Core

- **No images used.** All systems are code-only.

### P5 — Terrain

- **No images used.** Terrain is procedural (noise functions).
- Biome colors are hardcoded RGB values.

### P6 — Streaming

- **No images used.** Streaming is infrastructure only.

### P7 — Environment

- **No images used.** Sky, water, particles are all procedural shaders.

### P8 — Asset Pipeline

- **Parametric assets only.** 13 procedural generators (rocks, trees, houses, walls, props).
- **No external assets yet.** Pipeline ready for CC0 sources if needed.
- **Gallery page:** `/assets/gallery.html` displays all assets with 3D previews.

---

## License Policy

- **Default:** Procedural art (code, SVG, Canvas, shaders)
- **External assets:** CC0 or explicit license only
- **Log every external asset** here with source URL and license

## External Assets

_None yet. Pipeline ready for CC0 sources:_

- **Poly Haven** (https://polyhaven.com) — CC0 3D models, textures, HDRIs
- **Quaternius** (https://quaternius.com) — CC0 low-poly models
- **Kenney** (https://kenney.nl) — CC0 game assets

<!-- Template for future entries:
### [Asset Name]
- **Source:** [URL]
- **License:** [CC0 / CC-BY / etc.]
- **Used in:** [file or feature]
- **Modified:** [yes/no, describe changes]
-->
