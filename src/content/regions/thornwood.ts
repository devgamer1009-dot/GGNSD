/**
 * Thornwood Region Data
 * P20 - Complete region implementation: ancient forest with mist and fey elements
 */

// ============================================================================
// REGION METADATA
// ============================================================================

export const THORNWOOD_REGION = {
  id: 'thornwood',
  name: 'Thornwood',
  subtitle: 'The Whispering Wood',
  description: 'An ancient forest where giant trees pierce the mist and fey creatures dwell in shadow. The Thornmother holds the Root Shard here, guarding it with illusions and corrupted beasts.',
  
  // Geographic bounds (world coordinates)
  bounds: {
    minX: -2000,
    maxX: -500,
    minZ: -1500,
    maxZ: -200,
  },
  
  // Center point for fast travel
  center: { x: -1250, z: -850 },
  
  // Difficulty rating (1-5)
  difficulty: 3,
  
  // Recommended level
  recommendedLevel: 8,
};

// ============================================================================
// BIOME PARAMETERS
// ============================================================================

export const THORNWOOD_BIOMES = {
  // Deep Forest (dominant biome)
  deepForest: {
    id: 'thornwood_deep_forest',
    name: 'Ancient Forest',
    type: 'forest',
    
    // Terrain generation
    terrain: {
      baseHeight: 0.3,
      heightVariation: 0.4,
      roughness: 0.6,
      slope: 0.3,
    },
    
    // Vegetation density
    vegetation: {
      treeDensity: 0.9,        // Very dense
      grassDensity: 0.4,       // Moderate undergrowth
      bushDensity: 0.6,        // Thick bushes
      flowerDensity: 0.1,      // Sparse flowers
      mushroomDensity: 0.3,    // Notable mushroom presence
    },
    
    // Tree types (weighted)
    treeTypes: [
      { id: 'ancient_oak', weight: 0.4 },
      { id: 'twisted_elm', weight: 0.3 },
      { id: 'mossy_beech', weight: 0.2 },
      { id: 'fey_willow', weight: 0.1 },
    ],
    
    // Ground cover
    groundCover: [
      { id: 'moss', weight: 0.5 },
      { id: 'fallen_leaves', weight: 0.3 },
      { id: 'ferns', weight: 0.2 },
    ],
    
    // Fog parameters
    fog: {
      density: 0.7,            // Heavy fog
      color: { r: 0.6, g: 0.7, b: 0.6 }, // Greenish-grey
      startDistance: 20,
      endDistance: 150,
    },
  },
  
  // Forest Edge (transition biome)
  forestEdge: {
    id: 'thornwood_edge',
    name: 'Forest Edge',
    type: 'forest_edge',
    
    terrain: {
      baseHeight: 0.25,
      heightVariation: 0.3,
      roughness: 0.4,
      slope: 0.2,
    },
    
    vegetation: {
      treeDensity: 0.5,
      grassDensity: 0.7,
      bushDensity: 0.4,
      flowerDensity: 0.3,
      mushroomDensity: 0.1,
    },
    
    treeTypes: [
      { id: 'young_oak', weight: 0.5 },
      { id: 'birch', weight: 0.3 },
      { id: 'pine', weight: 0.2 },
    ],
    
    groundCover: [
      { id: 'grass', weight: 0.6 },
      { id: 'wildflowers', weight: 0.3 },
      { id: 'moss', weight: 0.1 },
    ],
    
    fog: {
      density: 0.3,
      color: { r: 0.7, g: 0.8, b: 0.7 },
      startDistance: 50,
      endDistance: 200,
    },
  },
  
  // Fey Grove (special area)
  feyGrove: {
    id: 'thornwood_fey_grove',
    name: 'Fey Grove',
    type: 'magical',
    
    terrain: {
      baseHeight: 0.35,
      heightVariation: 0.2,
      roughness: 0.3,
      slope: 0.1,
    },
    
    vegetation: {
      treeDensity: 0.7,
      grassDensity: 0.8,
      bushDensity: 0.3,
      flowerDensity: 0.8,     // Abundant magical flowers
      mushroomDensity: 0.5,   // Glowing mushrooms
    },
    
    treeTypes: [
      { id: 'fey_willow', weight: 0.6 },
      { id: 'silver_birch', weight: 0.4 },
    ],
    
    groundCover: [
      { id: 'glowing_moss', weight: 0.4 },
      { id: 'fey_flowers', weight: 0.5 },
      { id: 'magic_mushrooms', weight: 0.1 },
    ],
    
    fog: {
      density: 0.5,
      color: { r: 0.7, g: 0.6, b: 0.9 }, // Violet tint
      startDistance: 30,
      endDistance: 120,
    },
    
    // Special properties
    magical: true,
    particleEffects: ['fey_lights', 'floating_spores'],
  },
};

