/**
 * Bow System
 * Handles bow aiming, shooting, and arrow physics
 */

import * as THREE from 'three';
import { CombatStateComponent } from './CombatState.js';
import { DamageSystem } from './DamageSystem.js';
import { HitDetection } from './HitDetection.js';
import { WEAPON_SCHEMAS, WeaponStats } from '../../content/combat/schemas.js';

export interface Arrow {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  ownerId: string;
  lifetime: number;
}

export class BowSystem {
  private weapon: WeaponStats;
  private damageSystem: DamageSystem;
  private hitDetection: HitDetection;

  private isAiming: boolean = false;
  private aimTime: number = 0;
  private arrows: Arrow[] = [];
  private arrowSpeed: number = 50; // m/s
  private maxArrowLifetime: number = 5; // seconds

  constructor(
    damageSystem: DamageSystem,
    hitDetection: HitDetection,
    weaponId: string = 'bow'
  ) {
    this.weapon = WEAPON_SCHEMAS[weaponId]!;
    this.damageSystem = damageSystem;
    this.hitDetection = hitDetection;
  }

  /**
   * Update bow system
   */
  update(
    deltaTime: number,
    combatState: CombatStateComponent
  ): { hits: string[]; damage: number } {
    const result = { hits: [] as string[], damage: 0 };

    // Update aim time
    if (this.isAiming) {
      this.aimTime += deltaTime;
    }

    // Update arrows
    this.updateArrows(deltaTime, result);

    return result;
  }

  /**
   * Update arrow positions and check for hits
   */
  private updateArrows(
    deltaTime: number,
    result: { hits: string[]; damage: number }
  ): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.arrows.length; i++) {
      const arrow = this.arrows[i]!;
      
      // Update position
      arrow.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
      arrow.lifetime += deltaTime;

      // Check for hit
      const hit = this.hitDetection.raycast(
        arrow.position.clone().sub(arrow.velocity.clone().normalize().multiplyScalar(0.5)),
        arrow.velocity.clone().normalize(),
        1.0,
        [arrow.ownerId]
      );

      if (hit) {
        result.hits.push(hit.target);
        result.damage = arrow.damage;
        toRemove.push(i);
      } else if (arrow.lifetime > this.maxArrowLifetime) {
        toRemove.push(i);
      }
    }

    // Remove hit/expired arrows
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.arrows.splice(toRemove[i]!, 1);
    }
  }

  /**
   * Start aiming
   */
  startAim(): void {
    this.isAiming = true;
    this.aimTime = 0;
  }

  /**
   * Stop aiming
   */
  stopAim(): void {
    this.isAiming = false;
    this.aimTime = 0;
  }

  /**
   * Shoot arrow
   */
  shoot(
    combatState: CombatStateComponent,
    origin: THREE.Vector3,
    direction: THREE.Vector3
  ): boolean {
    if (!combatState.consumeStamina(this.weapon.staminaCost)) {
      return false;
    }

    // Calculate damage based on aim time
    const aimMultiplier = Math.min(1.0, this.aimTime / 1.0); // Full power after 1s
    const damage = this.weapon.baseDamage * aimMultiplier;

    // Create arrow
    const arrow: Arrow = {
      id: `arrow_${Date.now()}_${Math.random()}`,
      position: origin.clone(),
      velocity: direction.normalize().multiplyScalar(this.arrowSpeed),
      damage,
      ownerId: '', // Set by caller
      lifetime: 0,
    };

    this.arrows.push(arrow);
    this.stopAim();

    return true;
  }

  /**
   * Set arrow owner
   */
  setArrowOwner(arrowId: string, ownerId: string): void {
    const arrow = this.arrows.find(a => a.id === arrowId);
    if (arrow) {
      arrow.ownerId = ownerId;
    }
  }

  /**
   * Check if aiming
   */
  isAimingState(): boolean {
    return this.isAiming;
  }

  /**
   * Get aim progress (0-1)
   */
  getAimProgress(): number {
    return Math.min(1.0, this.aimTime / 1.0);
  }

  /**
   * Get active arrow count
   */
  getArrowCount(): number {
    return this.arrows.length;
  }

  /**
   * Get weapon stats
   */
  getWeapon(): WeaponStats {
    return this.weapon;
  }

  /**
   * Clear all arrows
   */
  clearArrows(): void {
    this.arrows = [];
  }
}
