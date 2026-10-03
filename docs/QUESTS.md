# Quest System

## Overview

The quest system provides a complete quest framework with dialogue, choices, reputation effects, inventory, crafting, merchants, and persistent world state. All quests are data-driven and schema-validated.

## Architecture

```
QuestSystem (orchestrator)
├── QuestValidator (schema validation)
├── JournalSystem (quest tracking)
├── InventorySystem (items and gear)
├── CraftingSystem (forge, cooking)
├── MerchantSystem (reputation-based pricing)
├── WorldFlagsSystem (persistent state)
└── QuestBot (automated testing)
```

## Quest Schema

### Quest Structure

```typescript
interface Quest {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Quest description
  giverId: string;               // NPC who gives quest
  status: QuestStatus;           // AVAILABLE, ACTIVE, COMPLETED, FAILED
  steps: QuestStep[];            // Quest steps
  currentStepId: string;         // Current step
  rewards: QuestReward[];        // Completion rewards
  requiredLevel?: number;        // Minimum level
  requiredFlags?: string[];      // Required world flags
  setFlags?: string[];           // Flags to set on completion
  repeatable?: boolean;          // Can be repeated
}
```

### Quest Steps

```typescript
interface QuestStep {
  id: string;                    // Step identifier
  type: QuestStepType;           // Step type
  description: string;           // Step description
  target?: string;               // Target NPC/location/item/enemy
  count?: number;                // Required count (for KILL/COLLECT)
  choices?: QuestChoice[];       // Dialogue choices
  nextStepId?: string;           // Next step
  requiredFlags?: string[];      // Required flags
  setFlags?: string[];           // Flags to set
}
```

### Step Types

| Type | Description | Target | Count |
|------|-------------|--------|-------|
| TALK_TO | Talk to NPC | NPC ID | - |
| GO_TO | Go to location | Location ID | - |
| KILL | Kill enemies | Enemy type | Required |
| COLLECT | Collect items | Item ID | Required |
| CRAFT | Craft item | Recipe ID | - |
| DELIVER | Deliver item | NPC ID | - |
| CHOICE | Make dialogue choice | - | - |

### Quest Choices

```typescript
interface QuestChoice {
  id: string;                              // Choice identifier
  text: string;                            // Choice text
  reputationChange?: Record<string, number>; // Faction reputation changes
  nextStepId?: string;                     // Branch to next step
  requiredFlags?: string[];                // Required flags
  setFlags?: string[];                     // Flags to set
}
```

### Quest Rewards

```typescript
interface QuestReward {
  type: 'item' | 'gold' | 'xp' | 'reputation';
  id?: string;        // Item ID (for item rewards)
  amount: number;     // Amount
  factionId?: string; // Faction ID (for reputation)
}
```

## SLICE Quests (First 6)

### Q1: A Knight's Awakening
- **Giver**: Elder Bram
- **Description**: You awaken in Briarhollow with no memory. Speak to the village elder.
- **Steps**:
  1. Talk to Elder Bram
  2. Listen to story (choice affects reputation)
  3. Go to village square
- **Rewards**: 50 XP, 10 gold
- **Flags**: `met_elder_bram`, `quest1_started`

### Q2: Wolf Problem
- **Giver**: Elder Bram
- **Requires**: `quest1_started`
- **Description**: Wolves attacking livestock. Hunt 3 wolves.
- **Steps**:
  1. Talk to Elder Bram
  2. Kill 3 wolves
  3. Return to Elder Bram
- **Rewards**: 100 XP, 25 gold, +10 Villagers reputation
- **Flags**: `wolves_defeated`

### Q3: The Lost Locket
- **Giver**: Martha (villager)
- **Description**: Find Martha's lost locket at the riverbank.
- **Steps**:
  1. Talk to Martha
  2. Go to riverbank
  3. Collect golden locket
  4. Deliver to Martha
- **Rewards**: 75 XP, 15 gold, +5 Villagers reputation

### Q4: The Smith's Request
- **Giver**: Eadric the Blacksmith
- **Description**: Collect 5 iron ore from the mine.
- **Steps**:
  1. Talk to Eadric
  2. Collect 5 iron ore
  3. Deliver to Eadric
- **Rewards**: 100 XP, Iron Sword, +10 Villagers reputation

### Q5: Bandit Threat
- **Giver**: Guard Captain
- **Requires**: `wolves_defeated`
- **Description**: Clear bandit camp east of Briarhollow.
- **Steps**:
  1. Talk to Guard Captain
  2. Go to bandit camp
  3. Kill 5 bandits
  4. Kill bandit leader
  5. Return to Guard Captain
- **Rewards**: 200 XP, 50 gold, +15 Guards reputation
- **Flags**: `bandits_defeated`

