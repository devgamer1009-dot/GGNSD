import { describe, it, expect, beforeEach } from 'vitest';
import { CombatStateComponent } from '../src/engine/combat/CombatState.js';
import { DamageSystem } from '../src/engine/combat/DamageSystem.js';
import { InputBuffer } from '../src/engine/combat/InputBuffer.js';

describe('Combat System', () => {
  describe('CombatStateComponent', () => {
    let combatState: CombatStateComponent;

    beforeEach(() => {
      combatState = new CombatStateComponent(100, 80, 60);
    });

    describe('Health', () => {
      it('should initialize with full health', () => {
        expect(combatState.health).toBe(100);
        expect(combatState.maxHealth).toBe(100);
      });

      it('should detect when alive', () => {
        expect(combatState.isAlive()).toBe(true);
      });

      it('should detect when dead', () => {
        combatState.health = 0;
        expect(combatState.isAlive()).toBe(false);
      });
    });

    describe('Stamina', () => {
      it('should initialize with full stamina', () => {
        expect(combatState.stamina).toBe(80);
        expect(combatState.maxStamina).toBe(80);
      });

      it('should check if has enough stamina', () => {
        expect(combatState.hasStamina(50)).toBe(true);
        expect(combatState.hasStamina(100)).toBe(false);
      });

      it('should consume stamina', () => {
        const success = combatState.consumeStamina(30);
        expect(success).toBe(true);
        expect(combatState.stamina).toBe(50);
      });

      it('should fail to consume if not enough stamina', () => {
        const success = combatState.consumeStamina(100);
        expect(success).toBe(false);
        expect(combatState.stamina).toBe(80);
      });

      it('should regenerate stamina over time', () => {
        combatState.consumeStamina(40);
        expect(combatState.stamina).toBe(40);

        combatState.regenerateStamina(1.0, 20); // 20 per second
        expect(combatState.stamina).toBe(60);
      });

      it('should not regenerate stamina when staggered', () => {
        combatState.consumeStamina(40);
        combatState.isStaggered = true;

        combatState.regenerateStamina(1.0, 20);
        expect(combatState.stamina).toBe(40);
      });

      it('should not regenerate stamina when blocking', () => {
        combatState.consumeStamina(40);
        combatState.isBlocking = true;

        combatState.regenerateStamina(1.0, 20);
        expect(combatState.stamina).toBe(40);
      });

      it('should cap stamina at max', () => {
        combatState.regenerateStamina(10.0, 20);
        expect(combatState.stamina).toBe(80);
      });
    });

    describe('Stagger', () => {
      it('should initialize with zero stagger', () => {
        expect(combatState.stagger).toBe(0);
        expect(combatState.isStaggered).toBe(false);
      });

      it('should apply stagger damage', () => {
        combatState.applyStagger(30);
        expect(combatState.stagger).toBe(30);
      });

      it('should stagger when threshold reached', () => {
        combatState.applyStagger(60);
        expect(combatState.isStaggered).toBe(true);
        expect(combatState.stagger).toBe(60);
      });

      it('should decay stagger over time', () => {
        combatState.applyStagger(30);
        combatState.decayStagger(1.0, 10);
        expect(combatState.stagger).toBe(20);
      });

      it('should unstagger when stagger reaches zero', () => {
        combatState.applyStagger(60);
        expect(combatState.isStaggered).toBe(true);

        combatState.decayStagger(6.0, 10);
        expect(combatState.stagger).toBe(0);
        expect(combatState.isStaggered).toBe(false);
      });
    });

    describe('Parry', () => {
      it('should start parry window', () => {
        combatState.startParry(0.3);
        expect(combatState.isParrying).toBe(true);
        expect(combatState.parryWindow).toBe(0.3);
      });

      it('should update parry window', () => {
        combatState.startParry(0.3);
        combatState.updateParry(0.1);
        expect(combatState.parryWindow).toBeCloseTo(0.2);
      });

      it('should end parry when window expires', () => {
        combatState.startParry(0.3);
        combatState.updateParry(0.4);
        expect(combatState.isParrying).toBe(false);
        expect(combatState.parryWindow).toBe(0);
      });
    });

    describe('Combo', () => {
      it('should increment combo', () => {
        combatState.incrementCombo(1.0);
        expect(combatState.comboCount).toBe(1);
        expect(combatState.lastAttackTime).toBe(1.0);
      });

      it('should reset combo if window expired', () => {
        combatState.incrementCombo(1.0);
        combatState.resetComboIfExpired(2.0, 0.8);
        expect(combatState.comboCount).toBe(0);
      });

      it('should not reset combo if within window', () => {
        combatState.incrementCombo(1.0);
        combatState.resetComboIfExpired(1.5, 0.8);
        expect(combatState.comboCount).toBe(1);
      });
    });
  });

  describe('DamageSystem', () => {
    let damageSystem: DamageSystem;
    let attacker: CombatStateComponent;
    let defender: CombatStateComponent;

    beforeEach(() => {
      damageSystem = new DamageSystem();
      attacker = new CombatStateComponent(100, 80, 60);
      defender = new CombatStateComponent(100, 80, 60);
    });

    describe('Damage Calculation', () => {
      it('should calculate base damage', () => {
        const { damage, modifiers } = damageSystem.calculateDamage(25, attacker, defender);
        expect(damage).toBeGreaterThan(0);
        expect(modifiers.isCritical).toBe(false);
        expect(modifiers.isBlocked).toBe(false);
        expect(modifiers.isParried).toBe(false);
      });

      it('should reduce damage when blocked', () => {
        defender.isBlocking = true;
        const { damage, modifiers } = damageSystem.calculateDamage(25, attacker, defender);
        expect(modifiers.isBlocked).toBe(true);
        expect(damage).toBeLessThan(25);
      });

      it('should negate damage when parried', () => {
        defender.isParrying = true;
        const { damage, modifiers } = damageSystem.calculateDamage(25, attacker, defender);
        expect(modifiers.isParried).toBe(true);
        expect(damage).toBe(0);
      });

      it('should apply combo multiplier', () => {
        attacker.comboCount = 2;
        const weapon = {
          id: 'sword',
          name: 'Test Sword',
          type: 'sword' as const,
          baseDamage: 25,
          staminaCost: 15,
          attackSpeed: 1.2,
          range: 2.5,
          comboWindow: 0.8,
          staggerDamage: 20,
        };
        const { damage } = damageSystem.calculateDamage(25, attacker, defender, weapon);
        expect(damage).toBeGreaterThan(25);
      });
    });

    describe('Damage Application', () => {
      it('should apply damage to target', () => {
        const event = damageSystem.createDamageEvent('attacker', 'defender', 25, 'physical');
        damageSystem.applyDamage(event, defender);
        expect(defender.health).toBe(75);
      });

      it('should not apply damage to dead target', () => {
        defender.health = 0;
        const event = damageSystem.createDamageEvent('attacker', 'defender', 25, 'physical');
        damageSystem.applyDamage(event, defender);
        expect(defender.health).toBe(0);
      });

      it('should apply stagger on hit', () => {
        const event = damageSystem.createDamageEvent('attacker', 'defender', 25, 'physical');
        damageSystem.applyDamage(event, defender);
        expect(defender.stagger).toBeGreaterThan(0);
      });

      it('should not apply stagger on blocked hit', () => {
        const event = damageSystem.createDamageEvent('attacker', 'defender', 25, 'physical', {
          isCritical: false,
          isBlocked: true,
          isParried: false,
          damageMultiplier: 0.3,
        });
        damageSystem.applyDamage(event, defender);
        expect(defender.stagger).toBe(0);
      });
    });
  });

  describe('InputBuffer', () => {
    let inputBuffer: InputBuffer;

    beforeEach(() => {
      inputBuffer = new InputBuffer();
    });

    describe('Buffering', () => {
      it('should add input to buffer', () => {
        inputBuffer.addInput('light_attack', 1.0);
        expect(inputBuffer.getSize()).toBe(1);
      });

      it('should get next unconsumed input', () => {
        inputBuffer.addInput('light_attack', 1.0);
        const input = inputBuffer.getNextInput(1.0);
        expect(input).not.toBeNull();
        expect(input?.action).toBe('light_attack');
      });

      it('should consume input', () => {
        inputBuffer.addInput('light_attack', 1.0);
        const input = inputBuffer.getNextInput(1.0);
        if (input) {
          inputBuffer.consumeInput(input);
        }
        const nextInput = inputBuffer.getNextInput(1.0);
        expect(nextInput).toBeNull();
      });

      it('should check if action is buffered', () => {
        inputBuffer.addInput('light_attack', 1.0);
        expect(inputBuffer.hasAction('light_attack', 1.0)).toBe(true);
        expect(inputBuffer.hasAction('heavy_attack', 1.0)).toBe(false);
      });

      it('should clear old inputs outside buffer window', () => {
        inputBuffer.addInput('light_attack', 1.0);
        inputBuffer.addInput('heavy_attack', 2.0);
        
        // After 0.4 seconds, first input should be gone (default window is 0.3)
        const input = inputBuffer.getNextInput(1.4);
        expect(input?.action).toBe('heavy_attack');
      });

      it('should limit buffer size', () => {
        for (let i = 0; i < 10; i++) {
          inputBuffer.addInput(`action_${i}`, i);
        }
        expect(inputBuffer.getSize()).toBeLessThanOrEqual(5);
      });

      it('should clear all inputs', () => {
        inputBuffer.addInput('light_attack', 1.0);
        inputBuffer.addInput('heavy_attack', 1.1);
        inputBuffer.clear();
        expect(inputBuffer.getSize()).toBe(0);
      });
    });

    describe('Combo Buffering', () => {
      it('should buffer combo inputs during recovery', () => {
        inputBuffer.addInput('light_attack', 1.0);
        inputBuffer.addInput('light_attack', 1.1);
        inputBuffer.addInput('light_attack', 1.2);

        expect(inputBuffer.getSize()).toBe(3);
      });

      it('should consume inputs in order', () => {
        inputBuffer.addInput('light_attack', 1.0);
        inputBuffer.addInput('heavy_attack', 1.1);

        const first = inputBuffer.getNextInput(1.0);
        expect(first?.action).toBe('light_attack');
        if (first) inputBuffer.consumeInput(first);

        const second = inputBuffer.getNextInput(1.0);
        expect(second?.action).toBe('heavy_attack');
      });
    });
  });
});
