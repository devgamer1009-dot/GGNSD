/**
 * Parametric Asset Generators
 * P8 - Procedural geometry for rocks, trees, houses, walls, props
 */

import * as THREE from 'three';
import { SeededRNG } from '../utils/SeededRNG.js';

/**
 * Parametric asset generator registry
 */
export class ParametricGenerators {
  private generators = new Map<string, (seed: number) => THREE.Object3D>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register default generators
   */
  private registerDefaults(): void {
    this.register('rock_small', generateSmallRock);
    this.register('rock_medium', generateMediumRock);
    this.register('rock_large', generateLargeRock);
    this.register('tree_pine', generatePineTree);
    this.register('tree_oak', generateOakTree);
    this.register('tree_birch', generateBirchTree);
    this.register('house_small', generateSmallHouse);
    this.register('house_medium', generateMediumHouse);
    this.register('wall_stone', generateStoneWall);
    this.register('wall_wood', generateWoodenWall);
    this.register('prop_barrel', generateBarrel);
    this.register('prop_crate', generateCrate);
    this.register('prop_chest', generateChest);
  }

  /**
   * Register a generator
   */
  register(name: string, generator: (seed: number) => THREE.Object3D): void {
    this.generators.set(name, generator);
  }

  /**
   * Generate an asset by name
   */
  generate(name: string, seed: number = 12345): THREE.Object3D {
    const generator = this.generators.get(name);
    if (!generator) {
      throw new Error(`Unknown parametric asset: ${name}`);
    }
    return generator(seed);
  }

  /**
   * Check if generator exists
   */
  has(name: string): boolean {
    return this.generators.has(name);
  }

  /**
   * Get all generator names
   */
  getNames(): string[] {
    return Array.from(this.generators.keys());
  }
}

// === ROCK GENERATORS ===

