/**
 * Character State Machine
 * P9 - Player movement states with extensible design
 */

export enum CharacterState {
  IDLE = 'idle',
  WALK = 'walk',
  SPRINT = 'sprint',
  JUMP = 'jump',
  FALL = 'fall',
  STEEP_SLOPE_SLIDE = 'steep_slope_slide',
  SWIM = 'swim',
  DODGE = 'dodge',
  // Future states (designed for extension)
  // CLIMB = 'climb',
  // GLIDE = 'glide',
  // MOUNT = 'mount',
}

export interface StateTransition {
  from: CharacterState;
  to: CharacterState;
  condition: () => boolean;
}

export interface CharacterStateData {
  state: CharacterState;
  previousState: CharacterState | null;
  stateTime: number; // Time in current state
  canTransition: boolean;
}

export class CharacterStateMachine {
  private currentState: CharacterState = CharacterState.IDLE;
  private previousState: CharacterState | null = null;
  private stateTime: number = 0;
  private transitions: StateTransition[] = [];
  
  // State flags
  private isGrounded: boolean = false;
  private isInWater: boolean = false;
  private slopeAngle: number = 0;
  private isDodging: boolean = false;
  private dodgeCooldown: number = 0;

  constructor() {
    this.setupTransitions();
  }

  /**
   * Setup all valid state transitions
   */
  private setupTransitions(): void {
    // From IDLE
    this.addTransition(CharacterState.IDLE, CharacterState.WALK, () => this.isMoving() && this.isGrounded);
    this.addTransition(CharacterState.IDLE, CharacterState.SPRINT, () => this.isMoving() && this.isSprinting() && this.isGrounded);
    this.addTransition(CharacterState.IDLE, CharacterState.JUMP, () => this.isJumping() && this.isGrounded);
    this.addTransition(CharacterState.IDLE, CharacterState.FALL, () => !this.isGrounded && !this.isInWater);
    this.addTransition(CharacterState.IDLE, CharacterState.SWIM, () => this.isInWater);
    this.addTransition(CharacterState.IDLE, CharacterState.DODGE, () => this.isDodging && this.dodgeCooldown <= 0);

    // From WALK
    this.addTransition(CharacterState.WALK, CharacterState.IDLE, () => !this.isMoving() && this.isGrounded);
    this.addTransition(CharacterState.WALK, CharacterState.SPRINT, () => this.isSprinting() && this.isGrounded);
    this.addTransition(CharacterState.WALK, CharacterState.JUMP, () => this.isJumping() && this.isGrounded);
    this.addTransition(CharacterState.WALK, CharacterState.FALL, () => !this.isGrounded && !this.isInWater);
    this.addTransition(CharacterState.WALK, CharacterState.SWIM, () => this.isInWater);
    this.addTransition(CharacterState.WALK, CharacterState.DODGE, () => this.isDodging && this.dodgeCooldown <= 0);

    // From SPRINT
    this.addTransition(CharacterState.SPRINT, CharacterState.IDLE, () => !this.isMoving() && this.isGrounded);
    this.addTransition(CharacterState.SPRINT, CharacterState.WALK, () => !this.isSprinting() && this.isGrounded);
    this.addTransition(CharacterState.SPRINT, CharacterState.JUMP, () => this.isJumping() && this.isGrounded);
    this.addTransition(CharacterState.SPRINT, CharacterState.FALL, () => !this.isGrounded && !this.isInWater);
    this.addTransition(CharacterState.SPRINT, CharacterState.SWIM, () => this.isInWater);
    this.addTransition(CharacterState.SPRINT, CharacterState.DODGE, () => this.isDodging && this.dodgeCooldown <= 0);

    // From JUMP
    this.addTransition(CharacterState.JUMP, CharacterState.FALL, () => this.isFalling());
    this.addTransition(CharacterState.JUMP, CharacterState.SWIM, () => this.isInWater);
    this.addTransition(CharacterState.JUMP, CharacterState.IDLE, () => this.isGrounded && !this.isMoving());
    this.addTransition(CharacterState.JUMP, CharacterState.WALK, () => this.isGrounded && this.isMoving());

    // From FALL
    this.addTransition(CharacterState.FALL, CharacterState.IDLE, () => this.isGrounded && !this.isMoving());
    this.addTransition(CharacterState.FALL, CharacterState.WALK, () => this.isGrounded && this.isMoving());
    this.addTransition(CharacterState.FALL, CharacterState.SPRINT, () => this.isGrounded && this.isSprinting());
    this.addTransition(CharacterState.FALL, CharacterState.SWIM, () => this.isInWater);
    this.addTransition(CharacterState.FALL, CharacterState.STEEP_SLOPE_SLIDE, () => this.isGrounded && this.slopeAngle > 45);

    // From STEEP_SLOPE_SLIDE
    this.addTransition(CharacterState.STEEP_SLOPE_SLIDE, CharacterState.FALL, () => !this.isGrounded);
    this.addTransition(CharacterState.STEEP_SLOPE_SLIDE, CharacterState.IDLE, () => this.isGrounded && this.slopeAngle <= 45 && !this.isMoving());
    this.addTransition(CharacterState.STEEP_SLOPE_SLIDE, CharacterState.WALK, () => this.isGrounded && this.slopeAngle <= 45 && this.isMoving());
    this.addTransition(CharacterState.STEEP_SLOPE_SLIDE, CharacterState.SWIM, () => this.isInWater);

    // From SWIM
    this.addTransition(CharacterState.SWIM, CharacterState.IDLE, () => !this.isInWater && this.isGrounded);
    this.addTransition(CharacterState.SWIM, CharacterState.WALK, () => !this.isInWater && this.isGrounded && this.isMoving());
    this.addTransition(CharacterState.SWIM, CharacterState.FALL, () => !this.isInWater && !this.isGrounded);

    // From DODGE
    this.addTransition(CharacterState.DODGE, CharacterState.IDLE, () => !this.isDodging && this.isGrounded);
    this.addTransition(CharacterState.DODGE, CharacterState.WALK, () => !this.isDodging && this.isGrounded && this.isMoving());
    this.addTransition(CharacterState.DODGE, CharacterState.FALL, () => !this.isGrounded);
  }