// ============================================================================
// LANDMARKS (8 total)
// ============================================================================

export const THORNWOOD_LANDMARKS = [
  {
    id: 'elmsong_village',
    name: 'Elmsong',
    type: 'settlement',
    position: { x: -1200, z: -800 },
    description: 'A hidden fey village nestled among giant roots. The inhabitants are reclusive and wary of outsiders.',
    discovered: false,
    fastTravel: true,
  },
  {
    id: 'thornmother_grove',
    name: 'Thornmother\'s Grove',
    type: 'dungeon_entrance',
    position: { x: -1400, z: -1000 },
    description: 'The heart of the forest where the Thornmother holds court. Protected by powerful illusions.',
    discovered: false,
    fastTravel: false,
    dungeon: 'thornmother_lair',
  },
  {
    id: 'whispering_stones',
    name: 'Whispering Stones',
    type: 'point_of_interest',
    position: { x: -1100, z: -900 },
    description: 'Ancient standing stones that hum with magical energy. Legends say they mark a portal to the Feywild.',
    discovered: false,
    fastTravel: false,
    lore: 'The stones were erected by the first fey to walk Aethelgard, marking places where the veil between worlds is thin.',
  },
  {
    id: 'mossheart_clearing',
    name: 'Mossheart Clearing',
    type: 'point_of_interest',
    position: { x: -1300, z: -700 },
    description: 'A perfectly circular clearing where the moss glows with an inner light. Animals avoid this place.',
    discovered: false,
    fastTravel: false,
    lore: 'Some say the clearing is the heart of the forest itself, pulsing with the life force of every tree in Thornwood.',
  },
  {
    id: 'ranger_outpost',
    name: 'Silvershade Outpost',
    type: 'settlement',
    position: { x: -900, z: -600 },
    description: 'A small ranger outpost at the forest edge. The rangers monitor the border and warn travelers of dangers within.',
    discovered: false,
    fastTravel: true,
  },
  {
    id: 'rotted_glade',
    name: 'The Rotted Glade',
    type: 'point_of_interest',
    position: { x: -1500, z: -1100 },
    description: 'A section of forest corrupted by the Rot. Trees twist in agony, and the air reeks of decay.',
    discovered: false,
    fastTravel: false,
    lore: 'The Rot spreads slowly through Thornwood, corrupting the ancient trees. The fey fight a losing battle to contain it.',
  },
  {
    id: 'crystal_brook',
    name: 'Crystal Brook',
    type: 'point_of_interest',
    position: { x: -1000, z: -1000 },
    description: 'A clear stream that flows with water so pure it seems to glow. The fey consider it sacred.',
    discovered: false,
    fastTravel: false,
    lore: 'Drinking from the brook is said to grant visions, though the fey warn that not all visions are truthful.',
  },
  {
    id: 'ancient_tree',
    name: 'The Elder Tree',
    type: 'point_of_interest',
    position: { x: -1250, z: -850 },
    description: 'The oldest tree in Thornwood, possibly in all of Aethelgard. Its roots span hundreds of meters.',
    discovered: false,
    fastTravel: true,
    lore: 'The Elder Tree is said to remember the founding of the world. Those who touch its bark may hear whispers of the past.',
  },
];

