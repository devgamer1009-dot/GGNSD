/**
 * Crowd System - Instanced crowd for distant NPCs
 * P11 - Efficient rendering of many distant characters
 */

import * as THREE from 'three';

export interface CrowdMember {
  id: number;
  position: THREE.Vector3;
  rotation: number;
  animationPhase: number;
  animationSpeed: number;
  type: 'villager' | 'soldier' | 'merchant';
}

export interface CrowdConfig {
  maxMembers: number;
  spawnRadius: number;
  minDistance: number;
  animationSpeedRange: [number, number];
}

const DEFAULT_CROWD_CONFIG: CrowdConfig = {
  maxMembers: 100,
  spawnRadius: 50.0,
  minDistance: 2.0,
  animationSpeedRange: [0.8, 1.2],
};

/**
 * Crowd system for instanced NPC rendering
 */
export class CrowdSystem {
  private config: CrowdConfig;
  private members: CrowdMember[] = [];
  private instancedMesh: THREE.InstancedMesh | null = null;
  private dummy: THREE.Object3D = new THREE.Object3D();
  
  private centerPosition: THREE.Vector3 = new THREE.Vector3();
  private needsUpdate: boolean = true;

  constructor(config: Partial<CrowdConfig> = {}) {
    this.config = { ...DEFAULT_CROWD_CONFIG, ...config };
  }

  /**
   * Initialize crowd system with instanced mesh
   */
  initialize(geometry: THREE.BufferGeometry, material: THREE.Material): void {
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.config.maxMembers
    );
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = 0; // Start with 0 instances
  }

  /**
   * Spawn crowd members around a position
   */
  spawnCrowd(center: THREE.Vector3, count: number): void {
    this.centerPosition.copy(center);
    
    // Clear existing members
    this.members = [];
    
    // Spawn new members
    for (let i = 0; i < Math.min(count, this.config.maxMembers); i++) {
      const member = this.spawnMember(i);
      if (member) {
        this.members.push(member);
      }
    }
    
    this.needsUpdate = true;
  }

  /**
   * Spawn a single crowd member
   */
  private spawnMember(id: number): CrowdMember | null {
    // Random position in radius
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.config.spawnRadius;
    
    const position = new THREE.Vector3(
      this.centerPosition.x + Math.cos(angle) * radius,
      this.centerPosition.y,
      this.centerPosition.z + Math.sin(angle) * radius
    );
    
    // Check minimum distance from other members
    for (const member of this.members) {
      if (position.distanceTo(member.position) < this.config.minDistance) {
        return null; // Too close to another member
      }
    }
    
    // Random rotation
    const rotation = Math.random() * Math.PI * 2;
    
    // Random animation phase and speed
    const animationPhase = Math.random() * Math.PI * 2;
    const [minSpeed, maxSpeed] = this.config.animationSpeedRange;
    const animationSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    
    // Random type
    const types: Array<'villager' | 'soldier' | 'merchant'> = ['villager', 'soldier', 'merchant'];
    const type = types[Math.floor(Math.random() * types.length)]!;
    
    return {
      id,
      position,
      rotation,
      animationPhase,
      animationSpeed,
      type,
    };
  }

  /**
   * Update crowd animation
   */
  update(deltaTime: number): void {
    if (!this.instancedMesh || this.members.length === 0) return;

    // Update animation phases
    for (const member of this.members) {
      member.animationPhase += deltaTime * member.animationSpeed;
    }

    // Update instanced mesh transforms
    this.instancedMesh.count = this.members.length;
    
    for (let i = 0; i < this.members.length; i++) {
      const member = this.members[i]!;
      
      // Simple idle animation (bobbing)
      const bobOffset = Math.sin(member.animationPhase) * 0.05;
      
      this.dummy.position.copy(member.position);
      this.dummy.position.y += bobOffset;
      this.dummy.rotation.y = member.rotation;
      this.dummy.updateMatrix();
      
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.needsUpdate = false;
  }

  /**
   * Get instanced mesh
   */
  getInstancedMesh(): THREE.InstancedMesh | null {
    return this.instancedMesh;
  }

  /**
   * Get crowd members
   */
  getMembers(): CrowdMember[] {
    return this.members;
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.members.length;
  }

  /**
   * Add a single member
   */
  addMember(position: THREE.Vector3, rotation: number, type: 'villager' | 'soldier' | 'merchant' = 'villager'): void {
    if (this.members.length >= this.config.maxMembers) return;
    
    const id = this.members.length;
    const [minSpeed, maxSpeed] = this.config.animationSpeedRange;
    
    this.members.push({
      id,
      position: position.clone(),
      rotation,
      animationPhase: Math.random() * Math.PI * 2,
      animationSpeed: minSpeed + Math.random() * (maxSpeed - minSpeed),
      type,
    });
    
    this.needsUpdate = true;
  }

  /**
   * Remove a member by ID
   */
  removeMember(id: number): void {
    const index = this.members.findIndex(m => m.id === id);
    if (index !== -1) {
      this.members.splice(index, 1);
      this.needsUpdate = true;
    }
  }

  /**
   * Clear all members
   */
  clear(): void {
    this.members = [];
    if (this.instancedMesh) {
      this.instancedMesh.count = 0;
    }
    this.needsUpdate = true;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      if (this.instancedMesh.material instanceof THREE.Material) {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }
    this.members = [];
  }
}

/**
 * Create simple crowd geometry (low-poly humanoid)
 */
export function createCrowdGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Simple capsule shape (body)
  const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  headGeometry.translate(0, 1.0, 0);
  
  // Merge geometries
  const mergedGeometry = new THREE.BufferGeometry();
  const bodyPositionAttr = bodyGeometry.attributes.position;
  const headPositionAttr = headGeometry.attributes.position;
  
  if (!bodyPositionAttr || !headPositionAttr) {
    bodyGeometry.dispose();
    headGeometry.dispose();
    return new THREE.BufferGeometry();
  }
  
  const bodyPositions = bodyPositionAttr.array;
  const headPositions = headPositionAttr.array;
  
  const positions = new Float32Array(bodyPositions.length + headPositions.length);
  positions.set(bodyPositions, 0);
  positions.set(headPositions, bodyPositions.length);
  
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Compute normals
  mergedGeometry.computeVertexNormals();
  
  // Cleanup
  bodyGeometry.dispose();
  headGeometry.dispose();
  
  return mergedGeometry;
}

/**
 * Create crowd material
 */
export function createCrowdMaterial(): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.8,
    metalness: 0.1,
  });
}
