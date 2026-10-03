import { describe, it, expect, beforeEach } from 'vitest';
import { QuestSystem } from '../src/engine/quests/QuestSystem.js';
import { QuestValidator } from '../src/engine/quests/QuestValidator.js';
import { InventorySystem, ItemType, EquipSlot } from '../src/engine/quests/InventorySystem.js';
import { CraftingSystem, CraftingStation } from '../src/engine/quests/CraftingSystem.js';
import { MerchantSystem } from '../src/engine/quests/MerchantSystem.js';
import { JournalSystem } from '../src/engine/quests/JournalSystem.js';
import { WorldFlagsSystem } from '../src/engine/quests/WorldFlagsSystem.js';
import { QuestBot } from '../src/engine/quests/QuestBot.js';
import { FactionSystem, FactionType } from '../src/engine/ai/FactionEventSystem.js';
import { Quest, QuestStatus, QuestStepType } from '../src/content/quests/schema.js';
import { SLICE_QUESTS } from '../src/content/quests/slice-quests.js';

describe('Quest System', () => {
  let questSystem: QuestSystem;
  let inventory: InventorySystem;
  let worldFlags: WorldFlagsSystem;
  let factionSystem: FactionSystem;

  beforeEach(() => {
    inventory = new InventorySystem();
    worldFlags = new WorldFlagsSystem();
    factionSystem = new FactionSystem();
    questSystem = new QuestSystem(inventory, worldFlags, factionSystem);
  });

  describe('Quest Management', () => {
    it('should add quest to system', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      expect(questSystem.getQuest(quest.id)).toBe(quest);
    });

    it('should get all quests', () => {
      SLICE_QUESTS.forEach(q => questSystem.addQuest(q));
      expect(questSystem.getAllQuests().length).toBe(SLICE_QUESTS.length);
    });

    it('should start quest', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      const success = questSystem.startQuest(quest.id);
      expect(success).toBe(true);
      expect(quest.status).toBe(QuestStatus.ACTIVE);
    });

    it('should not start quest if already active', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      const success = questSystem.startQuest(quest.id);
      expect(success).toBe(false);
    });

    it('should complete quest', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      const success = questSystem.completeQuest(quest.id);
      expect(success).toBe(true);
      expect(quest.status).toBe(QuestStatus.COMPLETED);
    });

    it('should fail quest', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      const success = questSystem.failQuest(quest.id);
      expect(success).toBe(true);
      expect(quest.status).toBe(QuestStatus.FAILED);
    });
  });

  describe('Quest Steps', () => {
    it('should complete step and move to next', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      
      const initialStep = quest.currentStepId;
      questSystem.completeStep(quest.id);
      
      expect(quest.currentStepId).not.toBe(initialStep);
    });

    it('should set flags when completing step', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      
      // Complete first step which sets flags
      questSystem.completeStep(quest.id);
      
      expect(worldFlags.hasFlag('met_elder_bram')).toBe(true);
    });

    it('should get current step description', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      
      const description = questSystem.getCurrentStepDescription(quest.id);
      expect(description).toBe(quest.steps[0]!.description);
    });
  });

  describe('Quest Choices', () => {
    it('should handle choice and apply reputation', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      
      // Move to choice step
      questSystem.completeStep(quest.id);
      
      // Make choice
      const choiceId = 'q1_choice1';
      questSystem.handleChoice(quest.id, choiceId);
      
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(5);
    });

    it('should move to next step after choice', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      
      // Move to choice step
      questSystem.completeStep(quest.id);
      
      const choiceStepId = quest.currentStepId;
      questSystem.handleChoice(quest.id, 'q1_choice1');
      
      expect(quest.currentStepId).not.toBe(choiceStepId);
    });
  });

  describe('Quest Rewards', () => {
    it('should give gold reward', () => {
      const quest = SLICE_QUESTS[0]!;
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      questSystem.completeQuest(quest.id);
      
      expect(inventory.getGold()).toBe(10);
    });

    it('should give reputation reward', () => {
      const quest = SLICE_QUESTS[1]!; // Wolf quest
      questSystem.addQuest(quest);
      questSystem.startQuest(quest.id);
      questSystem.completeQuest(quest.id);
      
      expect(factionSystem.getReputation(FactionType.VILLAGERS)).toBe(10);
    });
  });

  describe('Quest Requirements', () => {
    it('should check required flags', () => {
      const quest = SLICE_QUESTS[1]!; // Requires quest1_started
      questSystem.addQuest(quest);
      
      const available = questSystem.getAvailableQuests();
      expect(available.find(q => q.id === quest.id)).toBeUndefined();
      
      worldFlags.setFlag('quest1_started');
      const available2 = questSystem.getAvailableQuests();
      expect(available2.find(q => q.id === quest.id)).toBeDefined();
    });
  });
});

