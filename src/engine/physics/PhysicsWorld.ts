/**
 * Physics World - Rapier integration
 * P9 - Physics simulation with heightfield terrain colliders
 */

import RAPIER from '@dimforge/rapier3d-compat';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export interface PhysicsCharacter {
  rigidBody: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  isGrounded: boolean;
  slopeAngle: number;
}

export class PhysicsWorld {
  private world: RAPIER.World;
  private characters: Map<string, PhysicsCharacter> = new Map();
  private terrainColliders: Map<string, RAPIER.Collider> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Initialize with gravity
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new RAPIER.World(gravity);
  }

  /**
   * Initialize Rapier (async due to WASM loading)
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    await RAPIER.init();
    this.initialized = true;
    console.log('[PhysicsWorld] Initialized with Rapier');
  }

  /**
   * Create a character controller (capsule)
   */
  createCharacter(
    id: string,
    position: { x: number; y: number; z: number },
    height: number = 1.8,
    radius: number = 0.3
  ): PhysicsCharacter {
    // Create rigid body
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.99)
      .lockRotations(); // Prevent character from rotating

    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    // Create capsule collider
    const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2 - radius, radius)
      .setFriction(0.5)
      .setRestitution(0.0)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    const collider = this.world.createCollider(colliderDesc, rigidBody);

    const character: PhysicsCharacter = {
      rigidBody,
      collider,
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      isGrounded: false,
      slopeAngle: 0,
    };

    this.characters.set(id, character);
    return character;
  }

  /**
   * Create terrain collider from heightmap
   */
  createTerrainCollider(id: string, chunkData: TerrainChunkData, worldOffset: { x: number; z: number }): void {
    const { heights, resolution, size } = chunkData;
    const verticesPerSide = resolution + 1;

    // Create heightfield
    const heightsArray = new Float32Array(heights.length);
    for (let i = 0; i < heights.length; i++) {
      heightsArray[i] = heights[i]! * 200; // Scale height (matching visual)
    }

    const colliderDesc = RAPIER.ColliderDesc.heightfield(
      verticesPerSide,
      verticesPerSide,
      heightsArray,
      { x: size, y: 1, z: size } // Scale
    )
      .setTranslation(worldOffset.x, 0, worldOffset.z)
      .setFriction(0.7)
      .setRestitution(0.0);

    const collider = this.world.createCollider(colliderDesc);
    this.terrainColliders.set(id, collider);
  }

  /**
   * Remove terrain collider
   */
  removeTerrainCollider(id: string): void {
    const collider = this.terrainColliders.get(id);
    if (collider) {
      this.world.removeCollider(collider, true);
      this.terrainColliders.delete(id);
    }
  }

  /**
   * Apply movement force to character
   */
  applyMovement(id: string, force: { x: number; y: number; z: number }): void {
    const character = this.characters.get(id);
    if (!character) return;

    character.rigidBody.applyImpulse(
      { x: force.x, y: force.y, z: force.z },
      true
    );
  }

  /**
   * Apply jump impulse
   */
  applyJump(id: string, jumpForce: number = 5.0): void {
    const character = this.characters.get(id);
    if (!character || !character.isGrounded) return;

    character.rigidBody.applyImpulse(
      { x: 0, y: jumpForce, z: 0 },
      true
    );
  }

  /**
   * Step physics simulation
   */
  step(deltaTime: number): void {
    // Fixed timestep for stability
    const fixedDt = 1 / 60;
    this.world.timestep = fixedDt;
    
    // Step multiple times if needed
    const steps = Math.ceil(deltaTime / fixedDt);
    for (let i = 0; i < steps; i++) {
      this.world.step();
    }

    // Update character data
    for (const [id, character] of this.characters.entries()) {
      const position = character.rigidBody.translation();
      const velocity = character.rigidBody.linvel();

      character.position = { x: position.x, y: position.y, z: position.z };
      character.velocity = { x: velocity.x, y: velocity.y, z: velocity.z };

      // Check if grounded (raycast down)
      const ray = new RAPIER.Ray(
        { x: position.x, y: position.y, z: position.z },
        { x: 0, y: -1, z: 0 }
      );
      const hit = this.world.castRay(ray, 1.0, true);
      character.isGrounded = hit !== null;

      // Calculate slope angle if grounded (simplified)
      if (character.isGrounded) {
        const vel = character.velocity;
        const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        character.slopeAngle = horizontalSpeed > 0.1 ? 15 : 0;
      } else {
        character.slopeAngle = 0;
      }
    }
  }

  /**
   * Get character state
   */
  getCharacter(id: string): PhysicsCharacter | undefined {
    return this.characters.get(id);
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Map<string, PhysicsCharacter> {
    return this.characters;
  }

  /**
   * Get debug render data
   */
  getDebugData(): { vertices: Float32Array; colors: Float32Array } {
    return this.world.debugRender();
  }

  /**
   * Remove character
   */
  removeCharacter(id: string): void {
    const character = this.characters.get(id);
    if (character) {
      this.world.removeRigidBody(character.rigidBody);
      this.characters.delete(id);
    }
  }

  /**
   * Dispose world
   */
  dispose(): void {
    this.world.free();
    this.characters.clear();
    this.terrainColliders.clear();
  }
}
