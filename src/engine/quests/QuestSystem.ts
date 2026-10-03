/**
 * Quest System
 * P15 - Main quest system orchestrator
 */

import { Quest, QuestStatus, QuestStep, QuestStepType, QuestChoice } from '../../content/quests/schema.js';
import { JournalSystem } from './JournalSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { WorldFlagsSystem } from './WorldFlagsSystem.js';
import { FactionSystem } from '../ai/FactionEventSystem.js';

export class QuestSystem {
  private quests: Map<string, Quest> = new Map();
  private journal: JournalSystem;
  private inventory: InventorySystem;
  private worldFlags: WorldFlagsSystem;
  private factionSystem: FactionSystem;

  constructor(
    inventory: InventorySystem,
    worldFlags: WorldFlagsSystem,
    factionSystem: FactionSystem
  ) {
    this.inventory = inventory;
    this.worldFlags = worldFlags;
    this.factionSystem = factionSystem;
    this.journal = new JournalSystem();
  }

  /**
   * Add quest to system
   */
  addQuest(quest: Quest): void {
    this.quests.set(quest.id, quest);
  }

  /**
   * Get quest by ID
   */
  getQuest(questId: string): Quest | null {
    return this.quests.get(questId) || null;
  }

  /**
   * Get all quests
   */
  getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  /**
   * Get available quests for player
   */
  getAvailableQuests(): Quest[] {
    return this.getAllQuests().filter(quest => {
      // Check if quest is available (not active or completed)
      if (quest.status !== QuestStatus.AVAILABLE) return false;

      // Check required level
      if (quest.requiredLevel && this.getPlayerLevel() < quest.requiredLevel) {
        return false;
      }

      // Check required flags
      if (quest.requiredFlags && !this.worldFlags.hasAllFlags(quest.requiredFlags)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Start a quest
   */
  startQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.AVAILABLE) return false;
    if (quest.steps.length === 0) return false;

    quest.status = QuestStatus.ACTIVE;
    quest.currentStepId = quest.steps[0]!.id;
    this.journal.addQuest(quest);

    return true;
  }

  /**
   * Complete current step
   */
  completeStep(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.ACTIVE) return false;

    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    if (!currentStep) return false;

    // Set flags from current step
    if (currentStep.setFlags) {
      currentStep.setFlags.forEach(flag => this.worldFlags.setFlag(flag));
    }

    // Move to next step
    if (currentStep.nextStepId) {
      quest.currentStepId = currentStep.nextStepId;
      this.journal.updateQuestStep(questId, currentStep.nextStepId);
    } else {
      // No next step, complete quest
      this.completeQuest(questId);
    }

    return true;
  }

  /**
   * Complete a quest
   */
  completeQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;

    quest.status = QuestStatus.COMPLETED;
    this.journal.updateQuestStatus(questId, QuestStatus.COMPLETED);

    // Set quest flags
    if (quest.setFlags) {
      quest.setFlags.forEach(flag => this.worldFlags.setFlag(flag));
    }

    // Give rewards
    this.giveRewards(quest);

    return true;
  }

  /**
   * Fail a quest
   */
  failQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;

    quest.status = QuestStatus.FAILED;
    this.journal.updateQuestStatus(questId, QuestStatus.FAILED);

    return true;
  }

  /**
   * Give quest rewards
   */
  private giveRewards(quest: Quest): void {
    for (const reward of quest.rewards) {
      switch (reward.type) {
        case 'gold':
          this.inventory.addGold(reward.amount);
          break;
        case 'item':
          if (reward.id) {
            // Would add item to inventory
            // this.inventory.addItem(reward.id, reward.amount);
          }
          break;
        case 'reputation':
          if (reward.factionId) {
            this.factionSystem.modifyReputation(reward.factionId as any, reward.amount);
          }
          break;
        case 'xp':
          // Would add XP to player
          break;
      }
    }
  }

  /**
   * Handle dialogue choice
   */
  handleChoice(questId: string, choiceId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.ACTIVE) return false;

    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    if (!currentStep || !currentStep.choices) return false;

    const choice = currentStep.choices.find(c => c.id === choiceId);
    if (!choice) return false;

    // Check required flags
    if (choice.requiredFlags && !this.worldFlags.hasAllFlags(choice.requiredFlags)) {
      return false;
    }

    // Apply reputation changes
    if (choice.reputationChange) {
      for (const [factionId, change] of Object.entries(choice.reputationChange)) {
        this.factionSystem.modifyReputation(factionId as any, change);
      }
    }

    // Set flags
    if (choice.setFlags) {
      choice.setFlags.forEach(flag => this.worldFlags.setFlag(flag));
    }

    // Move to next step
    if (choice.nextStepId) {
      quest.currentStepId = choice.nextStepId;
      this.journal.updateQuestStep(questId, choice.nextStepId);
    } else {
      this.completeQuest(questId);
    }

    return true;
  }

  /**
   * Check if step is complete
   */
  isStepComplete(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.ACTIVE) return false;

    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    if (!currentStep) return false;

    switch (currentStep.type) {
      case QuestStepType.TALK_TO:
        // Would check if player talked to NPC
        return false;
      case QuestStepType.GO_TO:
        // Would check if player reached location
        return false;
      case QuestStepType.KILL:
        // Would check kill count
        return false;
      case QuestStepType.COLLECT:
        return this.inventory.hasItem(currentStep.target!, currentStep.count || 1);
      case QuestStepType.CRAFT:
        // Would check if item was crafted
        return false;
      case QuestStepType.DELIVER:
        // Would check if item was delivered
        return false;
      case QuestStepType.CHOICE:
        // Choice steps complete when choice is made
        return false;
      default:
        return false;
    }
  }

  /**
   * Get current step description
   */
  getCurrentStepDescription(questId: string): string | null {
    const quest = this.quests.get(questId);
    if (!quest) return null;

    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    return currentStep ? currentStep.description : null;
  }

  /**
   * Get journal system
   */
  getJournal(): JournalSystem {
    return this.journal;
  }

  /**
   * Get player level (placeholder)
   */
  private getPlayerLevel(): number {
    return 1; // Would get from player system
  }
}
