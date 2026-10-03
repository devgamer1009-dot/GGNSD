/**
 * Character Controller - Player movement and camera
 */

import * as THREE from 'three';
import type { SimpleTerrain } from './SimpleTerrain.js';

export class CharacterController {
  private mesh: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private position: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  private rotation: number = 0;
  private cameraYaw: number = 0;
  private cameraPitch: number = 0;

  private moveSpeed: number = 10;
  private sprintSpeed: number = 15;
  private jumpForce: number = 8;
  private gravity: number = -20;

  private isGrounded: boolean = true;
  private isSprinting: boolean = false;

  private health: number = 100;
  private maxHealth: number = 100;
  private stamina: number = 100;
  private maxStamina: number = 100;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    // Create player mesh (capsule)
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc8a96e,
      roughness: 0.6,
      metalness: 0.3
    });
    const capsule = new THREE.Mesh(geometry, material);
    capsule.castShadow = true;
    capsule.receiveShadow = true;

    this.mesh = new THREE.Group();
    this.mesh.add(capsule);

    // Add sword
    const swordGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.1);
    const swordMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    const sword = new THREE.Mesh(swordGeometry, swordMaterial);
    sword.position.set(0.6, 0, 0);
    sword.rotation.z = -0.3;
    this.mesh.add(sword);

    // Add shield
    const shieldGeometry = new THREE.CircleGeometry(0.4, 8);
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.set(-0.6, 0, 0.3);
    shield.rotation.y = Math.PI / 2;
    this.mesh.add(shield);

    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  public update(delta: number, keys: Record<string, boolean>, terrain: SimpleTerrain): void {
    // Movement
    const moveDir = new THREE.Vector3();

    if (keys['w']) moveDir.z -= 1;
    if (keys['s']) moveDir.z += 1;
    if (keys['a']) moveDir.x -= 1;
    if (keys['d']) moveDir.x += 1;

    // Sprint
    this.isSprinting = (keys['shift'] ?? false) && this.stamina > 0;
    const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;

    if (this.isSprinting && moveDir.length() > 0) {
      this.stamina = Math.max(0, this.stamina - 20 * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * delta);
    }

    // Apply camera rotation to movement
    if (moveDir.length() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Rotate player to face movement direction
      this.rotation = Math.atan2(moveDir.x, moveDir.z);
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }

    // Jump
    if (keys[' '] && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
    }

    // Apply velocity
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Ground collision
    const groundHeight = terrain.getHeightAt(this.position.x, this.position.z);
    if (this.position.y <= groundHeight + 1) {
      this.position.y = groundHeight + 1;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Update camera (third person)
    this.updateCamera();
  }

  private updateCamera(): void {
    const offset = new THREE.Vector3(0, 3, 8);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraPitch);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

    const targetPos = this.position.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(this.position.x, this.position.y + 1, this.position.z);
  }

  public rotateCamera(deltaX: number, deltaY: number): void {
    this.cameraYaw -= deltaX * 0.002;
    this.cameraPitch -= deltaY * 0.002;
    this.cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraPitch));
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getRotation(): number {
    return this.cameraYaw;
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getStamina(): number {
    return this.stamina;
  }

  public getMaxStamina(): number {
    return this.maxStamina;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }
}