// ============================================================================
// SETTLEMENT: ELMSONG
// ============================================================================

export const ELMSONG_SETTLEMENT = {
  id: 'elmsong',
  name: 'Elmsong',
  type: 'village',
  region: 'thornwood',
  
  position: { x: -1200, z: -800 },
  radius: 80,
  
  description: 'A hidden fey village built into the roots and branches of giant trees. The architecture blends seamlessly with nature, and the inhabitants move with an otherworldly grace.',
  
  // Buildings
  buildings: [
    {
      id: 'elder_hall',
      name: 'Elder Hall',
      type: 'town_hall',
      position: { x: -1200, z: -800 },
      description: 'The central gathering place, built into the trunk of an ancient oak.',
    },
    {
      id: 'weaver cottage',
      name: 'Mistweaver\'s Cottage',
      type: 'shop',
      position: { x: -1190, z: -795 },
      description: 'A fey weaver sells enchanted cloth and clothing.',
      shop: true,
      shopType: 'tailor',
    },
    {
      id: 'root_tavern',
      name: 'The Twisted Root',
      type: 'tavern',
      position: { x: -1210, z: -805 },
      description: 'A tavern built into a massive root system. Serves fey wine and mortal ale.',
      tavern: true,
    },
    {
      id: 'herbalist_hut',
      name: 'Briarheart\'s Hut',
      type: 'shop',
      position: { x: -1195, z: -810 },
      description: 'A herbalist sells potions and remedies made from forest plants.',
      shop: true,
      shopType: 'alchemist',
    },
  ],
  
  // NPCs
  npcs: [
    {
      id: 'elder_sylas',
      name: 'Elder Sylas',
      type: 'quest_giver',
      position: { x: -1200, z: -800 },
      description: 'The ancient leader of Elmsong, wise and wary.',
      faction: 'thornmother_court',
      disposition: 'cautious',
    },
    {
      id: 'mistweaver_lyra',
      name: 'Lyra Mistweaver',
      type: 'merchant',
      position: { x: -1190, z: -795 },
      description: 'A fey weaver who creates enchanted clothing.',
      faction: 'thornmother_court',
      disposition: 'friendly',
    },
    {
      id: 'briarheart_fin',
      name: 'Fin Briarheart',
      type: 'merchant',
      position: { x: -1195, z: -810 },
      description: 'A herbalist with deep knowledge of forest remedies.',
      faction: 'thornmother_court',
      disposition: 'neutral',
    },
    {
      id: 'rootkeeper_ora',
      name: 'Ora Rootkeeper',
      type: 'quest_giver',
      position: { x: -1210, z: -805 },
      description: 'A guardian of the village, fierce and protective.',
      faction: 'thornmother_court',
      disposition: 'hostile_to_outsiders',
    },
  ],
};

// ============================================================================
// ENEMY VARIANTS (2)
// ============================================================================

