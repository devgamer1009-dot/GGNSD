/**
 * NPC Schedule System
 * P14 - Time-based NPC activities
 */

export enum ActivityType {
  SLEEP = 'sleep',
  WORK = 'work',
  EAT = 'eat',
  SOCIALIZE = 'socialize',
  WANDER = 'wander',
  IDLE = 'idle',
}

export interface ScheduleEntry {
  startTime: number; // 0-24 hours
  endTime: number;
  activity: ActivityType;
  location?: { x: number; z: number };
}

export interface NPCSchedule {
  npcId: string;
  entries: ScheduleEntry[];
}

export const DEFAULT_SCHEDULES: Record<string, ScheduleEntry[]> = {
  villager: [
    { startTime: 0, endTime: 6, activity: ActivityType.SLEEP, location: { x: 0, z: 0 } },
    { startTime: 6, endTime: 8, activity: ActivityType.EAT, location: { x: 0, z: 0 } },
    { startTime: 8, endTime: 12, activity: ActivityType.WORK, location: { x: 10, z: 10 } },
    { startTime: 12, endTime: 13, activity: ActivityType.EAT, location: { x: 5, z: 5 } },
    { startTime: 13, endTime: 18, activity: ActivityType.WORK, location: { x: 10, z: 10 } },
    { startTime: 18, endTime: 20, activity: ActivityType.SOCIALIZE, location: { x: 15, z: 15 } },
    { startTime: 20, endTime: 22, activity: ActivityType.EAT, location: { x: 0, z: 0 } },
    { startTime: 22, endTime: 24, activity: ActivityType.SLEEP, location: { x: 0, z: 0 } },
  ],
  merchant: [
    { startTime: 0, endTime: 6, activity: ActivityType.SLEEP },
    { startTime: 6, endTime: 7, activity: ActivityType.EAT },
    { startTime: 7, endTime: 8, activity: ActivityType.WORK }, // Setup shop
    { startTime: 8, endTime: 18, activity: ActivityType.WORK }, // Open shop
    { startTime: 18, endTime: 19, activity: ActivityType.WORK }, // Close shop
    { startTime: 19, endTime: 21, activity: ActivityType.SOCIALIZE },
    { startTime: 21, endTime: 22, activity: ActivityType.EAT },
    { startTime: 22, endTime: 24, activity: ActivityType.SLEEP },
  ],
  guard: [
    { startTime: 0, endTime: 6, activity: ActivityType.SLEEP },
    { startTime: 6, endTime: 7, activity: ActivityType.EAT },
    { startTime: 7, endTime: 19, activity: ActivityType.WORK }, // Patrol
    { startTime: 19, endTime: 20, activity: ActivityType.EAT },
    { startTime: 20, endTime: 22, activity: ActivityType.SOCIALIZE },
    { startTime: 22, endTime: 24, activity: ActivityType.SLEEP },
  ],
};

export class ScheduleSystem {
  private schedules: Map<string, ScheduleEntry[]> = new Map();
  private currentTime: number = 8; // Start at 8 AM

  constructor() {
    // Load default schedules
    for (const [type, entries] of Object.entries(DEFAULT_SCHEDULES)) {
      this.schedules.set(type, entries);
    }
  }

  /**
   * Update time
   */
  updateTime(deltaTime: number, timeScale: number = 60): void {
    // timeScale: 60 = 1 real second = 1 game minute
    this.currentTime += (deltaTime * timeScale) / 60;
    if (this.currentTime >= 24) {
      this.currentTime -= 24;
    }
  }

  /**
   * Get current time (0-24)
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Set current time
   */
  setCurrentTime(time: number): void {
    this.currentTime = time % 24;
  }

  /**
   * Get current activity for NPC
   */
  getCurrentActivity(npcType: string): ScheduleEntry | null {
    const schedule = this.schedules.get(npcType);
    if (!schedule) return null;

    for (const entry of schedule) {
      if (this.currentTime >= entry.startTime && this.currentTime < entry.endTime) {
        return entry;
      }
    }

    return null;
  }

  /**
   * Add custom schedule
   */
  addSchedule(npcId: string, entries: ScheduleEntry[]): void {
    this.schedules.set(npcId, entries);
  }

  /**
   * Remove schedule
   */
  removeSchedule(npcId: string): void {
    this.schedules.delete(npcId);
  }

  /**
   * Get time as formatted string
   */
  getTimeString(): string {
    const hours = Math.floor(this.currentTime);
    const minutes = Math.floor((this.currentTime - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if it's night time
   */
  isNight(): boolean {
    return this.currentTime < 6 || this.currentTime >= 20;
  }

  /**
   * Check if it's day time
   */
  isDay(): boolean {
    return this.currentTime >= 6 && this.currentTime < 20;
  }
}
