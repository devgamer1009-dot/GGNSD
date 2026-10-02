import { describe, it, expect } from 'vitest';
import { createWorld, type Component } from '../src/engine/ecs/ECS.js';

class Position implements Component {
  constructor(public x = 0, public y = 0, public z = 0) {}
}

class Velocity implements Component {
  constructor(public x = 0, public y = 0, public z = 0) {}
}

class Health implements Component {
  constructor(public current = 100, public max = 100) {}
}

describe('ECS', () => {
  describe('Entity Lifecycle', () => {
    it('should create entities with unique IDs', () => {
      const world = createWorld();
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();
      
      expect(e1).not.toBe(e2);
      expect(e2).not.toBe(e3);
      expect(e1).not.toBe(e3);
    });

    it('should track entity count', () => {
      const world = createWorld();
      expect(world.getEntityCount()).toBe(0);
      
      world.createEntity();
      expect(world.getEntityCount()).toBe(1);
      
      world.createEntity();
      expect(world.getEntityCount()).toBe(2);
    });

    it('should destroy entities', () => {
      const world = createWorld();
      const entity = world.createEntity();
      expect(world.getEntityCount()).toBe(1);
      
      world.destroyEntity(entity);
      expect(world.getEntityCount()).toBe(0);
    });

    it('should check entity existence', () => {
      const world = createWorld();
      const entity = world.createEntity();
      
      expect(world.entityExists(entity)).toBe(true);
      
      world.destroyEntity(entity);
      expect(world.entityExists(entity)).toBe(false);
    });
  });

  describe('Component Management', () => {
    it('should add components to entities', () => {
      const world = createWorld();
      const entity = world.createEntity();
      const pos = new Position(1, 2, 3);
      
      world.addComponent(entity, pos);
      
      const retrieved = world.getComponent(entity, Position);
      expect(retrieved).toBe(pos);
      expect(retrieved?.x).toBe(1);
      expect(retrieved?.y).toBe(2);
      expect(retrieved?.z).toBe(3);
    });

    it('should check if entity has component', () => {
      const world = createWorld();
      const entity = world.createEntity();
      
      expect(world.hasComponent(entity, Position)).toBe(false);
      
      world.addComponent(entity, new Position());
      expect(world.hasComponent(entity, Position)).toBe(true);
    });

    it('should remove components from entities', () => {
      const world = createWorld();
      const entity = world.createEntity();
      world.addComponent(entity, new Position());
      
      expect(world.hasComponent(entity, Position)).toBe(true);
      
      world.removeComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(false);
    });

    it('should support multiple components per entity', () => {
      const world = createWorld();
      const entity = world.createEntity();
      
      world.addComponent(entity, new Position(1, 2, 3));
      world.addComponent(entity, new Velocity(4, 5, 6));
      world.addComponent(entity, new Health(100, 100));
      
      expect(world.hasComponent(entity, Position)).toBe(true);
      expect(world.hasComponent(entity, Velocity)).toBe(true);
      expect(world.hasComponent(entity, Health)).toBe(true);
    });

    it('should clean up components when entity is destroyed', () => {
      const world = createWorld();
      const entity = world.createEntity();
      world.addComponent(entity, new Position());
      world.addComponent(entity, new Velocity());
      
      world.destroyEntity(entity);
      
      expect(world.getComponent(entity, Position)).toBeUndefined();
      expect(world.getComponent(entity, Velocity)).toBeUndefined();
    });
  });

  describe('Query System', () => {
    it('should query entities with single component', () => {
      const world = createWorld();
      
      const e1 = world.createEntity();
      world.addComponent(e1, new Position());
      
      const e2 = world.createEntity();
      world.addComponent(e2, new Position());
      
      const e3 = world.createEntity();
      world.addComponent(e3, new Velocity());
      
      const results = world.query(Position);
      expect(results).toHaveLength(2);
      expect(results).toContain(e1);
      expect(results).toContain(e2);
      expect(results).not.toContain(e3);
    });

    it('should query entities with multiple components', () => {
      const world = createWorld();
      
      const e1 = world.createEntity();
      world.addComponent(e1, new Position());
      world.addComponent(e1, new Velocity());
      
      const e2 = world.createEntity();
      world.addComponent(e2, new Position());
      
      const e3 = world.createEntity();
      world.addComponent(e3, new Velocity());
      
      const results = world.queryMultiple(Position, Velocity);
      expect(results).toHaveLength(1);
      expect(results).toContain(e1);
    });

    it('should return empty array when no entities match', () => {
      const world = createWorld();
      
      const e1 = world.createEntity();
      world.addComponent(e1, new Position());
      
      const results = world.query(Velocity);
      expect(results).toHaveLength(0);
    });
  });

  describe('System Ordering', () => {
    it('should execute systems in deterministic order', () => {
      const world = createWorld();
      const entity = world.createEntity();
      world.addComponent(entity, new Position(0, 0, 0));
      world.addComponent(entity, new Velocity(1, 0, 0));
      
      const executionOrder: string[] = [];
      
      // System 1: Movement
      function movementSystem() {
        const pos = world.getComponent(entity, Position);
        const vel = world.getComponent(entity, Velocity);
        if (pos && vel) {
          pos.x += vel.x;
          executionOrder.push('movement');
        }
      }
      
      // System 2: Logging
      function loggingSystem() {
        const pos = world.getComponent(entity, Position);
        if (pos) {
          executionOrder.push(`logging:${pos.x}`);
        }
      }
      
      // Execute systems in order
      movementSystem();
      loggingSystem();
      
      expect(executionOrder).toEqual(['movement', 'logging:1']);
      
      // Execute again
      movementSystem();
      loggingSystem();
      
      expect(executionOrder).toEqual(['movement', 'logging:1', 'movement', 'logging:2']);
    });

    it('should maintain component state across system executions', () => {
      const world = createWorld();
      const entity = world.createEntity();
      world.addComponent(entity, new Position(0, 0, 0));
      world.addComponent(entity, new Velocity(2, 0, 0));
      
      // Simulate 3 frames
      for (let frame = 0; frame < 3; frame++) {
        const pos = world.getComponent(entity, Position);
        const vel = world.getComponent(entity, Velocity);
        if (pos && vel) {
          pos.x += vel.x;
        }
      }
      
      const finalPos = world.getComponent(entity, Position);
      expect(finalPos?.x).toBe(6); // 2 * 3 frames
    });
  });
});