export const THORNWOOD_ENEMIES = [
  {
    id: 'thorn_sprite',
    name: 'Thorn Sprite',
    type: 'fey',
    level: 8,
    
    description: 'Small fey creatures that dwell in Thornwood. They are mischievous and territorial, attacking intruders with thorn projectiles and magical tricks.',
    
    // Stats
    health: 45,
    damage: 8,
    defense: 2,
    speed: 12,
    
    // Abilities
    abilities: [
      {
        id: 'thorn_volley',
        name: 'Thorn Volley',
        type: 'ranged',
        damage: 8,
        cooldown: 3,
        description: 'Fires a volley of thorns at the target.',
      },
      {
        id: 'illusion_step',
        name: 'Illusion Step',
        type: 'magical',
        cooldown: 8,
        description: 'Creates an illusion to confuse enemies.',
      },
    ],
    
    // Behavior
    behavior: {
      aggroRange: 15,
      leashRange: 30,
      fleeHealth: 20,
      groupSize: { min: 2, max: 5 },
    },
    
    // Loot
    loot: [
      { itemId: 'fey_dust', chance: 0.8, quantity: { min: 1, max: 3 } },
      { itemId: 'thorn_shard', chance: 0.5, quantity: { min: 1, max: 2 } },
      { itemId: 'enchanted_petals', chance: 0.2, quantity: 1 },
    ],
    
    // Spawn locations
    spawnLocations: [
      { x: -1150, z: -850, count: 3 },
      { x: -1300, z: -900, count: 4 },
      { x: -1050, z: -750, count: 2 },
    ],
  },
  
  {
    id: 'corrupted_bear',
    name: 'Corrupted Bear',
    type: 'beast_rot',
    level: 10,
    
    description: 'Once a noble forest bear, now twisted by the Rot. Its fur is matted with dark corruption, and its eyes glow with malevolent intelligence.',
    
    // Stats
    health: 180,
    damage: 25,
    defense: 8,
    speed: 6,
    
    // Abilities
    abilities: [
      {
        id: 'maul',
        name: 'Maul',
        type: 'melee',
        damage: 25,
        cooldown: 2,
        description: 'A powerful swipe with massive claws.',
      },
      {
        id: 'rot_bile',
        name: 'Rot Bile',
        type: 'ranged',
        damage: 15,
        cooldown: 6,
        description: 'Spits corrosive bile that damages over time.',
        effect: 'poison',
      },
      {
        id: 'charge',
        name: 'Charge',
        type: 'melee',
        damage: 30,
        cooldown: 10,
        description: 'Charges at the target with devastating force.',
      },
    ],
    
    // Behavior
    behavior: {
      aggroRange: 20,
      leashRange: 40,
      fleeHealth: 0, // Never flees
      groupSize: { min: 1, max: 1 },
    },
    
    // Loot
    loot: [
      { itemId: 'corrupted_fur', chance: 0.9, quantity: 1 },
      { itemId: 'bear_claw', chance: 0.7, quantity: { min: 2, max: 4 } },
      { itemId: 'rot_essence', chance: 0.4, quantity: 1 },
      { itemId: 'enchanted_bear_pelt', chance: 0.1, quantity: 1 },
    ],
    
    // Spawn locations
    spawnLocations: [
      { x: -1400, z: -1000, count: 1 },
      { x: -1100, z: -950, count: 1 },
      { x: -1350, z: -750, count: 1 },
    ],
  },
];

// ============================================================================
// QUESTS (6 total)
// ============================================================================

