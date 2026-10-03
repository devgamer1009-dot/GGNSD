/**
 * Third-Person Camera System
 * P9 - Camera with collision, orbit, and lock-on support
 */

import * as THREE from 'three';
import type { PhysicsCharacter } from '../physics/PhysicsWorld.js';

export interface CameraConfig {
  distance: number;
  height: number;
  minDistance: number;
  maxDistance: number;
  minPitch: number;
  maxPitch: number;
  sensitivity: number;
  smoothing: number;
}

export class ThirdPersonCamera {
  private camera: THREE.PerspectiveCamera;
  private config: CameraConfig;
  
  private yaw: number = 0;
  private pitch: number = 0.3; // Slightly above horizontal
  private currentDistance: number;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  
  private lockOnTarget: PhysicsCharacter | null = null;
  private isLockedOn: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, config?: Partial<CameraConfig>) {
    this.camera = camera;
    this.config = {
      distance: 5.0,
      height: 2.0,
      minDistance: 2.0,
      maxDistance: 10.0,
      minPitch: -0.5,
      maxPitch: 1.2,
      sensitivity: 0.002,
      smoothing: 0.1,
      ...config,
    };
    this.currentDistance = this.config.distance;
  }

  /**
   * Update camera position and orientation
   */
  update(character: PhysicsCharacter, deltaTime: number): void {
    // Calculate target position (character position + offset)
    this.targetPosition.set(
      character.position.x,
      character.position.y + this.config.height,
      character.position.z
    );

    // If locked on, look at lock-on target
    if (this.isLockedOn && this.lockOnTarget) {
      const targetDir = new THREE.Vector3(
        this.lockOnTarget.position.x - character.position.x,
        0,
        this.lockOnTarget.position.z - character.position.z
      ).normalize();
      
      this.yaw = Math.atan2(targetDir.x, targetDir.z);
    }

    // Calculate desired camera position
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.currentDistance;
    const offsetY = Math.sin(this.pitch) * this.currentDistance;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.currentDistance;

    const desiredPosition = new THREE.Vector3(
      this.targetPosition.x - offsetX,
      this.targetPosition.y + offsetY,
      this.targetPosition.z - offsetZ
    );

    // Simple collision detection (prevent camera from going below terrain)
    // In a full implementation, this would raycast against terrain
    if (desiredPosition.y < this.targetPosition.y + 0.5) {
      desiredPosition.y = this.targetPosition.y + 0.5;
    }

    // Smooth interpolation
    const lerpFactor = 1.0 - Math.pow(1.0 - this.config.smoothing, deltaTime * 60);
    this.currentPosition.lerp(desiredPosition, lerpFactor);

    // Update camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.targetPosition);
  }

  /**
   * Handle mouse input for orbit
   */
  handleMouseMovement(deltaX: number, deltaY: number): void {
    if (this.isLockedOn) return; // Don't orbit when locked on

    this.yaw -= deltaX * this.config.sensitivity;
    this.pitch -= deltaY * this.config.sensitivity;

    // Clamp pitch
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
  }

  /**
   * Handle scroll input for zoom
   */
  handleScroll(delta: number): void {
    this.currentDistance -= delta * 0.5;
    this.currentDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, this.currentDistance)
    );
  }

  /**
   * Set lock-on target
   */
  setLockOnTarget(target: PhysicsCharacter | null): void {
    this.lockOnTarget = target;
    this.isLockedOn = target !== null;
  }

  /**
   * Toggle lock-on
   */
  toggleLockOn(target: PhysicsCharacter | null): void {
    if (this.isLockedOn) {
      this.isLockedOn = false;
      this.lockOnTarget = null;
    } else if (target) {
      this.isLockedOn = true;
      this.lockOnTarget = target;
    }
  }

  /**
   * Check if locked on
   */
  isLockOnActive(): boolean {
    return this.isLockedOn;
  }

  /**
   * Get camera yaw
   */
  getYaw(): number {
    return this.yaw;
  }

  /**
   * Get camera pitch
   */
  getPitch(): number {
    return this.pitch;
  }

  /**
   * Set camera config
   */
  setConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get camera config
   */
  getConfig(): CameraConfig {
    return { ...this.config };
  }
}
