/**
 * Mount System - Mount/dismount logic
 * P11 - Handle mounting horses and other rideable entities
 */

import * as THREE from 'three';
import { Horse } from './Horse.js';
import { CharacterState } from '../physics/CharacterStateMachine.js';

export interface Mountable {
  getRiderPosition(): THREE.Vector3;
  mount(): void;
  dismount(): void;
  isRiderMounted(): boolean;
  getMesh(): THREE.Object3D;
}

export enum MountState {
  DISMOUNTED = 'dismounted',
  MOUNTING = 'mounting',
  MOUNTED = 'mounted',
  DISMOUNTING = 'dismounting',
}

/**
 * Mount system for managing rider-mountable interactions
 */
export class MountSystem {
  private mountState: MountState = MountState.DISMOUNTED;
  private currentMount: Mountable | null = null;
  private mountProgress: number = 0;
  private mountDuration: number = 1.0;
  
  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private playerRotation: number = 0;

  constructor() {}

  /**
   * Try to mount nearest mountable
   */
  tryMount(mountables: Mountable[], playerPosition: THREE.Vector3): Mountable | null {
    if (this.mountState !== MountState.DISMOUNTED) return null;

    // Find nearest mountable within range
    let nearestMount: Mountable | null = null;
    let nearestDistance = Infinity;
    const mountRange = 3.0;

    for (const mount of mountables) {
      const mountPos = mount.getMesh().position;
      const distance = playerPosition.distanceTo(mountPos);
      
      if (distance < mountRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestMount = mount;
      }
    }

    if (nearestMount) {
      this.startMount(nearestMount);
      return nearestMount;
    }

    return null;
  }

  /**
   * Start mounting process
   */
  private startMount(mount: Mountable): void {
    this.currentMount = mount;
    this.mountState = MountState.MOUNTING;
    this.mountProgress = 0;
    mount.mount();
  }

  /**
   * Start dismounting process
   */
  tryDismount(): void {
    if (this.mountState !== MountState.MOUNTED || !this.currentMount) return;
    
    this.mountState = MountState.DISMOUNTING;
    this.mountProgress = 1.0;
    this.currentMount.dismount();
  }

  /**
   * Update mount system
   */
  update(deltaTime: number): {
    state: MountState;
    position: THREE.Vector3 | null;
    rotation: number | null;
  } {
    // Update mount/dismount progress
    if (this.mountState === MountState.MOUNTING) {
      this.mountProgress += deltaTime / this.mountDuration;
      
      if (this.mountProgress >= 1.0) {
        this.mountState = MountState.MOUNTED;
        this.mountProgress = 1.0;
      }
    } else if (this.mountState === MountState.DISMOUNTING) {
      this.mountProgress -= deltaTime / this.mountDuration;
      
      if (this.mountProgress <= 0.0) {
        this.mountState = MountState.DISMOUNTED;
        this.mountProgress = 0.0;
        this.currentMount = null;
      }
    }

    // Get rider position if mounted
    let position: THREE.Vector3 | null = null;
    let rotation: number | null = null;

    if (this.currentMount && (this.mountState === MountState.MOUNTED || this.mountState === MountState.MOUNTING || this.mountState === MountState.DISMOUNTING)) {
      position = this.currentMount.getRiderPosition();
      
      // Get rotation from mount if it's a horse
      if (this.currentMount instanceof Horse) {
        rotation = this.currentMount.getState().rotation;
      }
    }

    return {
      state: this.mountState,
      position,
      rotation,
    };
  }

  /**
   * Get current mount state
   */
  getMountState(): MountState {
    return this.mountState;
  }

  /**
   * Get current mount
   */
  getCurrentMount(): Mountable | null {
    return this.currentMount;
  }

  /**
   * Check if mounted
   */
  isMounted(): boolean {
    return this.mountState === MountState.MOUNTED;
  }

  /**
   * Get mount progress (0-1)
   */
  getMountProgress(): number {
    return this.mountProgress;
  }

  /**
   * Set player position (for mount range checking)
   */
  setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position);
  }

  /**
   * Force dismount (e.g., when mount dies)
   */
  forceDismount(): void {
    if (this.currentMount) {
      this.currentMount.dismount();
      this.currentMount = null;
    }
    this.mountState = MountState.DISMOUNTED;
    this.mountProgress = 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.forceDismount();
  }
}

/**
 * Get character state based on mount state
 */
export function getCharacterStateForMount(mountState: MountState): CharacterState {
  switch (mountState) {
    case MountState.MOUNTING:
    case MountState.DISMOUNTING:
      return CharacterState.DODGE; // Use dodge animation for mount/dismount
    case MountState.MOUNTED:
      return CharacterState.IDLE; // Will be overridden by horse movement
    case MountState.DISMOUNTED:
    default:
      return CharacterState.IDLE;
  }
}