export const THORNWOOD_QUESTS = [
  // Main Quest 1: Enter Thornwood
  {
    id: 'q_thornwood_1_enter',
    name: 'Into the Whispering Wood',
    description: 'The path to the Thornmother\'s domain lies through the ancient forest of Thornwood. Seek out the fey village of Elmsong and learn the ways of the forest.',
    giver: 'elder_sylas',
    region: 'thornwood',
    type: 'main',
    
    objectives: [
      {
        id: 'enter_thornwood',
        type: 'discover_location',
        description: 'Enter Thornwood',
        location: 'thornwood_forest_edge',
      },
      {
        id: 'find_elmsong',
        type: 'discover_location',
        description: 'Find the village of Elmsong',
        location: 'elmsong_village',
      },
      {
        id: 'speak_elder',
        type: 'talk_to',
        description: 'Speak with Elder Sylas',
        npc: 'elder_sylas',
      },
    ],
    
    rewards: {
      xp: 200,
      gold: 50,
      items: ['forest_charm'],
      reputation: { thornmother_court: 10 },
    },
    
    nextQuest: 'q_thornwood_2_thorns',
  },
  
  // Main Quest 2: Clear the Thorns
  {
    id: 'q_thornwood_2_thorns',
    name: 'The Thorn Barrier',
    description: 'The path to the Thornmother\'s Grove is blocked by a barrier of enchanted thorns. Gather materials to craft a potion that will dissolve them.',
    giver: 'briarheart_fin',
    region: 'thornwood',
    type: 'main',
    
    objectives: [
      {
        id: 'collect_moonpetals',
        type: 'collect',
        description: 'Collect Moonpetal Flowers (5)',
        item: 'moonpetal_flower',
        count: 5,
      },
      {
        id: 'collect_dewdrops',
        type: 'collect',
        description: 'Collect Crystal Dewdrops (3)',
        item: 'crystal_dewdrop',
        count: 3,
      },
      {
        id: 'craft_potion',
        type: 'craft',
        description: 'Craft Thorn-Dissolving Potion',
        recipe: 'thorn_dissolving_potion',
      },
      {
        id: 'use_potion',
        type: 'use_item',
        description: 'Use the potion on the thorn barrier',
        location: 'thorn_barrier',
      },
    ],
    
    rewards: {
      xp: 300,
      gold: 75,
      items: ['forest_key'],
      reputation: { thornmother_court: 15 },
    },
    
    nextQuest: 'q_thornwood_3_sprites',
  },
  
  // Main Quest 3: Deal with the Sprites
  {
    id: 'q_thornwood_3_sprites',
    name: 'The Sprite Menace',
    description: 'The thorn sprites have become aggressive, attacking travelers and villagers alike. Thin their numbers and discover what has enraged them.',
    giver: 'rootkeeper_ora',
    region: 'thornwood',
    type: 'main',
    
    objectives: [
      {
        id: 'kill_sprites',
        type: 'kill',
        description: 'Defeat Thorn Sprites (8)',
        enemy: 'thorn_sprite',
        count: 8,
      },
      {
        id: 'find_sprite_nest',
        type: 'discover_location',
        description: 'Find the sprite nest',
        location: 'sprite_nest',
      },
      {
        id: 'investigate_nest',
        type: 'interact',
        description: 'Investigate the sprite nest',
        location: 'sprite_nest',
      },
      {
        id: 'report_ora',
        type: 'talk_to',
        description: 'Report to Ora Rootkeeper',
        npc: 'rootkeeper_ora',
      },
    ],
    
    rewards: {
      xp: 400,
      gold: 100,
      items: ['sprite_ward'],
      reputation: { thornmother_court: 20 },
    },
    
    nextQuest: 'q_thornwood_4_corruption',
  },
  
  // Side Quest 1: The Rotted Glade
  {
    id: 'q_thornwood_side_1_rot',
    name: 'The Spreading Rot',
    description: 'The Rot has taken hold in a sacred glade. The fey beg you to cleanse it before the corruption spreads further.',
    giver: 'elder_sylas',
    region: 'thornwood',
    type: 'side',
    
    objectives: [
      {
        id: 'find_rotted_glade',
        type: 'discover_location',
        description: 'Find the Rotted Glade',
        location: 'rotted_glade',
      },
      {
        id: 'kill_corrupted_bears',
        type: 'kill',
        description: 'Defeat Corrupted Bears (3)',
        enemy: 'corrupted_bear',
        count: 3,
      },
      {
        id: 'cleanse_glade',
        type: 'interact',
        description: 'Cleanse the glade with holy water',
        location: 'rotted_glade',
        item: 'holy_water',
      },
    ],
    
    rewards: {
      xp: 350,
      gold: 80,
      items: ['rot_ward'],
      reputation: { thornmother_court: 25 },
    },
  },
  
  // Side Quest 2: The Lost Ranger
  {
    id: 'q_thornwood_side_2_ranger',
    name: 'The Lost Ranger',
    description: 'A ranger went missing in the deep forest days ago. Search for signs of them and bring news back to the outpost.',
    giver: 'ranger_captain',
    region: 'thornwood',
    type: 'side',
    
    objectives: [
      {
        id: 'search_forest',
        type: 'explore',
        description: 'Search the deep forest',
        location: 'deep_forest',
      },
      {
        id: 'find_ranger',
        type: 'discover_location',
        description: 'Find the missing ranger',
        location: 'ranger_camp',
      },
      {
        id: 'investigate_camp',
        type: 'interact',
        description: 'Investigate the ranger\'s camp',
        location: 'ranger_camp',
      },
      {
        id: 'return_captain',
        type: 'talk_to',
        description: 'Return to the Ranger Captain',
        npc: 'ranger_captain',
      },
    ],
    
    rewards: {
      xp: 250,
      gold: 60,
      items: ['ranger_compass'],
      reputation: { rangers: 15 },
    },
  },
  
  // Side Quest 3: Fey Treasures
  {
    id: 'q_thornwood_side_3_treasures',
    name: 'Whispers of the Fey',
    description: 'The fey speak of hidden treasures scattered throughout the forest. Seek them out and claim their bounty.',
    giver: 'mistweaver_lyra',
    region: 'thornwood',
    type: 'side',
    
    objectives: [
      {
        id: 'find_treasure_1',
        type: 'collect',
        description: 'Find the Fey Treasure at Whispering Stones',
        location: 'whispering_stones',
        item: 'fey_treasure',
      },
      {
        id: 'find_treasure_2',
        type: 'collect',
        description: 'Find the Fey Treasure at Mossheart Clearing',
        location: 'mossheart_clearing',
        item: 'fey_treasure',
      },
      {
        id: 'find_treasure_3',
        type: 'collect',
        description: 'Find the Fey Treasure at Crystal Brook',
        location: 'crystal_brook',
        item: 'fey_treasure',
      },
      {
        id: 'return_lyra',
        type: 'talk_to',
        description: 'Return to Lyra Mistweaver',
        npc: 'mistweaver_lyra',
      },
    ],
    
    rewards: {
      xp: 300,
      gold: 100,
      items: ['fey_cloak'],
      reputation: { thornmother_court: 20 },
    },
  },
];

