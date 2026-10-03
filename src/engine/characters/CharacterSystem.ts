/**
 * Character System - Main orchestrator for characters
 * P11 - Complete character system with animation, mounting, and crowds
 */

import * as THREE from 'three';
import { AnimationStateMachine } from './AnimationStateMachine.js';
import { Horse } from './Horse.js';
import { MountSystem, MountState } from './MountSystem.js';
import { RiderCamera } from './RiderCamera.js';
import { HorseManager } from './HorseManager.js';
import { CrowdSystem, createCrowdGeometry, createCrowdMaterial } from './CrowdSystem.js';
import { CharacterState } from '../physics/CharacterStateMachine.js';

export interface CharacterSystemConfig {
  enableCrowds: boolean;
  maxCrowdMembers: number;
  enableHorses: boolean;
  maxHorses: number;
}

const DEFAULT_CONFIG: CharacterSystemConfig = {
  enableCrowds: true,
  maxCrowdMembers: 100,
  enableHorses: true,
  maxHorses: 10,
};

/**
 * Main character system
 */
export class CharacterSystem {
  private config: CharacterSystemConfig;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private animationStateMachine: AnimationStateMachine;
  private mountSystem: MountSystem;
  private riderCamera: RiderCamera;
  private horseManager: HorseManager;
  private crowdSystem: CrowdSystem | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    config: Partial<CharacterSystemConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scene = scene;
    this.camera = camera;
    
    this.animationStateMachine = new AnimationStateMachine();
    this.mountSystem = new MountSystem();
    this.riderCamera = new RiderCamera(camera);
    this.horseManager = new HorseManager(scene, this.mountSystem, this.config.maxHorses);
    
    if (this.config.enableCrowds) {
      this.crowdSystem = new CrowdSystem({
        maxMembers: this.config.maxCrowdMembers,
      });
      
      const geometry = createCrowdGeometry();
      const material = createCrowdMaterial();
      this.crowdSystem.initialize(geometry, material);
    }
  }

  /**
   * Update character system
   */
  update(deltaTime: number, movementState: CharacterState, input: {
    moveX: number;
    moveZ: number;
    sprint: boolean;
    mount: boolean;
  }): void {
    // Update animation state machine
    this.animationStateMachine.update(deltaTime, movementState);
    
    // Update mount system
    const mountResult = this.mountSystem.update(deltaTime);
    
    // Handle mounting input
    if (input.mount && this.mountSystem.getMountState() === MountState.DISMOUNTED) {
      this.tryMountNearestHorse();
    } else if (input.mount && this.mountSystem.getMountState() === MountState.MOUNTED) {
      this.mountSystem.tryDismount();
    }
    
    // Update horses
    this.horseManager.update(deltaTime, input);
    
    // Update rider camera if mounted
    if (mountResult.state === MountState.MOUNTED) {
      const playerHorse = this.horseManager.getPlayerHorse();
      if (playerHorse) {
        const horseState = playerHorse.getState();
        this.riderCamera.update(
          deltaTime,
          playerHorse.getRiderPosition(),
          horseState.rotation,
          new THREE.Vector3(0, 0, 0)
        );
        
        if (!this.riderCamera.isActiveMode()) {
          this.riderCamera.activate(playerHorse.getRiderPosition(), horseState.rotation);
        }
      }
    } else {
      if (this.riderCamera.isActiveMode()) {
        this.riderCamera.deactivate();
      }
    }
    
    // Update crowd
    if (this.crowdSystem) {
      this.crowdSystem.update(deltaTime);
    }
  }

  /**
   * Try to mount nearest horse
   */
  private tryMountNearestHorse(): void {
    const playerPos = this.mountSystem['playerPosition']; // Access private for now
    this.horseManager.tryMountNearestHorse(playerPos);
  }

  /**
   * Add a horse to the system
   */
  addHorse(id: string, position: THREE.Vector3, rotation: number = 0): Horse {
    return this.horseManager.addHorse(id, position, rotation);
  }

  /**
   * Remove a horse from the system
   */
  removeHorse(id: string): void {
    this.horseManager.removeHorse(id);
  }

  /**
   * Spawn crowd at position
   */
  spawnCrowd(center: THREE.Vector3, count: number): void {
    if (this.crowdSystem) {
      this.crowdSystem.spawnCrowd(center, count);
      
      const mesh = this.crowdSystem.getInstancedMesh();
      if (mesh && !this.scene.children.includes(mesh)) {
        this.scene.add(mesh);
      }
    }
  }

  /**
   * Get animation state machine
   */
  getAnimationStateMachine(): AnimationStateMachine {
    return this.animationStateMachine;
  }

  /**
   * Get mount system
   */
  getMountSystem(): MountSystem {
    return this.mountSystem;
  }

  /**
   * Get rider camera
   */
  getRiderCamera(): RiderCamera {
    return this.riderCamera;
  }

  /**
   * Get crowd system
   */
  getCrowdSystem(): CrowdSystem | null {
    return this.crowdSystem;
  }

  /**
   * Get horse by ID
   */
  getHorse(id: string): Horse | undefined {
    return this.horseManager.getHorse(id);
  }

  /**
   * Get all horses
   */
  getAllHorses(): Map<string, Horse> {
    return this.horseManager.getAllHorses();
  }

  /**
   * Check if player is mounted
   */
  isPlayerMounted(): boolean {
    return this.horseManager.isPlayerMounted();
  }

  /**
   * Get player's current horse
   */
  getPlayerHorse(): Horse | null {
    return this.horseManager.getPlayerHorse();
  }

  /**
   * Get system statistics
   */
  getStats(): {
    horseCount: number;
    crowdCount: number;
    isMounted: boolean;
    currentAnimation: string;
  } {
    return {
      horseCount: this.horseManager.getHorseCount(),
      crowdCount: this.crowdSystem?.getMemberCount() ?? 0,
      isMounted: this.mountSystem.isMounted(),
      currentAnimation: this.animationStateMachine.getCurrentState(),
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Dispose horses
    this.horseManager.dispose();
    
    // Dispose crowd
    if (this.crowdSystem) {
      this.crowdSystem.dispose();
    }
    
    // Dispose mount system
    this.mountSystem.dispose();
  }
}
