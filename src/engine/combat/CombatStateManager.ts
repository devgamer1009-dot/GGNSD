/**
 * Combat State Manager
 * Manages combat states for all entities
 */

import { CombatStateComponent } from './CombatState.js';

export class CombatStateManager {
  private combatStates: Map<string, CombatStateComponent> = new Map();

  /**
   * Register a combatant
   */
  registerCombatant(id: string, maxHealth: number, maxStamina: number, maxStagger: number): void {
    const state = new CombatStateComponent(maxHealth, maxStamina, maxStagger);
    this.combatStates.set(id, state);
  }

  /**
   * Unregister a combatant
   */
  unregisterCombatant(id: string): void {
    this.combatStates.delete(id);
  }

  /**
   * Get combat state for entity
   */
  getCombatState(id: string): CombatStateComponent | undefined {
    return this.combatStates.get(id);
  }

  /**
   * Check if entity is registered
   */
  hasCombatant(id: string): boolean {
    return this.combatStates.has(id);
  }

  /**
   * Update all combat states
   */
  update(deltaTime: number): void {
    for (const state of this.combatStates.values()) {
      state.regenerateStamina(deltaTime);
      state.decayStagger(deltaTime);
    }
  }

  /**
   * Get all combat states
   */
  getAllStates(): Map<string, CombatStateComponent> {
    return this.combatStates;
  }

  /**
   * Get combatant count
   */
  getCombatantCount(): number {
    return this.combatStates.size;
  }

  /**
   * Clear all combat states
   */
  clear(): void {
    this.combatStates.clear();
  }
}