  /**
   * Add a state transition
   */
  private addTransition(from: CharacterState, to: CharacterState, condition: () => boolean): void {
    this.transitions.push({ from, to, condition });
  }

  /**
   * Update state machine
   */
  update(deltaTime: number): void {
    this.stateTime += deltaTime;
    
    // Update dodge cooldown
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= deltaTime;
    }

    // Check transitions
    for (const transition of this.transitions) {
      if (transition.from === this.currentState && transition.condition()) {
        this.transitionTo(transition.to);
        break;
      }
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CharacterState): void {
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTime = 0;

    // Reset dodge flag after transition
    if (newState === CharacterState.DODGE) {
      this.dodgeCooldown = 1.0; // 1 second cooldown
    }
  }

  /**
   * Get current state
   */
  getState(): CharacterState {
    return this.currentState;
  }

  /**
   * Get previous state
   */
  getPreviousState(): CharacterState | null {
    return this.previousState;
  }

  /**
   * Get time in current state
   */
  getStateTime(): number {
    return this.stateTime;
  }

  /**
   * Get state data
   */
  getStateData(): CharacterStateData {
    return {
      state: this.currentState,
      previousState: this.previousState,
      stateTime: this.stateTime,
      canTransition: true,
    };
  }

  // === Input setters ===

  setGrounded(grounded: boolean): void {
    this.isGrounded = grounded;
  }

  setInWater(inWater: boolean): void {
    this.isInWater = inWater;
  }

  setSlopeAngle(angle: number): void {
    this.slopeAngle = angle;
  }

  setDodging(dodging: boolean): void {
    this.isDodging = dodging;
  }

  // === Input getters (would be connected to input system) ===

  private isMoving(): boolean {
    // Would check input system for movement input
    return false; // Placeholder
  }

  private isSprinting(): boolean {
    // Would check input system for sprint input
    return false; // Placeholder
  }

  private isJumping(): boolean {
    // Would check input system for jump input
    return false; // Placeholder
  }

  private isFalling(): boolean {
    // Would check velocity
    return false; // Placeholder
  }

  /**
   * Force state (for testing/debugging)
   */
  forceState(state: CharacterState): void {
    this.previousState = this.currentState;
    this.currentState = state;
    this.stateTime = 0;
  }
}
