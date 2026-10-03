/**
 * Quest Manager - Simple quest system
 */

import * as THREE from 'three';

interface Quest {
  id: string;
  name: string;
  description: string;
  objective: string;
  targetPosition?: THREE.Vector3;
  targetRadius?: number;
  targetCount?: number;
  currentCount?: number;
  completed: boolean;
  active: boolean;
}

export class QuestManager {
  private quests: Map<string, Quest> = new Map();
  private activeQuestId: string | null = null;

  constructor() {
    this.initializeQuests();
  }

  private initializeQuests(): void {
    // Quest 1: Wake up
    this.quests.set('q1_wake_up', {
      id: 'q1_wake_up',
      name: 'A Knight\'s Awakening',
      description: 'You awaken in a strange land. Explore the area and find the village.',
      objective: 'Reach the village marker',
      targetPosition: new THREE.Vector3(50, 0, 50),
      targetRadius: 10,
      completed: false,
      active: false
    });

    // Quest 2: Defeat enemies
    this.quests.set('q2_defeat_enemies', {
      id: 'q2_defeat_enemies',
      name: 'Clear the Threat',
      description: 'Bandits are terrorizing the countryside. Defeat them.',
      objective: 'Defeat 3 enemies',
      targetCount: 3,
      currentCount: 0,
      completed: false,
      active: false
    });

    // Quest 3: Collect items
    this.quests.set('q3_collect_items', {
      id: 'q3_collect_items',
      name: 'Gather Resources',
      description: 'Collect resources from the area.',
      objective: 'Collect 5 items',
      targetCount: 5,
      currentCount: 0,
      completed: false,
      active: false
    });
  }

  public startQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.completed) return false;

    quest.active = true;
    this.activeQuestId = questId;
    return true;
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    if (!this.activeQuestId) return;

    const quest = this.quests.get(this.activeQuestId);
    if (!quest || quest.completed) return;

    // Check location-based objectives
    if (quest.targetPosition && quest.targetRadius) {
      const distance = playerPosition.distanceTo(quest.targetPosition);
      if (distance <= quest.targetRadius) {
        this.completeQuest(quest.id);
      }
    }
  }

  public incrementQuestProgress(questId: string, amount: number = 1): void {
    const quest = this.quests.get(questId);
    if (!quest || quest.completed || !quest.targetCount) return;

    quest.currentCount = (quest.currentCount ?? 0) + amount;

    if (quest.currentCount >= quest.targetCount) {
      this.completeQuest(questId);
    }
  }

  private completeQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.completed = true;
    quest.active = false;

    // Start next quest
    if (questId === 'q1_wake_up') {
      this.startQuest('q2_defeat_enemies');
    } else if (questId === 'q2_defeat_enemies') {
      this.startQuest('q3_collect_items');
    }

    this.activeQuestId = quest.completed ? null : questId;
  }

  public getActiveQuest(): Quest | null {
    if (!this.activeQuestId) return null;
    return this.quests.get(this.activeQuestId) ?? null;
  }

  public getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  public getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }
}
