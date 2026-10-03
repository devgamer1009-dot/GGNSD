import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleSystem, ActivityType } from '../src/engine/ai/ScheduleSystem.js';
import { BehaviorNode, Sequence, Selector, Action, Condition, NodeStatus, type Blackboard } from '../src/engine/ai/BehaviorTree.js';
import { AILodManager, AILodLevel, AIUpdateScheduler } from '../src/engine/ai/AILodManager.js';
import { FactionSystem, FactionType, EventSystem } from '../src/engine/ai/FactionEventSystem.js';

describe('AI System', () => {
  describe('ScheduleSystem', () => {
    let scheduleSystem: ScheduleSystem;

    beforeEach(() => {
      scheduleSystem = new ScheduleSystem();
    });

    it('should initialize with default time', () => {
      expect(scheduleSystem.getCurrentTime()).toBe(8);
    });

    it('should update time correctly', () => {
      scheduleSystem.updateTime(1, 60); // 1 second = 1 minute
      expect(scheduleSystem.getCurrentTime()).toBeCloseTo(8.0167, 3);
    });

    it('should wrap around at 24 hours', () => {
      scheduleSystem.setCurrentTime(23.9);
      scheduleSystem.updateTime(2, 60);
      expect(scheduleSystem.getCurrentTime()).toBeLessThan(1);
    });

    it('should get correct activity for time', () => {
      scheduleSystem.setCurrentTime(10);
      const activity = scheduleSystem.getCurrentActivity('villager');
      expect(activity).not.toBeNull();
      expect(activity!.activity).toBe(ActivityType.WORK);
    });

    it('should detect night time', () => {
      scheduleSystem.setCurrentTime(22);
      expect(scheduleSystem.isNight()).toBe(true);
      expect(scheduleSystem.isDay()).toBe(false);

      scheduleSystem.setCurrentTime(12);
      expect(scheduleSystem.isNight()).toBe(false);
      expect(scheduleSystem.isDay()).toBe(true);
    });

    it('should format time string correctly', () => {
      scheduleSystem.setCurrentTime(14.5);
      expect(scheduleSystem.getTimeString()).toBe('14:30');
    });
  });

  describe('BehaviorTree', () => {
    let blackboard: Blackboard;

    beforeEach(() => {
      blackboard = { counter: 0 };
    });

    it('should execute action nodes', () => {
      const action = new Action(blackboard, () => {
        blackboard.counter++;
        return NodeStatus.SUCCESS;
      });

      const status = action.tick(0.016);
      expect(status).toBe(NodeStatus.SUCCESS);
      expect(blackboard.counter).toBe(1);
    });

    it('should execute condition nodes', () => {
      const condition = new Condition(blackboard, (bb) => bb.counter > 0);
      
      expect(condition.tick(0.016)).toBe(NodeStatus.FAILURE);
      
      blackboard.counter = 1;
      expect(condition.tick(0.016)).toBe(NodeStatus.SUCCESS);
    });

    it('should execute sequence nodes', () => {
      const action1 = new Action(blackboard, () => {
        blackboard.counter++;
        return NodeStatus.SUCCESS;
      });

      const action2 = new Action(blackboard, () => {
        blackboard.counter += 10;
        return NodeStatus.SUCCESS;
      });

      const sequence = new Sequence(blackboard, [action1, action2]);
      const status = sequence.tick(0.016);

      expect(status).toBe(NodeStatus.SUCCESS);
      expect(blackboard.counter).toBe(11);
    });

    it('should fail sequence on first failure', () => {
      const action1 = new Action(blackboard, () => {
        blackboard.counter++;
        return NodeStatus.SUCCESS;
      });

      const action2 = new Action(blackboard, () => {
        return NodeStatus.FAILURE;
      });

      const action3 = new Action(blackboard, () => {
        blackboard.counter += 10;
        return NodeStatus.SUCCESS;
      });

      const sequence = new Sequence(blackboard, [action1, action2, action3]);
      const status = sequence.tick(0.016);

      expect(status).toBe(NodeStatus.FAILURE);
      expect(blackboard.counter).toBe(1); // Only first action executed
    });

    it('should execute selector nodes', () => {
      const action1 = new Action(blackboard, () => {
        return NodeStatus.FAILURE;
      });

      const action2 = new Action(blackboard, () => {
        blackboard.counter++;
        return NodeStatus.SUCCESS;
      });

      const selector = new Selector(blackboard, [action1, action2]);
      const status = selector.tick(0.016);

      expect(status).toBe(NodeStatus.SUCCESS);
      expect(blackboard.counter).toBe(1);
    });

    it('should handle running status', () => {
      let ticks = 0;
      const action = new Action(blackboard, () => {
        ticks++;
        return ticks < 3 ? NodeStatus.RUNNING : NodeStatus.SUCCESS;
      });

      expect(action.tick(0.016)).toBe(NodeStatus.RUNNING);
      expect(action.tick(0.016)).toBe(NodeStatus.RUNNING);
      expect(action.tick(0.016)).toBe(NodeStatus.SUCCESS);
      expect(ticks).toBe(3);
    });
  });

  describe('AILodManager', () => {
    let lodManager: AILodManager;

    beforeEach(() => {
      lodManager = new AILodManager();
    });

    it('should return FULL LOD for close distances', () => {
      expect(lodManager.getLodLevel(30)).toBe(AILodLevel.FULL);
      expect(lodManager.getLodLevel(50)).toBe(AILodLevel.FULL);
    });

    it('should return REDUCED LOD for medium distances', () => {
      expect(lodManager.getLodLevel(100)).toBe(AILodLevel.REDUCED);
      expect(lodManager.getLodLevel(150)).toBe(AILodLevel.REDUCED);
    });

    it('should return STATISTICAL LOD for far distances', () => {
      expect(lodManager.getLodLevel(200)).toBe(AILodLevel.STATISTICAL);
      expect(lodManager.getLodLevel(500)).toBe(AILodLevel.STATISTICAL);
    });

    it('should allow custom distance thresholds', () => {
      lodManager.setDistances(30, 100, 200);
      
      expect(lodManager.getLodLevel(25)).toBe(AILodLevel.FULL);
      expect(lodManager.getLodLevel(50)).toBe(AILodLevel.REDUCED);
      expect(lodManager.getLodLevel(150)).toBe(AILodLevel.STATISTICAL);
    });
  });

  describe('AIUpdateScheduler', () => {
    let scheduler: AIUpdateScheduler;

    beforeEach(() => {
      scheduler = new AIUpdateScheduler();
    });

    it('should register and update entities', () => {
      let updated = false;
      scheduler.registerEntity('test', () => {
        updated = true;
      });

      scheduler.update(0.016);
      expect(updated).toBe(true);
    });

    it('should unregister entities', () => {
      let updateCount = 0;
      scheduler.registerEntity('test', () => {
        updateCount++;
      });

      scheduler.update(0.016);
      expect(updateCount).toBe(1);

      scheduler.unregisterEntity('test');
      scheduler.update(0.016);
      expect(updateCount).toBe(1); // Should not increment
    });

    it('should respect time budget', () => {
      scheduler.setBudget(0.1); // 0.1ms budget

      let updateCount = 0;
      for (let i = 0; i < 100; i++) {
        scheduler.registerEntity(`entity_${i}`, () => {
          updateCount++;
          // Simulate work
          const start = performance.now();
          while (performance.now() - start < 0.05) {} // 0.05ms each
        });
      }

      const result = scheduler.update(0.016);
      expect(result.updated).toBeLessThan(100);
      expect(result.skipped).toBeGreaterThan(0);
    });

    it('should prioritize entities', () => {
      const updateOrder: string[] = [];

      scheduler.registerEntity('low', () => updateOrder.push('low'), 1);
      scheduler.registerEntity('high', () => updateOrder.push('high'), 10);
      scheduler.registerEntity('medium', () => updateOrder.push('medium'), 5);

      scheduler.update(0.016);

      expect(updateOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should track update time', () => {
      scheduler.registerEntity('test', () => {});
      scheduler.update(0.016);

      expect(scheduler.getLastUpdateTime()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('FactionSystem', () => {
    let factionSystem: FactionSystem;

    beforeEach(() => {
      factionSystem = new FactionSystem();
    });

    it('should initialize with default factions', () => {
      const factions = factionSystem.getAllFactions();
      expect(factions.length).toBeGreaterThan(0);
    });

    it('should modify reputation', () => {
      factionSystem.modifyReputation(FactionType.VILLAGERS, 20);
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(20);

      factionSystem.modifyReputation(FactionType.VILLAGERS, -10);
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(10);
    });

    it('should clamp reputation between -100 and 100', () => {
      factionSystem.modifyReputation(FactionType.VILLAGERS, 150);
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(100);

      factionSystem.modifyReputation(FactionType.VILLAGERS, -250);
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(-100);
    });

    it('should determine faction relations', () => {
      factionSystem.modifyReputation(FactionType.VILLAGERS, 50);
      expect(factionSystem.getFactionRelation(FactionType.VILLAGERS)).toBe('friendly');

      factionSystem.modifyReputation(FactionType.BANDITS, -50);
      expect(factionSystem.getFactionRelation(FactionType.BANDITS)).toBe('hostile');

      expect(factionSystem.getFactionRelation(FactionType.MERCHANTS)).toBe('neutral');
    });
  });

  describe('EventSystem', () => {
    let eventSystem: EventSystem;

    beforeEach(() => {
      eventSystem = new EventSystem();
    });

    it('should spawn events over time', () => {
      eventSystem.update(301, { x: 0, z: 0 }); // First event after 5 minutes
      expect(eventSystem.getEventCount()).toBeGreaterThan(0);
    });

    it('should track active events', () => {
      eventSystem.update(301, { x: 0, z: 0 });
      const activeEvents = eventSystem.getActiveEvents();
      expect(activeEvents.length).toBeGreaterThan(0);
      expect(activeEvents[0]!.active).toBe(true);
    });

    it('should expire events after duration', () => {
      eventSystem.update(301, { x: 0, z: 0 }); // Spawn event
      eventSystem.update(61, { x: 0, z: 0 }); // Wait for duration (60s)
      
      const activeEvents = eventSystem.getActiveEvents();
      expect(activeEvents.length).toBe(0);
    });
  });

  describe('Determinism', () => {
    it('should produce deterministic schedules', () => {
      const system1 = new ScheduleSystem();
      const system2 = new ScheduleSystem();

      system1.setCurrentTime(12);
      system2.setCurrentTime(12);

      const activity1 = system1.getCurrentActivity('villager');
      const activity2 = system2.getCurrentActivity('villager');

      expect(activity1).toEqual(activity2);
    });

    it('should produce deterministic LOD levels', () => {
      const lod1 = new AILodManager();
      const lod2 = new AILodManager();

      expect(lod1.getLodLevel(100)).toBe(lod2.getLodLevel(100));
      expect(lod1.getLodLevel(200)).toBe(lod2.getLodLevel(200));
    });
  });
});
