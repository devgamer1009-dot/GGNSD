/**
 * AI System - Main Orchestrator
 * P14 - Complete AI system with navmesh, NPCs, wildlife, factions, events
 */

import * as THREE from 'three';
import { NavMeshSystem } from './NavMeshSystem.js';
import { NPCSystem, type NPCConfig } from './NPCSystem.js';
import { WildlifeSystem, WildlifeType } from './WildlifeSystem.js';
import { FactionSystem, EventSystem, FactionType } from './FactionEventSystem.js';
import { AILodManager, AIUpdateScheduler } from './AILodManager.js';
import type { TerrainChunkData } from '../terrain/TerrainGenerator.js';

export class AISystem {
  private scene: THREE.Scene;
  private navMesh: NavMeshSystem;
  private npcSystem: NPCSystem;
  private wildlifeSystem: WildlifeSystem;
  private factionSystem: FactionSystem;
  private eventSystem: EventSystem;
  private lodManager: AILodManager;
  private updateScheduler: AIUpdateScheduler;

  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private currentWeather: string = 'clear';

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.navMesh = new NavMeshSystem();
    this.npcSystem = new NPCSystem(scene, this.navMesh);
    this.wildlifeSystem = new WildlifeSystem(scene);
    this.factionSystem = new FactionSystem();
    this.eventSystem = new EventSystem();
    this.lodManager = new AILodManager();
    this.updateScheduler = new AIUpdateScheduler();
  }

  /**
   * Initialize AI system
   */
  async init(): Promise<void> {
    await this.navMesh.init();
  }

  /**
   * Update AI system
   */
  update(deltaTime: number): void {
    // Update player position (would be passed from game loop)
    // this.playerPosition.copy(player.position);

    // Update NPCs with time-sliced scheduler
    this.updateScheduler.update(deltaTime);

    // Update wildlife
    this.wildlifeSystem.update(deltaTime, this.playerPosition, this.currentWeather);

    // Update events
    this.eventSystem.update(deltaTime, { x: this.playerPosition.x, z: this.playerPosition.z });

    // Update NPC schedules
    this.npcSystem.update(deltaTime);
  }

  /**
   * Generate navmesh for terrain chunk
   */
  generateChunkNavMesh(chunkData: TerrainChunkData, worldOffsetX: number, worldOffsetZ: number): void {
    this.navMesh.generateChunkNavMesh(chunkData, worldOffsetX, worldOffsetZ);
  }

  /**
   * Remove navmesh for chunk
   */
  removeChunkNavMesh(chunkX: number, chunkZ: number): void {
    this.navMesh.removeChunkNavMesh(chunkX, chunkZ);
  }

  /**
   * Add NPC
   */
  addNPC(config: NPCConfig): void {
    this.npcSystem.addNPC(config);
    
    // Register with scheduler
    this.updateScheduler.registerEntity(
      config.id,
      (dt) => {
        const npc = this.npcSystem.getNPC(config.id);
        if (npc) {
          npc.update(dt, this.npcSystem.getScheduleSystem(), this.navMesh);
        }
      },
      1 // Priority
    );
  }

  /**
   * Remove NPC
   */
  removeNPC(id: string): void {
    this.npcSystem.removeNPC(id);
    this.updateScheduler.unregisterEntity(id);
  }

  /**
   * Spawn village NPCs
   */
  spawnVillageNPCs(centerX: number, centerZ: number, count: number): void {
    this.npcSystem.spawnVillageNPCs(centerX, centerZ, count);
  }

  /**
   * Spawn wildlife herd
   */
  spawnWildlifeHerd(type: WildlifeType, centerX: number, centerZ: number, count: number): void {
    this.wildlifeSystem.spawnHerd(type, centerX, centerZ, count);
  }

  /**
   * Modify faction reputation
   */
  modifyReputation(faction: FactionType, amount: number): void {
    this.factionSystem.modifyReputation(faction, amount);
  }

  /**
   * Get faction reputation
   */
  getReputation(faction: FactionType): number {
    return this.factionSystem.getReputation(faction);
  }

  /**
   * Set player position
   */
  setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position);
  }

  /**
   * Set current weather
   */
  setWeather(weather: string): void {
    this.currentWeather = weather;
  }

  /**
   * Get AI statistics
   */
  getStats(): {
    npcCount: number;
    wildlifeCount: number;
    navMeshCount: number;
    activeEvents: number;
    aiUpdateTime: number;
  } {
    return {
      npcCount: this.npcSystem.getNPCCount(),
      wildlifeCount: this.wildlifeSystem.getWildlifeCount(),
      navMeshCount: this.navMesh.getNavMeshCount(),
      activeEvents: this.eventSystem.getActiveEvents().length,
      aiUpdateTime: this.updateScheduler.getLastUpdateTime(),
    };
  }

  /**
   * Get subsystems
   */
  getNavMesh(): NavMeshSystem {
    return this.navMesh;
  }

  getNPCSystem(): NPCSystem {
    return this.npcSystem;
  }

  getWildlifeSystem(): WildlifeSystem {
    return this.wildlifeSystem;
  }

  getFactionSystem(): FactionSystem {
    return this.factionSystem;
  }

  getEventSystem(): EventSystem {
    return this.eventSystem;
  }

  /**
   * Dispose all AI resources
   */
  dispose(): void {
    this.navMesh.dispose();
    this.npcSystem.dispose();
    this.wildlifeSystem.dispose();
    this.updateScheduler.clear();
  }
}
