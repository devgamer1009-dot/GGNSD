/**
 * Damage System
 * Handles damage calculation, blocking, parrying, and damage events
 */

import { CombatStateComponent } from './CombatState.js';
import { DamageEvent, WeaponStats } from '../../content/combat/schemas.js';

export interface DamageModifiers {
  isCritical: boolean;
  isBlocked: boolean;
  isParried: boolean;
  damageMultiplier: number;
}

export class DamageSystem {
  private criticalChance: number = 0.1;
  private criticalMultiplier: number = 1.5;
  private blockReduction: number = 0.7;
  private parryNegation: number = 1.0;

  /**
   * Calculate damage with modifiers
   */
  calculateDamage(
    baseDamage: number,
    attacker: CombatStateComponent,
    defender: CombatStateComponent,
    weapon?: WeaponStats
  ): { damage: number; modifiers: DamageModifiers } {
    let damage = baseDamage;
    const modifiers: DamageModifiers = {
      isCritical: false,
      isBlocked: false,
      isParried: false,
      damageMultiplier: 1.0,
    };

    // Check for parry (highest priority)
    if (defender.isParrying) {
      modifiers.isParried = true;
      modifiers.damageMultiplier = 1.0 - this.parryNegation;
      damage *= modifiers.damageMultiplier;
      return { damage: Math.round(damage), modifiers };
    }

    // Check for block
    if (defender.isBlocking) {
      modifiers.isBlocked = true;
      modifiers.damageMultiplier = 1.0 - this.blockReduction;
      damage *= modifiers.damageMultiplier;
    }

    // Check for critical hit
    if (Math.random() < this.criticalChance) {
      modifiers.isCritical = true;
      damage *= this.criticalMultiplier;
    }

    // Apply weapon combo multiplier
    if (weapon && attacker.comboCount > 0) {
      const comboMultiplier = 1.0 + attacker.comboCount * 0.1;
      damage *= comboMultiplier;
    }

    return { damage: Math.round(damage), modifiers };
  }

  /**
   * Apply damage to target
   */
  applyDamage(
    event: DamageEvent,
    target: CombatStateComponent
  ): void {
    if (!target.isAlive()) return;

    target.health -= event.amount;
    target.health = Math.max(0, target.health);

    // Apply stagger if not blocked/parried
    if (!event.isBlocked && !event.isParried) {
      target.applyStagger(event.amount * 0.5);
    }
  }

  /**
   * Create damage event
   */
  createDamageEvent(
    source: string,
    target: string,
    damage: number,
    type: 'physical' | 'fire' | 'frost' | 'magic' = 'physical',
    modifiers: DamageModifiers = {
      isCritical: false,
      isBlocked: false,
      isParried: false,
      damageMultiplier: 1.0,
    }
  ): DamageEvent {
    return {
      source,
      target,
      amount: damage,
      type,
      isCritical: modifiers.isCritical,
      isBlocked: modifiers.isBlocked,
      isParried: modifiers.isParried,
    };
  }

  /**
   * Set critical hit parameters
   */
  setCriticalParams(chance: number, multiplier: number): void {
    this.criticalChance = chance;
    this.criticalMultiplier = multiplier;
  }

  /**
   * Set block/parry parameters
   */
  setDefenseParams(blockReduction: number, parryNegation: number): void {
    this.blockReduction = blockReduction;
    this.parryNegation = parryNegation;
  }
}
