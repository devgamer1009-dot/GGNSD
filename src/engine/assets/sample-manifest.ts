/**
 * Sample Asset Manifest
 * P8 - Example manifest for testing the pipeline
 */

import type { AssetManifest } from './types.js';
import { AssetType } from './types.js';

export const SAMPLE_MANIFEST: AssetManifest = {
  version: '1.0.0',
  assets: {
    // Rocks
    rock_small: {
      id: 'rock_small',
      type: AssetType.PARAMETRIC,
      source: 'rock_small',
      version: '1.0.0',
      metadata: {
        triangles: 60,
        tags: ['rock', 'small', 'decoration'],
      },
    },
    rock_medium: {
      id: 'rock_medium',
      type: AssetType.PARAMETRIC,
      source: 'rock_medium',
      version: '1.0.0',
      metadata: {
        triangles: 240,
        tags: ['rock', 'medium', 'decoration'],
      },
    },
    rock_large: {
      id: 'rock_large',
      type: AssetType.PARAMETRIC,
      source: 'rock_large',
      version: '1.0.0',
      metadata: {
        triangles: 960,
        tags: ['rock', 'large', 'decoration'],
      },
    },

    // Trees
    tree_pine: {
      id: 'tree_pine',
      type: AssetType.PARAMETRIC,
      source: 'tree_pine',
      version: '1.0.0',
      metadata: {
        triangles: 320,
        tags: ['tree', 'pine', 'vegetation'],
      },
    },
    tree_oak: {
      id: 'tree_oak',
      type: AssetType.PARAMETRIC,
      source: 'tree_oak',
      version: '1.0.0',
      metadata: {
        triangles: 480,
        tags: ['tree', 'oak', 'vegetation'],
      },
    },
    tree_birch: {
      id: 'tree_birch',
      type: AssetType.PARAMETRIC,
      source: 'tree_birch',
      version: '1.0.0',
      metadata: {
        triangles: 360,
        tags: ['tree', 'birch', 'vegetation'],
      },
    },

    // Buildings
    house_small: {
      id: 'house_small',
      type: AssetType.PARAMETRIC,
      source: 'house_small',
      version: '1.0.0',
      metadata: {
        triangles: 240,
        tags: ['building', 'house', 'small'],
      },
    },
    house_medium: {
      id: 'house_medium',
      type: AssetType.PARAMETRIC,
      source: 'house_medium',
      version: '1.0.0',
      metadata: {
        triangles: 360,
        tags: ['building', 'house', 'medium'],
      },
    },

    // Walls
    wall_stone: {
      id: 'wall_stone',
      type: AssetType.PARAMETRIC,
      source: 'wall_stone',
      version: '1.0.0',
      metadata: {
        triangles: 12,
        tags: ['wall', 'stone', 'structure'],
      },
    },
    wall_wood: {
      id: 'wall_wood',
      type: AssetType.PARAMETRIC,
      source: 'wall_wood',
      version: '1.0.0',
      metadata: {
        triangles: 12,
        tags: ['wall', 'wood', 'structure'],
      },
    },

    // Props
    prop_barrel: {
      id: 'prop_barrel',
      type: AssetType.PARAMETRIC,
      source: 'prop_barrel',
      version: '1.0.0',
      metadata: {
        triangles: 192,
        tags: ['prop', 'barrel', 'container'],
      },
    },
    prop_crate: {
      id: 'prop_crate',
      type: AssetType.PARAMETRIC,
      source: 'prop_crate',
      version: '1.0.0',
      metadata: {
        triangles: 12,
        tags: ['prop', 'crate', 'container'],
      },
    },
    prop_chest: {
      id: 'prop_chest',
      type: AssetType.PARAMETRIC,
      source: 'prop_chest',
      version: '1.0.0',
      metadata: {
        triangles: 36,
        tags: ['prop', 'chest', 'container'],
      },
    },
  },
};
