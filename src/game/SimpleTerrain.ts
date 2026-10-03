/**
 * Simple Terrain Generator
 */

import * as THREE from 'three';
import { SeededRandom } from './SeededRandom.js';

export class SimpleTerrain {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh | null = null;
  private heightData: Float32Array;
  private width: number;
  private depth: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.width = 200;
    this.depth = 200;
    this.heightData = new Float32Array(this.width * this.depth);
  }

  public generate(seed: number): void {
    const rng = new SeededRandom(seed);

    // Generate heightmap
    for (let z = 0; z < this.depth; z++) {
      for (let x = 0; x < this.width; x++) {
        const nx = x / this.width - 0.5;
        const nz = z / this.depth - 0.5;

        // Multiple octaves of noise
        let height = 0;
        let amplitude = 1;
        let frequency = 2;

        for (let i = 0; i < 4; i++) {
          height += this.noise(nx * frequency, nz * frequency, rng) * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }

        this.heightData[z * this.width + x] = height * 5;
      }
    }

    // Create mesh
    const geometry = new THREE.PlaneGeometry(this.width, this.depth, this.width - 1, this.depth - 1);
    geometry.rotateX(-Math.PI / 2);

    const positionAttribute = geometry.attributes.position;
    if (positionAttribute) {
      const positions = positionAttribute.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const height = this.heightData[i];
        if (height !== undefined) {
          positions[i * 3 + 1] = height;
        }
      }
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x3a7d44,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // Add trees
    this.addTrees(100, rng);

    // Add rocks
    this.addRocks(50, rng);
  }

  private noise(x: number, y: number, rng: SeededRandom): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const tl = this.random2d(xi, yi, rng);
    const tr = this.random2d(xi + 1, yi, rng);
    const bl = this.random2d(xi, yi + 1, rng);
    const br = this.random2d(xi + 1, yi + 1, rng);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    return tl * (1 - u) * (1 - v) + tr * u * (1 - v) + bl * (1 - u) * v + br * u * v;
  }

  private random2d(x: number, y: number, rng: SeededRandom): number {
    rng.setSeed(x * 374761393 + y * 668265263);
    return rng.next() * 2 - 1;
  }

  private addTrees(count: number, rng: SeededRandom): void {
    const treeGeometry = new THREE.ConeGeometry(1, 4, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8
    });

    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9
    });

    for (let i = 0; i < count; i++) {
      const x = rng.nextRange(-this.width * 0.4, this.width * 0.4);
      const z = rng.nextRange(-this.depth * 0.4, this.depth * 0.4);
      const y = this.getHeightAt(x, z);

      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);

      const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
      leaves.position.y = 4;
      leaves.castShadow = true;
      tree.add(leaves);

      tree.position.set(x, y, z);
      tree.scale.setScalar(0.8 + rng.next() * 0.4);

      this.scene.add(tree);
    }
  }

  private addRocks(count: number, rng: SeededRandom): void {
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let i = 0; i < count; i++) {
      const x = rng.nextRange(-this.width * 0.4, this.width * 0.4);
      const z = rng.nextRange(-this.depth * 0.4, this.depth * 0.4);
      const y = this.getHeightAt(x, z);

      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, y + 0.5, z);
      rock.rotation.set(
        rng.next() * Math.PI,
        rng.next() * Math.PI,
        rng.next() * Math.PI
      );
      rock.scale.setScalar(0.5 + rng.next() * 1);
      rock.castShadow = true;
      rock.receiveShadow = true;

      this.scene.add(rock);
    }
  }

  public getHeightAt(x: number, z: number): number {
    const gridX = Math.floor(x + this.width / 2);
    const gridZ = Math.floor(z + this.depth / 2);

    if (gridX < 0 || gridX >= this.width || gridZ < 0 || gridZ >= this.depth) {
      return 0;
    }

    const height = this.heightData[gridZ * this.width + gridX];
    return height ?? 0;
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }
}