describe('Quest Validator', () => {
  let validator: QuestValidator;

  beforeEach(() => {
    validator = new QuestValidator();
  });

  it('should validate valid quest', () => {
    const quest = SLICE_QUESTS[0]!;
    const result = validator.validate(quest);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect missing nextStepId', () => {
    const quest: Quest = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      giverId: 'npc',
      status: QuestStatus.AVAILABLE,
      steps: [
        {
          id: 'step1',
          type: QuestStepType.TALK_TO,
          description: 'Talk',
          target: 'npc',
          nextStepId: 'nonexistent',
        },
      ],
      currentStepId: 'step1',
      rewards: [],
    };

    const result = validator.validate(quest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect unreachable steps', () => {
    const quest: Quest = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      giverId: 'npc',
      status: QuestStatus.AVAILABLE,
      steps: [
        {
          id: 'step1',
          type: QuestStepType.TALK_TO,
          description: 'Talk',
          target: 'npc',
        },
        {
          id: 'step2',
          type: QuestStepType.GO_TO,
          description: 'Go',
          target: 'location',
        },
      ],
      currentStepId: 'step1',
      rewards: [],
    };

    const result = validator.validate(quest);
    expect(result.warnings.some(w => w.message.includes('unreachable'))).toBe(true);
  });

  it('should validate all slice quests', () => {
    const result = validator.validateAll(SLICE_QUESTS);
    expect(result.valid).toBe(true);
  });
});

describe('Inventory System', () => {
  let inventory: InventorySystem;

  beforeEach(() => {
    inventory = new InventorySystem();
  });

  it('should add item', () => {
    const item = {
      id: 'sword',
      name: 'Sword',
      description: 'A sword',
      type: ItemType.WEAPON,
      value: 100,
      stackable: false,
      maxStack: 1,
    };

    inventory.addItem(item);
    expect(inventory.hasItem('sword')).toBe(true);
  });

  it('should stack items', () => {
    const item = {
      id: 'potion',
      name: 'Potion',
      description: 'A potion',
      type: ItemType.CONSUMABLE,
      value: 10,
      stackable: true,
      maxStack: 10,
    };

    inventory.addItem(item, 5);
    expect(inventory.getItemCount('potion')).toBe(5);

    inventory.addItem(item, 3);
    expect(inventory.getItemCount('potion')).toBe(8);
  });

  it('should remove item', () => {
    const item = {
      id: 'sword',
      name: 'Sword',
      description: 'A sword',
      type: ItemType.WEAPON,
      value: 100,
      stackable: false,
      maxStack: 1,
    };

    inventory.addItem(item);
    inventory.removeItem('sword');
    expect(inventory.hasItem('sword')).toBe(false);
  });

  it('should manage gold', () => {
    inventory.addGold(100);
    expect(inventory.getGold()).toBe(100);

    inventory.removeGold(50);
    expect(inventory.getGold()).toBe(50);
  });

  it('should equip item', () => {
    const item = {
      id: 'sword',
      name: 'Sword',
      description: 'A sword',
      type: ItemType.WEAPON,
      value: 100,
      stackable: false,
      maxStack: 1,
      equipSlot: EquipSlot.WEAPON,
    };

    inventory.addItem(item);
    inventory.equip('sword');
    
    const equipped = inventory.getEquippedItem(EquipSlot.WEAPON);
    expect(equipped).toBe(item);
  });
});

