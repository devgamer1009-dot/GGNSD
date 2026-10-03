/**
 * Telegraph System - Attack warning and visual feedback
 * P21 - Manages telegraphs for boss attacks
 */

import * as THREE from 'three';
import { Telegraph, BossAttack } from './BossFramework.js';

export interface ActiveTelegraph {
  id: string;
  attack: BossAttack;
  telegraph: Telegraph;
  startTime: number;
  duration: number;
  position: THREE.Vector3;
  radius: number;
  isActive: boolean;
  mesh?: THREE.Mesh;
}

export class TelegraphSystem {
  private activeTelegraphs: Map<string, ActiveTelegraph> = new Map();
  private scene: THREE.Scene;
  private telegraphIdCounter: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create a new telegraph for an attack
   */
  createTelegraph(
    attack: BossAttack,
    position: THREE.Vector3,
    radius: number
  ): string {
    const id = `telegraph_${this.telegraphIdCounter++}`;
    
    const telegraph: ActiveTelegraph = {
      id,
      attack,
      telegraph: attack.telegraph,
      startTime: performance.now() / 1000,
      duration: attack.telegraph.duration,
      position: position.clone(),
      radius,
      isActive: true,
    };

    // Create visual representation
    telegraph.mesh = this.createTelegraphMesh(telegraph);
    this.scene.add(telegraph.mesh);

    this.activeTelegraphs.set(id, telegraph);
    
    console.log(`[Telegraph] Created telegraph for ${attack.name} at ${position.toArray().join(', ')}`);
    
    return id;
  }

  /**
   * Create visual mesh for telegraph
   */
  private createTelegraphMesh(telegraph: ActiveTelegraph): THREE.Mesh {
    const geometry = new THREE.RingGeometry(
      telegraph.radius * 0.8,
      telegraph.radius,
      32
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(telegraph.telegraph.color || '#ff0000'),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(telegraph.position);
    mesh.position.y += 0.1; // Slightly above ground
    mesh.rotation.x = -Math.PI / 2; // Flat on ground
    
    return mesh;
  }

  /**
   * Update all active telegraphs
   */
  update(currentTime: number): TelegraphEvent[] {
    const events: TelegraphEvent[] = [];
    const toRemove: string[] = [];

    for (const [id, telegraph] of this.activeTelegraphs.entries()) {
      const elapsed = currentTime - telegraph.startTime;
      const progress = elapsed / telegraph.duration;

      // Update visual (pulsing effect)
      if (telegraph.mesh) {
        const material = telegraph.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 + Math.sin(progress * Math.PI * 4) * 0.2;
        
        // Scale effect
        const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
        telegraph.mesh.scale.set(scale, scale, 1);
      }

      // Check if telegraph is complete
      if (elapsed >= telegraph.duration) {
        events.push({
          type: 'telegraph_complete',
          telegraphId: id,
          attack: telegraph.attack,
          position: telegraph.position,
          radius: telegraph.radius,
        });
        
        toRemove.push(id);
      }
      // Check if hitbox should activate
      else if (elapsed >= telegraph.duration - telegraph.telegraph.hitboxDelay) {
        if (telegraph.isActive) {
          events.push({
            type: 'hitbox_active',
            telegraphId: id,
            attack: telegraph.attack,
            position: telegraph.position,
            radius: telegraph.radius,
          });
          telegraph.isActive = false;
        }
      }
    }

    // Remove completed telegraphs
    for (const id of toRemove) {
      this.removeTelegraph(id);
    }

    return events;
  }

  /**
   * Remove a telegraph
   */
  private removeTelegraph(id: string): void {
    const telegraph = this.activeTelegraphs.get(id);
    if (telegraph) {
      if (telegraph.mesh) {
        this.scene.remove(telegraph.mesh);
        telegraph.mesh.geometry.dispose();
        (telegraph.mesh.material as THREE.Material).dispose();
      }
      this.activeTelegraphs.delete(id);
    }
  }

  /**
   * Check if player is in telegraph area
   */
  isPlayerInTelegraph(playerPosition: THREE.Vector3, telegraphId: string): boolean {
    const telegraph = this.activeTelegraphs.get(telegraphId);
    if (!telegraph) return false;

    const distance = playerPosition.distanceTo(telegraph.position);
    return distance <= telegraph.radius;
  }

  /**
   * Get all active telegraphs
   */
  getActiveTelegraphs(): ActiveTelegraph[] {
    return Array.from(this.activeTelegraphs.values());
  }

  /**
   * Clear all telegraphs
   */
  clear(): void {
    for (const id of this.activeTelegraphs.keys()) {
      this.removeTelegraph(id);
    }
  }

  /**
   * Get telegraph count
   */
  getTelegraphCount(): number {
    return this.activeTelegraphs.size;
  }
}

export interface TelegraphEvent {
  type: 'telegraph_complete' | 'hitbox_active';
  telegraphId: string;
  attack: BossAttack;
  position: THREE.Vector3;
  radius: number;
}
