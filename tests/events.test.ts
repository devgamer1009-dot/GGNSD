import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../src/engine/events/EventBus.js';

describe('EventBus', () => {
  describe('Subscription', () => {
    it('should subscribe to events', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      bus.on('test', handler);
      
      expect(bus.getHandlerCount('test')).toBe(1);
    });

    it('should support multiple handlers for same event', () => {
      const bus = createEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.on('test', handler1);
      bus.on('test', handler2);
      
      expect(bus.getHandlerCount('test')).toBe(2);
    });

    it('should unsubscribe handlers', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      bus.on('test', handler);
      expect(bus.getHandlerCount('test')).toBe(1);
      
      bus.off('test', handler);
      expect(bus.getHandlerCount('test')).toBe(0);
    });

    it('should handle unsubscribing non-existent handler', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      // Should not throw
      bus.off('test', handler);
      expect(bus.getHandlerCount('test')).toBe(0);
    });
  });

  describe('Emission', () => {
    it('should emit events to handlers', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      bus.on('test', handler);
      bus.emit('test', { value: 42 });
      
      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should emit to multiple handlers', () => {
      const bus = createEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.emit('test', 'data');
      
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should emit events without data', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      bus.on('test', handler);
      bus.emit('test');
      
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should not emit to handlers of different events', () => {
      const bus = createEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.on('event1', handler1);
      bus.on('event2', handler2);
      
      bus.emit('event1');
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not throw when emitting event with no handlers', () => {
      const bus = createEventBus();
      
      // Should not throw
      expect(() => bus.emit('nonexistent')).not.toThrow();
    });
  });

  describe('Handler Execution Order', () => {
    it('should execute handlers in subscription order', () => {
      const bus = createEventBus();
      const order: number[] = [];
      
      bus.on('test', () => order.push(1));
      bus.on('test', () => order.push(2));
      bus.on('test', () => order.push(3));
      
      bus.emit('test');
      
      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('Clear', () => {
    it('should clear all handlers', () => {
      const bus = createEventBus();
      
      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());
      bus.on('event3', vi.fn());
      
      expect(bus.getHandlerCount('event1')).toBe(1);
      expect(bus.getHandlerCount('event2')).toBe(1);
      expect(bus.getHandlerCount('event3')).toBe(1);
      
      bus.clear();
      
      expect(bus.getHandlerCount('event1')).toBe(0);
      expect(bus.getHandlerCount('event2')).toBe(0);
      expect(bus.getHandlerCount('event3')).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should support typed event data', () => {
      const bus = createEventBus();
      
      interface PlayerEvent {
        id: number;
        name: string;
      }
      
      const handler = vi.fn();
      bus.on<PlayerEvent>('playerJoined', handler);
      
      bus.emit<PlayerEvent>('playerJoined', { id: 1, name: 'Alice' });
      
      expect(handler).toHaveBeenCalledWith({ id: 1, name: 'Alice' });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle damage events', () => {
      const bus = createEventBus();
      const damageLog: Array<{ entityId: number; damage: number }> = [];
      
      bus.on('damage', (data: { entityId: number; damage: number }) => {
        damageLog.push(data);
      });
      
      bus.emit('damage', { entityId: 1, damage: 10 });
      bus.emit('damage', { entityId: 2, damage: 25 });
      
      expect(damageLog).toEqual([
        { entityId: 1, damage: 10 },
        { entityId: 2, damage: 25 },
      ]);
    });

    it('should handle game state changes', () => {
      const bus = createEventBus();
      let gameState = 'menu';
      
      bus.on('stateChange', (newState: string) => {
        gameState = newState;
      });
      
      bus.emit('stateChange', 'playing');
      expect(gameState).toBe('playing');
      
      bus.emit('stateChange', 'paused');
      expect(gameState).toBe('paused');
    });
  });
});