// ============================================================================
// AMBIENT AUDIO SET
// ============================================================================

export const THORNWOOD_AUDIO = {
  // Background music
  music: {
    exploration: {
      track: 'thornwood_exploration',
      volume: 0.6,
      crossfade: 3.0,
      description: 'Mysterious, ethereal music with woodwinds and strings',
    },
    combat: {
      track: 'thornwood_combat',
      volume: 0.7,
      crossfade: 1.5,
      description: 'Intense percussion with haunting melodies',
    },
    fey_grove: {
      track: 'thornwood_fey_magic',
      volume: 0.5,
      crossfade: 4.0,
      description: 'Magical, otherworldly ambience with chimes and whispers',
    },
  },
  
  // Ambient sounds
  ambience: [
    {
      id: 'forest_wind',
      track: 'forest_wind_light',
      volume: 0.4,
      loop: true,
      description: 'Gentle wind through ancient trees',
    },
    {
      id: 'bird_calls',
      track: 'forest_birds_mysterious',
      volume: 0.3,
      loop: true,
      description: 'Distant, eerie bird calls',
    },
    {
      id: 'water_stream',
      track: 'stream_gentle',
      volume: 0.2,
      loop: true,
      zones: ['crystal_brook'],
      description: 'Gentle stream flowing',
    },
    {
      id: 'fey_whispers',
      track: 'fey_whispers_ambient',
      volume: 0.15,
      loop: true,
      zones: ['fey_grove', 'whispering_stones'],
      description: 'Soft, unintelligible whispers',
    },
  ],
  
  // Sound effects
  sfx: {
    footstep_grass: 'footstep_grass_soft',
    footstep_moss: 'footstep_moss_soft',
    footstep_mud: 'footstep_mud_soft',
    
    thorn_sprite_attack: 'magic_thorn_impact',
    thorn_sprite_death: 'fey_creature_death',
    
    corrupted_bear_roar: 'bear_roar_corrupted',
    corrupted_bear_attack: 'heavy_claw_swipe',
    corrupted_bear_death: 'large_creature_death',
    
    magic_barrier_dissolve: 'magic_barrier_break',
    fey_treasure_found: 'magical_chime_positive',
    
    ui_quest_start: 'quest_start_mystical',
    ui_quest_complete: 'quest_complete_mystical',
  },
};

