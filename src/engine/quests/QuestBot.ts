/**
 * Quest Bot
 * P15 - Headless bot that can complete quests automatically
 */

import { Quest, QuestStatus, QuestStepType } from '../../content/quests/schema.js';
import { QuestSystem } from './QuestSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { WorldFlagsSystem } from './WorldFlagsSystem.js';
import { FactionSystem, FactionType } from '../ai/FactionEventSystem.js';

export interface BotAction {
  type: 'start_quest' | 'complete_step' | 'make_choice' | 'add_item' | 'set_flag';
  questId?: string;
  stepId?: string;
  choiceId?: string;
  itemId?: string;
  itemCount?: number;
  flag?: string;
}

export class QuestBot {
  private questSystem: QuestSystem;
  private inventory: InventorySystem;
  private worldFlags: WorldFlagsSystem;
  private factionSystem: FactionSystem;
  private actionLog: BotAction[] = [];

  constructor(
    questSystem: QuestSystem,
    inventory: InventorySystem,
    worldFlags: WorldFlagsSystem,
    factionSystem: FactionSystem
  ) {
    this.questSystem = questSystem;
    this.inventory = inventory;
    this.worldFlags = worldFlags;
    this.factionSystem = factionSystem;
  }

  /**
   * Run bot to complete a quest
   */
  runQuest(questId: string): boolean {
    const quest = this.questSystem.getQuest(questId);
    if (!quest) return false;

    // Start quest if not already started
    if (quest.status === QuestStatus.AVAILABLE) {
      this.questSystem.startQuest(questId);
      this.log({ type: 'start_quest', questId });
    }

    // Complete steps until quest is done
    let maxSteps = 100; // Prevent infinite loops
    while (quest.status === QuestStatus.ACTIVE && maxSteps > 0) {
      const success = this.completeCurrentStep(quest);
      if (!success) break;
      maxSteps--;
    }

    return quest.status === QuestStatus.COMPLETED;
  }

  /**
   * Complete current step
   */
  private completeCurrentStep(quest: Quest): boolean {
    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    if (!currentStep) return false;

    switch (currentStep.type) {
      case QuestStepType.TALK_TO:
        // Simulate talking to NPC
        this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
        return this.questSystem.completeStep(quest.id);

      case QuestStepType.GO_TO:
        // Simulate going to location
        this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
        return this.questSystem.completeStep(quest.id);

      case QuestStepType.KILL:
        // Simulate killing enemies
        if (currentStep.target && currentStep.count) {
          // Would simulate combat
          this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
          return this.questSystem.completeStep(quest.id);
        }
        return false;

      case QuestStepType.COLLECT:
        // Add required items to inventory
        if (currentStep.target && currentStep.count) {
          this.simulateCollectItem(currentStep.target, currentStep.count);
          this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
          return this.questSystem.completeStep(quest.id);
        }
        return false;

      case QuestStepType.CRAFT:
        // Simulate crafting
        this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
        return this.questSystem.completeStep(quest.id);

      case QuestStepType.DELIVER:
        // Simulate delivering item
        this.log({ type: 'complete_step', questId: quest.id, stepId: currentStep.id });
        return this.questSystem.completeStep(quest.id);

      case QuestStepType.CHOICE:
        // Make first available choice
        if (currentStep.choices && currentStep.choices.length > 0) {
          const choice = currentStep.choices[0]!;
          this.questSystem.handleChoice(quest.id, choice.id);
          this.log({ type: 'make_choice', questId: quest.id, choiceId: choice.id });
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Simulate collecting an item
   */
  private simulateCollectItem(itemId: string, count: number): void {
    // Create a dummy item and add to inventory
    const item = {
      id: itemId,
      name: itemId,
      description: 'Quest item',
      type: 'quest' as any,
      value: 0,
      stackable: true,
      maxStack: 99,
    };
    this.inventory.addItem(item, count);
    this.log({ type: 'add_item', itemId, itemCount: count });
  }

  /**
   * Run all available quests
   */
  runAllQuests(): { completed: number; failed: number } {
    const quests = this.questSystem.getAllQuests();
    let completed = 0;
    let failed = 0;

    for (const quest of quests) {
      if (quest.status === QuestStatus.AVAILABLE) {
        const success = this.runQuest(quest.id);
        if (success) {
          completed++;
        } else {
          failed++;
        }
      }
    }

    return { completed, failed };
  }

  /**
   * Get action log
   */
  getActionLog(): BotAction[] {
    return [...this.actionLog];
  }

  /**
   * Clear action log
   */
  clearLog(): void {
    this.actionLog = [];
  }

  /**
   * Log action
   */
  private log(action: BotAction): void {
    this.actionLog.push(action);
  }
}
