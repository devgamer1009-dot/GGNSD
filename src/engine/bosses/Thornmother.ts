/**
 * Thornmother Boss Implementation - Regional guardian of Thornwood
 * P21 - Complete boss implementation using the framework
 */

import * as THREE from 'three';
import { BossFramework, BossAction } from './BossFramework.js';
import { TelegraphSystem, TelegraphEvent } from './TelegraphSystem.js';
import { ArenaSystem } from './ArenaSystem.js';
import { CinematicCamera, createRevealTrack } from './CinematicCamera.js';
import { 
  THORNMOTHER_DATA, 
  THORNMOTHER_ARENA, 
  THORNMOTHER_PHASES,
  THORNMOTHER_INTRO,
  THORNMOTHER_DEFEAT,
  THORNMOTHER_LOOT,
} from '../../content/bosses/thornmother.js';

export enum BossState {
  INACTIVE = 'inactive',
  INTRO_CINEMATIC = 'intro_cinematic',
  FIGHTING = 'fighting',
  PHASE_TRANSITION = 'phase_transition',
  DEFEAT_CINEMATIC = 'defeat_cinematic',
  DEFEATED = 'defeated',
}

export class Thornmother {
  private framework: BossFramework;
  private telegraphSystem: TelegraphSystem;
  private arenaSystem: ArenaSystem;
  private cinematicCamera: CinematicCamera;
  
  private state: BossState = BossState.INACTIVE;
  private bossPosition: THREE.Vector3;
  private bossMesh?: THREE.Group;
  
