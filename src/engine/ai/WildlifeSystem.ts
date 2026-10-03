/**
 * Wildlife System
 * P14 - Wildlife herds and predators with player/weather reactions
 */

import * as THREE from 'three';

export enum WildlifeType {
  DEER = 'deer',
  RABBIT = 'rabbit',
  WOLF = 'wolf',
  BEAR = 'bear',
}

export enum WildlifeBehavior {
  GRAZE = 'graze',
  FLEE = 'flee',
  HUNT = 'hunt',
  WANDER = 'wander',
  SLEEP = 'sleep',
}

export interface WildlifeConfig {
  id: string;
  type: WildlifeType;
  position: { x: number; y: number; z: number };
  speed: number;
  isPredator: boolean;
}

export class Wildlife {
  id: string;
  type: WildlifeType;
  position: THREE.Vector3;
  velocity: THREE.Vector3 = new THREE.Vector3();
  speed: number;
  isPredator: boolean;
  behavior: WildlifeBehavior = WildlifeBehavior.WANDER;
  targetPosition: THREE.Vector3 | null = null;
  mesh: THREE.Group | null = null;
  alertness: number = 0; // 0-1, increases when player nearby
  health: number = 100;

  constructor(config: WildlifeConfig) {
    this.id = config.id;
    this.type = config.type;
    this.position = new THREE.Vector3(config.position.x, config.position.y, config.position.z);
    this.speed = config.speed;
    this.isPredator = config.isPredator;
  }

  update(deltaTime: number, playerPosition: THREE.Vector3, weather: string): void {
    // Check player distance
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // Update alertness
    if (distanceToPlayer < 20) {
      this.alertness = Math.min(1, this.alertness + deltaTime * 0.5);
    } else {
      this.alertness = Math.max(0, this.alertness - deltaTime * 0.2);
    }

    // Update behavior based on alertness and type
    this.updateBehavior(distanceToPlayer, playerPosition);

    // Move
    if (this.targetPosition) {
      this.moveToTarget(deltaTime);
    }

    // Weather effects
    if (weather === 'storm' || weather === 'snow') {
      this.speed *= 0.7; // Slow down in bad weather
    }
  }

  private updateBehavior(distanceToPlayer: number, playerPosition: THREE.Vector3): void {
    if (this.isPredator) {
      // Predator behavior
      if (distanceToPlayer < 15 && this.alertness > 0.7) {
        this.behavior = WildlifeBehavior.HUNT;
        this.targetPosition = playerPosition.clone();
      } else {
        this.behavior = WildlifeBehavior.WANDER;
        this.wander();
      }
    } else {
      // Prey behavior
      if (distanceToPlayer < 15 && this.alertness > 0.5) {
        this.behavior = WildlifeBehavior.FLEE;
        // Flee away from player
        const fleeDirection = this.position.clone().sub(playerPosition).normalize();
        this.targetPosition = this.position.clone().add(fleeDirection.multiplyScalar(30));
      } else if (this.alertness < 0.2) {
        this.behavior = WildlifeBehavior.GRAZE;
        this.wander();
      } else {
        this.behavior = WildlifeBehavior.WANDER;
        this.wander();
      }
    }
  }

  private wander(): void {
    if (!this.targetPosition || this.position.distanceTo(this.targetPosition) < 2) {
      // Pick new random target
      this.targetPosition = this.position.clone();
      this.targetPosition.x += (Math.random() - 0.5) * 20;
      this.targetPosition.z += (Math.random() - 0.5) * 20;
    }
  }

  private moveToTarget(deltaTime: number): void {
    if (!this.targetPosition) return;

    const direction = this.targetPosition.clone().sub(this.position);
    const distance = direction.length();

    if (distance < 1) {
      this.targetPosition = null;
      return;
    }

    direction.normalize();
    const movement = direction.multiplyScalar(this.speed * deltaTime);
    this.position.add(movement);

    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }

  createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = `wildlife_${this.id}`;

    let bodyColor: number;
    let bodySize: number;

    switch (this.type) {
      case WildlifeType.DEER:
        bodyColor = 0x8b6f47;
        bodySize = 1.0;
        break;
      case WildlifeType.RABBIT:
        bodyColor = 0xa0a0a0;
        bodySize = 0.3;
        break;
      case WildlifeType.WOLF:
        bodyColor = 0x606060;
        bodySize = 0.8;
        break;
      case WildlifeType.BEAR:
        bodyColor = 0x4a3728;
        bodySize = 1.5;
        break;
      default:
        bodyColor = 0x808080;
        bodySize = 1.0;
    }

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.3 * bodySize, 0.8 * bodySize, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.9,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.5 * bodySize;
    body.castShadow = true;
    group.add(body);

    group.position.copy(this.position);
    this.mesh = group;

    return group;
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
  }
}

export class WildlifeSystem {
  private wildlife: Map<string, Wildlife> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addWildlife(config: WildlifeConfig): Wildlife {
    const animal = new Wildlife(config);
    const mesh = animal.createMesh();
    this.scene.add(mesh);
    this.wildlife.set(config.id, animal);
    return animal;
  }

  removeWildlife(id: string): void {
    const animal = this.wildlife.get(id);
    if (animal) {
      if (animal.mesh) {
        this.scene.remove(animal.mesh);
      }
      animal.dispose();
      this.wildlife.delete(id);
    }
  }

  update(deltaTime: number, playerPosition: THREE.Vector3, weather: string): void {
    for (const animal of this.wildlife.values()) {
      animal.update(deltaTime, playerPosition, weather);
    }
  }

  spawnHerd(type: WildlifeType, centerX: number, centerZ: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 5 + Math.random() * 10;
      
      this.addWildlife({
        id: `${type}_${i}`,
        type,
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: 0,
          z: centerZ + Math.sin(angle) * radius,
        },
        speed: type === WildlifeType.RABBIT ? 3 : 2,
        isPredator: type === WildlifeType.WOLF || type === WildlifeType.BEAR,
      });
    }
  }

  getWildlifeCount(): number {
    return this.wildlife.size;
  }

  dispose(): void {
    for (const animal of this.wildlife.values()) {
      if (animal.mesh) {
        this.scene.remove(animal.mesh);
      }
      animal.dispose();
    }
    this.wildlife.clear();
  }
}
