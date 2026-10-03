/**
 * Horse Manager
 * Manages horse instances and mounting
 */

import * as THREE from 'three';
import { Horse } from './Horse.js';
import { MountSystem, MountState } from './MountSystem.js';

export class HorseManager {
  private horses: Map<string, Horse> = new Map();
  private mountSystem: MountSystem;
  private scene: THREE.Scene;
  private playerHorseId: string | null = null;
  private maxHorses: number;

  constructor(scene: THREE.Scene, mountSystem: MountSystem, maxHorses: number = 10) {
    this.scene = scene;
    this.mountSystem = mountSystem;
    this.maxHorses = maxHorses;
  }

  /**
   * Add a horse
   */
  addHorse(id: string, position: THREE.Vector3, rotation: number = 0): Horse {
    if (this.horses.size >= this.maxHorses) {
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
   * Remove a horse
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
   * Get horse count
   */
  getHorseCount(): number {
    return this.horses.size;
  }

  /**
   * Try to mount nearest horse
   */
  tryMountNearestHorse(playerPosition: THREE.Vector3): boolean {
    const horses = Array.from(this.horses.values());
    const mounted = this.mountSystem.tryMount(horses, playerPosition);
    
    if (mounted) {
      // Find horse ID
      for (const [id, horse] of this.horses.entries()) {
        if (horse === mounted) {
          this.playerHorseId = id;
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get player's current horse
   */
  getPlayerHorse(): Horse | null {
    if (!this.playerHorseId) return null;
    return this.horses.get(this.playerHorseId) ?? null;
  }

  /**
   * Check if player is mounted
   */
  isPlayerMounted(): boolean {
    return this.mountSystem.isMounted();
  }

  /**
   * Update all horses
   */
  update(deltaTime: number, input: { moveX: number; moveZ: number; sprint: boolean }): void {
    const mountResult = this.mountSystem.update(deltaTime);

    for (const [id, horse] of this.horses.entries()) {
      const isPlayerHorse = id === this.playerHorseId;

      if (isPlayerHorse && mountResult.state === MountState.MOUNTED) {
        // Player-controlled horse
        horse.update(deltaTime, input);
      } else {
        // NPC horse (simple AI)
        horse.update(deltaTime, { moveX: 0, moveZ: 0, sprint: false });
      }
    }
  }

  /**
   * Dispose all horses
   */
  dispose(): void {
    for (const horse of this.horses.values()) {
      this.scene.remove(horse.getMesh());
      horse.dispose();
    }
    this.horses.clear();
    this.playerHorseId = null;
  }
}