  private onStateChange?: (state: BossState) => void;
  private onDamage?: (damage: number) => void;
  private onLoot?: (loot: any[]) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    position: THREE.Vector3
  ) {
    this.bossPosition = position.clone();
    
    // Initialize systems
    this.framework = new BossFramework(THORNMOTHER_PHASES, THORNMOTHER_DATA.maxHealth);
    this.telegraphSystem = new TelegraphSystem(scene);
    this.arenaSystem = new ArenaSystem(scene, {
      center: THORNMOTHER_ARENA.center,
      radius: THORNMOTHER_ARENA.radius,
      height: THORNMOTHER_ARENA.height,
      rules: THORNMOTHER_ARENA.phaseRules[0] || [],
    });
    this.cinematicCamera = new CinematicCamera(camera);
    
    // Setup callbacks
    this.framework.setOnPhaseChange((phase) => this.onPhaseChange(phase));
    this.framework.setOnAttack((attack) => this.onBossAttack(attack));
    this.framework.setOnDefeat(() => this.onBossDefeat());
    
    // Create boss visual
    this.createBossVisual(scene);
  }

  /**
   * Create boss visual representation
   */
  private createBossVisual(scene: THREE.Scene): void {
    this.bossMesh = new THREE.Group();
    
    // Body (tree trunk)
    const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 4;
    body.castShadow = true;
    this.bossMesh.add(body);
    
    // Head (tree canopy)
    const headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 9;
    head.castShadow = true;
    this.bossMesh.add(head);
    
    // Arms (branches)
    const armGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-2, 6, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    this.bossMesh.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(2, 6, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    this.bossMesh.add(rightArm);
    
    this.bossMesh.position.copy(this.bossPosition);
    scene.add(this.bossMesh);
  }

  /**
   * Start the boss fight
   */
  startFight(): void {
    if (this.state !== BossState.INACTIVE) return;
    
    this.state = BossState.INTRO_CINEMATIC;
    this.notifyStateChange();
    
    // Play intro cinematic
    this.cinematicCamera.play(THORNMOTHER_INTRO, () => {
      this.state = BossState.FIGHTING;
      this.framework.start();
      this.notifyStateChange();
      console.log('[Thornmother] Fight started!');
    });
  }

  /**
   * Update boss logic
   */
  update(deltaTime: number, playerPosition: THREE.Vector3, currentTime: number): void {
    const currentState = this.state;
    
    // Update cinematic camera
    if (currentState === BossState.INTRO_CINEMATIC || currentState === BossState.PHASE_TRANSITION || currentState === BossState.DEFEAT_CINEMATIC) {
      this.cinematicCamera.update(currentTime);
      return;
    }
    
    // Update telegraphs
    const telegraphEvents = this.telegraphSystem.update(currentTime);
    this.handleTelegraphEvents(telegraphEvents, playerPosition);
    
    // Update boss AI
    if (currentState === BossState.FIGHTING) {
      const action = this.framework.update(deltaTime, playerPosition);
      if (action) {
        this.executeBossAction(action, playerPosition);
      }
      
      // Update boss visual (face player)
      if (this.bossMesh) {
        const direction = new THREE.Vector3().subVectors(playerPosition, this.bossPosition);
        direction.y = 0;
        if (direction.length() > 0.1) {
          const angle = Math.atan2(direction.x, direction.z);
          this.bossMesh.rotation.y = angle;
        }
      }
    }
  }

  /**
   * Execute a boss action
   */
  private executeBossAction(action: BossAction, playerPosition: THREE.Vector3): void {
    const { attack } = action;
    
    // Calculate telegraph radius based on attack pattern
    let radius = 5;
    if (attack.pattern.type === 'aoe') {
      radius = attack.pattern.areaOfEffect || 10;
    } else if (attack.pattern.type === 'melee') {
      radius = attack.pattern.range || 5;
    } else if (attack.pattern.type === 'ranged') {
      radius = 3;
    }
    
    // Create telegraph
    this.telegraphSystem.createTelegraph(attack, playerPosition, radius);
    
    console.log(`[Thornmother] Executing attack: ${attack.name}`);
  }

  /**
   * Handle telegraph events
   */
  private handleTelegraphEvents(events: TelegraphEvent[], playerPosition: THREE.Vector3): void {
    for (const event of events) {
      if (event.type === 'hitbox_active') {
        // Check if player is in hitbox
        if (this.telegraphSystem.isPlayerInTelegraph(playerPosition, event.telegraphId)) {
          // Apply damage (would be handled by combat system)
          console.log(`[Thornmother] Player hit by ${event.attack.name} for ${event.attack.damage} damage`);
        }
      }
    }
  }

  /**
   * Apply damage to boss
   */
  takeDamage(amount: number): boolean {
    if (this.state !== BossState.FIGHTING) return false;
    
    const defeated = this.framework.takeDamage(amount);
    
    if (this.onDamage) {
      this.onDamage(amount);
    }
    
    return defeated;
  }

  /**
   * Handle phase change
   */
  private onPhaseChange(phaseIndex: number): void {
    const phase = THORNMOTHER_PHASES[phaseIndex];
    if (!phase) return;
    
    this.state = BossState.PHASE_TRANSITION;
    this.notifyStateChange();
    
    // Update arena rules
    if (phase.arenaRules) {
      this.arenaSystem.updateRules(phase.arenaRules);
    }
    
    // Play phase transition cinematic if available
    if (phase.phaseTransition) {
      this.cinematicCamera.play(phase.phaseTransition, () => {
        this.state = BossState.FIGHTING;
        this.notifyStateChange();
        console.log(`[Thornmother] Phase ${phaseIndex + 1} started: ${phase.name}`);
      });
    } else {
      this.state = BossState.FIGHTING;
      this.notifyStateChange();
    }
  }

  /**
   * Handle boss attack
   */
  private onBossAttack(attack: any): void {
    // Could trigger sound effects, animations, etc.
    console.log(`[Thornmother] Attacking with: ${attack.name}`);
  }

  /**
   * Handle boss defeat
   */
  private onBossDefeat(): void {
    this.state = BossState.DEFEAT_CINEMATIC;
    this.notifyStateChange();
    
    // Play defeat cinematic
    this.cinematicCamera.play(THORNMOTHER_DEFEAT, () => {
      this.state = BossState.DEFEATED;
      this.notifyStateChange();
      
      // Drop loot
      if (this.onLoot) {
        this.onLoot(THORNMOTHER_LOOT);
      }
      
      console.log('[Thornmother] Defeated!');
    });
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: BossState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Set damage callback
   */
  setOnDamage(callback: (damage: number) => void): void {
    this.onDamage = callback;
  }

  /**
   * Set loot callback
   */
  setOnLoot(callback: (loot: any[]) => void): void {
    this.onLoot = callback;
  }

  /**
   * Get current state
   */
  getState(): BossState {
    return this.state;
  }

  /**
   * Get health percentage
   */
  getHealthPercent(): number {
    return this.framework.getHealthPercent();
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): number {
    return this.framework.getCurrentPhaseIndex();
  }

  /**
   * Get boss position
   */
  getPosition(): THREE.Vector3 {
    return this.bossPosition.clone();
  }

  /**
   * Check if player is in arena
   */
  isPlayerInArena(playerPosition: THREE.Vector3): boolean {
    return this.arenaSystem.isWithinBoundary(playerPosition);
  }

  /**
   * Check if player is in hazard
   */
  isPlayerInHazard(playerPosition: THREE.Vector3): { inHazard: boolean; damage: number } {
    return this.arenaSystem.isInHazard(playerPosition);
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.telegraphSystem.clear();
    this.arenaSystem.dispose();
    
    if (this.bossMesh) {
      this.bossMesh.parent?.remove(this.bossMesh);
      this.bossMesh.traverse((child) => {
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