### Q6: The Merchant's Invitation
- **Giver**: Merchant Guild Envoy
- **Requires**: `bandits_defeated`
- **Description**: Merchant Guild offers invitation.
- **Steps**:
  1. Talk to Envoy
  2. Make choice (affects reputation)
     - Accept: +20 Merchants, -5 Villagers → Go to Goldacre
     - Decline: +10 Villagers, -10 Merchants → Return to Elder
- **Rewards**: 150 XP, 30 gold
- **Flags**: `merchant_guild_contacted`

## Quest Validator

### Validation Rules

1. **No unreachable steps** - All steps must be reachable from first step
2. **No missing references** - All nextStepId and choice targets must exist
3. **Valid step types** - Steps with targets must have targets defined
4. **Valid counts** - KILL and COLLECT steps must have counts

### Usage

```typescript
const validator = new QuestValidator();
const result = validator.validate(quest);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

### Validation Results

```typescript
interface QuestValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  questId: string;
  stepId: string;
  message: string;
}
```

## Inventory System

### Item Types

| Type | Description | Stackable |
|------|-------------|-----------|
| WEAPON | Weapons | No |
| ARMOR | Armor pieces | No |
| CONSUMABLE | Potions, food | Yes |
| MATERIAL | Crafting materials | Yes |
| QUEST | Quest items | Yes |
| MISC | Miscellaneous | Varies |

### Equipment Slots

- WEAPON, SHIELD
- HEAD, CHEST, LEGS, HANDS, FEET
- RING_1, RING_2, AMULET

### Usage

```typescript
const inventory = new InventorySystem();

// Add item
inventory.addItem(item, count);

// Remove item
inventory.removeItem(itemId, count);

// Check item
inventory.hasItem(itemId, count);

// Equip item
inventory.equip(itemId);

// Get gold
inventory.getGold();
inventory.addGold(amount);
```

## Crafting System

### Crafting Stations

| Station | Description |
|---------|-------------|
| FORGE | Weapons and armor |
| COOKING | Food and potions |
| ALCHEMY | Potions and elixirs |

### Recipes

```typescript
interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  station: CraftingStation;
  result: { itemId: string; count: number };
  ingredients: Array<{ itemId: string; count: number }>;
  requiredLevel?: number;
  craftTime: number;
}
```

### Default Recipes

**Forge:**
- Iron Sword (3 iron ore, 1 wood)
- Iron Shield (4 iron ore, 2 wood)
- Steel Sword (3 steel ingot, 1 wood, level 5)

**Cooking:**
- Cooked Meat (1 raw meat)
- Hearty Stew (2 raw meat, 3 vegetables, 1 water)
- Bread (2 flour, 1 water)

### Usage

```typescript
const crafting = new CraftingSystem(inventory);

// Get recipes
const recipes = crafting.getRecipesByStation(CraftingStation.FORGE);

// Check if can craft
if (crafting.canCraft('iron_sword')) {
  crafting.craft('iron_sword');
}
```

## Merchant System

### Reputation-Based Pricing

Prices are modified by faction reputation:
- **Reputation -100**: 1.5x price (hostile)
- **Reputation 0**: 1.0x price (neutral)
- **Reputation +100**: 0.5x price (friendly)

### Merchant Structure

```typescript
interface Merchant {
  id: string;
  name: string;
  factionId: FactionType;
  inventory: MerchantInventory[];
  buyMultiplier: number;  // What they pay (0-1)
  sellMultiplier: number; // What they charge (1+)
}
```

### Usage

```typescript
const merchants = new MerchantSystem(inventory, factionSystem);

// Get price
const price = merchants.getItemPrice('blacksmith_briarhollow', 'iron_sword');

// Buy item
merchants.buyItem('blacksmith_briarhollow', 'iron_sword', 1);

// Sell item
merchants.sellItem('blacksmith_briarhollow', 'iron_ore', 5);
```

## World Flags System

### Purpose

Persistent world state that affects quest availability and world events.

### Usage

```typescript
const flags = new WorldFlagsSystem();

// Set flag
flags.setFlag('quest1_completed');

// Check flag
if (flags.hasFlag('quest1_completed')) {
  // Quest 2 available
}

// Check multiple flags
if (flags.hasAllFlags(['flag1', 'flag2'])) {
  // Both flags set
}

// Export/import for saves
const exported = flags.export();
flags.import(exported);
```

## Journal System

### Purpose

Tracks active and completed quests with current objectives.

### Usage

```typescript
const journal = new JournalSystem();

// Add quest
journal.addQuest(quest);

// Get quests by status
const active = journal.getQuestsByStatus(QuestStatus.ACTIVE);
const completed = journal.getQuestsByStatus(QuestStatus.COMPLETED);

// Get journal entries
const entries = journal.getJournal();
```

## Quest Bot

### Purpose

Headless bot for automated testing of quest logic.

### Usage

```typescript
const bot = new QuestBot(questSystem, inventory, worldFlags, factionSystem);

