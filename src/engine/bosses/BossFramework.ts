/**
 * Boss Framework - Multi-phase boss management system
 * P21 - Core framework for all bosses
 */

import * as THREE from 'three';

export interface BossPhase {
  id: string;
  name: string;
  healthThreshold: number; // percentage (0-100) to trigger this phase
  attacks: BossAttack[];
  phaseTransition?: CinematicTrack;
  arenaRules?: ArenaRule[];
  musicTrack?: string;
  dialogue?: string[];
}

export interface BossAttack {
  id: string;
  name: string;
  telegraph: Telegraph;
  damage: number;
  cooldown: number; // seconds
  pattern: AttackPattern;
  priority: number; // higher = more likely to be chosen
  minHealth?: number; // only use above this health %
  maxHealth?: number; // only use below this health %
}

export interface Telegraph {
  duration: number; // seconds of warning
  visual: string; // effect name
  audio: string; // sound name
  hitboxDelay: number; // delay after telegraph before actual hit
  color?: string; // telegraph color
}

export interface AttackPattern {
  type: 'melee' | 'ranged' | 'aoe' | 'summon' | 'buff';
  range?: number;
  areaOfEffect?: number;
  projectileCount?: number;
  duration?: number;
}

export interface ArenaRule {
  type: 'boundary' | 'hazard' | 'obstacle' | 'buff_zone';
  position?: THREE.Vector3;
  radius?: number;
  damage?: number;
  effect?: string;
}

export interface CinematicTrack {
  duration: number;
  cameraPath: CameraKeyframe[];
  dialogue?: string[];
  musicCue?: string;
}

export interface CameraKeyframe {
  time: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
}

export class BossFramework {
  private currentPhase: number = 0;
  private phases: BossPhase[];
  private health: number;
  private maxHealth: number;
  private attackCooldowns: Map<string, number> = new Map();
  private isActive: boolean = false;
  private arenaRules: ArenaRule[] = [];
  private onPhaseChange?: (phase: number) => void;
  private onAttack?: (attack: BossAttack) => void;
  private onDefeat?: () => void;

  constructor(phases: BossPhase[], maxHealth: number) {
    this.phases = phases;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.arenaRules = phases[0]?.arenaRules || [];
  }

  /**
   * Start the boss fight
   */
  start(): void {
    this.isActive = true;
    this.currentPhase = 0;
    this.health = this.maxHealth;
    this.attackCooldowns.clear();
  }

  /**
   * Update boss logic
   */
  update(deltaTime: number, playerPosition: THREE.Vector3): BossAction | null {
    if (!this.isActive) return null;

    // Update cooldowns
    for (const [attackId, cooldown] of this.attackCooldowns.entries()) {
      this.attackCooldowns.set(attackId, Math.max(0, cooldown - deltaTime));
    }

    // Check phase transitions
    const healthPercent = (this.health / this.maxHealth) * 100;
    for (let i = this.phases.length - 1; i >= 0; i--) {
      const phase = this.phases[i];
      if (phase && healthPercent <= phase.healthThreshold && i > this.currentPhase) {
        this.transitionToPhase(i);
        break;
      }
    }

    // Select and return next attack
    return this.selectAttack(playerPosition);
  }

  /**
   * Select next attack based on priority and availability
   */
  private selectAttack(playerPosition: THREE.Vector3): BossAction | null {
    const phase = this.phases[this.currentPhase];
    if (!phase || !phase.attacks || phase.attacks.length === 0) return null;

    const healthPercent = (this.health / this.maxHealth) * 100;
    
    // Filter available attacks
    const available = phase.attacks.filter(attack => {
      const cooldown = this.attackCooldowns.get(attack.id) || 0;
      if (cooldown > 0) return false;
      
      if (attack.minHealth !== undefined && healthPercent < attack.minHealth) return false;
      if (attack.maxHealth !== undefined && healthPercent > attack.maxHealth) return false;
      
      return true;
    });

    if (available.length === 0) return null;

    // Weighted random selection based on priority
    const totalPriority = available.reduce((sum, a) => sum + a.priority, 0);
    let random = Math.random() * totalPriority;
    
    for (const attack of available) {
      random -= attack.priority;
      if (random <= 0) {
        // Set cooldown
        this.attackCooldowns.set(attack.id, attack.cooldown);
        
        // Notify attack
        if (this.onAttack) {
          this.onAttack(attack);
        }
        
        return {
          type: 'attack',
          attack: attack,
          telegraph: attack.telegraph,
        };
      }
    }

    return null;
  }

  /**
   * Transition to a new phase
   */
  private transitionToPhase(phaseIndex: number): void {
    this.currentPhase = phaseIndex;
    const phase = this.phases[phaseIndex];
    
    if (!phase) return;
    
    // Update arena rules
    if (phase.arenaRules) {
      this.arenaRules = phase.arenaRules;
    }
    
    // Reset cooldowns for new phase
    this.attackCooldowns.clear();
    
    // Notify phase change
    if (this.onPhaseChange) {
      this.onPhaseChange(phaseIndex);
    }
    
    console.log(`[Boss] Transitioned to phase ${phaseIndex}: ${phase.name}`);
  }

  /**
   * Apply damage to boss
   */
  takeDamage(amount: number): boolean {
    if (!this.isActive) return false;
    
    this.health = Math.max(0, this.health - amount);
    
    if (this.health === 0) {
      this.defeat();
      return true;
    }
    
    return false;
  }

  /**
   * Handle boss defeat
   */
  private defeat(): void {
    this.isActive = false;
    if (this.onDefeat) {
      this.onDefeat();
    }
    console.log('[Boss] Defeated!');
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): BossPhase | null {
    return this.phases[this.currentPhase] || null;
  }

  /**
   * Get current phase index
   */
  getCurrentPhaseIndex(): number {
    return this.currentPhase;
  }

  /**
   * Get health percentage
   */
  getHealthPercent(): number {
    return (this.health / this.maxHealth) * 100;
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get max health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get arena rules
   */
  getArenaRules(): ArenaRule[] {
    return this.arenaRules;
  }

  /**
   * Check if boss is active
   */
  isActiveFight(): boolean {
    return this.isActive;
  }

  /**
   * Set phase change callback
   */
  setOnPhaseChange(callback: (phase: number) => void): void {
    this.onPhaseChange = callback;
  }

  /**
   * Set attack callback
   */
  setOnAttack(callback: (attack: BossAttack) => void): void {
    this.onAttack = callback;
  }

  /**
   * Set defeat callback
   */
  setOnDefeat(callback: () => void): void {
    this.onDefeat = callback;
  }

  /**
   * Get all phases
   */
  getPhases(): BossPhase[] {
    return this.phases;
  }
}

export interface BossAction {
  type: 'attack';
  attack: BossAttack;
  telegraph: Telegraph;
}