// ============================================================================
// COLOR GRADING
// ============================================================================

export const THORNWOOD_COLOR_GRADING = {
  // Overall color palette
  palette: {
    primary: { r: 0.2, g: 0.4, b: 0.3 },      // Deep forest green
    secondary: { r: 0.6, g: 0.7, b: 0.6 },    // Misty grey-green
    accent: { r: 0.5, g: 0.3, b: 0.6 },       // Fey violet
    shadow: { r: 0.1, g: 0.15, b: 0.2 },      // Dark blue-green
    highlight: { r: 0.8, g: 0.9, b: 0.7 },    // Soft yellow-green
  },
  
  // Post-processing settings
  postProcessing: {
    // Color correction
    colorCorrection: {
      saturation: 0.8,        // Slightly desaturated
      contrast: 1.1,          // Slightly increased
      brightness: 0.95,       // Slightly darker
      gamma: 1.05,            // Slight gamma adjustment
    },
    
    // Color grading LUT (applied as tint)
    colorGrading: {
      shadows: { r: 0.1, g: 0.15, b: 0.2 },      // Blue-green shadows
      midtones: { r: 0.2, g: 0.3, b: 0.25 },     // Green midtones
      highlights: { r: 0.7, g: 0.8, b: 0.6 },    // Yellow-green highlights
    },
    
    // Fog (handled separately but affects color)
    fog: {
      color: { r: 0.6, g: 0.7, b: 0.6 },
      density: 0.7,
    },
    
    // Bloom (for magical areas)
    bloom: {
      enabled: true,
      intensity: 0.3,
      threshold: 0.8,
      radius: 0.5,
    },
    
    // Vignette
    vignette: {
      enabled: true,
      intensity: 0.3,
      smoothness: 0.5,
    },
  },
  
  // Time-of-day variations
  timeOfDay: {
    dawn: {
      colorShift: { r: 0.1, g: 0.05, b: 0.0 },   // Warm orange tint
      brightness: 0.9,
      fogDensity: 0.8,
    },
    day: {
      colorShift: { r: 0.0, g: 0.0, b: 0.0 },    // Neutral
      brightness: 1.0,
      fogDensity: 0.6,
    },
    dusk: {
      colorShift: { r: 0.15, g: 0.05, b: 0.1 },  // Purple-orange tint
      brightness: 0.85,
      fogDensity: 0.9,
    },
    night: {
      colorShift: { r: -0.1, g: -0.05, b: 0.1 }, // Blue tint
      brightness: 0.6,
      fogDensity: 0.5,
    },
  },
  
  // Special area overrides
  specialAreas: {
    fey_grove: {
      colorShift: { r: 0.0, g: 0.1, b: 0.2 },    // Violet tint
      saturation: 1.2,
      bloom: { intensity: 0.5 },
    },
    rotted_glade: {
      colorShift: { r: 0.1, g: -0.1, b: -0.1 },  // Sickly green
      saturation: 0.6,
      contrast: 1.3,
    },
  },
};

// ============================================================================
// WEATHER WEIGHTS
// ============================================================================

