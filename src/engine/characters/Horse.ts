/**
 * Horse System - Horse with walk/trot/gallop gaits
 * P11 - Horse character with multiple gaits and mount/dismount
 */

import * as THREE from 'three';
import { createProceduralHumanoid } from './ProceduralHumanoid.js';

export enum HorseGait {
  IDLE = 'idle',
  WALK = 'walk',
  TROT = 'trot',
  GALLOP = 'gallop',
}

export interface HorseConfig {
  walkSpeed: number;      // m/s
  trotSpeed: number;      // m/s
  gallopSpeed: number;    // m/s
  turnSpeed: number;      // radians/s
  mountTime: number;      // seconds
  dismountTime: number;   // seconds
}

const DEFAULT_HORSE_CONFIG: HorseConfig = {
  walkSpeed: 2.0,
  trotSpeed: 5.0,
  gallopSpeed: 12.0,
  turnSpeed: 2.0,
  mountTime: 1.0,
  dismountTime: 0.8,
};

export interface HorseState {
  position: THREE.Vector3;
  rotation: number;
  gait: HorseGait;
  isMounted: boolean;
  riderOffset: THREE.Vector3;
}

/**
 * Horse character system
 */
export class Horse {
  private config: HorseConfig;
  private mesh: THREE.Group;
  private state: HorseState;
  
  private animationTime: number = 0;
  private mountProgress: number = 0;
  private isMounting: boolean = false;
  private isDismounting: boolean = false;

