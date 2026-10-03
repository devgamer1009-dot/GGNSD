/**
 * Animation State Machine - Blending tied to MOVEMENT.md states
 * P11 - Animation state machine with smooth transitions
 */

import { CharacterState } from '../physics/CharacterStateMachine.js';

export interface AnimationClip {
  name: string;
  duration: number;
  loop: boolean;
  blendMode: 'override' | 'additive';
}

export interface AnimationState {
  clip: AnimationClip;
  speed: number;
  weight: number;
}

export interface AnimationTransition {
  from: CharacterState;
  to: CharacterState;
  blendDuration: number;
}

/**
 * Animation state machine with blending
 */
export class AnimationStateMachine {
  private currentState: CharacterState = CharacterState.IDLE;
  private previousState: CharacterState | null = null;
  private currentTime: number = 0;
  private blendTime: number = 0;
  private blendDuration: number = 0.2;
  
  private animationClips: Map<CharacterState, AnimationClip> = new Map();
  private currentWeight: number = 1.0;
  private previousWeight: number = 0.0;
  
  private transitions: Map<string, AnimationTransition> = new Map();

  constructor() {
    this.setupDefaultClips();
    this.setupTransitions();
  }

  /**
   * Setup default animation clips for each state
   */
  private setupDefaultClips(): void {
    this.animationClips.set(CharacterState.IDLE, {
      name: 'idle',
      duration: 2.0,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.WALK, {
      name: 'walk',
      duration: 1.0,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.SPRINT, {
      name: 'sprint',
      duration: 0.6,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.JUMP, {
      name: 'jump',
      duration: 0.8,
      loop: false,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.FALL, {
      name: 'fall',
      duration: 0.5,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.STEEP_SLOPE_SLIDE, {
      name: 'slide',
      duration: 1.0,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.SWIM, {
      name: 'swim',
      duration: 1.5,
      loop: true,
      blendMode: 'override',
    });

    this.animationClips.set(CharacterState.DODGE, {
      name: 'dodge',
      duration: 0.5,
      loop: false,
      blendMode: 'override',
    });

    // Future states
    this.animationClips.set('MOUNT' as CharacterState, {
      name: 'mount',
      duration: 1.0,
      loop: false,
      blendMode: 'override',
    });
  }

  /**
   * Setup animation transitions
   */
  private setupTransitions(): void {
    // Fast transitions (combat states)
    this.addTransition(CharacterState.IDLE, CharacterState.DODGE, 0.1);
    this.addTransition(CharacterState.WALK, CharacterState.DODGE, 0.1);
    this.addTransition(CharacterState.SPRINT, CharacterState.DODGE, 0.1);

    // Medium transitions (movement changes)
    this.addTransition(CharacterState.IDLE, CharacterState.WALK, 0.2);
    this.addTransition(CharacterState.WALK, CharacterState.IDLE, 0.2);
    this.addTransition(CharacterState.WALK, CharacterState.SPRINT, 0.2);
    this.addTransition(CharacterState.SPRINT, CharacterState.WALK, 0.2);

    // Slow transitions (state changes)
    this.addTransition(CharacterState.IDLE, CharacterState.JUMP, 0.3);
    this.addTransition(CharacterState.JUMP, CharacterState.FALL, 0.3);
    this.addTransition(CharacterState.FALL, CharacterState.IDLE, 0.3);
    this.addTransition(CharacterState.IDLE, CharacterState.SWIM, 0.4);
    this.addTransition(CharacterState.SWIM, CharacterState.IDLE, 0.4);
  }

  /**
   * Add animation transition
   */
  private addTransition(from: CharacterState, to: CharacterState, blendDuration: number): void {
    const key = `${from}->${to}`;
    this.transitions.set(key, { from, to, blendDuration });
  }

  /**
   * Update animation state machine
   */
  update(deltaTime: number, movementState: CharacterState): void {
    // Check if state changed
    if (movementState !== this.currentState) {
      this.transitionTo(movementState);
    }

    // Update time
    this.currentTime += deltaTime;

    // Update blend
    if (this.blendTime < this.blendDuration) {
      this.blendTime += deltaTime;
      const blendProgress = Math.min(this.blendTime / this.blendDuration, 1.0);
      
      // Smooth blend using easing
      const eased = this.easeInOutCubic(blendProgress);
      this.currentWeight = eased;
      this.previousWeight = 1.0 - eased;
    } else {
      this.currentWeight = 1.0;
      this.previousWeight = 0.0;
    }

    // Loop animation if needed
    const clip = this.animationClips.get(this.currentState);
    if (clip && clip.loop && this.currentTime > clip.duration) {
      this.currentTime = this.currentTime % clip.duration;
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CharacterState): void {
    const key = `${this.currentState}->${newState}`;
    const transition = this.transitions.get(key);

    this.previousState = this.currentState;
    this.currentState = newState;
    this.currentTime = 0;

    if (transition) {
      this.blendDuration = transition.blendDuration;
    } else {
      this.blendDuration = 0.2; // Default blend time
    }

    this.blendTime = 0;
    this.currentWeight = 0.0;
    this.previousWeight = 1.0;
  }

  /**
   * Get current animation state
   */
  getCurrentState(): CharacterState {
    return this.currentState;
  }

  /**
   * Get previous animation state
   */
  getPreviousState(): CharacterState | null {
    return this.previousState;
  }

  /**
   * Get current animation clip
   */
  getCurrentClip(): AnimationClip | undefined {
    return this.animationClips.get(this.currentState);
  }

  /**
   * Get previous animation clip
   */
  getPreviousClip(): AnimationClip | undefined {
    if (!this.previousState) return undefined;
    return this.animationClips.get(this.previousState);
  }

  /**
   * Get blend weights
   */
  getBlendWeights(): { current: number; previous: number } {
    return {
      current: this.currentWeight,
      previous: this.previousWeight,
    };
  }

  /**
   * Get normalized animation time (0-1)
   */
  getNormalizedTime(): number {
    const clip = this.animationClips.get(this.currentState);
    if (!clip) return 0;
    return this.currentTime / clip.duration;
  }

  /**
   * Check if animation is complete (for non-looping)
   */
  isAnimationComplete(): boolean {
    const clip = this.animationClips.get(this.currentState);
    if (!clip || clip.loop) return false;
    return this.currentTime >= clip.duration;
  }

  /**
   * Easing function for smooth blending
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Force state (for testing)
   */
  forceState(state: CharacterState): void {
    this.currentState = state;
    this.previousState = null;
    this.currentTime = 0;
    this.currentWeight = 1.0;
    this.previousWeight = 0.0;
  }

  /**
   * Get all animation clips
   */
  getAllClips(): Map<CharacterState, AnimationClip> {
    return this.animationClips;
  }

  /**
   * Validate blend weights sum to 1
   */
  validateBlendWeights(): boolean {
    const { current, previous } = this.getBlendWeights();
    const sum = current + previous;
    return Math.abs(sum - 1.0) < 0.001;
  }
}
