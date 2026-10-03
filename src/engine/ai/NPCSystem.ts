/**
 * NPC System
 * P14 - NPC management with schedules and behavior trees
 */

import * as THREE from 'three';
import { ScheduleSystem, ActivityType, type ScheduleEntry } from './ScheduleSystem.js';
import { BehaviorNode, Sequence, Selector, Action, Condition, NodeStatus, type Blackboard } from './BehaviorTree.js';
import { NavMeshSystem } from './NavMeshSystem.js';

export enum NPCState {
  IDLE = 'idle',
  MOVING = 'moving',
  WORKING = 'working',
  SOCIALIZING = 'socializing',
  SLEEPING = 'sleeping',
  EATING = 'eating',
}

export interface NPCConfig {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  homeLocation: { x: number; z: number };
  workLocation?: { x: number; z: number };
  speed: number;
}

export class NPC {
  id: string;
  type: string;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3 | null = null;
  homeLocation: THREE.Vector3;
  workLocation: THREE.Vector3 | null;
  speed: number;
  state: NPCState = NPCState.IDLE;
  currentActivity: ScheduleEntry | null = null;
  behaviorTree: BehaviorNode | null = null;
  blackboard: Blackboard = {};
  mesh: THREE.Group | null = null;

  constructor(config: NPCConfig) {
    this.id = config.id;
    this.type = config.type;
    this.position = new THREE.Vector3(config.position.x, config.position.y, config.position.z);
    this.homeLocation = new THREE.Vector3(config.homeLocation.x, 0, config.homeLocation.z);
    this.workLocation = config.workLocation 
      ? new THREE.Vector3(config.workLocation.x, 0, config.workLocation.z)
      : null;
    this.speed = config.speed;

    // Initialize blackboard
    this.blackboard = {
      npc: this,
      targetPosition: null,
      path: null,
      currentActivity: null,
    };
  }

  /**
   * Update NPC
   */
  update(deltaTime: number, scheduleSystem: ScheduleSystem, navMesh: NavMeshSystem): void {
    // Get current activity
    this.currentActivity = scheduleSystem.getCurrentActivity(this.type);
    this.blackboard.currentActivity = this.currentActivity;

    // Update behavior tree
    if (this.behaviorTree) {
      this.behaviorTree.tick(deltaTime);
    }

    // Move towards target
    if (this.targetPosition) {
      this.moveToTarget(deltaTime, navMesh);
    }

    // Update state based on activity
    this.updateState();
  }

  /**
   * Move towards target position
   */
  private moveToTarget(deltaTime: number, navMesh: NavMeshSystem): void {
    if (!this.targetPosition) return;

    const direction = this.targetPosition.clone().sub(this.position);
    const distance = direction.length();

    if (distance < 0.5) {
      this.targetPosition = null;
      this.blackboard.targetPosition = null;
      return;
    }

    direction.normalize();
    const movement = direction.multiplyScalar(this.speed * deltaTime);
    this.position.add(movement);

    // Update mesh position
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }

  /**
   * Update NPC state based on activity
   */
  private updateState(): void {
    if (!this.currentActivity) {
      this.state = NPCState.IDLE;
      return;
    }

    switch (this.currentActivity.activity) {
      case ActivityType.SLEEP:
        this.state = NPCState.SLEEPING;
        break;
      case ActivityType.WORK:
        this.state = NPCState.WORKING;
        break;
      case ActivityType.EAT:
        this.state = NPCState.EATING;
        break;
      case ActivityType.SOCIALIZE:
        this.state = NPCState.SOCIALIZING;
        break;
      default:
        this.state = NPCState.IDLE;
    }
  }

  /**
   * Set target position
   */
  setTarget(position: THREE.Vector3): void {
    this.targetPosition = position.clone();
    this.blackboard.targetPosition = position;
  }