function generateSmallRock(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const geometry = new THREE.DodecahedronGeometry(0.5, 0);
  deformGeometry(geometry, rng, 0.2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.9,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

function generateMediumRock(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const geometry = new THREE.DodecahedronGeometry(1.0, 1);
  deformGeometry(geometry, rng, 0.3);

  const material = new THREE.MeshStandardMaterial({
    color: 0x707070,
    roughness: 0.95,
    metalness: 0.05,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

function generateLargeRock(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const geometry = new THREE.IcosahedronGeometry(2.0, 1);
  deformGeometry(geometry, rng, 0.4);

  const material = new THREE.MeshStandardMaterial({
    color: 0x606060,
    roughness: 1.0,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

// === TREE GENERATORS ===

function generatePineTree(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  // Trunk
  const trunkHeight = 2.0 + rng.nextFloat(0, 1.0);
  const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, trunkHeight, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage (cone layers)
  const layers = 3 + Math.floor(rng.nextFloat(0, 2));
  for (let i = 0; i < layers; i++) {
    const radius = 1.5 - i * 0.3;
    const height = 1.5;
    const foliageGeometry = new THREE.ConeGeometry(radius, height, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = trunkHeight + i * 1.0;
    foliage.castShadow = true;
    group.add(foliage);
  }

  return group;
}

function generateOakTree(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  // Trunk
  const trunkHeight = 3.0 + rng.nextFloat(0, 1.5);
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, trunkHeight, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage (sphere cluster)
  const foliageRadius = 2.0 + rng.nextFloat(0, 1.0);
  const foliageGeometry = new THREE.IcosahedronGeometry(foliageRadius, 1);
  deformGeometry(foliageGeometry, rng, 0.2);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a6b1f,
    roughness: 0.8,
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = trunkHeight + foliageRadius * 0.5;
  foliage.castShadow = true;
  group.add(foliage);

  return group;
}

function generateBirchTree(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  // Trunk (white birch)
  const trunkHeight = 4.0 + rng.nextFloat(0, 2.0);
  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, trunkHeight, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    roughness: 0.7,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage (lighter green)
  const foliageRadius = 1.5 + rng.nextFloat(0, 0.5);
  const foliageGeometry = new THREE.IcosahedronGeometry(foliageRadius, 1);
  deformGeometry(foliageGeometry, rng, 0.15);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cb342,
    roughness: 0.8,
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = trunkHeight + foliageRadius * 0.3;
  foliage.castShadow = true;
  group.add(foliage);

  return group;
}

// === BUILDING GENERATORS ===

function generateSmallHouse(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  // Base
  const baseWidth = 3.0;
  const baseDepth = 4.0;
  const baseHeight = 2.5;
  const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4c4a8,
    roughness: 0.8,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = baseHeight / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Roof
  const roofHeight = 1.5;
  const roofGeometry = new THREE.ConeGeometry(
    Math.max(baseWidth, baseDepth) * 0.7,
    roofHeight,
    4
  );
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.9,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = baseHeight + roofHeight / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  return group;
}

function generateMediumHouse(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  // Base (larger)
  const baseWidth = 5.0;
  const baseDepth = 6.0;
  const baseHeight = 3.0;
  const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8b896,
    roughness: 0.8,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = baseHeight / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Roof
  const roofHeight = 2.0;
  const roofGeometry = new THREE.ConeGeometry(
    Math.max(baseWidth, baseDepth) * 0.7,
    roofHeight,
    4
  );
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b3410,
    roughness: 0.9,
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = baseHeight + roofHeight / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Chimney
  const chimneyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
  const chimneyMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.9,
  });
  const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
  chimney.position.set(baseWidth * 0.3, baseHeight + roofHeight * 0.7, 0);
  chimney.castShadow = true;
  group.add(chimney);

  return group;
}

// === WALL GENERATORS ===

function generateStoneWall(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const wallLength = 4.0;
  const wallHeight = 2.0;
  const wallThickness = 0.5;

  const geometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 1.0,
  });

  const wall = new THREE.Mesh(geometry, material);
  wall.position.y = wallHeight / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  return group;
}

function generateWoodenWall(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const wallLength = 4.0;
  const wallHeight = 2.0;
  const wallThickness = 0.3;

  const geometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    roughness: 0.9,
  });

  const wall = new THREE.Mesh(geometry, material);
  wall.position.y = wallHeight / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  return group;
}

// === PROP GENERATORS ===

function generateBarrel(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const radius = 0.4;
  const height = 0.8;

  const geometry = new THREE.CylinderGeometry(radius, radius, height, 12);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.8,
  });

  const barrel = new THREE.Mesh(geometry, material);
  barrel.position.y = height / 2;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  group.add(barrel);

  // Metal bands
  const bandGeometry = new THREE.TorusGeometry(radius + 0.02, 0.03, 8, 12);
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    roughness: 0.6,
    metalness: 0.8,
  });

  const band1 = new THREE.Mesh(bandGeometry, bandMaterial);
  band1.position.y = height * 0.25;
  band1.rotation.x = Math.PI / 2;
  group.add(band1);

  const band2 = new THREE.Mesh(bandGeometry, bandMaterial);
  band2.position.y = height * 0.75;
  band2.rotation.x = Math.PI / 2;
  group.add(band2);

  return group;
}

function generateCrate(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const size = 0.8;

  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    roughness: 0.9,
  });

  const crate = new THREE.Mesh(geometry, material);
  crate.position.y = size / 2;
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  return group;
}

function generateChest(seed: number): THREE.Group {
  const rng = new SeededRNG(seed);
  const group = new THREE.Group();

  const width = 0.8;
  const height = 0.5;
  const depth = 0.5;

  // Base
  const baseGeometry = new THREE.BoxGeometry(width, height, depth);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.8,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = height / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Lid (slightly larger)
  const lidGeometry = new THREE.BoxGeometry(width + 0.05, 0.1, depth + 0.05);
  const lidMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c3a1e,
    roughness: 0.8,
  });
  const lid = new THREE.Mesh(lidGeometry, lidMaterial);
  lid.position.y = height + 0.05;
  lid.castShadow = true;
  group.add(lid);

  // Metal lock
  const lockGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.05);
  const lockMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.3,
    metalness: 0.9,
  });
  const lock = new THREE.Mesh(lockGeometry, lockMaterial);
  lock.position.set(0, height * 0.7, depth / 2 + 0.025);
  group.add(lock);

  return group;
}

// === UTILITY FUNCTIONS ===

/**
 * Deform geometry vertices for organic look
 */
function deformGeometry(geometry: THREE.BufferGeometry, rng: SeededRNG, amount: number): void {
  const positions = geometry.attributes.position;
  if (!positions) return;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    const offset = (rng.nextFloat(0, 1) - 0.5) * amount;
    positions.setXYZ(i, x + offset, y + offset, z + offset);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}
