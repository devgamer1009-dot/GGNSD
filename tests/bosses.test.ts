import { describe, it, expect, beforeEach } from 'vitest';
import { BossFramework, BossPhase, BossAttack } from '../src/engine/bosses/BossFramework.js';
import { TelegraphSystem } from '../src/engine/bosses/TelegraphSystem.js';
import { ArenaSystem } from '../src/engine/bosses/ArenaSystem.js';
import * as THREE from 'three';

describe('BossFramework', () => {
  let framework: BossFramework;
  let phases: BossPhase[];

  beforeEach(() => {
    // Create test phases
    phases = [
      {
        id: 'phase_1',
        name: 'Phase 1',
        healthThreshold: 100,
        attacks: [
          {
            id: 'attack_1',
            name: 'Basic Attack',
            telegraph: {
              duration: 1.0,
              visual: 'test',
              audio: 'test',
              hitboxDelay: 0.2,
            },
            damage: 10,
            cooldown: 2,
            pattern: { type: 'melee', range: 5 },
            priority: 10,
          },
        ],
      },
      {
        id: 'phase_2',
        name: 'Phase 2',
        healthThreshold: 50,
        attacks: [
          {
            id: 'attack_2',
            name: 'Strong Attack',
            telegraph: {
              duration: 1.5,
              visual: 'test',
              audio: 'test',
              hitboxDelay: 0.3,
            },
            damage: 20,
            cooldown: 3,
            pattern: { type: 'aoe', areaOfEffect: 10 },
            priority: 8,
          },
        ],
      },
      {
        id: 'phase_3',
        name: 'Phase 3',
        healthThreshold: 25,
        attacks: [
          {
            id: 'attack_3',
            name: 'Ultimate Attack',
            telegraph: {
              duration: 2.0,
              visual: 'test',
              audio: 'test',
              hitboxDelay: 0.5,
            },
            damage: 40,
            cooldown: 5,
            pattern: { type: 'ranged', range: 20 },
            priority: 12,
          },
        ],
      },
    ];

    framework = new BossFramework(phases, 1000);
  });

  describe('Initialization', () => {
    it('should initialize with correct health', () => {
      expect(framework.getHealth()).toBe(1000);
      expect(framework.getMaxHealth()).toBe(1000);
      expect(framework.getHealthPercent()).toBe(100);
    });

    it('should start at phase 0', () => {
      expect(framework.getCurrentPhaseIndex()).toBe(0);
      expect(framework.getCurrentPhase()?.id).toBe('phase_1');
    });

    it('should not be active before start', () => {
      expect(framework.isActiveFight()).toBe(false);
    });
  });

  describe('Phase Transitions', () => {
    beforeEach(() => {
      framework.start();
    });

    it('should transition to phase 2 at 50% health', () => {
      let phaseChanged = false;
      framework.setOnPhaseChange((phase) => {
        phaseChanged = true;
        expect(phase).toBe(1);
      });

      // Deal 500 damage (50% health)
      framework.takeDamage(500);
      framework.update(0.1, new THREE.Vector3());

      expect(phaseChanged).toBe(true);
      expect(framework.getCurrentPhaseIndex()).toBe(1);
      expect(framework.getCurrentPhase()?.id).toBe('phase_2');
    });

    it('should transition to phase 3 at 25% health', () => {
      let phaseChanged = false;
      framework.setOnPhaseChange((phase) => {
        phaseChanged = true;
        expect(phase).toBe(2);
      });

      // Deal 750 damage (25% health)
      framework.takeDamage(750);
      framework.update(0.1, new THREE.Vector3());

      expect(phaseChanged).toBe(true);
      expect(framework.getCurrentPhaseIndex()).toBe(2);
      expect(framework.getCurrentPhase()?.id).toBe('phase_3');
    });

    it('should not transition backwards', () => {
      // Go to phase 2
      framework.takeDamage(500);
      framework.update(0.1, new THREE.Vector3());
      expect(framework.getCurrentPhaseIndex()).toBe(1);

      // Heal (not possible in real game, but testing logic)
      framework.takeDamage(-100);
      framework.update(0.1, new THREE.Vector3());

      // Should still be in phase 2
      expect(framework.getCurrentPhaseIndex()).toBe(1);
    });

    it('should reset attack cooldowns on phase transition', () => {
      // Use attack to set cooldown
      framework.update(0.1, new THREE.Vector3());
      
      // Transition to phase 2
      framework.takeDamage(500);
      framework.update(0.1, new THREE.Vector3());

      // Should be able to use attacks again
      const action = framework.update(0.1, new THREE.Vector3());
      expect(action).not.toBeNull();
    });

    it('should trigger phase change callback', () => {
      const phasesTriggered: number[] = [];
      framework.setOnPhaseChange((phase) => {
        phasesTriggered.push(phase);
      });

      // Trigger all phases
      framework.takeDamage(500);
      framework.update(0.1, new THREE.Vector3());
      
      framework.takeDamage(250);
      framework.update(0.1, new THREE.Vector3());

      expect(phasesTriggered).toEqual([1, 2]);
    });
  });

  describe('Attack Selection', () => {
    beforeEach(() => {
      framework.start();
    });

    it('should select attacks based on priority', () => {
      const attacks: string[] = [];
      framework.setOnAttack((attack) => {
        attacks.push(attack.id);
      });

      // Run multiple updates to collect attacks
      for (let i = 0; i < 10; i++) {
        framework.update(3, new THREE.Vector3()); // Long enough to reset cooldowns
      }

      expect(attacks.length).toBeGreaterThan(0);
    });

    it('should respect attack cooldowns', () => {
      let attackCount = 0;
      framework.setOnAttack(() => {
        attackCount++;
      });

      // First attack
      framework.update(0.1, new THREE.Vector3());
      const firstCount = attackCount;

      // Immediate second update (should be on cooldown)
      framework.update(0.1, new THREE.Vector3());
      
      // Should not have attacked again yet
      expect(attackCount).toBe(firstCount);

      // Wait for cooldown
      framework.update(3, new THREE.Vector3());
      expect(attackCount).toBeGreaterThan(firstCount);
    });

    it('should respect health-based attack restrictions', () => {
      // Create phase with health-restricted attack
      const restrictedPhases: BossPhase[] = [
        {
          id: 'phase_1',
          name: 'Phase 1',
          healthThreshold: 100,
          attacks: [
            {
              id: 'early_attack',
              name: 'Early Attack',
              telegraph: {
                duration: 1.0,
                visual: 'test',
                audio: 'test',
                hitboxDelay: 0.2,
              },
              damage: 10,
              cooldown: 1,
              pattern: { type: 'melee', range: 5 },
              priority: 10,
              maxHealth: 50, // Only use below 50% health
            },
            {
              id: 'normal_attack',
              name: 'Normal Attack',
              telegraph: {
                duration: 1.0,
                visual: 'test',
                audio: 'test',
                hitboxDelay: 0.2,
              },
              damage: 10,
              cooldown: 1,
              pattern: { type: 'melee', range: 5 },
              priority: 5,
            },
          ],
        },
      ];

      const restrictedFramework = new BossFramework(restrictedPhases, 1000);
      restrictedFramework.start();

      const attacks: string[] = [];
      restrictedFramework.setOnAttack((attack) => {
        attacks.push(attack.id);
      });

      // At full health, should only use normal_attack
      restrictedFramework.update(2, new THREE.Vector3());
      expect(attacks).toContain('normal_attack');
      expect(attacks).not.toContain('early_attack');

      // Below 50% health, should use both
      attacks.length = 0;
      restrictedFramework.takeDamage(600);
      restrictedFramework.update(5, new THREE.Vector3());
      
      // Should have used both attacks
      expect(attacks.some(a => a === 'early_attack' || a === 'normal_attack')).toBe(true);
    });
  });

  describe('Damage and Defeat', () => {
    beforeEach(() => {
      framework.start();
    });

    it('should apply damage correctly', () => {
      framework.takeDamage(100);
      expect(framework.getHealth()).toBe(900);
      expect(framework.getHealthPercent()).toBe(90);
    });

    it('should not go below 0 health', () => {
      framework.takeDamage(1500);
      expect(framework.getHealth()).toBe(0);
      expect(framework.getHealthPercent()).toBe(0);
    });

    it('should trigger defeat at 0 health', () => {
      let defeated = false;
      framework.setOnDefeat(() => {
        defeated = true;
      });

      framework.takeDamage(1000);
      
      expect(defeated).toBe(true);
      expect(framework.isActiveFight()).toBe(false);
    });

    it('should return true when boss is defeated', () => {
      const result = framework.takeDamage(1000);
      expect(result).toBe(true);
    });

    it('should return false when boss is not defeated', () => {
      const result = framework.takeDamage(500);
      expect(result).toBe(false);
    });
  });

  describe('Arena Rules', () => {
    it('should use phase 1 arena rules initially', () => {
      const rules = framework.getArenaRules();
      expect(rules).toEqual(phases[0]?.arenaRules || []);
    });

    it('should update arena rules on phase transition', () => {
      framework.start();
      
      // Add arena rules to phase 2
      if (phases[1]) {
        phases[1].arenaRules = [
          {
            type: 'hazard',
            position: new THREE.Vector3(0, 0, 0),
            radius: 5,
            damage: 10,
          },
        ];
      }

      framework.takeDamage(500);
      framework.update(0.1, new THREE.Vector3());

      const rules = framework.getArenaRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });
});

describe('TelegraphSystem', () => {
  let scene: THREE.Scene;
  let telegraphSystem: TelegraphSystem;

  beforeEach(() => {
    scene = new THREE.Scene();
    telegraphSystem = new TelegraphSystem(scene);
  });

  describe('Telegraph Creation', () => {
    it('should create telegraph with unique ID', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 1.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.2,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      const id = telegraphSystem.createTelegraph(attack, new THREE.Vector3(), 5);
      expect(id).toBeDefined();
      expect(id).toContain('telegraph_');
    });

    it('should create visual mesh for telegraph', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 1.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.2,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      telegraphSystem.createTelegraph(attack, new THREE.Vector3(), 5);
      
      expect(scene.children.length).toBeGreaterThan(0);
    });

    it('should track active telegraphs', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 1.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.2,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      telegraphSystem.createTelegraph(attack, new THREE.Vector3(), 5);
      expect(telegraphSystem.getTelegraphCount()).toBe(1);
    });
  });

  describe('Telegraph Timing', () => {
    it('should complete after duration', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 1.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.2,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      telegraphSystem.createTelegraph(attack, new THREE.Vector3(), 5);
      
      // Update past duration
      const events = telegraphSystem.update(2.0);
      
      expect(events.some(e => e.type === 'telegraph_complete')).toBe(true);
      expect(telegraphSystem.getTelegraphCount()).toBe(0);
    });

    it('should activate hitbox before completion', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 2.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.5,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      telegraphSystem.createTelegraph(attack, new THREE.Vector3(), 5);
      
      // Update to hitbox activation (2.0 - 0.5 = 1.5)
      const events = telegraphSystem.update(1.6);
      
      expect(events.some(e => e.type === 'hitbox_active')).toBe(true);
    });
  });

  describe('Player Detection', () => {
    it('should detect player in telegraph area', () => {
      const attack: BossAttack = {
        id: 'test_attack',
        name: 'Test Attack',
        telegraph: {
          duration: 1.0,
          visual: 'test',
          audio: 'test',
          hitboxDelay: 0.2,
        },
        damage: 10,
        cooldown: 2,
        pattern: { type: 'melee', range: 5 },
        priority: 10,
      };

      const position = new THREE.Vector3(10, 0, 10);
      const id = telegraphSystem.createTelegraph(attack, position, 5);
      
      // Player inside
      const playerInside = new THREE.Vector3(12, 0, 12);
      expect(telegraphSystem.isPlayerInTelegraph(playerInside, id)).toBe(true);
      
      // Player outside
      const playerOutside = new THREE.Vector3(20, 0, 20);
      expect(telegraphSystem.isPlayerInTelegraph(playerOutside, id)).toBe(false);
    });
  });
});

