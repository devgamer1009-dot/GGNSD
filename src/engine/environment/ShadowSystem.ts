/**
 * Shadow System - Stabilized cascaded shadow maps
 * Prevents shadow shimmering through snap-to-grid technique
 */

import * as THREE from 'three';
import type { TimeSystem } from './TimeSystem.js';

export enum ShadowQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface CascadeConfig {
  distance: number;
  resolution: number;
  bias: number;
}

export class ShadowSystem {
  private quality: ShadowQuality = ShadowQuality.MEDIUM;
  
  private directionalLight: THREE.DirectionalLight | null = null;
  private cascades: CascadeConfig[] = [];
  
  // Stabilization
  private shadowMapSize: number = 2048;
  private snapResolution: number = 256; // Snap shadow map to grid
  
  constructor(private scene: THREE.Scene) {
    this.setupCascades();
    this.createDirectionalLight();
  }

  /**
   * Setup cascade configurations based on quality
   */
  private setupCascades(): void {
    switch (this.quality) {
      case ShadowQuality.LOW:
        this.cascades = [
          { distance: 50, resolution: 512, bias: 0.005 },
          { distance: 150, resolution: 512, bias: 0.01 }
        ];
        this.shadowMapSize = 1024;
        break;
      case ShadowQuality.MEDIUM:
        this.cascades = [
          { distance: 50, resolution: 1024, bias: 0.005 },
          { distance: 150, resolution: 1024, bias: 0.01 },
          { distance: 400, resolution: 1024, bias: 0.015 }
        ];
        this.shadowMapSize = 2048;
        break;
      case ShadowQuality.HIGH:
        this.cascades = [
          { distance: 50, resolution: 2048, bias: 0.003 },
          { distance: 150, resolution: 2048, bias: 0.008 },
          { distance: 400, resolution: 2048, bias: 0.012 },
          { distance: 1000, resolution: 2048, bias: 0.02 }
        ];
        this.shadowMapSize = 4096;
        break;
    }
  }

  /**
   * Create directional light with shadow support
   */
  private createDirectionalLight(): void {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.castShadow = true;
    
    // Shadow map configuration
    this.directionalLight.shadow.mapSize.width = this.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = this.shadowMapSize;
    
    // Shadow camera frustum
    const cascade = this.cascades[0];
    if (cascade) {
      const d = cascade.distance;
      this.directionalLight.shadow.camera.left = -d;
      this.directionalLight.shadow.camera.right = d;
      this.directionalLight.shadow.camera.top = d;
      this.directionalLight.shadow.camera.bottom = -d;
      this.directionalLight.shadow.camera.near = 0.1;
      this.directionalLight.shadow.camera.far = 500;
      this.directionalLight.shadow.bias = -cascade.bias;
    }
    
    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  /**
   * Update shadow system based on time
   */
  update(timeSystem: TimeSystem, cameraPosition: THREE.Vector3): void {
    if (!this.directionalLight) return;
    
    // Update light direction from sun
    const sunDir = timeSystem.getSunDirection();
    const sunIntensity = timeSystem.getSunIntensity();
    
    this.directionalLight.position.set(
      cameraPosition.x + sunDir[0] * 100,
      cameraPosition.y + sunDir[1] * 100,
      cameraPosition.z + sunDir[2] * 100
    );
    
    this.directionalLight.target.position.copy(cameraPosition);
    this.directionalLight.intensity = sunIntensity;
    
    // Stabilize shadows by snapping to grid
    this.stabilizeShadows(cameraPosition);
  }

  /**
   * Stabilize shadows by snapping shadow camera to grid
   * Prevents shadow shimmering when camera moves
   */
  private stabilizeShadows(cameraPosition: THREE.Vector3): void {
    if (!this.directionalLight) return;
    
    const shadowCamera = this.directionalLight.shadow.camera;
    const cascade = this.cascades[0];
    if (!cascade) return;
    
    // Calculate snap size based on shadow map resolution
    const worldUnitsPerTexel = (cascade.distance * 2) / this.shadowMapSize;
    const snapSize = worldUnitsPerTexel * this.snapResolution;
    
    // Snap camera position to grid
    const snappedX = Math.round(cameraPosition.x / snapSize) * snapSize;
    const snappedZ = Math.round(cameraPosition.z / snapSize) * snapSize;
    
    // Update shadow camera position
    const offset = new THREE.Vector3().subVectors(
      this.directionalLight.position,
      cameraPosition
    );
    
    shadowCamera.position.set(
      snappedX + offset.x,
      cameraPosition.y + offset.y,
      snappedZ + offset.z
    );
    
    shadowCamera.updateProjectionMatrix();
  }

  /**
   * Set shadow quality tier
   */
  setQuality(quality: ShadowQuality): void {
    this.quality = quality;
    
    // Recreate light with new settings
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.scene.remove(this.directionalLight.target);
    }
    
    this.setupCascades();
    this.createDirectionalLight();
  }

  /**
   * Get current quality
   */
  getQuality(): ShadowQuality {
    return this.quality;
  }

  /**
   * Get cascade configurations
   */
  getCascades(): CascadeConfig[] {
    return this.cascades;
  }

  /**
   * Get directional light
   */
  getDirectionalLight(): THREE.DirectionalLight | null {
    return this.directionalLight;
  }

  /**
   * Enable/disable shadows
   */
  setShadowsEnabled(enabled: boolean): void {
    if (this.directionalLight) {
      this.directionalLight.castShadow = enabled;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.directionalLight) {
      if (this.directionalLight.shadow.map) {
        this.directionalLight.shadow.map.dispose();
      }
      this.scene.remove(this.directionalLight);
      this.scene.remove(this.directionalLight.target);
    }
  }
}
