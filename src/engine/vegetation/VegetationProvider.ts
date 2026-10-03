/**
 * Vegetation Provider - CellContentProvider implementation
 * P10 - Instanced vegetation per cell with deterministic placement
 */

import * as THREE from 'three';
import type { CellContentProvider } from '../streaming/StreamingManager.js';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';
import type { AssetManager } from '../assets/manager.js';
import type { WeatherSystem } from '../environment/WeatherSystem.js';
import { generateVegetation, type VegetationInstance } from './PlacementSystem.js';
import { VegetationLOD } from './VegetationLOD.js';
import { CombinedCulling } from './VegetationCulling.js';
import { createWindMaterial, updateWindUniforms } from './WindShader.js';

export interface VegetationProviderConfig {
  worldSeed: number;
  maxInstancesPerChunk: number;
  enableWind: boolean;
  enableCulling: boolean;
}

const DEFAULT_CONFIG: VegetationProviderConfig = {
  worldSeed: 12345,
  maxInstancesPerChunk: 500,
  enableWind: true,
  enableCulling: true,
};

/**
 * Vegetation content provider
 * Implements CellContentProvider for streaming integration
 */
export class VegetationProvider implements CellContentProvider {
  readonly id = 'vegetation';
  
  private config: VegetationProviderConfig;
  private assetManager: AssetManager;
  private weatherSystem: WeatherSystem;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  
  private chunkMeshes: Map<string, THREE.Group> = new Map();
  private chunkInstances: Map<string, VegetationInstance[]> = new Map();
  private lodSystem: VegetationLOD;
  private cullingSystem: CombinedCulling;
  private windMaterials: THREE.ShaderMaterial[] = [];
  private time: number = 0;

  constructor(
    assetManager: AssetManager,
    weatherSystem: WeatherSystem,
    camera: THREE.Camera,
    scene: THREE.Scene,
    config: Partial<VegetationProviderConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.assetManager = assetManager;
    this.weatherSystem = weatherSystem;
    this.camera = camera;
    this.scene = scene;
    
    this.lodSystem = new VegetationLOD(camera);
    this.cullingSystem = new CombinedCulling(500);
  }

  /**
   * Generate vegetation content for a chunk
   */
  async generateContent(
    chunkX: number,
    chunkZ: number,
    chunkData: TerrainChunkData
  ): Promise<THREE.Group> {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Generate vegetation instances
    let instances = generateVegetation(chunkData, this.config.worldSeed);
    
    // Limit instances per chunk
    if (instances.length > this.config.maxInstancesPerChunk) {
      instances = instances.slice(0, this.config.maxInstancesPerChunk);
    }
    
    // Store instances for culling
    this.chunkInstances.set(chunkKey, instances);
    
    // Create mesh group
    const group = new THREE.Group();
    group.name = `vegetation_${chunkKey}`;
    
    // Create instanced meshes for each asset type
    const assetInstances = this.groupByAsset(instances);
    
    for (const [assetId, assetInsts] of assetInstances.entries()) {
      const mesh = await this.createInstancedMesh(assetId, assetInsts);
      if (mesh) {
        group.add(mesh);
      }
    }
    
    // Store chunk mesh
    this.chunkMeshes.set(chunkKey, group);
    this.scene.add(group);
    
    return group;
  }

  /**
   * Dispose vegetation content for a chunk
   */
  disposeContent(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    const group = this.chunkMeshes.get(chunkKey);
    if (group) {
      this.scene.remove(group);
      
      // Dispose all geometries and materials
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      
      this.chunkMeshes.delete(chunkKey);
    }
    
    this.chunkInstances.delete(chunkKey);
  }

  /**
   * Update vegetation (wind animation, culling)
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Update wind uniforms
    if (this.config.enableWind) {
      const wind = this.weatherSystem.getWind(0, 0, this.time);
      for (const material of this.windMaterials) {
        updateWindUniforms(material, wind, this.time);
      }
    }
    
    // Update LOD
    this.lodSystem.update();
    
    // Update culling
    if (this.config.enableCulling) {
      this.cullingSystem.update(this.camera);
      
      for (const [chunkKey, instances] of this.chunkInstances.entries()) {
        const culled = this.cullingSystem.cull(instances);
        // Update visibility based on culling
        // (In a full implementation, this would update instanced mesh visibility)
      }
    }
  }

  /**
   * Group instances by asset ID
   */
  private groupByAsset(instances: VegetationInstance[]): Map<string, VegetationInstance[]> {
    const grouped = new Map<string, VegetationInstance[]>();
    
    for (const instance of instances) {
      if (!grouped.has(instance.assetId)) {
        grouped.set(instance.assetId, []);
      }
      grouped.get(instance.assetId)!.push(instance);
    }
    
    return grouped;
  }

  /**
   * Create instanced mesh for asset type
   */
  private async createInstancedMesh(
    assetId: string,
    instances: VegetationInstance[]
  ): Promise<THREE.InstancedMesh | null> {
    // Load asset
    const asset = await this.assetManager.load(assetId);
    if (!asset) return null;
    
    // Get base geometry from first child
    let baseGeometry: THREE.BufferGeometry | null = null;
    let baseMaterial: THREE.Material | null = null;
    
    // Check if asset.data is an Object3D
    if (asset.data instanceof THREE.Object3D) {
      asset.data.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && !baseGeometry) {
          baseGeometry = child.geometry;
          baseMaterial = child.material;
        }
      });
    }
    
    if (!baseGeometry || !baseMaterial) return null;
    
    // Create wind material for vegetation
    let material: THREE.Material = baseMaterial;
    if (this.config.enableWind && assetId.startsWith('tree_')) {
      const baseColor = (baseMaterial as THREE.MeshStandardMaterial).color?.getHex() ?? 0x2d5016;
      material = createWindMaterial(baseColor);
      this.windMaterials.push(material as THREE.ShaderMaterial);
    }
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(baseGeometry, material, instances.length);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    
    // Set instance transforms
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]!;
      
      position.set(instance.position.x, instance.position.y, instance.position.z);
      rotation.setFromEuler(new THREE.Euler(
        instance.rotation.x,
        instance.rotation.y,
        instance.rotation.z
      ));
      scale.setScalar(instance.scale);
      
      matrix.compose(position, rotation, scale);
      instancedMesh.setMatrixAt(i, matrix);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    return instancedMesh;
  }

  /**
   * Get chunk instance count
   */
  getInstanceCount(chunkX: number, chunkZ: number): number {
    const chunkKey = `${chunkX},${chunkZ}`;
    return this.chunkInstances.get(chunkKey)?.length ?? 0;
  }

  /**
   * Get total instance count
   */
  getTotalInstanceCount(): number {
    let total = 0;
    for (const instances of this.chunkInstances.values()) {
      total += instances.length;
    }
    return total;
  }

  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.chunkMeshes.size;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const chunkKey of this.chunkMeshes.keys()) {
      const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
      this.disposeContent(chunkX!, chunkZ!);
    }
    
    this.lodSystem.dispose();
    
    for (const material of this.windMaterials) {
      material.dispose();
    }
    this.windMaterials = [];
  }
}
