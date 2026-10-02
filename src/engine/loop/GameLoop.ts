/**
 * Fixed timestep game loop with render interpolation
 * Engine layer — never imports game
 */

export interface GameLoopCallbacks {
  update: (dt: number) => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  private readonly timestep: number;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private callbacks: GameLoopCallbacks | null = null;
  private frameId = 0;

  // Stats
  private tickCount = 0;
  private frameCount = 0;
  private ticksPerSecond = 0;
  private framesPerSecond = 0;
  private statsTimer = 0;

  constructor(timestep = 1 / 60) {
    this.timestep = timestep;
  }

  start(callbacks: GameLoopCallbacks): void {
    this.callbacks = callbacks;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.running || !this.callbacks) return;

    const frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp frame time to avoid spiral of death
    const clampedFrameTime = Math.min(frameTime, 0.25);
    this.accumulator += clampedFrameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.timestep) {
      this.callbacks.update(this.timestep);
      this.accumulator -= this.timestep;
      this.tickCount++;
    }

    // Render with interpolation
    const alpha = this.accumulator / this.timestep;
    this.callbacks.render(alpha);
    this.frameCount++;

    // Update stats every second
    this.statsTimer += frameTime;
    if (this.statsTimer >= 1.0) {
      this.ticksPerSecond = this.tickCount;
      this.framesPerSecond = this.frameCount;
      this.tickCount = 0;
      this.frameCount = 0;
      this.statsTimer = 0;
    }

    this.frameId = requestAnimationFrame(this.loop);
  };

  getTicksPerSecond(): number {
    return this.ticksPerSecond;
  }

  getFramesPerSecond(): number {
    return this.framesPerSecond;
  }

  getTimestep(): number {
    return this.timestep;
  }

  isRunning(): boolean {
    return this.running;
  }
}

export function createGameLoop(timestep?: number): GameLoop {
  return new GameLoop(timestep);
}