describe('Crafting System', () => {
  let inventory: InventorySystem;
  let crafting: CraftingSystem;

  beforeEach(() => {
    inventory = new InventorySystem();
    crafting = new CraftingSystem(inventory);
  });

  it('should get recipes by station', () => {
    const forgeRecipes = crafting.getRecipesByStation(CraftingStation.FORGE);
    expect(forgeRecipes.length).toBeGreaterThan(0);
  });

  it('should check if can craft', () => {
    // Add ingredients
    inventory.addItem({
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Ore',
      type: ItemType.MATERIAL,
      value: 10,
      stackable: true,
      maxStack: 99,
    }, 5);

    inventory.addItem({
      id: 'wood',
      name: 'Wood',
      description: 'Wood',
      type: ItemType.MATERIAL,
      value: 5,
      stackable: true,
      maxStack: 99,
    }, 5);

    expect(crafting.canCraft('iron_sword')).toBe(true);
  });

  it('should craft item', () => {
    // Add ingredients
    inventory.addItem({
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Ore',
      type: ItemType.MATERIAL,
      value: 10,
      stackable: true,
      maxStack: 99,
    }, 5);

    inventory.addItem({
      id: 'wood',
      name: 'Wood',
      description: 'Wood',
      type: ItemType.MATERIAL,
      value: 5,
      stackable: true,
      maxStack: 99,
    }, 5);

    const success = crafting.craft('iron_sword');
    expect(success).toBe(true);
    expect(inventory.hasItem('iron_sword')).toBe(true);
  });
});

describe('World Flags System', () => {
  let flags: WorldFlagsSystem;

  beforeEach(() => {
    flags = new WorldFlagsSystem();
  });

  it('should set flag', () => {
    flags.setFlag('test_flag');
    expect(flags.hasFlag('test_flag')).toBe(true);
  });

  it('should unset flag', () => {
    flags.setFlag('test_flag');
    flags.unsetFlag('test_flag');
    expect(flags.hasFlag('test_flag')).toBe(false);
  });

  it('should check all flags', () => {
    flags.setFlag('flag1');
    flags.setFlag('flag2');
    expect(flags.hasAllFlags(['flag1', 'flag2'])).toBe(true);
    expect(flags.hasAllFlags(['flag1', 'flag3'])).toBe(false);
  });

  it('should export and import', () => {
    flags.setFlag('flag1');
    flags.setFlag('flag2');
    
    const exported = flags.export();
    
    const newFlags = new WorldFlagsSystem();
    newFlags.import(exported);
    
    expect(newFlags.hasFlag('flag1')).toBe(true);
    expect(newFlags.hasFlag('flag2')).toBe(true);
  });
});

describe('Quest Bot', () => {
  let questSystem: QuestSystem;
  let inventory: InventorySystem;
  let worldFlags: WorldFlagsSystem;
  let factionSystem: FactionSystem;
  let bot: QuestBot;

  beforeEach(() => {
    inventory = new InventorySystem();
    worldFlags = new WorldFlagsSystem();
    factionSystem = new FactionSystem();
    questSystem = new QuestSystem(inventory, worldFlags, factionSystem);
    bot = new QuestBot(questSystem, inventory, worldFlags, factionSystem);
  });

  it('should complete simple quest', () => {
    const quest = SLICE_QUESTS[0]!;
    questSystem.addQuest(quest);
    
    const success = bot.runQuest(quest.id);
    expect(success).toBe(true);
    expect(quest.status).toBe(QuestStatus.COMPLETED);
  });

  it('should log actions', () => {
    const quest = SLICE_QUESTS[0]!;
    questSystem.addQuest(quest);
    
    bot.runQuest(quest.id);
    
    const log = bot.getActionLog();
    expect(log.length).toBeGreaterThan(0);
    expect(log[0]!.type).toBe('start_quest');
  });

  it('should handle collect steps', () => {
    const quest = SLICE_QUESTS[2]!; // Lost locket quest
    questSystem.addQuest(quest);
    
    const success = bot.runQuest(quest.id);
    expect(success).toBe(true);
  });
});

describe('SLICE Quests Integration', () => {
  it('should have 6 quests', () => {
    expect(SLICE_QUESTS.length).toBe(6);
  });

  it('should have valid quest graph', () => {
    const validator = new QuestValidator();
    const result = validator.validateAll(SLICE_QUESTS);
    expect(result.valid).toBe(true);
  });

  it('should have proper quest chain', () => {
    // Q1 -> Q2 (requires quest1_started)
    // Q2 -> Q5 (requires wolves_defeated)
    // Q5 -> Q6 (requires bandits_defeated)
    
    const q1 = SLICE_QUESTS.find(q => q.id === 'q1_wake_up')!;
    const q2 = SLICE_QUESTS.find(q => q.id === 'q2_wolves')!;
    const q5 = SLICE_QUESTS.find(q => q.id === 'q5_bandits')!;
    const q6 = SLICE_QUESTS.find(q => q.id === 'q6_merchant_guild')!;

    expect(q2.requiredFlags).toContain('quest1_started');
    expect(q5.requiredFlags).toContain('wolves_defeated');
    expect(q6.requiredFlags).toContain('bandits_defeated');
  });
});
