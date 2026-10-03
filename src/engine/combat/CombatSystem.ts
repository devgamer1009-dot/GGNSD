/**
 * Combat System - Main orchestrator
 * Coordinates all combat subsystems
 */

import * as THREE from 'three';
import { CombatStateManager } from './CombatStateManager.js';
import { DamageSystem } from './DamageSystem.js';
import { HitDetection } from './HitDetection.js';
import { InputBuffer } from './InputBuffer.js';
import { SwordSystem } from './SwordSystem.js';
import { BowSystem } from './BowSystem.js';
import { SpellSystem } from './SpellSystem.js';
import { EnemyAISystem } from './EnemyAI.js';
import { VisualFeedback } from './VisualFeedback.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';

export interface CombatConfig {
  enableHitStop: boolean;
  enableCameraShake: boolean;
  enableParticles: boolean;
}

const DEFAULT_CONFIG: CombatConfig = {
  enableHitStop: true,
  enableCameraShake: true,
  enableParticles: true,
};

export class CombatSystem {
  private config: CombatConfig;
  private scene: THREE.Scene;
  private physicsWorld: PhysicsWorld;

  private damageSystem: DamageSystem;
  private hitDetection: HitDetection;
  private inputBuffer: InputBuffer;
  private enemyAI: EnemyAISystem;
  private visualFeedback: VisualFeedback;

  private swordSystem: SwordSystem;
  private bowSystem: BowSystem;
  private spellSystem: SpellSystem;

  private combatStateManager: CombatStateManager;
  private currentTime: number = 0;

  constructor(
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    config: Partial<CombatConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    // Initialize subsystems
    this.damageSystem = new DamageSystem();
    this.hitDetection = new HitDetection(physicsWorld);
    this.inputBuffer = new InputBuffer();
    this.enemyAI = new EnemyAISystem();
    this.visualFeedback = new VisualFeedback(scene);
    this.combatStateManager = new CombatStateManager();

    this.swordSystem = new SwordSystem(this.damageSystem, this.hitDetection, this.inputBuffer);
    this.bowSystem = new BowSystem(this.damageSystem, this.hitDetection);
    this.spellSystem = new SpellSystem(this.damageSystem, this.hitDetection);
  }

  /**
   * Update combat system
   */
  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    // Update visual feedback
    const feedback = this.visualFeedback.update(deltaTime);

    // Update all combat states
    this.combatStateManager.update(deltaTime);

