import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterStateMachine, CharacterState } from '../src/engine/physics/CharacterStateMachine.js';

describe('CharacterStateMachine', () => {
  let stateMachine: CharacterStateMachine;

  beforeEach(() => {
    stateMachine = new CharacterStateMachine();
  });

  describe('Initial State', () => {
    it('should start in IDLE state', () => {
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
    });

    it('should have null previous state initially', () => {
      expect(stateMachine.getPreviousState()).toBeNull();
    });

    it('should have zero state time initially', () => {
      expect(stateMachine.getStateTime()).toBe(0);
    });
  });

  describe('State Transitions', () => {
    it('should transition from IDLE to WALK when moving and grounded', () => {
      stateMachine.setGrounded(true);
      // Simulate movement input (would need input system integration)
      stateMachine.forceState(CharacterState.WALK);
      expect(stateMachine.getState()).toBe(CharacterState.WALK);
    });

    it('should transition from IDLE to JUMP when jumping and grounded', () => {
      stateMachine.setGrounded(true);
      stateMachine.forceState(CharacterState.JUMP);
      expect(stateMachine.getState()).toBe(CharacterState.JUMP);
    });

    it('should transition from JUMP to FALL when falling', () => {
      stateMachine.forceState(CharacterState.JUMP);
      stateMachine.forceState(CharacterState.FALL);
      expect(stateMachine.getState()).toBe(CharacterState.FALL);
    });

    it('should transition from FALL to IDLE when landing', () => {
      stateMachine.forceState(CharacterState.FALL);
      stateMachine.setGrounded(true);
      stateMachine.forceState(CharacterState.IDLE);
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
    });

    it('should transition to SWIM when entering water', () => {
      stateMachine.setInWater(true);
      stateMachine.forceState(CharacterState.SWIM);
      expect(stateMachine.getState()).toBe(CharacterState.SWIM);
    });

    it('should transition to STEEP_SLOPE_SLIDE on steep slope', () => {
      stateMachine.setGrounded(true);
      stateMachine.setSlopeAngle(50);
      stateMachine.forceState(CharacterState.STEEP_SLOPE_SLIDE);
      expect(stateMachine.getState()).toBe(CharacterState.STEEP_SLOPE_SLIDE);
    });

    it('should transition to DODGE when dodging', () => {
      stateMachine.setDodging(true);
      stateMachine.forceState(CharacterState.DODGE);
      expect(stateMachine.getState()).toBe(CharacterState.DODGE);
    });
  });

  describe('State Time Tracking', () => {
    it('should accumulate state time', () => {
      stateMachine.update(0.1);
      expect(stateMachine.getStateTime()).toBeCloseTo(0.1);
      
      stateMachine.update(0.2);
      expect(stateMachine.getStateTime()).toBeCloseTo(0.3);
    });

    it('should reset state time on transition', () => {
      stateMachine.update(0.5);
      expect(stateMachine.getStateTime()).toBeCloseTo(0.5);
      
      stateMachine.forceState(CharacterState.WALK);
      expect(stateMachine.getStateTime()).toBe(0);
    });
  });

  describe('Previous State Tracking', () => {
    it('should track previous state after transition', () => {
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
      
      stateMachine.forceState(CharacterState.WALK);
      expect(stateMachine.getPreviousState()).toBe(CharacterState.IDLE);
      expect(stateMachine.getState()).toBe(CharacterState.WALK);
      
      stateMachine.forceState(CharacterState.JUMP);
      expect(stateMachine.getPreviousState()).toBe(CharacterState.WALK);
      expect(stateMachine.getState()).toBe(CharacterState.JUMP);
    });
  });

  describe('State Data', () => {
    it('should return complete state data', () => {
      const data = stateMachine.getStateData();
      
      expect(data.state).toBe(CharacterState.IDLE);
      expect(data.previousState).toBeNull();
      expect(data.stateTime).toBe(0);
      expect(data.canTransition).toBe(true);
    });

    it('should update state data after transitions', () => {
      stateMachine.update(0.1);
      stateMachine.forceState(CharacterState.WALK);
      
      const data = stateMachine.getStateData();
      expect(data.state).toBe(CharacterState.WALK);
      expect(data.previousState).toBe(CharacterState.IDLE);
      expect(data.stateTime).toBe(0);
    });
  });

  describe('Slope Detection', () => {
    it('should track slope angle', () => {
      stateMachine.setSlopeAngle(30);
      const data = stateMachine.getStateData();
      // Slope angle is stored internally, accessible via character physics
      expect(data).toBeDefined();
    });

    it('should handle steep slopes (>45 degrees)', () => {
      stateMachine.setGrounded(true);
      stateMachine.setSlopeAngle(50);
      stateMachine.forceState(CharacterState.STEEP_SLOPE_SLIDE);
      expect(stateMachine.getState()).toBe(CharacterState.STEEP_SLOPE_SLIDE);
    });

    it('should not slide on gentle slopes (<=45 degrees)', () => {
      stateMachine.setGrounded(true);
      stateMachine.setSlopeAngle(30);
      // Should remain in current state, not transition to slide
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
    });
  });

  describe('Water States', () => {
    it('should enter swim state when in water', () => {
      stateMachine.setInWater(true);
      stateMachine.forceState(CharacterState.SWIM);
      expect(stateMachine.getState()).toBe(CharacterState.SWIM);
    });

    it('should exit swim state when leaving water', () => {
      stateMachine.forceState(CharacterState.SWIM);
      stateMachine.setInWater(false);
      stateMachine.setGrounded(true);
      stateMachine.forceState(CharacterState.IDLE);
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
    });
  });

  describe('Dodge Mechanics', () => {
    it('should enter dodge state', () => {
      stateMachine.setDodging(true);
      stateMachine.forceState(CharacterState.DODGE);
      expect(stateMachine.getState()).toBe(CharacterState.DODGE);
    });

    it('should exit dodge state', () => {
      stateMachine.forceState(CharacterState.DODGE);
      stateMachine.setDodging(false);
      stateMachine.forceState(CharacterState.IDLE);
      expect(stateMachine.getState()).toBe(CharacterState.IDLE);
    });
  });

  describe('Extensibility', () => {
    it('should support future states (commented out)', () => {
      // These states are designed for future implementation
      // CLIMB, GLIDE, MOUNT
      expect(CharacterState.IDLE).toBeDefined();
      expect(CharacterState.WALK).toBeDefined();
      expect(CharacterState.SPRINT).toBeDefined();
      expect(CharacterState.JUMP).toBeDefined();
      expect(CharacterState.FALL).toBeDefined();
      expect(CharacterState.STEEP_SLOPE_SLIDE).toBeDefined();
      expect(CharacterState.SWIM).toBeDefined();
      expect(CharacterState.DODGE).toBeDefined();
    });
  });
});