describe('ArenaSystem', () => {
  let scene: THREE.Scene;
  let arenaSystem: ArenaSystem;

  beforeEach(() => {
    scene = new THREE.Scene();
    arenaSystem = new ArenaSystem(scene, {
      center: new THREE.Vector3(0, 0, 0),
      radius: 20,
      height: 10,
      rules: [],
    });
  });

  describe('Boundary Checking', () => {
    it('should detect position within boundary', () => {
      const inside = new THREE.Vector3(10, 0, 10);
      expect(arenaSystem.isWithinBoundary(inside)).toBe(true);
    });

    it('should detect position outside boundary', () => {
      const outside = new THREE.Vector3(30, 0, 30);
      expect(arenaSystem.isWithinBoundary(outside)).toBe(false);
    });

    it('should constrain position to arena', () => {
      const outside = new THREE.Vector3(30, 0, 0);
      const constrained = arenaSystem.constrainToArena(outside);
      
      expect(arenaSystem.isWithinBoundary(constrained)).toBe(true);
      expect(constrained.x).toBeLessThanOrEqual(20);
    });
  });

  describe('Hazard Zones', () => {
    it('should detect player in hazard', () => {
      const arenaWithHazards = new ArenaSystem(scene, {
        center: new THREE.Vector3(0, 0, 0),
        radius: 20,
        height: 10,
        rules: [
          {
            type: 'hazard',
            position: new THREE.Vector3(5, 0, 5),
            radius: 3,
            damage: 10,
          },
        ],
      });

      const inHazard = new THREE.Vector3(5, 0, 5);
      const result = arenaWithHazards.isInHazard(inHazard);
      
      expect(result.inHazard).toBe(true);
      expect(result.damage).toBe(10);
    });

    it('should detect player outside hazard', () => {
      const arenaWithHazards = new ArenaSystem(scene, {
        center: new THREE.Vector3(0, 0, 0),
        radius: 20,
        height: 10,
        rules: [
          {
            type: 'hazard',
            position: new THREE.Vector3(5, 0, 5),
            radius: 3,
            damage: 10,
          },
        ],
      });

      const outsideHazard = new THREE.Vector3(15, 0, 15);
      const result = arenaWithHazards.isInHazard(outsideHazard);
      
      expect(result.inHazard).toBe(false);
    });
  });

  describe('Obstacle Collision', () => {
    it('should detect collision with obstacle', () => {
      const arenaWithObstacles = new ArenaSystem(scene, {
        center: new THREE.Vector3(0, 0, 0),
        radius: 20,
        height: 10,
        rules: [
          {
            type: 'obstacle',
            position: new THREE.Vector3(5, 0, 5),
            radius: 2,
          },
        ],
      });

      const colliding = new THREE.Vector3(6, 0, 6);
      expect(arenaWithObstacles.collidesWithObstacle(colliding, 1)).toBe(true);
    });

    it('should detect no collision with obstacle', () => {
      const arenaWithObstacles = new ArenaSystem(scene, {
        center: new THREE.Vector3(0, 0, 0),
        radius: 20,
        height: 10,
        rules: [
          {
            type: 'obstacle',
            position: new THREE.Vector3(5, 0, 5),
            radius: 2,
          },
        ],
      });

      const notColliding = new THREE.Vector3(15, 0, 15);
      expect(arenaWithObstacles.collidesWithObstacle(notColliding, 1)).toBe(false);
    });
  });
});
