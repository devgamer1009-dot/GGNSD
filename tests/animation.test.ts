import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationStateMachine } from '../src/engine/characters/AnimationStateMachine.js';
import { CharacterState } from '../src/engine/physics/CharacterStateMachine.js';

describe('AnimationStateMachine', () => {
  let animationSM: AnimationStateMachine;

  beforeEach(() => {
    animationSM = new AnimationStateMachine();
  });

  describe('Initial State', () => {
    it('should start in IDLE state', () => {
      expect(animationSM.getCurrentState()).toBe(CharacterState.IDLE);
    });

    it('should have null previous state initially', () => {
      expect(animationSM.getPreviousState()).toBeNull();
    });

    it('should have valid initial clip', () => {
      const clip = animationSM.getCurrentClip();
      expect(clip).toBeDefined();
      expect(clip?.name).toBe('idle');
    });
  });

  describe('State Transitions', () => {
    it('should transition from IDLE to WALK', () => {
      animationSM.update(0.016, CharacterState.WALK);
      expect(animationSM.getCurrentState()).toBe(CharacterState.WALK);
      expect(animationSM.getPreviousState()).toBe(CharacterState.IDLE);
    });

    it('should transition from WALK to SPRINT', () => {
      animationSM.update(0.016, CharacterState.WALK);
      animationSM.update(0.016, CharacterState.SPRINT);
      expect(animationSM.getCurrentState()).toBe(CharacterState.SPRINT);
      expect(animationSM.getPreviousState()).toBe(CharacterState.WALK);
    });

    it('should transition from IDLE to JUMP', () => {
      animationSM.update(0.016, CharacterState.JUMP);
      expect(animationSM.getCurrentState()).toBe(CharacterState.JUMP);
    });

    it('should transition from JUMP to FALL', () => {
      animationSM.update(0.016, CharacterState.JUMP);
      animationSM.update(0.016, CharacterState.FALL);
      expect(animationSM.getCurrentState()).toBe(CharacterState.FALL);
    });

    it('should transition to SWIM', () => {
      animationSM.update(0.016, CharacterState.SWIM);
      expect(animationSM.getCurrentState()).toBe(CharacterState.SWIM);
    });

    it('should transition to DODGE', () => {
      animationSM.update(0.016, CharacterState.DODGE);
      expect(animationSM.getCurrentState()).toBe(CharacterState.DODGE);
    });
  });

  describe('Blend Weights', () => {
    it('should start with full weight on current state', () => {
      const weights = animationSM.getBlendWeights();
      expect(weights.current).toBe(1.0);
      expect(weights.previous).toBe(0.0);
    });

    it('should blend during transition', () => {
      animationSM.update(0.016, CharacterState.WALK);
      
      // Immediately after transition, should be blending
      const weights = animationSM.getBlendWeights();
      expect(weights.current).toBeLessThan(1.0);
      expect(weights.previous).toBeGreaterThan(0.0);
    });

    it('should complete blend after blend duration', () => {
      animationSM.update(0.016, CharacterState.WALK);
      
      // Wait for blend to complete (default 0.2s)
      for (let i = 0; i < 20; i++) {
        animationSM.update(0.016, CharacterState.WALK);
      }
      
      const weights = animationSM.getBlendWeights();
      expect(weights.current).toBeCloseTo(1.0, 2);
      expect(weights.previous).toBeCloseTo(0.0, 2);
    });

    it('should always sum to 1.0', () => {
      animationSM.update(0.016, CharacterState.WALK);
      
      for (let i = 0; i < 10; i++) {
        animationSM.update(0.016, CharacterState.WALK);
        expect(animationSM.validateBlendWeights()).toBe(true);
      }
    });

    it('should have valid blend weights at all times', () => {
      const states = [
        CharacterState.IDLE,
        CharacterState.WALK,
        CharacterState.SPRINT,
        CharacterState.JUMP,
        CharacterState.FALL,
        CharacterState.SWIM,
        CharacterState.DODGE,
      ];

      for (const state of states) {
        animationSM.update(0.016, state);
        expect(animationSM.validateBlendWeights()).toBe(true);
      }
    });
  });

  describe('Animation Clips', () => {
    it('should have clip for each state', () => {
      const states = [
        CharacterState.IDLE,
        CharacterState.WALK,
        CharacterState.SPRINT,
        CharacterState.JUMP,
        CharacterState.FALL,
        CharacterState.STEEP_SLOPE_SLIDE,
        CharacterState.SWIM,
        CharacterState.DODGE,
      ];

      for (const state of states) {
        animationSM.forceState(state);
        const clip = animationSM.getCurrentClip();
        expect(clip).toBeDefined();
        expect(clip?.name).toBeTruthy();
      }
    });

    it('should have correct clip properties', () => {
      const clip = animationSM.getCurrentClip();
      expect(clip).toBeDefined();
      expect(clip?.duration).toBeGreaterThan(0);
      expect(typeof clip?.loop).toBe('boolean');
      expect(clip?.blendMode).toBe('override');
    });

    it('should have different durations for different states', () => {
      const idleClip = animationSM.getCurrentClip();
      
      animationSM.forceState(CharacterState.SPRINT);
      const sprintClip = animationSM.getCurrentClip();
      
      expect(idleClip?.duration).not.toBe(sprintClip?.duration);
    });
  });

  describe('Animation Time', () => {
    it('should advance time', () => {
      const initialTime = animationSM.getNormalizedTime();
      animationSM.update(0.1, CharacterState.IDLE);
      const newTime = animationSM.getNormalizedTime();
      
      expect(newTime).toBeGreaterThan(initialTime);
    });

    it('should loop looping animations', () => {
      animationSM.forceState(CharacterState.IDLE);
      
      // Update past duration
      for (let i = 0; i < 200; i++) {
        animationSM.update(0.016, CharacterState.IDLE);
      }
      
      const normalizedTime = animationSM.getNormalizedTime();
      expect(normalizedTime).toBeLessThan(1.0); // Should have looped
    });

    it('should not loop non-looping animations', () => {
      animationSM.forceState(CharacterState.JUMP);
      
      // Update past duration
      for (let i = 0; i < 100; i++) {
        animationSM.update(0.016, CharacterState.JUMP);
      }
      
      expect(animationSM.isAnimationComplete()).toBe(true);
    });

    it('should reset time on state change', () => {
      animationSM.update(0.1, CharacterState.IDLE);
      const time1 = animationSM.getNormalizedTime();
      
      animationSM.update(0.016, CharacterState.WALK);
      const time2 = animationSM.getNormalizedTime();
      
      expect(time2).toBeLessThan(time1); // Should have reset
    });
  });

  describe('Force State', () => {
    it('should force state without blending', () => {
      animationSM.forceState(CharacterState.SPRINT);
      
      expect(animationSM.getCurrentState()).toBe(CharacterState.SPRINT);
      expect(animationSM.getPreviousState()).toBeNull();
      
      const weights = animationSM.getBlendWeights();
      expect(weights.current).toBe(1.0);
      expect(weights.previous).toBe(0.0);
    });
  });

  describe('Animation Completion', () => {
    it('should detect non-looping animation completion', () => {
      animationSM.forceState(CharacterState.JUMP);
      
      expect(animationSM.isAnimationComplete()).toBe(false);
      
      // Update past duration
      for (let i = 0; i < 100; i++) {
        animationSM.update(0.016, CharacterState.JUMP);
      }
      
      expect(animationSM.isAnimationComplete()).toBe(true);
    });

    it('should never complete looping animations', () => {
      animationSM.forceState(CharacterState.IDLE);
      
      for (let i = 0; i < 1000; i++) {
        animationSM.update(0.016, CharacterState.IDLE);
        expect(animationSM.isAnimationComplete()).toBe(false);
      }
    });
  });

  describe('Get All Clips', () => {
    it('should return all animation clips', () => {
      const clips = animationSM.getAllClips();
      expect(clips.size).toBeGreaterThan(0);
      expect(clips.has(CharacterState.IDLE)).toBe(true);
      expect(clips.has(CharacterState.WALK)).toBe(true);
    });
  });
});
