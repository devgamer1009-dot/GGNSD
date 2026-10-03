import { describe, it, expect } from 'vitest';
import { PriorityQueue } from '../src/engine/streaming/PriorityQueue.js';

describe('PriorityQueue', () => {
  describe('Basic Operations', () => {
    it('should start empty', () => {
      const queue = new PriorityQueue<string>();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });

    it('should enqueue and dequeue items', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 1);
      queue.enqueue('second', 2);
      queue.enqueue('third', 3);

      expect(queue.size()).toBe(3);
      expect(queue.dequeue()).toBe('first');
      expect(queue.dequeue()).toBe('second');
      expect(queue.dequeue()).toBe('third');
      expect(queue.isEmpty()).toBe(true);
    });

    it('should maintain priority order', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('low', 10);
      queue.enqueue('high', 1);
      queue.enqueue('medium', 5);

      expect(queue.dequeue()).toBe('high');
      expect(queue.dequeue()).toBe('medium');
      expect(queue.dequeue()).toBe('low');
    });

    it('should handle equal priorities', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 5);
      queue.enqueue('second', 5);
      queue.enqueue('third', 5);

      // All have same priority, should dequeue in FIFO order
      expect(queue.dequeue()).toBe('first');
      expect(queue.dequeue()).toBe('second');
      expect(queue.dequeue()).toBe('third');
    });
  });

  describe('Peek', () => {
    it('should peek without removing', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 1);
      queue.enqueue('second', 2);

      expect(queue.peek()).toBe('first');
      expect(queue.size()).toBe(2);
    });

    it('should return undefined when empty', () => {
      const queue = new PriorityQueue<string>();
      expect(queue.peek()).toBeUndefined();
    });
  });

  describe('Remove', () => {
    it('should remove specific items', () => {
      const queue = new PriorityQueue<{ id: number }>();
      queue.enqueue({ id: 1 }, 1);
      queue.enqueue({ id: 2 }, 2);
      queue.enqueue({ id: 3 }, 3);

      const removed = queue.remove((item) => item.id === 2);
      expect(removed).toBe(true);
      expect(queue.size()).toBe(2);

      expect(queue.dequeue()?.id).toBe(1);
      expect(queue.dequeue()?.id).toBe(3);
    });

    it('should return false when item not found', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 1);

      const removed = queue.remove((item) => item === 'notfound');
      expect(removed).toBe(false);
      expect(queue.size()).toBe(1);
    });
  });

  describe('Has', () => {
    it('should check if item exists', () => {
      const queue = new PriorityQueue<{ id: number }>();
      queue.enqueue({ id: 1 }, 1);
      queue.enqueue({ id: 2 }, 2);

      expect(queue.has((item) => item.id === 1)).toBe(true);
      expect(queue.has((item) => item.id === 2)).toBe(true);
      expect(queue.has((item) => item.id === 3)).toBe(false);
    });
  });

  describe('Clear', () => {
    it('should clear all items', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 1);
      queue.enqueue('second', 2);
      queue.enqueue('third', 3);

      queue.clear();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.size()).toBe(0);
    });
  });

  describe('ToArray', () => {
    it('should return all items', () => {
      const queue = new PriorityQueue<string>();
      queue.enqueue('first', 1);
      queue.enqueue('second', 2);
      queue.enqueue('third', 3);

      const items = queue.toArray();
      expect(items).toHaveLength(3);
      expect(items).toContain('first');
      expect(items).toContain('second');
      expect(items).toContain('third');
    });
  });

  describe('Chunk Loading Priority', () => {
    it('should prioritize closer chunks', () => {
      const queue = new PriorityQueue<{ chunkX: number; chunkZ: number; distance: number }>();
      
      queue.enqueue({ chunkX: 10, chunkZ: 10, distance: 1000 }, 1000);
      queue.enqueue({ chunkX: 1, chunkZ: 1, distance: 100 }, 100);
      queue.enqueue({ chunkX: 5, chunkZ: 5, distance: 500 }, 500);

      const first = queue.dequeue()!;
      expect(first.distance).toBe(100);
      expect(first.chunkX).toBe(1);
      expect(first.chunkZ).toBe(1);

      const second = queue.dequeue()!;
      expect(second.distance).toBe(500);

      const third = queue.dequeue()!;
      expect(third.distance).toBe(1000);
    });

    it('should prioritize chunks in camera path', () => {
      const queue = new PriorityQueue<{ chunkX: number; distance: number; movingToward: boolean }>();
      
      // Chunk at distance 500, moving toward
      queue.enqueue({ chunkX: 5, distance: 500, movingToward: true }, 500 - 50);
      
      // Chunk at distance 400, not moving toward
      queue.enqueue({ chunkX: 4, distance: 400, movingToward: false }, 400);

      const first = queue.dequeue()!;
      expect(first.chunkX).toBe(5); // Moving toward has priority despite being farther
    });
  });

  describe('Stress Test', () => {
    it('should handle many items', () => {
      const queue = new PriorityQueue<number>();
      
      // Add 1000 items with random priorities
      for (let i = 0; i < 1000; i++) {
        queue.enqueue(i, Math.random() * 1000);
      }

      expect(queue.size()).toBe(1000);

      // Dequeue all and verify order
      let lastPriority = -Infinity;
      for (let i = 0; i < 1000; i++) {
        queue.dequeue();
      }

      expect(queue.isEmpty()).toBe(true);
    });
  });
});
