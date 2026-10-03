/**
 * Thornmother Boss Data - Regional guardian of Thornwood
 * P21 - Complete boss definition with phases, attacks, and arena
 */

import * as THREE from 'three';
import { BossPhase, BossAttack, ArenaRule, CinematicTrack } from '../../engine/bosses/BossFramework.js';

// ============================================================================
// BOSS METADATA
// ============================================================================

export const THORNMOTHER_DATA = {
  id: 'thornmother',
  name: 'The Thornmother',
  title: 'Guardian of the Whispering Wood',
  region: 'thornwood',
  level: 15,
  maxHealth: 1500,
  description: 'An ancient fey creature who guards the Root Shard. She commands the forest itself, calling upon vines, roots, and corrupted nature to defend her domain.',
  
  // Lore
  lore: [
    'The Thornmother was once a mortal druid who bound herself to the forest to protect it from the Rot.',
    'Over centuries, she became more tree than human, her consciousness merging with the ancient woods.',
    'She holds the Root Shard, one of the five pieces of the shattered crown.',
    'Those who seek the shard must prove themselves worthy by surviving her trial.',
  ],
};

// ============================================================================
// ARENA CONFIGURATION
// ============================================================================

export const THORNMOTHER_ARENA = {
  center: new THREE.Vector3(-1400, 0, -1000),
  radius: 30,
  height: 20,
  
  // Arena rules by phase
  phaseRules: [
    // Phase 1: Basic arena
    [
      {
        type: 'boundary' as const,
        position: new THREE.Vector3(-1400, 0, -1000),
        radius: 30,
      },
    ],
    // Phase 2: Add hazards
    [
      {
        type: 'boundary' as const,
        position: new THREE.Vector3(-1400, 0, -1000),
        radius: 30,
      },
      {
        type: 'hazard' as const,
        position: new THREE.Vector3(-1410, 0, -1010),
        radius: 5,
        damage: 10,
        effect: 'rot_pool',
      },
      {
        type: 'hazard' as const,
        position: new THREE.Vector3(-1390, 0, -990),
        radius: 5,
        damage: 10,
        effect: 'rot_pool',
      },
    ],
    // Phase 3: More hazards, smaller arena
    [
      {
        type: 'boundary' as const,
        position: new THREE.Vector3(-1400, 0, -1000),
        radius: 20, // Smaller arena
      },
      {
        type: 'hazard' as const,
        position: new THREE.Vector3(-1410, 0, -1010),
        radius: 6,
        damage: 15,
        effect: 'rot_pool',
      },
      {
        type: 'hazard' as const,
        position: new THREE.Vector3(-1390, 0, -990),
        radius: 6,
        damage: 15,
        effect: 'rot_pool',
      },
      {
        type: 'hazard' as const,
        position: new THREE.Vector3(-1400, 0, -1020),
        radius: 4,
        damage: 15,
        effect: 'rot_pool',
      },
    ],
  ],
};

// ============================================================================
// PHASE 1: NATURE'S WRATH
// ============================================================================

const PHASE_1_ATTACKS: BossAttack[] = [
  {
    id: 'vine_whip',
    name: 'Vine Whip',
    telegraph: {
      duration: 1.5,
      visual: 'vine_warning',
      audio: 'vine_whip_telegraph',
      hitboxDelay: 0.3,
      color: '#2d5016',
    },
    damage: 25,
    cooldown: 4,
    pattern: {
      type: 'melee',
      range: 8,
    },
    priority: 10,
  },
  {
    id: 'root_slam',
    name: 'Root Slam',
    telegraph: {
      duration: 2.0,
      visual: 'root_warning',
      audio: 'root_slam_telegraph',
      hitboxDelay: 0.5,
      color: '#4a3728',
    },
    damage: 40,
    cooldown: 8,
    pattern: {
      type: 'aoe',
      areaOfEffect: 10,
    },
    priority: 5,
  },
  {
    id: 'spore_cloud',
    name: 'Spore Cloud',
    telegraph: {
      duration: 1.8,
      visual: 'spore_warning',
      audio: 'spore_cloud_telegraph',
      hitboxDelay: 0.2,
      color: '#7cb342',
    },
    damage: 15,
    cooldown: 6,
    pattern: {
      type: 'ranged',
      range: 20,
      projectileCount: 5,
    },
    priority: 7,
  },
];

const PHASE_1: BossPhase = {
  id: 'phase_1',
  name: "Nature's Wrath",
  healthThreshold: 100, // Starts at 100%
  attacks: PHASE_1_ATTACKS,
  arenaRules: THORNMOTHER_ARENA.phaseRules[0],
  musicTrack: 'thornmother_phase1',
  dialogue: [
    'You dare enter my grove, mortal?',
    'The forest remembers all who trespass...',
    'Let the roots claim you!',
  ],
};

