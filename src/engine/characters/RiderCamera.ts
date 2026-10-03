/**
 * Rider Camera - Camera mode for mounted characters
 * P11 - Third-person camera optimized for riding
 */

import * as THREE from 'three';

export interface RiderCameraConfig {
  distance: number;
  height: number;
  lookAheadDistance: number;
  smoothing: number;
  turnSmoothing: number;
}

const DEFAULT_RIDER_CAMERA_CONFIG: RiderCameraConfig = {
  distance: 4.0,
  height: 2.0,
  lookAheadDistance: 2.0,
  smoothing: 0.15,
  turnSmoothing: 0.1,
};

/**
 * Rider camera system for mounted characters
 */
export class RiderCamera {
  private camera: THREE.PerspectiveCamera;
  private config: RiderCameraConfig;
  
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  
  private isActive: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, config: Partial<RiderCameraConfig> = {}) {
    this.camera = camera;
    this.config = { ...DEFAULT_RIDER_CAMERA_CONFIG, ...config };
  }

  /**
   * Update rider camera
   */
  update(
    deltaTime: number,
    riderPosition: THREE.Vector3,
    riderRotation: number,
    horseVelocity: THREE.Vector3
  ): void {
    if (!this.isActive) return;

    // Calculate target camera position (behind and above rider)
    const offsetX = Math.sin(riderRotation) * this.config.distance;
    const offsetZ = Math.cos(riderRotation) * this.config.distance;
    
    this.targetPosition.set(
      riderPosition.x - offsetX,
      riderPosition.y + this.config.height,
      riderPosition.z - offsetZ
    );

    // Calculate look-at point (ahead of rider)
    const lookAheadX = Math.sin(riderRotation) * this.config.lookAheadDistance;
    const lookAheadZ = Math.cos(riderRotation) * this.config.lookAheadDistance;
    
    this.targetLookAt.set(
      riderPosition.x + lookAheadX,
      riderPosition.y + 1.0,
      riderPosition.z + lookAheadZ
    );

    // Smooth camera movement
    const lerpFactor = 1.0 - Math.pow(1.0 - this.config.smoothing, deltaTime * 60);
    this.currentPosition.lerp(this.targetPosition, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);

    // Update camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Activate rider camera
   */
  activate(initialPosition: THREE.Vector3, initialRotation: number): void {
    this.isActive = true;
    
    // Initialize camera position
    const offsetX = Math.sin(initialRotation) * this.config.distance;
    const offsetZ = Math.cos(initialRotation) * this.config.distance;
    
    this.currentPosition.set(
      initialPosition.x - offsetX,
      initialPosition.y + this.config.height,
      initialPosition.z - offsetZ
    );
    
    this.currentLookAt.copy(initialPosition);
    this.currentLookAt.y += 1.0;
    
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Deactivate rider camera
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Check if rider camera is active
   */
  isActiveMode(): boolean {
    return this.isActive;
  }

  /**
   * Set camera configuration
   */
  setConfig(config: Partial<RiderCameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get camera configuration
   */
  getConfig(): RiderCameraConfig {
    return { ...this.config };
  }

  /**
   * Get current camera position
   */
  getPosition(): THREE.Vector3 {
    return this.currentPosition.clone();
  }

  /**
   * Get current look-at point
   */
  getLookAt(): THREE.Vector3 {
    return this.currentLookAt.clone();
  }
}
