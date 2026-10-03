/**
 * Vegetation LOD System - Level of detail management with billboards
 * P10 - Distance-based LOD switching with billboard impostors
 */

import * as THREE from 'three';
import type { VegetationInstance } from './PlacementSystem.js';

export interface LODConfig {
  maxDistance: number;
  type: 'full' | 'reduced' | 'billboard';
}

export const VEGETATION_LOD_CONFIG: LODConfig[] = [
  { maxDistance: 50, type: 'full' },      // Full detail mesh
  { maxDistance: 150, type: 'reduced' },  // Reduced poly mesh
  { maxDistance: 500, type: 'billboard' }, // Billboard impostor
];

/**
 * Vegetation LOD manager
 */
export class VegetationLOD {
  private lodMeshes: Map<string, THREE.LOD> = new Map();
  private billboardTextures: Map<string, THREE.Texture> = new Map();
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Create LOD object for vegetation instance
   */
  createLOD(
    instance: VegetationInstance,
    fullMesh: THREE.Object3D,
    reducedMesh?: THREE.Object3D
  ): THREE.LOD {
    const lod = new THREE.LOD();

    // Level 0: Full detail (0-50m)
    lod.addLevel(fullMesh, 0);

    // Level 1: Reduced detail (50-150m)
    if (reducedMesh) {
      lod.addLevel(reducedMesh, 50);
    }

    // Level 2: Billboard (150-500m)
    const billboard = this.createBillboard(instance.assetId);
    if (billboard) {
      lod.addLevel(billboard, 150);
    }

    // Position the LOD
    lod.position.set(
      instance.position.x,
      instance.position.y,
      instance.position.z
    );

    // Apply rotation and scale
    lod.rotation.set(
      instance.rotation.x,
      instance.rotation.y,
      instance.rotation.z
    );
    lod.scale.setScalar(instance.scale);

    return lod;
  }

  /**
   * Create billboard impostor for an asset
   */
  private createBillboard(assetId: string): THREE.Sprite | null {
    // Get or create billboard texture
    let texture = this.billboardTextures.get(assetId);
    
    if (!texture) {
      // Create procedural billboard texture
      texture = this.generateBillboardTexture(assetId);
      this.billboardTextures.set(assetId, texture);
    }

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 6, 1); // Billboard size
    sprite.center.set(0.5, 0); // Anchor at bottom

    return sprite;
  }

  /**
   * Generate procedural billboard texture for asset
   */
  private generateBillboardTexture(assetId: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Clear with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw simplified shape based on asset type
    if (assetId.startsWith('tree_')) {
      this.drawTreeBillboard(ctx, assetId);
    } else if (assetId.startsWith('rock_')) {
      this.drawRockBillboard(ctx, assetId);
    } else {
      this.drawGenericBillboard(ctx);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Draw tree billboard
   */
  private drawTreeBillboard(ctx: CanvasRenderingContext2D, assetId: string): void {
    // Trunk
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(56, 180, 16, 76);

    // Foliage
    if (assetId === 'tree_pine') {
      // Pine tree - conical
      ctx.fillStyle = '#1a4d2e';
      ctx.beginPath();
      ctx.moveTo(64, 20);
      ctx.lineTo(20, 180);
      ctx.lineTo(108, 180);
      ctx.closePath();
      ctx.fill();
    } else if (assetId === 'tree_oak') {
      // Oak tree - rounded
      ctx.fillStyle = '#2d5016';
      ctx.beginPath();
      ctx.arc(64, 100, 50, 0, Math.PI * 2);
      ctx.fill();
    } else if (assetId === 'tree_birch') {
      // Birch tree - white trunk, lighter foliage
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(56, 180, 16, 76);
      ctx.fillStyle = '#7cb342';
      ctx.beginPath();
      ctx.arc(64, 100, 45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw rock billboard
   */
  private drawRockBillboard(ctx: CanvasRenderingContext2D, assetId: string): void {
    ctx.fillStyle = '#606060';
    
    if (assetId === 'rock_small') {
      ctx.beginPath();
      ctx.arc(64, 200, 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (assetId === 'rock_medium') {
      ctx.beginPath();
      ctx.arc(64, 180, 45, 0, Math.PI * 2);
      ctx.fill();
    } else if (assetId === 'rock_large') {
      ctx.beginPath();
      ctx.arc(64, 160, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw generic billboard
   */
  private drawGenericBillboard(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#808080';
    ctx.fillRect(32, 128, 64, 128);
  }

  /**
   * Update LOD levels based on camera distance
   */
  update(): void {
    for (const lod of this.lodMeshes.values()) {
      lod.update(this.camera);
    }
  }

  /**
   * Register LOD object
   */
  registerLOD(id: string, lod: THREE.LOD): void {
    this.lodMeshes.set(id, lod);
  }

  /**
   * Unregister LOD object
   */
  unregisterLOD(id: string): void {
    const lod = this.lodMeshes.get(id);
    if (lod) {
      lod.parent?.remove(lod);
      this.lodMeshes.delete(id);
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const lod of this.lodMeshes.values()) {
      lod.parent?.remove(lod);
    }
    this.lodMeshes.clear();

    for (const texture of this.billboardTextures.values()) {
      texture.dispose();
    }
    this.billboardTextures.clear();
  }

  /**
   * Get LOD count
   */
  getLODCount(): number {
    return this.lodMeshes.size;
  }
}
