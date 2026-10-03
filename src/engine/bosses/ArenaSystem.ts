/**
 * Arena System - Boss fight arena management
 * P21 - Manages arena boundaries, hazards, and rules
 */

import * as THREE from 'three';
import { ArenaRule } from './BossFramework.js';

export interface ArenaConfig {
  center: THREE.Vector3;
  radius: number;
  height: number;
  rules: ArenaRule[];
}

export class ArenaSystem {
  private config: ArenaConfig;
  private scene: THREE.Scene;
  private boundaryMesh?: THREE.Mesh;
  private hazardMeshes: Map<string, THREE.Mesh> = new Map();
  private obstacleMeshes: Map<string, THREE.Mesh> = new Map();
  private buffZoneMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene, config: ArenaConfig) {
    this.scene = scene;
    this.config = config;
    this.createArenaVisuals();
  }

  /**
   * Create visual representations of arena elements
   */
  private createArenaVisuals(): void {
    // Create boundary indicator
    this.createBoundary();
    
    // Create rules visuals
    for (const rule of this.config.rules) {
      this.createRuleVisual(rule);
    }
  }

  /**
   * Create arena boundary visual
   */
  private createBoundary(): void {
    const geometry = new THREE.RingGeometry(
      this.config.radius - 0.5,
      this.config.radius,
      64
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    this.boundaryMesh = new THREE.Mesh(geometry, material);
    this.boundaryMesh.position.copy(this.config.center);
    this.boundaryMesh.position.y = 0.1;
    this.boundaryMesh.rotation.x = -Math.PI / 2;
    
    this.scene.add(this.boundaryMesh);
  }

  /**
   * Create visual for a specific rule
   */
  private createRuleVisual(rule: ArenaRule): void {
    if (!rule.position || !rule.radius) return;

    switch (rule.type) {
      case 'hazard':
        this.createHazardZone(rule);
        break;
      case 'obstacle':
        this.createObstacle(rule);
        break;
      case 'buff_zone':
        this.createBuffZone(rule);
        break;
    }
  }

  /**
   * Create hazard zone visual
   */
  private createHazardZone(rule: ArenaRule): void {
    if (!rule.position || !rule.radius) return;

    const geometry = new THREE.CircleGeometry(rule.radius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(rule.position);
    mesh.position.y = 0.05;
    mesh.rotation.x = -Math.PI / 2;
    
    const id = `hazard_${this.hazardMeshes.size}`;
    this.hazardMeshes.set(id, mesh);
    this.scene.add(mesh);
  }

  /**
   * Create obstacle visual
   */
  private createObstacle(rule: ArenaRule): void {
    if (!rule.position || !rule.radius) return;

    const geometry = new THREE.CylinderGeometry(rule.radius, rule.radius, 2, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(rule.position);
    mesh.position.y = 1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const id = `obstacle_${this.obstacleMeshes.size}`;
    this.obstacleMeshes.set(id, mesh);
    this.scene.add(mesh);
  }

  /**
   * Create buff zone visual
   */
  private createBuffZone(rule: ArenaRule): void {
    if (!rule.position || !rule.radius) return;

    const geometry = new THREE.CircleGeometry(rule.radius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(rule.position);
    mesh.position.y = 0.05;
    mesh.rotation.x = -Math.PI / 2;
    
    const id = `buff_${this.buffZoneMeshes.size}`;
    this.buffZoneMeshes.set(id, mesh);
    this.scene.add(mesh);
  }

  /**
   * Check if position is within arena boundary
   */
  isWithinBoundary(position: THREE.Vector3): boolean {
    const distance = new THREE.Vector2(
      position.x - this.config.center.x,
      position.z - this.config.center.z
    ).length();
    
    return distance <= this.config.radius;
  }

  /**
   * Constrain position to arena boundary
   */
  constrainToArena(position: THREE.Vector3): THREE.Vector3 {
    if (this.isWithinBoundary(position)) {
      return position.clone();
    }

    const direction = new THREE.Vector3(
      position.x - this.config.center.x,
      0,
      position.z - this.config.center.z
    ).normalize();

    return new THREE.Vector3(
      this.config.center.x + direction.x * this.config.radius,
      position.y,
      this.config.center.z + direction.z * this.config.radius
    );
  }

  /**
   * Check if position is in a hazard zone
   */
  isInHazard(position: THREE.Vector3): { inHazard: boolean; damage: number } {
    for (const rule of this.config.rules) {
      if (rule.type !== 'hazard' || !rule.position || !rule.radius) continue;

      const distance = position.distanceTo(rule.position);
      if (distance <= rule.radius) {
        return {
          inHazard: true,
          damage: rule.damage || 0,
        };
      }
    }

    return { inHazard: false, damage: 0 };
  }

  /**
   * Check if position is in a buff zone
   */
  isInBuffZone(position: THREE.Vector3): { inBuff: boolean; effect: string } {
    for (const rule of this.config.rules) {
      if (rule.type !== 'buff_zone' || !rule.position || !rule.radius) continue;

      const distance = position.distanceTo(rule.position);
      if (distance <= rule.radius) {
        return {
          inBuff: true,
          effect: rule.effect || 'unknown',
        };
      }
    }

    return { inBuff: false, effect: '' };
  }

  /**
   * Check if position collides with obstacle
   */
  collidesWithObstacle(position: THREE.Vector3, radius: number = 0.5): boolean {
    for (const rule of this.config.rules) {
      if (rule.type !== 'obstacle' || !rule.position || !rule.radius) continue;

      const distance = position.distanceTo(rule.position);
      if (distance <= rule.radius + radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update arena rules (for phase transitions)
   */
  updateRules(rules: ArenaRule[]): void {
    // Clear existing rule visuals
    this.clearRuleVisuals();
    
    // Update config
    this.config.rules = rules;
    
    // Create new visuals
    for (const rule of rules) {
      this.createRuleVisual(rule);
    }
  }

  /**
   * Clear all rule visuals
   */
  private clearRuleVisuals(): void {
    for (const mesh of this.hazardMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.hazardMeshes.clear();

    for (const mesh of this.obstacleMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.obstacleMeshes.clear();

    for (const mesh of this.buffZoneMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.buffZoneMeshes.clear();
  }

  /**
   * Get arena center
   */
  getCenter(): THREE.Vector3 {
    return this.config.center.clone();
  }

  /**
   * Get arena radius
   */
  getRadius(): number {
    return this.config.radius;
  }

  /**
   * Get all arena rules
   */
  getRules(): ArenaRule[] {
    return this.config.rules;
  }

  /**
   * Dispose all arena visuals
   */
  dispose(): void {
    if (this.boundaryMesh) {
      this.scene.remove(this.boundaryMesh);
      this.boundaryMesh.geometry.dispose();
      (this.boundaryMesh.material as THREE.Material).dispose();
    }

    this.clearRuleVisuals();
  }
}
