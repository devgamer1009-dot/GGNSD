/**
 * Combat System - Enemy AI and combat mechanics
 */

import * as THREE from 'three';
import type { CharacterController } from './CharacterController.js';

interface Enemy {
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttack: number;
  state: 'idle' | 'chase' | 'attack' | 'dead';
}

export class CombatSystem {
  private scene: THREE.Scene;
  private player: CharacterController;
  private enemies: Enemy[] = [];
  private playerAttackCooldown: number = 0;
  private playerAttackRange: number = 3;
  private playerDamage: number = 25;

  constructor(scene: THREE.Scene, player: CharacterController) {
    this.scene = scene;
    this.player = player;
  }

  public spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      this.spawnEnemy(x, 1, z);
    }
  }

  private spawnEnemy(x: number, y: number, z: number): void {
    // Create enemy mesh (red capsule)
    const geometry = new THREE.CapsuleGeometry(0.6, 1.8, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.7,
      metalness: 0.2
    });
    const capsule = new THREE.Mesh(geometry, material);
    capsule.castShadow = true;
    capsule.receiveShadow = true;

    const mesh = new THREE.Group();
    mesh.add(capsule);

    // Add weapon
    const weaponGeometry = new THREE.BoxGeometry(0.15, 2, 0.15);
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.1
    });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.7, 0, 0);
    weapon.rotation.z = -0.5;
    mesh.add(weapon);

    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const enemy: Enemy = {
      mesh,
      health: 100,
      maxHealth: 100,
      damage: 15,
      speed: 5,
      attackRange: 2.5,
      attackCooldown: 2,
      lastAttack: 0,
      state: 'idle'
    };

    this.enemies.push(enemy);
  }

  public update(delta: number): void {
    const playerPos = this.player.getPosition();

    // Update player attack cooldown
    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown -= delta;
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;

      const enemyPos = enemy.mesh.position;
      const distance = enemyPos.distanceTo(playerPos);

      // AI behavior
      if (distance < enemy.attackRange) {
        enemy.state = 'attack';

        // Attack player
        enemy.lastAttack += delta;
        if (enemy.lastAttack >= enemy.attackCooldown) {
          this.player.takeDamage(enemy.damage);
          enemy.lastAttack = 0;
        }
      } else if (distance < 30) {
        enemy.state = 'chase';

        // Move towards player
        const direction = new THREE.Vector3()
          .subVectors(playerPos, enemyPos)
          .normalize();

        enemy.mesh.position.add(direction.multiplyScalar(enemy.speed * delta));
        enemy.mesh.lookAt(playerPos);
      } else {
        enemy.state = 'idle';
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.state !== 'dead' || e.mesh.parent !== null);
  }

  public playerAttack(): void {
    if (this.playerAttackCooldown > 0) return;

    this.playerAttackCooldown = 0.5;

    const playerPos = this.player.getPosition();

    // Check for enemies in range
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;

      const distance = enemy.mesh.position.distanceTo(playerPos);
      if (distance <= this.playerAttackRange) {
        enemy.health -= this.playerDamage;

        // Visual feedback
        enemy.mesh.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
          if (enemy.mesh) {
            enemy.mesh.scale.set(1, 1, 1);
          }
        }, 100);

        // Check if enemy died
        if (enemy.health <= 0) {
          enemy.state = 'dead';
          this.scene.remove(enemy.mesh);
        }

        break; // Only hit one enemy per attack
      }
    }
  }

  public getEnemyCount(): number {
    return this.enemies.filter(e => e.state !== 'dead').length;
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }
}
