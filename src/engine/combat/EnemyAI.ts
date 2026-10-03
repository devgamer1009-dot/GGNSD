/**
 * Enemy AI System
 * Telegraphed state machine AI for enemies
 */

import * as THREE from 'three';
import { CombatStateComponent } from './CombatState.js';
import { ENEMY_SCHEMAS, EnemyStats } from '../../content/combat/schemas.js';

export type EnemyState = 'idle' | 'chase' | 'telegraph' | 'attack' | 'recovery' | 'staggered' | 'retreat';

export interface EnemyAI {
  id: string;
  stats: EnemyStats;
  state: EnemyState;
  stateTimer: number;
  targetId: string | null;
  targetPosition: THREE.Vector3 | null;
}

export class EnemyAISystem {
  private enemies: Map<string, EnemyAI> = new Map();

  /**
   * Spawn enemy
   */
  spawnEnemy(id: string, type: 'swordsman' | 'archer' | 'brute'): EnemyAI {
    const stats = ENEMY_SCHEMAS[type]!;
    const enemy: EnemyAI = {
      id,
      stats,
      state: 'idle',
      stateTimer: 0,
      targetId: null,
      targetPosition: null,
    };
    this.enemies.set(id, enemy);
    return enemy;
  }

  /**
   * Update enemy AI
   */
  update(
    deltaTime: number,
    enemyId: string,
    enemyPos: THREE.Vector3,
    playerPos: THREE.Vector3,
    playerCombatState: CombatStateComponent
  ): { action: 'attack' | null; attackType?: 'light' | 'heavy' | 'ranged' } {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) return { action: null };

    const result = { action: null as 'attack' | null, attackType: undefined as 'light' | 'heavy' | 'ranged' | undefined };

    // Update state timer
    enemy.stateTimer += deltaTime;

    // Calculate distance to player
    const distance = enemyPos.distanceTo(playerPos);
    const direction = playerPos.clone().sub(enemyPos).normalize();

    // State machine
    switch (enemy.state) {
      case 'idle':
        if (distance <= enemy.stats.behavior.aggroRange) {
          enemy.targetId = 'player';
          enemy.targetPosition = playerPos.clone();
          enemy.state = 'chase';
          enemy.stateTimer = 0;
        }
        break;

      case 'chase':
        if (distance > enemy.stats.behavior.aggroRange * 1.5) {
          enemy.state = 'idle';
          enemy.stateTimer = 0;
        } else if (distance <= enemy.stats.behavior.attackRange) {
          enemy.state = 'telegraph';
          enemy.stateTimer = 0;
        } else if (enemy.stats.health < enemy.stats.behavior.retreatHealth) {
          enemy.state = 'retreat';
          enemy.stateTimer = 0;
        }
        break;

      case 'telegraph':
        if (enemy.stateTimer >= enemy.stats.behavior.telegraphTime) {
          enemy.state = 'attack';
          enemy.stateTimer = 0;
          result.action = 'attack';
          result.attackType = enemy.stats.type === 'archer' ? 'ranged' : 'light';
        }
        break;

      case 'attack':
        // Attack happens instantly after telegraph
        enemy.state = 'recovery';
        enemy.stateTimer = 0;
        break;

      case 'recovery':
        const recoveryTime = 1.0 / enemy.stats.attackSpeed;
        if (enemy.stateTimer >= recoveryTime) {
          enemy.state = 'chase';
          enemy.stateTimer = 0;
        }
        break;

      case 'staggered':
        if (enemy.stateTimer >= 2.0) {
          enemy.state = 'chase';
          enemy.stateTimer = 0;
        }
        break;

      case 'retreat':
        if (distance > enemy.stats.behavior.aggroRange) {
          enemy.state = 'idle';
          enemy.stateTimer = 0;
        } else if (enemy.stats.health > enemy.stats.behavior.retreatHealth * 1.5) {
          enemy.state = 'chase';
          enemy.stateTimer = 0;
        }
        break;
    }

    return result;
  }

  /**
   * Apply stagger to enemy
   */
  staggerEnemy(enemyId: string): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.state = 'staggered';
      enemy.stateTimer = 0;
    }
  }

  /**
   * Apply damage to enemy
   */
  damageEnemy(enemyId: string, damage: number): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.stats.health -= damage;
      if (enemy.stats.health <= 0) {
        this.removeEnemy(enemyId);
      }
    }
  }

  /**
   * Remove enemy
   */
  removeEnemy(enemyId: string): void {
    this.enemies.delete(enemyId);
  }

  /**
   * Get enemy
   */
  getEnemy(enemyId: string): EnemyAI | undefined {
    return this.enemies.get(enemyId);
  }

  /**
   * Get all enemies
   */
  getAllEnemies(): EnemyAI[] {
    return Array.from(this.enemies.values());
  }

  /**
   * Get enemy count
   */
  getEnemyCount(): number {
    return this.enemies.size;
  }

  /**
   * Clear all enemies
   */
  clear(): void {
    this.enemies.clear();
  }
}
