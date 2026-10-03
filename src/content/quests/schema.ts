/**
 * Quest Schema Definitions
 * P15 - Data structures for quest system
 */

export enum QuestStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum QuestStepType {
  TALK_TO = 'talk_to',
  GO_TO = 'go_to',
  KILL = 'kill',
  COLLECT = 'collect',
  CRAFT = 'craft',
  DELIVER = 'deliver',
  CHOICE = 'choice',
}

export interface QuestChoice {
  id: string;
  text: string;
  reputationChange?: Record<string, number>; // faction -> change
  nextStepId?: string;
  requiredFlags?: string[];
  setFlags?: string[];
}

export interface QuestStep {
  id: string;
  type: QuestStepType;
  description: string;
  target?: string; // NPC ID, location ID, enemy type, item ID
  count?: number;
  choices?: QuestChoice[];
  nextStepId?: string;
  requiredFlags?: string[];
  setFlags?: string[];
}

export interface QuestReward {
  type: 'item' | 'gold' | 'xp' | 'reputation';
  id?: string; // item ID for item rewards
  amount: number;
  factionId?: string; // for reputation rewards
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  giverId: string; // NPC ID
  status: QuestStatus;
  steps: QuestStep[];
  currentStepId: string;
  rewards: QuestReward[];
  requiredLevel?: number;
  requiredFlags?: string[];
  setFlags?: string[];
  repeatable?: boolean;
}

export interface DialogueLine {
  speakerId: string;
  text: string;
  choices?: QuestChoice[];
}

export interface DialogueScene {
  id: string;
  lines: DialogueLine[];
}
