/**
 * Game State Manager
 * P19 - Manages overall game progression through the SLICE
 */

export enum GamePhase {
  INTRO = 'intro',
  EXPLORATION = 'exploration',
  QUEST_ACTIVE = 'quest_active',
  COMBAT = 'combat',
  BOSS_FIGHT = 'boss_fight',
  CUTSCENE = 'cutscene',
  PAUSED = 'paused',
}

export interface GameState {
  phase: GamePhase;
  currentQuestId: string | null;
  completedQuests: string[];
  discoveredLocations: string[];
  defeatedEnemies: string[];
  bossDefeated: boolean;
  playtime: number;
  introComplete: boolean;
}

export class GameStateManager {
  private state: GameState;
  private onStateChangeCallbacks: Array<(state: GameState) => void> = [];

  constructor() {
    this.state = {
      phase: GamePhase.INTRO,
      currentQuestId: null,
      completedQuests: [],
      discoveredLocations: [],
      defeatedEnemies: [],
      bossDefeated: false,
      playtime: 0,
      introComplete: false,
    };
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Update game phase
   */
  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
    this.notifyChange();
  }

  /**
   * Start a quest
   */
  startQuest(questId: string): void {
    this.state.currentQuestId = questId;
    this.state.phase = GamePhase.QUEST_ACTIVE;
    this.notifyChange();
  }

  /**
   * Complete a quest
   */
  completeQuest(questId: string): void {
    if (!this.state.completedQuests.includes(questId)) {
      this.state.completedQuests.push(questId);
    }
    this.state.currentQuestId = null;
    this.state.phase = GamePhase.EXPLORATION;
    this.notifyChange();
  }

  /**
   * Discover a location
   */
  discoverLocation(locationId: string): void {
    if (!this.state.discoveredLocations.includes(locationId)) {
      this.state.discoveredLocations.push(locationId);
      this.notifyChange();
    }
  }

  /**
   * Defeat an enemy
   */
  defeatEnemy(enemyId: string): void {
    if (!this.state.defeatedEnemies.includes(enemyId)) {
      this.state.defeatedEnemies.push(enemyId);
      this.notifyChange();
    }
  }

  /**
   * Defeat the boss
   */
  defeatBoss(): void {
    this.state.bossDefeated = true;
    this.state.phase = GamePhase.CUTSCENE;
    this.notifyChange();
  }

  /**
   * Complete intro
   */
  completeIntro(): void {
    this.state.introComplete = true;
    this.state.phase = GamePhase.EXPLORATION;
    this.notifyChange();
  }

  /**
   * Update playtime
   */
  updatePlaytime(deltaTime: number): void {
    this.state.playtime += deltaTime;
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (state: GameState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  /**
   * Notify state change
   */
  private notifyChange(): void {
    for (const callback of this.onStateChangeCallbacks) {
      callback(this.state);
    }
  }

  /**
   * Check if quest is completed
   */
  isQuestCompleted(questId: string): boolean {
    return this.state.completedQuests.includes(questId);
  }

  /**
   * Check if location is discovered
   */
  isLocationDiscovered(locationId: string): boolean {
    return this.state.discoveredLocations.includes(locationId);
  }

  /**
   * Check if enemy is defeated
   */
  isEnemyDefeated(enemyId: string): boolean {
    return this.state.defeatedEnemies.includes(enemyId);
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const totalObjectives = 10; // 3 quests + 1 boss + 6 locations
    const completed = 
      this.state.completedQuests.length +
      (this.state.bossDefeated ? 1 : 0) +
      this.state.discoveredLocations.length;
    
    return (completed / totalObjectives) * 100;
  }

  /**
   * Export state for saving
   */
  exportState(): GameState {
    return { ...this.state };
  }

  /**
   * Import state from save
   */
  importState(state: GameState): void {
    this.state = { ...state };
    this.notifyChange();
  }
}