// Run single quest
bot.runQuest('q1_wake_up');

// Run all quests
const result = bot.runAllQuests();
console.log(`Completed: ${result.completed}, Failed: ${result.failed}`);

// Get action log
const log = bot.getActionLog();
```

### Bot Actions

| Action | Description |
|--------|-------------|
| start_quest | Start a quest |
| complete_step | Complete current step |
| make_choice | Make dialogue choice |
| add_item | Add item to inventory |
| set_flag | Set world flag |

## Integration

### Quest System Setup

```typescript
// Create systems
const inventory = new InventorySystem();
const worldFlags = new WorldFlagsSystem();
const factionSystem = new FactionSystem();
const questSystem = new QuestSystem(inventory, worldFlags, factionSystem);

// Load quests
SLICE_QUESTS.forEach(q => questSystem.addQuest(q));

// Get available quests
const available = questSystem.getAvailableQuests();

// Start quest
questSystem.startQuest('q1_wake_up');

// Complete step
questSystem.completeStep('q1_wake_up');

// Handle choice
questSystem.handleChoice('q1_wake_up', 'q1_choice1');
```

### Streaming Integration

```typescript
// In CellContentProvider
async generateContent(chunkX, chunkZ, chunkData) {
  // Check for quest NPCs
  const npcs = getQuestNPCsInChunk(chunkX, chunkZ);
  
  for (const npc of npcs) {
    // Check if NPC has available quests
    const quests = questSystem.getAvailableQuests()
      .filter(q => q.giverId === npc.id);
    
    if (quests.length > 0) {
      // Show quest indicator
      npc.showQuestIndicator();
    }
  }
}
```

## Testing

### Unit Tests

```bash
npm test tests/quests.test.ts
```

**Coverage:**
- ✅ Quest management (add, start, complete, fail)
- ✅ Quest steps (complete, move to next, set flags)
- ✅ Quest choices (handle choice, apply reputation)
- ✅ Quest rewards (gold, reputation, items)
- ✅ Quest requirements (flags, level)
- ✅ Quest validation (unreachable steps, missing references)
- ✅ Inventory (add, remove, stack, equip)
- ✅ Crafting (recipes, craft items)
- ✅ World flags (set, unset, check, export/import)
- ✅ Quest bot (run quests, log actions)
- ✅ SLICE quests integration (6 quests, valid graph, proper chain)

### Manual Testing

**Test Quest 1:**
1. Run `npm run dev`
2. Navigate to Briarhollow
3. Find Elder Bram
4. Start quest "A Knight's Awakening"
5. Talk to Elder Bram
6. Make choice (affects reputation)
7. Go to village square
8. Complete quest

**Check:**
- [ ] Quest appears in journal
- [ ] Steps update correctly
- [ ] Choice affects reputation
- [ ] Rewards given (XP, gold)
- [ ] Flags set correctly
- [ ] Next quest becomes available

## Performance

### Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| Quest validation | < 1ms | Per quest |
| Step completion | < 0.1ms | Per step |
| Journal update | < 0.1ms | Per update |
| Inventory ops | < 0.01ms | Per operation |

### Optimizations

- Quest data loaded once at startup
- Journal entries cached
- Flag checks are O(1) with Set
- Inventory uses Map for O(1) lookups

## Known Limitations

1. **No dialogue UI** - Choices handled programmatically
2. **No quest markers** - Would need map integration
3. **No quest tracking UI** - Journal is data-only
4. **Limited item database** - Items hardcoded
5. **No quest timers** - Time-limited quests not supported
6. **No quest chains UI** - Prerequisites not visible

## Future Improvements

- [ ] Dialogue UI with voice acting
- [ ] Quest markers on map
- [ ] Quest tracking HUD
- [ ] Quest log UI
- [ ] Quest timers and deadlines
- [ ] Quest difficulty ratings
- [ ] Quest categories (main, side, daily)
- [ ] Quest achievements
- [ ] Quest rewards preview
- [ ] Quest sharing (multiplayer)

## Files

- `src/engine/quests/QuestSystem.ts` - Main orchestrator
- `src/engine/quests/QuestValidator.ts` - Schema validation
- `src/engine/quests/InventorySystem.ts` - Items and gear
- `src/engine/quests/CraftingSystem.ts` - Crafting
- `src/engine/quests/MerchantSystem.ts` - Merchants
- `src/engine/quests/JournalSystem.ts` - Quest tracking
- `src/engine/quests/WorldFlagsSystem.ts` - Persistent state
- `src/engine/quests/QuestBot.ts` - Automated testing
- `src/content/quests/schema.ts` - Quest schemas
- `src/content/quests/slice-quests.ts` - SLICE quest data
- `tests/quests.test.ts` - Unit tests
