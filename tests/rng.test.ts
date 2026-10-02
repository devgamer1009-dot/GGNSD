import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/engine/utils/SeededRNG.js';

describe('SeededRNG', () => {
  describe('Determinism', () => {
    it('should produce same sequence with same seed', () => {
      const rng1 = createRNG(12345);
      const rng2 = createRNG(12345);
      
      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];
      
      expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = createRNG(12345);
      const rng2 = createRNG(54321);
      
      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];
      
      expect(seq1).not.toEqual(seq2);
    });

    it('should be reproducible across multiple calls', () => {
      const rng = createRNG(999);
      
      // First sequence
      const seq1 = [rng.next(), rng.next(), rng.next()];
      
      // Reset and get same sequence
      rng.setSeed(999);
      const seq2 = [rng.next(), rng.next(), rng.next()];
      
      expect(seq1).toEqual(seq2);
    });
  });

  describe('Value Range', () => {
    it('should produce values in [0, 1) range', () => {
      const rng = createRNG(42);
      
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should produce integers in specified range', () => {
      const rng = createRNG(42);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(1, 10);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should produce floats in specified range', () => {
      const rng = createRNG(42);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(5.0, 10.0);
        expect(value).toBeGreaterThanOrEqual(5.0);
        expect(value).toBeLessThan(10.0);
      }
    });

    it('should handle negative ranges', () => {
      const rng = createRNG(42);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(-10.0, -5.0);
        expect(value).toBeGreaterThanOrEqual(-10.0);
        expect(value).toBeLessThan(-5.0);
      }
    });

    it('should handle ranges crossing zero', () => {
      const rng = createRNG(42);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(-5.0, 5.0);
        expect(value).toBeGreaterThanOrEqual(-5.0);
        expect(value).toBeLessThan(5.0);
      }
    });
  });

  describe('Distribution', () => {
    it('should produce roughly uniform distribution', () => {
      const rng = createRNG(42);
      const buckets = new Array(10).fill(0);
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * 10);
        buckets[bucket]++;
      }
      
      // Each bucket should have roughly 10% of values (±2%)
      const expected = iterations / 10;
      for (const count of buckets) {
        expect(count).toBeGreaterThan(expected * 0.8);
        expect(count).toBeLessThan(expected * 1.2);
      }
    });

    it('should produce uniform integer distribution', () => {
      const rng = createRNG(42);
      const counts = new Array(6).fill(0); // 1-6
      const iterations = 6000;
      
      for (let i = 0; i < iterations; i++) {
        const value = rng.nextInt(1, 6);
        counts[value - 1]++;
      }
      
      // Each value should appear roughly 1/6 of the time (±5%)
      const expected = iterations / 6;
      for (const count of counts) {
        expect(count).toBeGreaterThan(expected * 0.85);
        expect(count).toBeLessThan(expected * 1.15);
      }
    });
  });

  describe('Seed Management', () => {
    it('should get current seed', () => {
      const rng = createRNG(12345);
      expect(rng.getSeed()).toBe(12345);
    });

    it('should update seed', () => {
      const rng = createRNG(12345);
      rng.next();
      rng.next();
      
      const newSeed = 99999;
      rng.setSeed(newSeed);
      
      expect(rng.getSeed()).toBe(newSeed);
    });

    it('should reset sequence when seed is changed', () => {
      const rng = createRNG(42);
      const seq1 = [rng.next(), rng.next(), rng.next()];
      
      rng.setSeed(42);
      const seq2 = [rng.next(), rng.next(), rng.next()];
      
      expect(seq1).toEqual(seq2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle seed of 0', () => {
      const rng = createRNG(0);
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle negative seed', () => {
      const rng = createRNG(-12345);
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle very large seed', () => {
      const rng = createRNG(Number.MAX_SAFE_INTEGER);
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle single-value integer range', () => {
      const rng = createRNG(42);
      const value = rng.nextInt(5, 5);
      expect(value).toBe(5);
    });

    it('should handle zero-width float range', () => {
      const rng = createRNG(42);
      const value = rng.nextFloat(5.0, 5.0);
      expect(value).toBe(5.0);
    });
  });

  describe('Performance', () => {
    it('should generate many values quickly', () => {
      const rng = createRNG(42);
      const iterations = 100000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        rng.next();
      }
      
      const elapsed = performance.now() - start;
      const perSecond = iterations / (elapsed / 1000);
      
      // Should generate at least 10M values per second
      expect(perSecond).toBeGreaterThan(10_000_000);
    });
  });
});