  constructor(config: Partial<HorseConfig> = {}) {
    this.config = { ...DEFAULT_HORSE_CONFIG, ...config };
    this.mesh = this.createHorseMesh();
    
    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      rotation: 0,
      gait: HorseGait.IDLE,
      isMounted: false,
      riderOffset: new THREE.Vector3(0, 1.2, 0), // Saddle position
    };
  }

  /**
   * Create horse mesh (procedural)
   */
  private createHorseMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.CapsuleGeometry(0.2, 0.5, 8, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0.8, 1.3, 0);
    head.rotation.z = Math.PI / 4;
    head.castShadow = true;
    group.add(head);
    
    // Neck
    const neckGeometry = new THREE.CapsuleGeometry(0.15, 0.4, 8, 16);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.set(0.6, 1.2, 0);
    neck.rotation.z = Math.PI / 3;
    neck.castShadow = true;
    group.add(neck);
    
    // Legs (4)
    const legGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 8, 16);
    const legPositions = [
      { x: 0.4, z: 0.2 },   // Front left
      { x: 0.4, z: -0.2 },  // Front right
      { x: -0.4, z: 0.2 },  // Back left
      { x: -0.4, z: -0.2 }, // Back right
    ];
    
    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos.x, 0.4, pos.z);
      leg.castShadow = true;
      group.add(leg);
    }
    
    // Tail
    const tailGeometry = new THREE.CapsuleGeometry(0.05, 0.4, 8, 16);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-0.8, 1.0, 0);
    tail.rotation.z = -Math.PI / 6;
    tail.castShadow = true;
    group.add(tail);
    
    return group;
  }

  /**
   * Update horse state
   */
  update(deltaTime: number, input: { moveX: number; moveZ: number; sprint: boolean }): void {
    // Update animation time
    this.animationTime += deltaTime;
    
    // Update mount/dismount
    if (this.isMounting) {
      this.mountProgress += deltaTime / this.config.mountTime;
      if (this.mountProgress >= 1.0) {
        this.isMounting = false;
        this.state.isMounted = true;
        this.mountProgress = 1.0;
      }
    } else if (this.isDismounting) {
      this.mountProgress -= deltaTime / this.config.dismountTime;
      if (this.mountProgress <= 0.0) {
        this.isDismounting = false;
        this.state.isMounted = false;
        this.mountProgress = 0.0;
      }
    }
    
    // Update movement
    if (this.state.isMounted) {
      this.updateMovement(deltaTime, input);
    }
    
    // Update gait animation
    this.updateGaitAnimation(deltaTime);
  }

  /**
   * Update horse movement
   */
  private updateMovement(deltaTime: number, input: { moveX: number; moveZ: number; sprint: boolean }): void {
    // Calculate movement direction
    const moveLength = Math.sqrt(input.moveX * input.moveX + input.moveZ * input.moveZ);
    
    if (moveLength > 0.1) {
      // Normalize movement
      const moveX = input.moveX / moveLength;
      const moveZ = input.moveZ / moveLength;
      
      // Determine gait based on speed
      let speed: number;
      if (input.sprint) {
        this.state.gait = HorseGait.GALLOP;
        speed = this.config.gallopSpeed;
      } else if (moveLength > 0.5) {
        this.state.gait = HorseGait.TROT;
        speed = this.config.trotSpeed;
      } else {
        this.state.gait = HorseGait.WALK;
        speed = this.config.walkSpeed;
      }
      
      // Move horse
      this.state.position.x += moveX * speed * deltaTime;
      this.state.position.z += moveZ * speed * deltaTime;
      
      // Rotate horse to face movement direction
      const targetRotation = Math.atan2(moveX, moveZ);
      const rotationDiff = targetRotation - this.state.rotation;
      
      // Smooth rotation
      const maxRotation = this.config.turnSpeed * deltaTime;
      if (Math.abs(rotationDiff) < maxRotation) {
        this.state.rotation = targetRotation;
      } else {
        this.state.rotation += Math.sign(rotationDiff) * maxRotation;
      }
    } else {
      this.state.gait = HorseGait.IDLE;
    }
    
    // Update mesh transform
    this.mesh.position.copy(this.state.position);
    this.mesh.rotation.y = this.state.rotation;
  }

  /**
   * Update gait animation
   */
  private updateGaitAnimation(_deltaTime: number): void {
    // Animate legs based on gait
    const legSpeed = this.getGaitAnimationSpeed();
    const legAmplitude = this.getGaitLegAmplitude();
    
    const legAngle = Math.sin(this.animationTime * legSpeed) * legAmplitude;
    
    // Animate legs (simplified)
    const legs = this.mesh.children.filter((child, index) => index >= 4 && index < 8);
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (leg) {
        const phase = (i % 2) * Math.PI; // Alternate legs
        leg.rotation.x = Math.sin(this.animationTime * legSpeed + phase) * legAmplitude;
      }
    }
    
    // Animate tail
    const tail = this.mesh.children[6];
    if (tail) {
      tail.rotation.x = Math.sin(this.animationTime * 2) * 0.2;
    }
  }

  /**
   * Get gait animation speed
   */
  private getGaitAnimationSpeed(): number {
    switch (this.state.gait) {
      case HorseGait.IDLE: return 0;
      case HorseGait.WALK: return 3;
      case HorseGait.TROT: return 6;
      case HorseGait.GALLOP: return 10;
    }
  }

  /**
   * Get gait leg amplitude
   */
  private getGaitLegAmplitude(): number {
    switch (this.state.gait) {
      case HorseGait.IDLE: return 0;
      case HorseGait.WALK: return 0.3;
      case HorseGait.TROT: return 0.5;
      case HorseGait.GALLOP: return 0.7;
    }
  }

  /**
   * Mount horse
   */
  mount(): void {
    if (this.state.isMounted || this.isMounting) return;
    this.isMounting = true;
    this.mountProgress = 0;
  }

  /**
   * Dismount horse
   */
  dismount(): void {
    if (!this.state.isMounted || this.isDismounting) return;
    this.isDismounting = true;
    this.mountProgress = 1;
  }

  /**
   * Get horse mesh
   */
  getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Get horse state
   */
  getState(): HorseState {
    return { ...this.state };
  }

  /**
   * Get rider position (world space)
   */
  getRiderPosition(): THREE.Vector3 {
    const riderPos = this.state.riderOffset.clone();
    riderPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.state.rotation);
    riderPos.add(this.state.position);
    
    // Interpolate during mount/dismount
    if (this.isMounting || this.isDismounting) {
      const groundPos = this.state.position.clone();
      groundPos.y = 0;
      riderPos.lerp(groundPos, 1.0 - this.mountProgress);
    }
    
    return riderPos;
  }

  /**
   * Check if horse is mounted
   */
  isRiderMounted(): boolean {
    return this.state.isMounted;
  }

  /**
   * Get current gait
   */
  getCurrentGait(): HorseGait {
    return this.state.gait;
  }

  /**
   * Set horse position
   */
  setPosition(x: number, y: number, z: number): void {
    this.state.position.set(x, y, z);
    this.mesh.position.set(x, y, z);
  }

  /**
   * Set horse rotation
   */
  setRotation(rotation: number): void {
    this.state.rotation = rotation;
    this.mesh.rotation.y = rotation;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