  /**
   * Create behavior tree for this NPC
   */
  createBehaviorTree(): void {
    const bb = this.blackboard;

    // Simple behavior tree
    this.behaviorTree = new Selector(bb, [
      // Sleep if it's sleep time
      new Sequence(bb, [
        new Condition(bb, (bb) => bb.currentActivity?.activity === ActivityType.SLEEP),
        new Action(bb, (bb) => {
          const npc = bb.npc as NPC;
          npc.setTarget(npc.homeLocation);
          return NodeStatus.SUCCESS;
        }),
      ]),

      // Go to work if it's work time
      new Sequence(bb, [
        new Condition(bb, (bb) => bb.currentActivity?.activity === ActivityType.WORK),
        new Action(bb, (bb) => {
          const npc = bb.npc as NPC;
          if (npc.workLocation) {
            npc.setTarget(npc.workLocation);
          }
          return NodeStatus.SUCCESS;
        }),
      ]),

      // Wander if idle
      new Sequence(bb, [
        new Condition(bb, (bb) => bb.currentActivity?.activity === ActivityType.IDLE),
        new Action(bb, (bb) => {
          const npc = bb.npc as NPC;
          const wanderTarget = npc.homeLocation.clone();
          wanderTarget.x += (Math.random() - 0.5) * 20;
          wanderTarget.z += (Math.random() - 0.5) * 20;
          npc.setTarget(wanderTarget);
          return NodeStatus.SUCCESS;
        }),
      ]),
    ]);
  }

  /**
   * Create mesh for NPC
   */
  createMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = `npc_${this.id}`;

    // Simple capsule for NPC
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getColorForType(),
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);

    group.position.copy(this.position);
    this.mesh = group;

    return group;
  }

  /**
   * Get color based on NPC type
   */
  private getColorForType(): number {
    switch (this.type) {
      case 'villager':
        return 0x8b7355;
      case 'merchant':
        return 0xc8a96e;
      case 'guard':
        return 0x606060;
      default:
        return 0x808080;
    }
  }

  /**
   * Dispose NPC resources
   */
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

export class NPCSystem {
  private npcs: Map<string, NPC> = new Map();
  private scheduleSystem: ScheduleSystem;
  private navMesh: NavMeshSystem;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, navMesh: NavMeshSystem) {
    this.scene = scene;
    this.navMesh = navMesh;
    this.scheduleSystem = new ScheduleSystem();
  }

  /**
   * Add NPC
   */
  addNPC(config: NPCConfig): NPC {
    const npc = new NPC(config);
    npc.createBehaviorTree();
    
    const mesh = npc.createMesh();
    this.scene.add(mesh);
    
    this.npcs.set(config.id, npc);
    return npc;
  }

  /**
   * Remove NPC
   */
  removeNPC(id: string): void {
    const npc = this.npcs.get(id);
    if (npc) {
      if (npc.mesh) {
        this.scene.remove(npc.mesh);
      }
      npc.dispose();
      this.npcs.delete(id);
    }
  }

  /**
   * Update all NPCs
   */
  update(deltaTime: number): void {
    // Update schedule time
    this.scheduleSystem.updateTime(deltaTime);

    // Update each NPC
    for (const npc of this.npcs.values()) {
      npc.update(deltaTime, this.scheduleSystem, this.navMesh);
    }
  }

  /**
   * Get NPC by ID
   */
  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id);
  }

  /**
   * Get all NPCs
   */
  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Get NPC count
   */
  getNPCCount(): number {
    return this.npcs.size;
  }

  /**
   * Get schedule system
   */
  getScheduleSystem(): ScheduleSystem {
    return this.scheduleSystem;
  }

  /**
   * Spawn village NPCs
   */
  spawnVillageNPCs(centerX: number, centerZ: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;

      const types = ['villager', 'merchant', 'guard'];
      const type = types[Math.floor(Math.random() * types.length)]!;

      this.addNPC({
        id: `npc_${i}`,
        type,
        position: { x, y: 0, z },
        homeLocation: { x: centerX, z: centerZ },
        workLocation: { x: centerX + 10, z: centerZ + 10 },
        speed: 2,
      });
    }
  }

  /**
   * Dispose all NPCs
   */
  dispose(): void {
    for (const npc of this.npcs.values()) {
      if (npc.mesh) {
        this.scene.remove(npc.mesh);
      }
      npc.dispose();
    }
    this.npcs.clear();
  }
}
