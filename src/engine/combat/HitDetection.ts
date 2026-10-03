/**
 * Hit Detection System
 * Uses sweep tests for accurate hit detection
 */

import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';

export interface HitResult {
  target: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  bone?: string;
}

export class HitDetection {
  private physicsWorld: PhysicsWorld;

  constructor(physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  /**
   * Sphere sweep test for melee attacks
   */
  sphereSweep(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    radius: number,
    distance: number,
    excludeIds: string[] = []
  ): HitResult[] {
    const hits: HitResult[] = [];

    // Perform raycast
    const ray = new THREE.Raycaster(
      origin,
      direction.normalize(),
      0,
      distance
    );

    // Get all characters in range
    const characters = this.physicsWorld.getAllCharacters();
    
    for (const [id, character] of characters.entries()) {
      if (excludeIds.includes(id)) continue;

      const charPos = new THREE.Vector3(
        character.position.x,
        character.position.y,
        character.position.z
      );

      // Check if character is within sweep volume
      const toCharacter = charPos.clone().sub(origin);
      const projection = toCharacter.dot(direction);
      
      if (projection < 0 || projection > distance) continue;

      const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projection));
      const distanceToCenter = closestPoint.distanceTo(charPos);

      if (distanceToCenter < radius + 0.5) { // 0.5 is character radius
        hits.push({
          target: id,
          position: charPos,
          normal: direction.clone().negate(),
          distance: projection,
        });
      }
    }

    // Sort by distance
    hits.sort((a, b) => a.distance - b.distance);
    return hits;
  }

  /**
   * Raycast for ranged attacks (bow, spells)
   */
  raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    excludeIds: string[] = []
  ): HitResult | null {
    const ray = new THREE.Raycaster(
      origin,
      direction.normalize(),
      0,
      maxDistance
    );

    const characters = this.physicsWorld.getAllCharacters();
    let closestHit: HitResult | null = null;
    let closestDistance = maxDistance;

    for (const [id, character] of characters.entries()) {
      if (excludeIds.includes(id)) continue;

      const charPos = new THREE.Vector3(
        character.position.x,
        character.position.y + 1, // Aim at center mass
        character.position.z
      );

      // Simple sphere intersection
      const toCharacter = charPos.clone().sub(origin);
      const projection = toCharacter.dot(direction.normalize());
      
      if (projection < 0 || projection > maxDistance) continue;

      const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projection));
      const distanceToCenter = closestPoint.distanceTo(charPos);

      if (distanceToCenter < 0.5 && projection < closestDistance) {
        closestDistance = projection;
        closestHit = {
          target: id,
          position: charPos,
          normal: direction.clone().negate(),
          distance: projection,
        };
      }
    }

    return closestHit;
  }

  /**
   * Box sweep for wide attacks
   */
  boxSweep(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    width: number,
    height: number,
    distance: number,
    excludeIds: string[] = []
  ): HitResult[] {
    // Simplified: use multiple raycasts across the width
    const hits: HitResult[] = [];
    const rayCount = 5;
    const raySpacing = width / rayCount;

    for (let i = 0; i < rayCount; i++) {
      const offset = (i - rayCount / 2) * raySpacing;
      const rayOrigin = origin.clone();
      rayOrigin.x += direction.z * offset;
      rayOrigin.z -= direction.x * offset;

      const hit = this.raycast(rayOrigin, direction, distance, excludeIds);
      if (hit && !hits.find(h => h.target === hit!.target)) {
        hits.push(hit);
      }
    }

    return hits;
  }

  /**
   * Check if target is in range and facing
   */
  isInAttackRange(
    attackerPos: THREE.Vector3,
    attackerDir: THREE.Vector3,
    targetPos: THREE.Vector3,
    range: number,
    angle: number = Math.PI / 3 // 60 degree cone
  ): boolean {
    const toTarget = targetPos.clone().sub(attackerPos);
    const distance = toTarget.length();

    if (distance > range) return false;

    const dot = toTarget.normalize().dot(attackerDir.normalize());
    const targetAngle = Math.acos(dot);

    return targetAngle <= angle;
  }
}
