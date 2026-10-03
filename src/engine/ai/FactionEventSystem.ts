/**
 * Faction and Event Systems
 * P14 - Reputation tracking and dynamic events
 */

export enum FactionType {
  VILLAGERS = 'villagers',
  MERCHANTS = 'merchants',
  GUARDS = 'guards',
  BANDITS = 'bandits',
}

export interface Faction {
  id: FactionType;
  name: string;
  reputation: number; // -100 to 100
}

export class FactionSystem {
  private factions: Map<FactionType, Faction> = new Map();

  constructor() {
    // Initialize default factions
    this.factions.set(FactionType.VILLAGERS, {
      id: FactionType.VILLAGERS,
      name: 'Villagers',
      reputation: 0,
    });
    this.factions.set(FactionType.MERCHANTS, {
      id: FactionType.MERCHANTS,
      name: 'Merchants',
      reputation: 0,
    });
    this.factions.set(FactionType.GUARDS, {
      id: FactionType.GUARDS,
      name: 'Guards',
      reputation: 0,
    });
    this.factions.set(FactionType.BANDITS, {
      id: FactionType.BANDITS,
      name: 'Bandits',
      reputation: -50,
    });
  }

  modifyReputation(factionId: FactionType, amount: number): void {
    const faction = this.factions.get(factionId);
    if (faction) {
      faction.reputation = Math.max(-100, Math.min(100, faction.reputation + amount));
    }
  }

  getReputation(factionId: FactionType): number {
    return this.factions.get(factionId)?.reputation ?? 0;
  }

  getFactionRelation(factionId: FactionType): 'hostile' | 'neutral' | 'friendly' {
    const rep = this.getReputation(factionId);
    if (rep < -30) return 'hostile';
    if (rep > 30) return 'friendly';
    return 'neutral';
  }

  getAllFactions(): Faction[] {
    return Array.from(this.factions.values());
  }
}

export enum EventType {
  BANDIT_RAID = 'bandit_raid',
  MERCHANT_CARAVAN = 'merchant_caravan',
  WOLF_ATTACK = 'wolf_attack',
  FESTIVAL = 'festival',
}

export interface GameEvent {
  id: string;
  type: EventType;
  location: { x: number; z: number };
  startTime: number;
  duration: number;
  active: boolean;
}

export class EventSystem {
  private events: Map<string, GameEvent> = new Map();
  private currentTime: number = 0;
  private nextEventTime: number = 300; // First event after 5 minutes

  update(deltaTime: number, playerPosition: { x: number; z: number }): void {
    this.currentTime += deltaTime;

    // Check if it's time for a new event
    if (this.currentTime >= this.nextEventTime) {
      this.spawnRandomEvent(playerPosition);
      this.nextEventTime = this.currentTime + 300 + Math.random() * 300; // 5-10 minutes
    }

    // Update active events
    for (const event of this.events.values()) {
      if (event.active) {
        const elapsed = this.currentTime - event.startTime;
        if (elapsed >= event.duration) {
          event.active = false;
        }
      }
    }
  }

  private spawnRandomEvent(playerPosition: { x: number; z: number }): void {
    const eventTypes = [
      EventType.BANDIT_RAID,
      EventType.MERCHANT_CARAVAN,
      EventType.WOLF_ATTACK,
    ];

    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]!;
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;

    const event: GameEvent = {
      id: `event_${Date.now()}`,
      type,
      location: {
        x: playerPosition.x + Math.cos(angle) * distance,
        z: playerPosition.z + Math.sin(angle) * distance,
      },
      startTime: this.currentTime,
      duration: 60, // 1 minute
      active: true,
    };

    this.events.set(event.id, event);
  }

  getActiveEvents(): GameEvent[] {
    return Array.from(this.events.values()).filter(e => e.active);
  }

  getEventCount(): number {
    return this.events.size;
  }
}
