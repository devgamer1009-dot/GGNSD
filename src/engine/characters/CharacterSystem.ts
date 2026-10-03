/**
 * Character System - Main orchestrator for characters
 * P11 - Complete character system with animation, mounting, and crowds
 */

import * as THREE from 'three';
import { AnimationStateMachine } from './AnimationStateMachine.js';
import { Horse } from './Horse.js';
import { MountSystem, MountState } from './MountSystem.js';
import { RiderCamera } from './RiderCamera.js';
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
  private crowdSystem: CrowdSystem | null = null;
  
  private horses: Map<string, Horse> = new Map();
  private playerHorseId: string | null = null;

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
    for (const [id, horse] of this.horses.entries()) {
      const isPlayerHorse = id === this.playerHorseId;
      
      if (isPlayerHorse && mountResult.state === MountState.MOUNTED) {
        // Player-controlled horse
        horse.update(deltaTime, input);
        
        // Update rider camera
        const horseState = horse.getState();
        this.riderCamera.update(
          deltaTime,
          horse.getRiderPosition(),
          horseState.rotation,
          new THREE.Vector3(0, 0, 0) // Velocity from horse
        );
      } else {
        // NPC horse (simple AI)
        horse.update(deltaTime, { moveX: 0, moveZ: 0, sprint: false });
      }
    }
    
    // Update crowd
    if (this.crowdSystem) {
      this.crowdSystem.update(deltaTime);
    }
    
    // Switch camera mode based on mount state
    if (mountResult.state === MountState.MOUNTED) {
      if (!this.riderCamera.isActiveMode()) {
        const horse = this.horses.get(this.playerHorseId!);
        if (horse) {
          this.riderCamera.activate(horse.getRiderPosition(), horse.getState().rotation);
        }
      }
    } else {
      if (this.riderCamera.isActiveMode()) {
        this.riderCamera.deactivate();
      }
    }
  }

  /**
   * Try to mount nearest horse
   */
  private tryMountNearestHorse(): void {
    const mountables = Array.from(this.horses.values());
    const playerPos = this.mountSystem['playerPosition']; // Access private for now
    
    const mounted = this.mountSystem.tryMount(mountables, playerPos);
    if (mounted) {
      // Find horse ID
      for (const [id, horse] of this.horses.entries()) {
        if (horse === mounted) {
          this.playerHorseId = id;
          break;
        }
      }
    }
  }

  /**
   * Add a horse to the system
   */
  addHorse(id: string, position: THREE.Vector3, rotation: number = 0): Horse {
    if (this.horses.size >= this.config.maxHorses) {
      throw new Error('Maximum horse count reached');
    }
    
    const horse = new Horse();
    horse.setPosition(position.x, position.y, position.z);
    horse.setRotation(rotation);
    
    this.horses.set(id, horse);
    this.scene.add(horse.getMesh());
    
    return horse;
  }

  /**
   * Remove a horse from the system
   */
  removeHorse(id: string): void {
    const horse = this.horses.get(id);
    if (horse) {
      this.scene.remove(horse.getMesh());
      horse.dispose();
      this.horses.delete(id);
      
      if (this.playerHorseId === id) {
        this.playerHorseId = null;
        this.mountSystem.forceDismount();
      }
    }
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
    return this.horses.get(id);
  }

  /**
   * Get all horses
   */
  getAllHorses(): Map<string, Horse> {
    return this.horses;
  }

  /**
   * Check if player is mounted
   */
  isPlayerMounted(): boolean {
    return this.mountSystem.isMounted();
  }

  /**
   * Get player's current horse
   */
  getPlayerHorse(): Horse | null {
    if (!this.playerHorseId) return null;
    return this.horses.get(this.playerHorseId) ?? null;
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
      horseCount: this.horses.size,
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
    for (const horse of this.horses.values()) {
      this.scene.remove(horse.getMesh());
      horse.dispose();
    }
    this.horses.clear();
    
    // Dispose crowd
    if (this.crowdSystem) {
      this.crowdSystem.dispose();
    }
    
    // Dispose mount system
    this.mountSystem.dispose();
  }
}
