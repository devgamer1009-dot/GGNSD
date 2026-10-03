/**
 * Vegetation Culling - CPU-based frustum culling
 * P10 - Per-chunk culling for vegetation instances
 */

import * as THREE from 'three';
import type { VegetationInstance } from './PlacementSystem.js';

/**
 * Vegetation culling system
 * Uses CPU-based frustum culling per chunk
 */
export class VegetationCulling {
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private cullingEnabled: boolean = true;

  /**
   * Update frustum from camera
   */
  update(camera: THREE.Camera): void {
    if (!this.cullingEnabled) return;

    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * Cull vegetation instances based on frustum
   */
  cullInstances(instances: VegetationInstance[]): VegetationInstance[] {
    if (!this.cullingEnabled) return instances;

    const culled: VegetationInstance[] = [];
    const sphere = new THREE.Sphere();

    for (const instance of instances) {
      // Create bounding sphere for instance
      sphere.center.set(
        instance.position.x,
        instance.position.y + 1, // Offset for tree height
        instance.position.z
      );
      sphere.radius = 2 * instance.scale; // Approximate radius

      // Check if sphere intersects frustum
      if (this.frustum.intersectsSphere(sphere)) {
        culled.push(instance);
      }
    }

    return culled;
  }

  /**
   * Check if single instance is visible
   */
  isInstanceVisible(instance: VegetationInstance): boolean {
    if (!this.cullingEnabled) return true;

    const sphere = new THREE.Sphere(
      new THREE.Vector3(
        instance.position.x,
        instance.position.y + 1,
        instance.position.z
      ),
      2 * instance.scale
    );

    return this.frustum.intersectsSphere(sphere);
  }

  /**
   * Enable/disable culling
   */
  setCullingEnabled(enabled: boolean): void {
    this.cullingEnabled = enabled;
  }

  /**
   * Check if culling is enabled
   */
  isCullingEnabled(): boolean {
    return this.cullingEnabled;
  }

  /**
   * Get frustum for debugging
   */
  getFrustum(): THREE.Frustum {
    return this.frustum;
  }
}

/**
 * Distance-based culling for vegetation
 * Culls instances beyond maximum render distance
 */
export class DistanceCulling {
  private maxDistance: number;
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(maxDistance: number = 500) {
    this.maxDistance = maxDistance;
  }

  /**
   * Update camera position
   */
  update(cameraPosition: THREE.Vector3): void {
    this.cameraPosition.copy(cameraPosition);
  }

  /**
   * Cull instances by distance
   */
  cullByDistance(instances: VegetationInstance[]): VegetationInstance[] {
    const culled: VegetationInstance[] = [];

    for (const instance of instances) {
      const dx = instance.position.x - this.cameraPosition.x;
      const dz = instance.position.z - this.cameraPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= this.maxDistance) {
        culled.push(instance);
      }
    }

    return culled;
  }

  /**
   * Check if instance is within distance
   */
  isWithinDistance(instance: VegetationInstance): boolean {
    const dx = instance.position.x - this.cameraPosition.x;
    const dz = instance.position.z - this.cameraPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= this.maxDistance;
  }

  /**
   * Set maximum render distance
   */
  setMaxDistance(distance: number): void {
    this.maxDistance = distance;
  }

  /**
   * Get maximum render distance
   */
  getMaxDistance(): number {
    return this.maxDistance;
  }
}

/**
 * Combined culling system
 * Applies both frustum and distance culling
 */
export class CombinedCulling {
  private frustumCulling: VegetationCulling;
  private distanceCulling: DistanceCulling;

  constructor(maxDistance: number = 500) {
    this.frustumCulling = new VegetationCulling();
    this.distanceCulling = new DistanceCulling(maxDistance);
  }

  /**
   * Update culling systems
   */
  update(camera: THREE.Camera): void {
    this.frustumCulling.update(camera);
    this.distanceCulling.update(camera.position);
  }

  /**
   * Apply all culling
   */
  cull(instances: VegetationInstance[]): VegetationInstance[] {
    // First cull by distance (cheaper)
    let culled = this.distanceCulling.cullByDistance(instances);
    
    // Then cull by frustum
    culled = this.frustumCulling.cullInstances(culled);
    
    return culled;
  }

  /**
   * Get frustum culling system
   */
  getFrustumCulling(): VegetationCulling {
    return this.frustumCulling;
  }

  /**
   * Get distance culling system
   */
  getDistanceCulling(): DistanceCulling {
    return this.distanceCulling;
  }
}
