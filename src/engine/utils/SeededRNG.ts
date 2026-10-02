/**
 * Seeded RNG — deterministic random numbers
 * Engine layer — never imports game
 * 
 * Uses mulberry32 algorithm for fast, deterministic RNG
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    // Mulberry32 algorithm
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  setSeed(seed: number): void {
    this.state = seed;
  }

  getSeed(): number {
    return this.state;
  }
}

export function createRNG(seed: number): SeededRNG {
  return new SeededRNG(seed);
}