// ============================================================================
// PHASE 2: FEY MAGIC
// ============================================================================

const PHASE_2_ATTACKS: BossAttack[] = [
  {
    id: 'illusion_duplicates',
    name: 'Illusion Duplicates',
    telegraph: {
      duration: 2.5,
      visual: 'illusion_warning',
      audio: 'illusion_telegraph',
      hitboxDelay: 0.5,
      color: '#9c27b0',
    },
    damage: 20,
    cooldown: 12,
    pattern: {
      type: 'summon',
      projectileCount: 3, // 3 duplicates
      duration: 10,
    },
    priority: 6,
    maxHealth: 66, // Only use below 66% health
  },
  {
    id: 'enchantment',
    name: 'Fey Enchantment',
    telegraph: {
      duration: 2.0,
      visual: 'enchantment_warning',
      audio: 'enchantment_telegraph',
      hitboxDelay: 0.3,
      color: '#e1bee7',
    },
    damage: 30,
    cooldown: 10,
    pattern: {
      type: 'ranged',
      range: 25,
    },
    priority: 8,
    maxHealth: 66,
  },
  {
    id: 'teleport_strike',
    name: 'Teleport Strike',
    telegraph: {
      duration: 1.0,
      visual: 'teleport_warning',
      audio: 'teleport_telegraph',
      hitboxDelay: 0.1,
      color: '#ce93d8',
    },
    damage: 35,
    cooldown: 7,
    pattern: {
      type: 'melee',
      range: 5,
    },
    priority: 9,
    maxHealth: 66,
  },
  // Keep some phase 1 attacks
  PHASE_1_ATTACKS[0]!, // Vine Whip
  PHASE_1_ATTACKS[2]!, // Spore Cloud
];

const PHASE_2_TRANSITION: CinematicTrack = {
  duration: 3.0,
  cameraPath: [
    {
      time: 0,
      position: new THREE.Vector3(-1400, 10, -970),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 60,
    },
    {
      time: 1,
      position: new THREE.Vector3(-1410, 15, -980),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 55,
    },
    {
      time: 2,
      position: new THREE.Vector3(-1400, 12, -975),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 50,
    },
  ],
  dialogue: [
    'You are stronger than I anticipated...',
    'But the forest has deeper magics!',
    'Witness the power of the Feywild!',
  ],
};

const PHASE_2: BossPhase = {
  id: 'phase_2',
  name: 'Fey Magic',
  healthThreshold: 66, // Triggers at 66% health
  attacks: PHASE_2_ATTACKS,
  phaseTransition: PHASE_2_TRANSITION,
  arenaRules: THORNMOTHER_ARENA.phaseRules[1],
  musicTrack: 'thornmother_phase2',
  dialogue: [
    'The veil between worlds grows thin...',
    'My power is renewed!',
  ],
};

// ============================================================================
// PHASE 3: CORRUPTION UNLEASHED
// ============================================================================

const PHASE_3_ATTACKS: BossAttack[] = [
  {
    id: 'rot_tendrils',
    name: 'Rot Tendrils',
    telegraph: {
      duration: 2.5,
      visual: 'rot_warning',
      audio: 'rot_tendrils_telegraph',
      hitboxDelay: 0.5,
      color: '#1b5e20',
    },
    damage: 35,
    cooldown: 8,
    pattern: {
      type: 'aoe',
      areaOfEffect: 15,
      duration: 5, // Lingering damage
    },
    priority: 10,
    minHealth: 0,
    maxHealth: 33, // Only use below 33% health
  },
  {
    id: 'blight_explosion',
    name: 'Blight Explosion',
    telegraph: {
      duration: 3.0,
      visual: 'blight_warning',
      audio: 'blight_explosion_telegraph',
      hitboxDelay: 1.0,
      color: '#4a148c',
    },
    damage: 60,
    cooldown: 15,
    pattern: {
      type: 'aoe',
      areaOfEffect: 25, // Entire arena
    },
    priority: 5,
    maxHealth: 33,
  },
  {
    id: 'final_stand',
    name: "Nature's Final Stand",
    telegraph: {
      duration: 2.0,
      visual: 'final_stand_warning',
      audio: 'final_stand_telegraph',
      hitboxDelay: 0.3,
      color: '#880e4f',
    },
    damage: 45,
    cooldown: 6,
    pattern: {
      type: 'melee',
      range: 10,
    },
    priority: 12,
    maxHealth: 33,
  },
  // Keep some attacks from previous phases
  PHASE_1_ATTACKS[0]!, // Vine Whip
  PHASE_2_ATTACKS[2]!, // Teleport Strike
];

