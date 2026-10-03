/**
 * Combat State Component
 * Tracks health, stamina, stagger, and combat status
 */

import { CombatState } from '../../content/combat/schemas.js';

export class CombatStateComponent implements CombatState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  stagger: number;
  maxStagger: number;
  isStaggered: boolean = false;
  isBlocking: boolean = false;
  isParrying: boolean = false;
  parryWindow: number = 0;
  comboCount: number = 0;
  lastAttackTime: number = 0;

  constructor(maxHealth: number, maxStamina: number, maxStagger: number) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.maxStamina = maxStamina;
    this.stamina = maxStamina;
    this.maxStagger = maxStagger;
    this.stagger = 0;
  }

  /**
   * Check if entity is alive
   */
  isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Check if entity has enough stamina
   */
  hasStamina(amount: number): boolean {
    return this.stamina >= amount;
  }

  /**
   * Consume stamina
   */
  consumeStamina(amount: number): boolean {
    if (this.stamina < amount) {
      return false;
    }
    this.stamina -= amount;
    return true;
  }

  /**
   * Regenerate stamina over time
   */
  regenerateStamina(deltaTime: number, rate: number = 20): void {
    if (this.isStaggered || this.isBlocking) {
      return; // No regen while staggered or blocking
    }
    this.stamina = Math.min(this.maxStamina, this.stamina + rate * deltaTime);
  }

  /**
   * Apply stagger damage
   */
  applyStagger(amount: number): void {
    this.stagger += amount;
    if (this.stagger >= this.maxStagger) {
      this.isStaggered = true;
      this.stagger = this.maxStagger;
    }
  }

  /**
   * Decay stagger over time
   */
  decayStagger(deltaTime: number, rate: number = 10): void {
    if (this.stagger > 0) {
      this.stagger = Math.max(0, this.stagger - rate * deltaTime);
      if (this.stagger === 0) {
        this.isStaggered = false;
      }
    }
  }

  /**
   * Start parry window
   */
  startParry(duration: number = 0.3): void {
    this.isParrying = true;
    this.parryWindow = duration;
  }

  /**
   * Update parry window
   */
  updateParry(deltaTime: number): void {
    if (this.isParrying) {
      this.parryWindow -= deltaTime;
      if (this.parryWindow <= 0) {
        this.isParrying = false;
        this.parryWindow = 0;
      }
    }
  }

  /**
   * Reset combo if window expired
   */
  resetComboIfExpired(currentTime: number, comboWindow: number): void {
    if (currentTime - this.lastAttackTime > comboWindow) {
      this.comboCount = 0;
    }
  }

  /**
   * Increment combo
   */
  incrementCombo(currentTime: number): void {
    this.comboCount++;
    this.lastAttackTime = currentTime;
  }

  /**
   * Clone state
   */
  clone(): CombatStateComponent {
    const clone = new CombatStateComponent(this.maxHealth, this.maxStamina, this.maxStagger);
    clone.health = this.health;
    clone.stamina = this.stamina;
    clone.stagger = this.stagger;
    clone.isStaggered = this.isStaggered;
    clone.isBlocking = this.isBlocking;
    clone.isParrying = this.isParrying;
    clone.parryWindow = this.parryWindow;
    clone.comboCount = this.comboCount;
    clone.lastAttackTime = this.lastAttackTime;
    return clone;
  }
}
