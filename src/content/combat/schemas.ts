/**
 * Combat data schemas and types
 */

export interface WeaponStats {
  id: string;
  name: string;
  type: 'sword' | 'bow' | 'spell';
  baseDamage: number;
  staminaCost: number;
  attackSpeed: number; // attacks per second
  range: number;
  comboWindow: number; // seconds to chain next attack
  staggerDamage: number;
}

export interface SpellStats {
  id: string;
  name: string;
  type: 'fire' | 'frost' | 'ward';
  manaCost: number;
  cooldown: number;
  damage?: number;
  duration?: number;
  radius?: number;
  effect: string;
}

export interface EnemyStats {
  id: string;
  name: string;
  type: 'swordsman' | 'archer' | 'brute';
  health: number;
  stamina: number;
  damage: number;
  attackSpeed: number;
  staggerThreshold: number;
  behavior: {
    aggroRange: number;
    attackRange: number;
    retreatHealth: number;
    telegraphTime: number;
  };
}

export interface DamageEvent {
  source: string;
  target: string;
  amount: number;
  type: 'physical' | 'fire' | 'frost' | 'magic';
  isCritical: boolean;
  isBlocked: boolean;
  isParried: boolean;
}

export interface CombatState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  stagger: number;
  maxStagger: number;
  isStaggered: boolean;
  isBlocking: boolean;
  isParrying: boolean;
  parryWindow: number;
  comboCount: number;
  lastAttackTime: number;
}

export const WEAPON_SCHEMAS: Record<string, WeaponStats> = {
  sword: {
    id: 'sword',
    name: 'Iron Sword',
    type: 'sword',
    baseDamage: 25,
    staminaCost: 15,
    attackSpeed: 1.2,
    range: 2.5,
    comboWindow: 0.8,
    staggerDamage: 20,
  },
  bow: {
    id: 'bow',
    name: 'Longbow',
    type: 'bow',
    baseDamage: 30,
    staminaCost: 20,
    attackSpeed: 0.8,
    range: 30,
    comboWindow: 0,
    staggerDamage: 15,
  },
};

export const SPELL_SCHEMAS: Record<string, SpellStats> = {
  fire: {
    id: 'fire',
    name: 'Fireball',
    type: 'fire',
    manaCost: 30,
    cooldown: 3.0,
    damage: 40,
    radius: 3.0,
    effect: 'burn',
  },
  frost: {
    id: 'frost',
    name: 'Frost Nova',
    type: 'frost',
    manaCost: 25,
    cooldown: 5.0,
    damage: 20,
    radius: 5.0,
    duration: 3.0,
    effect: 'slow',
  },
  ward: {
    id: 'ward',
    name: 'Ward',
    type: 'ward',
    manaCost: 40,
    cooldown: 10.0,
    duration: 5.0,
    effect: 'shield',
  },
};

export const ENEMY_SCHEMAS: Record<string, EnemyStats> = {
  swordsman: {
    id: 'swordsman',
    name: 'Bandit Swordsman',
    type: 'swordsman',
    health: 100,
    stamina: 80,
    damage: 20,
    attackSpeed: 1.0,
    staggerThreshold: 60,
    behavior: {
      aggroRange: 15,
      attackRange: 3,
      retreatHealth: 30,
      telegraphTime: 0.8,
    },
  },
  archer: {
    id: 'archer',
    name: 'Bandit Archer',
    type: 'archer',
    health: 70,
    stamina: 60,
    damage: 25,
    attackSpeed: 0.6,
    staggerThreshold: 40,
    behavior: {
      aggroRange: 25,
      attackRange: 20,
      retreatHealth: 40,
      telegraphTime: 1.2,
    },
  },
  brute: {
    id: 'brute',
    name: 'Bandit Brute',
    type: 'brute',
    health: 200,
    stamina: 120,
    damage: 40,
    attackSpeed: 0.5,
    staggerThreshold: 100,
    behavior: {
      aggroRange: 12,
      attackRange: 4,
      retreatHealth: 20,
      telegraphTime: 1.5,
    },
  },
};