const PHASE_3_TRANSITION: CinematicTrack = {
  duration: 4.0,
  cameraPath: [
    {
      time: 0,
      position: new THREE.Vector3(-1400, 15, -970),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 55,
    },
    {
      time: 1,
      position: new THREE.Vector3(-1420, 20, -980),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 50,
    },
    {
      time: 2,
      position: new THREE.Vector3(-1400, 25, -1000),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 45,
    },
    {
      time: 3,
      position: new THREE.Vector3(-1380, 18, -1020),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 50,
    },
  ],
  dialogue: [
    'No... I will not fall!',
    'The Rot consumes me, but I will take you with me!',
    'Witness my final transformation!',
    'The forest will have its vengeance!',
  ],
};

const PHASE_3: BossPhase = {
  id: 'phase_3',
  name: 'Corruption Unleashed',
  healthThreshold: 33, // Triggers at 33% health
  attacks: PHASE_3_ATTACKS,
  phaseTransition: PHASE_3_TRANSITION,
  arenaRules: THORNMOTHER_ARENA.phaseRules[2],
  musicTrack: 'thornmother_phase3',
  dialogue: [
    'The corruption... it consumes me!',
    'But I will not fall alone!',
  ],
};

// ============================================================================
// INTRO CINEMATIC
// ============================================================================

export const THORNMOTHER_INTRO: CinematicTrack = {
  duration: 8.0,
  cameraPath: [
    {
      time: 0,
      position: new THREE.Vector3(-1400, 30, -950),
      lookAt: new THREE.Vector3(-1400, 0, -1000),
      fov: 70,
    },
    {
      time: 2,
      position: new THREE.Vector3(-1410, 20, -970),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 65,
    },
    {
      time: 4,
      position: new THREE.Vector3(-1400, 15, -980),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 60,
    },
    {
      time: 6,
      position: new THREE.Vector3(-1390, 10, -990),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 55,
    },
    {
      time: 8,
      position: new THREE.Vector3(-1385, 8, -995),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 50,
    },
  ],
  dialogue: [
    'The forest grows quiet...',
    'Something ancient stirs in the grove...',
    'The Thornmother awakens!',
    'Prepare yourself, challenger...',
    'This is your final warning.',
  ],
  musicCue: 'thornmother_intro',
};

// ============================================================================
// DEFEAT CINEMATIC
// ============================================================================

export const THORNMOTHER_DEFEAT: CinematicTrack = {
  duration: 6.0,
  cameraPath: [
    {
      time: 0,
      position: new THREE.Vector3(-1385, 8, -995),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 50,
    },
    {
      time: 2,
      position: new THREE.Vector3(-1390, 10, -990),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 55,
    },
    {
      time: 4,
      position: new THREE.Vector3(-1400, 15, -980),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 60,
    },
    {
      time: 6,
      position: new THREE.Vector3(-1400, 20, -970),
      lookAt: new THREE.Vector3(-1400, 2, -1000),
      fov: 65,
    },
  ],
  dialogue: [
    'No... the forest... it fades...',
    'You have proven worthy, mortal.',
    'Take the Root Shard...',
    'Protect it from the Rot...',
    'The forest... remembers...',
  ],
  musicCue: 'thornmother_defeat',
};

// ============================================================================
// EXPORT ALL PHASES
// ============================================================================

export const THORNMOTHER_PHASES: BossPhase[] = [
  PHASE_1,
  PHASE_2,
  PHASE_3,
];

// ============================================================================
// LOOT TABLE
// ============================================================================

export const THORNMOTHER_LOOT = [
  {
    itemId: 'root_shard',
    name: 'Root Shard',
    description: 'A fragment of the shattered crown, pulsing with ancient power.',
    chance: 1.0, // Guaranteed
    quantity: 1,
  },
  {
    itemId: 'thornmother_staff',
    name: "Thornmother's Staff",
    description: 'A staff grown from living wood, still warm with fey magic.',
    chance: 0.5,
    quantity: 1,
  },
  {
    itemId: 'fey_essence',
    name: 'Fey Essence',
    description: 'A vial of pure fey magic, shimmering with otherworldly light.',
    chance: 0.8,
    quantity: { min: 2, max: 4 },
  },
  {
    itemId: 'ancient_bark',
    name: 'Ancient Bark',
    description: 'A piece of bark from the oldest tree in Thornwood.',
    chance: 1.0,
    quantity: { min: 3, max: 5 },
  },
  {
    itemId: 'gold',
    name: 'Gold',
    description: 'A pouch of ancient coins.',
    chance: 1.0,
    quantity: { min: 200, max: 300 },
  },
];
