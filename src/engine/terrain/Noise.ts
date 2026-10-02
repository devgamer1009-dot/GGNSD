/**
 * Noise functions for terrain generation
 * Engine layer — never imports game
 * 
 * Implements Perlin noise, fBm, ridged multifractal, and domain warping.
 */

// Permutation table for Perlin noise
const PERM = new Uint8Array(512);
const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

// Initialize permutation table with seed
export function initNoise(seed: number): void {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  
  // Fisher-Yates shuffle with seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255]!;
  }
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 11;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * 3D Perlin noise
 */
export function perlin3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  
  const A = PERM[X]! + Y;
  const AA = PERM[A]! + Z;
  const AB = PERM[A + 1]! + Z;
  const B = PERM[X + 1]! + Y;
  const BA = PERM[B]! + Z;
  const BB = PERM[B + 1]! + Z;
  
  return lerp(
    lerp(
      lerp(grad(PERM[AA]!, x, y, z), grad(PERM[BA]!, x - 1, y, z), u),
      lerp(grad(PERM[AB]!, x, y - 1, z), grad(PERM[BB]!, x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(PERM[AA + 1]!, x, y, z - 1), grad(PERM[BA + 1]!, x - 1, y, z - 1), u),
      lerp(grad(PERM[AB + 1]!, x, y - 1, z - 1), grad(PERM[BB + 1]!, x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
}

/**
 * 2D Perlin noise (z=0)
 */
export function perlin2(x: number, y: number): number {
  return perlin3(x, y, 0);
}

/**
 * Fractal Brownian Motion (fBm)
 */
export function fbm(
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += perlin2(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
}

/**
 * Ridged multifractal noise
 */
export function ridged(
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let weight = 1;
  
  for (let i = 0; i < octaves; i++) {
    let signal = perlin2(x * frequency, y * frequency);
    signal = 1.0 - Math.abs(signal);
    signal *= signal;
    signal *= weight;
    weight = Math.min(1.0, Math.max(0.0, signal * 2.0));
    
    value += signal * amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value * 2.0 - 1.0;
}

/**
 * Domain warping
 */
export function domainWarp(
  x: number,
  y: number,
  warpStrength: number,
  warpOctaves: number
): { x: number; y: number } {
  const qx = fbm(x, y, warpOctaves, 2.0, 0.5);
  const qy = fbm(x + 5.2, y + 1.3, warpOctaves, 2.0, 0.5);
  
  return {
    x: x + qx * warpStrength,
    y: y + qy * warpStrength,
  };
}

/**
 * Simple erosion approximation
 * Simulates thermal erosion by smoothing steep slopes
 */
export function thermalErosion(heights: Float32Array, width: number, height: number, iterations: number): void {
  const talusAngle = 0.05; // Maximum slope before erosion
  
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const h = heights[idx]!;
        
        // Find lowest neighbor
        let minH = h;
        let minIdx = idx;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            const nh = heights[nIdx]!;
            if (nh < minH) {
              minH = nh;
              minIdx = nIdx;
            }
          }
        }
        
        // Erode if slope exceeds talus angle
        const slope = h - minH;
        if (slope > talusAngle) {
          const moveAmount = (slope - talusAngle) * 0.5;
          heights[idx] = h - moveAmount;
          heights[minIdx] = minH + moveAmount;
        }
      }
    }
  }
}

/**
 * River carving
 * Carves rivers along flow paths
 */
export function carveRiver(
  heights: Float32Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  steps: number,
  depth: number
): void {
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < steps; i++) {
    const idx = Math.floor(y) * width + Math.floor(x);
    if (idx < 0 || idx >= heights.length) break;
    
    // Carve at current position
    heights[idx] = Math.max(0, heights[idx]! - depth);
    
    // Also carve neighbors for width
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nIdx = (Math.floor(y) + dy) * width + (Math.floor(x) + dx);
        if (nIdx >= 0 && nIdx < heights.length) {
          heights[nIdx] = Math.max(0, heights[nIdx]! - depth * 0.5);
        }
      }
    }
    
    // Flow to lowest neighbor
    let minH = heights[idx]!;
    let nextX = x;
    let nextY = y;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const nIdx = Math.floor(ny) * width + Math.floor(nx);
        const nh = heights[nIdx]!;
        if (nh < minH) {
          minH = nh;
          nextX = nx;
          nextY = ny;
        }
      }
    }
    
    // Stop if we're at a local minimum
    if (nextX === x && nextY === y) break;
    
    x = nextX;
    y = nextY;
  }
}