export const THORNWOOD_WEATHER = {
  // Base weather probabilities (must sum to 1.0)
  baseWeights: {
    clear: 0.15,        // Rare in Thornwood
    overcast: 0.35,     // Common
    fog: 0.30,          // Very common
    rain: 0.15,         // Moderate
    storm: 0.03,        // Rare
    snow: 0.02,         // Very rare
  },
  
  // Time-of-day modifiers
  timeModifiers: {
    dawn: {
      fog: 1.5,         // More fog at dawn
      clear: 0.7,
    },
    day: {
      // No modifiers
    },
    dusk: {
      fog: 1.3,         // More fog at dusk
      overcast: 1.2,
    },
    night: {
      fog: 1.8,         // Much more fog at night
      clear: 0.5,
    },
  },
  
  // Season modifiers (if seasonal system exists)
  seasonModifiers: {
    spring: {
      rain: 1.3,
      clear: 1.2,
    },
    summer: {
      clear: 1.5,
      fog: 0.8,
    },
    autumn: {
      fog: 1.4,
      rain: 1.2,
    },
    winter: {
      snow: 2.0,
      fog: 1.6,
      clear: 0.5,
    },
  },
  
  // Special event modifiers
  eventModifiers: {
    fey_festival: {
      clear: 2.0,       // Clear skies during festival
      fog: 0.3,
    },
    rot_spread: {
      fog: 2.0,         // More fog when Rot is active
      storm: 1.5,
    },
    thornmother_angry: {
      storm: 3.0,       // Storms when Thornmother is angered
      fog: 1.5,
    },
  },
  
  // Weather effects on gameplay
  effects: {
    fog: {
      visibilityReduction: 0.6,    // 60% visibility
      enemyDetectionRange: 0.7,    // 70% detection range
      navigationPenalty: 1.2,      // 20% slower movement
    },
    rain: {
      visibilityReduction: 0.8,
      fireDamageReduction: 0.5,    // 50% less fire damage
      staminaRegenReduction: 0.9,  // 10% slower stamina regen
    },
    storm: {
      visibilityReduction: 0.5,
      lightningChance: 0.01,       // 1% chance per second
      windEffect: 1.5,             // Stronger wind effects
    },
  },
};

// ============================================================================
// VALIDATION
// ============================================================================

export function validateThornwoodRegion(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate landmarks
  if (THORNWOOD_LANDMARKS.length !== 8) {
    errors.push(`Expected 8 landmarks, got ${THORNWOOD_LANDMARKS.length}`);
  }
  
  // Validate settlement
  if (!ELMSONG_SETTLEMENT.buildings || ELMSONG_SETTLEMENT.buildings.length === 0) {
    errors.push('Settlement must have at least one building');
  }
  
  if (!ELMSONG_SETTLEMENT.npcs || ELMSONG_SETTLEMENT.npcs.length === 0) {
    errors.push('Settlement must have at least one NPC');
  }
  
  // Validate enemies
  if (THORNWOOD_ENEMIES.length !== 2) {
    errors.push(`Expected 2 enemy variants, got ${THORNWOOD_ENEMIES.length}`);
  }
  
  for (const enemy of THORNWOOD_ENEMIES) {
    if (!enemy.spawnLocations || enemy.spawnLocations.length === 0) {
      errors.push(`Enemy ${enemy.id} has no spawn locations`);
    }
  }
  
  // Validate quests
  if (THORNWOOD_QUESTS.length !== 6) {
    errors.push(`Expected 6 quests, got ${THORNWOOD_QUESTS.length}`);
  }
  
  for (const quest of THORNWOOD_QUESTS) {
    if (!quest.objectives || quest.objectives.length === 0) {
      errors.push(`Quest ${quest.id} has no objectives`);
    }
    
    if (!quest.rewards) {
      errors.push(`Quest ${quest.id} has no rewards`);
    }
  }
  
  // Validate audio
  if (!THORNWOOD_AUDIO.music || Object.keys(THORNWOOD_AUDIO.music).length === 0) {
    errors.push('Region must have at least one music track');
  }
  
  if (!THORNWOOD_AUDIO.ambience || THORNWOOD_AUDIO.ambience.length === 0) {
    errors.push('Region must have at least one ambient sound');
  }
  
  // Validate color grading
  if (!THORNWOOD_COLOR_GRADING.palette) {
    errors.push('Region must have color palette defined');
  }
  
  // Validate weather
  const weatherSum = Object.values(THORNWOOD_WEATHER.baseWeights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weatherSum - 1.0) > 0.01) {
    errors.push(`Weather weights must sum to 1.0, got ${weatherSum}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Run validation on import
const validation = validateThornwoodRegion();
if (!validation.valid) {
  console.error('[Thornwood] Validation failed:', validation.errors);
} else {
  console.log('[Thornwood] Region data validated successfully');
}
