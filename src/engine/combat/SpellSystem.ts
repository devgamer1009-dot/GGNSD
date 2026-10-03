/**
 * Spell System
 * Handles spell casting for fire, frost, and ward spells
 */

import * as THREE from 'three';
import { CombatStateComponent } from './CombatState.js';
import { DamageSystem } from './DamageSystem.js';
import { HitDetection } from './HitDetection.js';
import { SPELL_SCHEMAS, SpellStats } from '../../content/combat/schemas.js';

export interface ActiveSpell {
  id: string;
  spellId: string;
  casterId: string;
  position: THREE.Vector3;
  radius: number;
  damage: number;
  duration: number;
  elapsed: number;
  effect: string;
  affectedTargets: Set<string>;
}

export class SpellSystem {
  private damageSystem: DamageSystem;
  private hitDetection: HitDetection;

  private activeSpells: ActiveSpell[] = [];
  private cooldowns: Map<string, number> = new Map();

  constructor(damageSystem: DamageSystem, hitDetection: HitDetection) {
    this.damageSystem = damageSystem;
    this.hitDetection = hitDetection;
  }

  /**
   * Update spell system
   */
  update(
    deltaTime: number,
    currentTime: number
  ): { hits: Map<string, { damage: number; type: 'fire' | 'frost' | 'magic' }> } {
    const result = { hits: new Map<string, { damage: number; type: 'fire' | 'frost' | 'magic' }>() };

    // Update cooldowns
    for (const [spellId, time] of this.cooldowns.entries()) {
      const remaining = time - currentTime;
      if (remaining <= 0) {
        this.cooldowns.delete(spellId);
      }
    }

    // Update active spells
    const toRemove: number[] = [];
    for (let i = 0; i < this.activeSpells.length; i++) {
      const spell = this.activeSpells[i]!;
      spell.elapsed += deltaTime;

      if (spell.elapsed >= spell.duration) {
        toRemove.push(i);
        continue;
      }

      // Check for hits (area of effect)
      if (spell.effect !== 'shield') {
        const hits = this.checkSpellHits(spell);
        for (const [targetId, damage] of hits.entries()) {
          if (!spell.affectedTargets.has(targetId)) {
            spell.affectedTargets.add(targetId);
            const existing = result.hits.get(targetId);
            if (existing) {
              existing.damage += damage;
            } else {
              result.hits.set(targetId, { damage, type: spell.spellId as 'fire' | 'frost' | 'magic' });
            }
          }
        }
      }
    }

    // Remove expired spells
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.activeSpells.splice(toRemove[i]!, 1);
    }

    return result;
  }

  /**
   * Check for spell hits in area
   */
  private checkSpellHits(spell: ActiveSpell): Map<string, number> {
    const hits = new Map<string, number>();

    // Simple distance-based check
    const characters = this.hitDetection['physicsWorld'].getAllCharacters();
    for (const [id, character] of characters.entries()) {
      if (id === spell.casterId) continue;
      if (spell.affectedTargets.has(id)) continue;

      const charPos = new THREE.Vector3(
        character.position.x,
        character.position.y,
        character.position.z
      );

      const distance = charPos.distanceTo(spell.position);
      if (distance <= spell.radius) {
        hits.set(id, spell.damage);
      }
    }

    return hits;
  }

  /**
   * Cast fire spell
   */
  castFire(
    casterId: string,
    position: THREE.Vector3,
    currentTime: number
  ): boolean {
    const spell = SPELL_SCHEMAS.fire!;
    
    if (!this.canCast(spell.id, currentTime)) {
      return false;
    }

    this.cooldowns.set(spell.id, currentTime + spell.cooldown);

    const activeSpell: ActiveSpell = {
      id: `spell_${Date.now()}_${Math.random()}`,
      spellId: spell.id,
      casterId,
      position: position.clone(),
      radius: spell.radius!,
      damage: spell.damage!,
      duration: 0.5, // Fireball is instant
      elapsed: 0,
      effect: spell.effect,
      affectedTargets: new Set(),
    };

    this.activeSpells.push(activeSpell);
    return true;
  }

  /**
   * Cast frost spell
   */
  castFrost(
    casterId: string,
    position: THREE.Vector3,
    currentTime: number
  ): boolean {
    const spell = SPELL_SCHEMAS.frost!;
    
    if (!this.canCast(spell.id, currentTime)) {
      return false;
    }

    this.cooldowns.set(spell.id, currentTime + spell.cooldown);

    const activeSpell: ActiveSpell = {
      id: `spell_${Date.now()}_${Math.random()}`,
      spellId: spell.id,
      casterId,
      position: position.clone(),
      radius: spell.radius!,
      damage: spell.damage!,
      duration: spell.duration!,
      elapsed: 0,
      effect: spell.effect,
      affectedTargets: new Set(),
    };

    this.activeSpells.push(activeSpell);
    return true;
  }

  /**
   * Cast ward spell (shield)
   */
  castWard(
    casterId: string,
    position: THREE.Vector3,
    currentTime: number
  ): boolean {
    const spell = SPELL_SCHEMAS.ward!;
    
    if (!this.canCast(spell.id, currentTime)) {
      return false;
    }

    this.cooldowns.set(spell.id, currentTime + spell.cooldown);

    const activeSpell: ActiveSpell = {
      id: `spell_${Date.now()}_${Math.random()}`,
      spellId: spell.id,
      casterId,
      position: position.clone(),
      radius: 2.0,
      damage: 0,
      duration: spell.duration!,
      elapsed: 0,
      effect: spell.effect,
      affectedTargets: new Set(),
    };

    this.activeSpells.push(activeSpell);
    return true;
  }

  /**
   * Check if spell can be cast
   */
  canCast(spellId: string, currentTime: number): boolean {
    const cooldown = this.cooldowns.get(spellId);
    if (cooldown && currentTime < cooldown) {
      return false;
    }
    return true;
  }

  /**
   * Get cooldown remaining
   */
  getCooldown(spellId: string, currentTime: number): number {
    const cooldown = this.cooldowns.get(spellId);
    if (!cooldown) return 0;
    return Math.max(0, cooldown - currentTime);
  }

  /**
   * Get active spell count
   */
  getActiveSpellCount(): number {
    return this.activeSpells.length;
  }

  /**
   * Clear all spells
   */
  clearSpells(): void {
    this.activeSpells = [];
    this.cooldowns.clear();
  }
}
