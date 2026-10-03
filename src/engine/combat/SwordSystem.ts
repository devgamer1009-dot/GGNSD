/**
 * Sword System
 * Handles sword attacks, combos, and blocking
 */

import * as THREE from 'three';
import { CombatStateComponent } from './CombatState.js';
import { DamageSystem } from './DamageSystem.js';
import { HitDetection } from './HitDetection.js';
import { InputBuffer } from './InputBuffer.js';
import { WEAPON_SCHEMAS, WeaponStats } from '../../content/combat/schemas.js';

export type SwordAction = 'light_attack' | 'heavy_attack' | 'block' | 'parry';

export class SwordSystem {
  private weapon: WeaponStats;
  private damageSystem: DamageSystem;
  private hitDetection: HitDetection;
  private inputBuffer: InputBuffer;

  private attackState: 'idle' | 'windup' | 'active' | 'recovery' = 'idle';
  private attackTimer: number = 0;
  private isBlocking: boolean = false;

  // Timing windows (seconds)
  private lightAttackWindup: number = 0.2;
  private lightAttackActive: number = 0.15;
  private lightAttackRecovery: number = 0.3;
  private heavyAttackWindup: number = 0.5;
  private heavyAttackActive: number = 0.2;
  private heavyAttackRecovery: number = 0.5;
  private parryWindow: number = 0.3;

  constructor(
    damageSystem: DamageSystem,
    hitDetection: HitDetection,
    inputBuffer: InputBuffer,
    weaponId: string = 'sword'
  ) {
    this.weapon = WEAPON_SCHEMAS[weaponId]!;
    this.damageSystem = damageSystem;
    this.hitDetection = hitDetection;
    this.inputBuffer = inputBuffer;
  }

  /**
   * Update sword system
   */
  update(
    deltaTime: number,
    attackerId: string,
    attackerPos: THREE.Vector3,
    attackerDir: THREE.Vector3,
    combatState: CombatStateComponent
  ): { hits: string[]; damage: number } {
    const result = { hits: [] as string[], damage: 0 };

    // Update attack state
    if (this.attackState !== 'idle') {
      this.attackTimer += deltaTime;
      this.updateAttackState(attackerId, attackerPos, attackerDir, combatState, result);
    }

    // Update parry window
    combatState.updateParry(deltaTime);

    return result;
  }

  /**
   * Update attack state machine
   */
  private updateAttackState(
    attackerId: string,
    attackerPos: THREE.Vector3,
    attackerDir: THREE.Vector3,
    combatState: CombatStateComponent,
    result: { hits: string[]; damage: number }
  ): void {
    const isHeavy = combatState.comboCount >= 3; // 3rd hit is heavy
    const windup = isHeavy ? this.heavyAttackWindup : this.lightAttackWindup;
    const active = isHeavy ? this.heavyAttackActive : this.lightAttackActive;
    const recovery = isHeavy ? this.heavyAttackRecovery : this.lightAttackRecovery;

    if (this.attackState === 'windup' && this.attackTimer >= windup) {
      this.attackState = 'active';
      this.attackTimer = 0;
    } else if (this.attackState === 'active') {
      // Perform hit detection during active window
      const hits = this.hitDetection.sphereSweep(
        attackerPos,
        attackerDir,
        this.weapon.range,
        2.0,
        [attackerId]
      );

      if (hits.length > 0) {
        result.hits = hits.map(h => h.target);
        result.damage = this.weapon.baseDamage;
      }

      if (this.attackTimer >= active) {
        this.attackState = 'recovery';
        this.attackTimer = 0;
      }
    } else if (this.attackState === 'recovery' && this.attackTimer >= recovery) {
      this.attackState = 'idle';
      this.attackTimer = 0;
    }
  }

  /**
   * Start light attack
   */
  lightAttack(combatState: CombatStateComponent, currentTime: number): boolean {
    if (this.attackState !== 'idle') {
      // Buffer input if in recovery
      if (this.attackState === 'recovery') {
        this.inputBuffer.addInput('light_attack', currentTime);
      }
      return false;
    }

    if (!combatState.consumeStamina(this.weapon.staminaCost)) {
      return false;
    }

    combatState.resetComboIfExpired(currentTime, this.weapon.comboWindow);
    combatState.incrementCombo(currentTime);

    this.attackState = 'windup';
    this.attackTimer = 0;
    return true;
  }

  /**
   * Start heavy attack
   */
  heavyAttack(combatState: CombatStateComponent): boolean {
    if (this.attackState !== 'idle') return false;

    const heavyCost = this.weapon.staminaCost * 2;
    if (!combatState.consumeStamina(heavyCost)) {
      return false;
    }

    this.attackState = 'windup';
    this.attackTimer = 0;
    combatState.comboCount = 3; // Force heavy attack
    return true;
  }

  /**
   * Start blocking
   */
  startBlock(combatState: CombatStateComponent): void {
    if (this.attackState !== 'idle') return;
    this.isBlocking = true;
    combatState.isBlocking = true;
  }

  /**
   * Stop blocking
   */
  stopBlock(combatState: CombatStateComponent): void {
    this.isBlocking = false;
    combatState.isBlocking = false;
  }

  /**
   * Start parry
   */
  startParry(combatState: CombatStateComponent): boolean {
    if (this.attackState !== 'idle') return false;
    if (!combatState.consumeStamina(this.weapon.staminaCost * 0.5)) {
      return false;
    }

    combatState.startParry(this.parryWindow);
    return true;
  }

  /**
   * Check if can attack
   */
  canAttack(combatState: CombatStateComponent): boolean {
    return this.attackState === 'idle' && combatState.hasStamina(this.weapon.staminaCost);
  }

  /**
   * Get current attack state
   */
  getAttackState(): string {
    return this.attackState;
  }

  /**
   * Check if is blocking
   */
  isBlockingState(): boolean {
    return this.isBlocking;
  }

  /**
   * Get weapon stats
   */
  getWeapon(): WeaponStats {
    return this.weapon;
  }
}
