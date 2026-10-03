/**
 * Journal System
 * P15 - Quest journal and tracking
 */

import { Quest, QuestStatus, QuestStep } from '../../content/quests/schema.js';

export interface JournalEntry {
  questId: string;
  questName: string;
  status: QuestStatus;
  currentStepDescription: string;
  timestamp: number;
}

export class JournalSystem {
  private quests: Map<string, Quest> = new Map();
  private journal: JournalEntry[] = [];

  /**
   * Add quest to journal
   */
  addQuest(quest: Quest): void {
    this.quests.set(quest.id, quest);
    this.updateJournalEntry(quest);
  }

  /**
   * Remove quest from journal
   */
  removeQuest(questId: string): void {
    this.quests.delete(questId);
    this.journal = this.journal.filter(e => e.questId !== questId);
  }

  /**
   * Update quest status
   */
  updateQuestStatus(questId: string, status: QuestStatus): void {
    const quest = this.quests.get(questId);
    if (quest) {
      quest.status = status;
      this.updateJournalEntry(quest);
    }
  }

  /**
   * Update quest step
   */
  updateQuestStep(questId: string, stepId: string): void {
    const quest = this.quests.get(questId);
    if (quest) {
      quest.currentStepId = stepId;
      this.updateJournalEntry(quest);
    }
  }

  /**
   * Update journal entry for quest
   */
  private updateJournalEntry(quest: Quest): void {
    const currentStep = quest.steps.find(s => s.id === quest.currentStepId);
    const description = currentStep ? currentStep.description : 'No current objective';

    const existingIndex = this.journal.findIndex(e => e.questId === quest.id);
    const entry: JournalEntry = {
      questId: quest.id,
      questName: quest.name,
      status: quest.status,
      currentStepDescription: description,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      this.journal[existingIndex] = entry;
    } else {
      this.journal.push(entry);
    }
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
   * Get quests by status
   */
  getQuestsByStatus(status: QuestStatus): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.status === status);
  }

  /**
   * Get journal entries
   */
  getJournal(): JournalEntry[] {
    return [...this.journal].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get active quests count
   */
  getActiveQuestCount(): number {
    return this.getQuestsByStatus(QuestStatus.ACTIVE).length;
  }

  /**
   * Get completed quests count
   */
  getCompletedQuestCount(): number {
    return this.getQuestsByStatus(QuestStatus.COMPLETED).length;
  }

  /**
   * Check if quest is active
   */
  isQuestActive(questId: string): boolean {
    const quest = this.quests.get(questId);
    return quest ? quest.status === QuestStatus.ACTIVE : false;
  }

  /**
   * Check if quest is completed
   */
  isQuestCompleted(questId: string): boolean {
    const quest = this.quests.get(questId);
    return quest ? quest.status === QuestStatus.COMPLETED : false;
  }

  /**
   * Clear journal
   */
  clear(): void {
    this.quests.clear();
    this.journal = [];
  }
}