    // Update enemy AI
    for (const enemy of this.enemyAI.getAllEnemies()) {
      const enemyPos = this.physicsWorld.getCharacter(enemy.id)?.position;
      const playerPos = this.physicsWorld.getCharacter('player')?.position;
      const playerState = this.combatStateManager.getCombatState('player');

      if (enemyPos && playerPos && playerState) {
        const enemyPosVec = new THREE.Vector3(enemyPos.x, enemyPos.y, enemyPos.z);
        const playerPosVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);

        const action = this.enemyAI.update(
          deltaTime,
          enemy.id,
          enemyPosVec,
          playerPosVec,
          playerState
        );

        if (action.action === 'attack') {
          // Enemy attacks player
          this.enemyAttackPlayer(enemy.id, action.attackType!);
        }
      }
    }

    // Update weapons
    const playerPos = this.physicsWorld.getCharacter('player')?.position;
    const playerState = this.combatStateManager.getCombatState('player');

    if (playerPos && playerState) {
      const posVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
      const dirVec = new THREE.Vector3(0, 0, -1); // Forward direction

      // Update sword
      const swordResult = this.swordSystem.update(
        deltaTime,
        'player',
        posVec,
        dirVec,
        playerState
      );

      // Apply sword hits
      for (const hitId of swordResult.hits) {
        this.applyHit('player', hitId, swordResult.damage, 'physical');
      }

      // Update bow
      const bowResult = this.bowSystem.update(deltaTime, playerState);

      // Apply bow hits
      for (const hitId of bowResult.hits) {
        this.applyHit('player', hitId, bowResult.damage, 'physical');
      }

      // Update spells
      const spellResult = this.spellSystem.update(deltaTime, this.currentTime);

      // Apply spell hits
      for (const [targetId, hitData] of spellResult.hits.entries()) {
        this.applyHit('player', targetId, hitData.damage, hitData.type);
      }
    }
  }

  /**
   * Apply hit to target
   */
  private applyHit(
    attackerId: string,
    targetId: string,
    baseDamage: number,
    damageType: 'physical' | 'fire' | 'frost' | 'magic'
  ): void {
    const attacker = this.combatStateManager.getCombatState(attackerId);
    const target = this.combatStateManager.getCombatState(targetId);

    if (!attacker || !target) return;

    // Calculate damage
    const { damage, modifiers } = this.damageSystem.calculateDamage(
      baseDamage,
      attacker,
      target
    );

    // Create damage event
    const event = this.damageSystem.createDamageEvent(
      attackerId,
      targetId,
      damage,
      damageType,
      modifiers
    );

    // Apply damage
    this.damageSystem.applyDamage(event, target);

    // Apply stagger
    if (!modifiers.isBlocked && !modifiers.isParried) {
      target.applyStagger(damage * 0.5);
    }

    // Visual feedback
    if (this.config.enableHitStop && damage > 20) {
      this.visualFeedback.triggerHitStop(0.1, 0.2);
    }

    if (this.config.enableCameraShake) {
      this.visualFeedback.triggerCameraShake(0.1, 0.2);
    }

    if (this.config.enableParticles) {
      const targetPos = this.physicsWorld.getCharacter(targetId)?.position;
      if (targetPos) {
        this.visualFeedback.spawnHitParticles(
          new THREE.Vector3(targetPos.x, targetPos.y + 1, targetPos.z),
          10
        );
      }
    }
  }

  /**
   * Enemy attacks player
   */
  private enemyAttackPlayer(enemyId: string, attackType: 'light' | 'heavy' | 'ranged'): void {
    const enemy = this.enemyAI.getEnemy(enemyId);
    if (!enemy) return;

    const damage = enemy.stats.damage * (attackType === 'heavy' ? 1.5 : 1.0);
    this.applyHit(enemyId, 'player', damage, 'physical');
  }

  /**
   * Register combatant
   */
  registerCombatant(id: string, maxHealth: number, maxStamina: number, maxStagger: number): void {
    this.combatStateManager.registerCombatant(id, maxHealth, maxStamina, maxStagger);
  }

  /**
   * Get combat state
   */
  getCombatState(id: string) {
    return this.combatStateManager.getCombatState(id);
  }

  /**
   * Player actions
   */
  playerLightAttack(): boolean {
    const state = this.combatStateManager.getCombatState('player');
    if (!state) return false;
    return this.swordSystem.lightAttack(state, this.currentTime);
  }

  playerHeavyAttack(): boolean {
    const state = this.combatStateManager.getCombatState('player');
    if (!state) return false;
    return this.swordSystem.heavyAttack(state);
  }

  playerBlock(start: boolean): void {
    const state = this.combatStateManager.getCombatState('player');
    if (!state) return;
    if (start) {
      this.swordSystem.startBlock(state);
    } else {
      this.swordSystem.stopBlock(state);
    }
  }

  playerParry(): boolean {
    const state = this.combatStateManager.getCombatState('player');
    if (!state) return false;
    return this.swordSystem.startParry(state);
  }

  playerShootArrow(origin: THREE.Vector3, direction: THREE.Vector3): boolean {
    const state = this.combatStateManager.getCombatState('player');
    if (!state) return false;
    return this.bowSystem.shoot(state, origin, direction);
  }

  playerCastFire(position: THREE.Vector3): boolean {
    return this.spellSystem.castFire('player', position, this.currentTime);
  }

  playerCastFrost(position: THREE.Vector3): boolean {
    return this.spellSystem.castFrost('player', position, this.currentTime);
  }

  playerCastWard(position: THREE.Vector3): boolean {
    return this.spellSystem.castWard('player', position, this.currentTime);
  }

  /**
   * Spawn enemy
   */
  spawnEnemy(id: string, type: 'swordsman' | 'archer' | 'brute'): void {
    const enemy = this.enemyAI.spawnEnemy(id, type);
    this.registerCombatant(id, enemy.stats.health, enemy.stats.stamina, enemy.stats.staggerThreshold);
  }

  /**
   * Get subsystems
   */
  getSwordSystem(): SwordSystem {
    return this.swordSystem;
  }

  getBowSystem(): BowSystem {
    return this.bowSystem;
  }

  getSpellSystem(): SpellSystem {
    return this.spellSystem;
  }

  getVisualFeedback(): VisualFeedback {
    return this.visualFeedback;
  }

  /**
   * Get time scale (for hit-stop)
   */
  getTimeScale(): number {
    return this.visualFeedback.getTimeScale();
  }

  /**
   * Get camera offset (for camera shake)
   */
  getCameraOffset(): THREE.Vector3 {
    return this.visualFeedback['cameraOffset'].clone();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.visualFeedback.dispose();
    this.combatStateManager.clear();
    this.enemyAI.clear();
  }
}
