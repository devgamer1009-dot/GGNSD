# Thornwood Region Review Guide - P20

## Overview

This document provides a structured guide for testing the Thornwood region - an ancient forest filled with mist, fey creatures, and the corrupting influence of the Rot.

## Region Profile

**Name:** Thornwood  
**Subtitle:** The Whispering Wood  
**Theme:** Ancient forest, fey magic, mystery, corruption  
**Difficulty:** ★★★☆☆ (3/5)  
**Recommended Level:** 8  
**Estimated Playtime:** 2-3 hours (main quests) + 1-2 hours (side content)

## What You Should Explore

### Starting the Region

1. **Travel to Thornwood**: From Greenmarch, head northwest toward the forest
2. **Enter the Forest Edge**: Transition from farmland to ancient woods
3. **Discover Elmsong**: Find the hidden fey village
4. **Meet Elder Sylas**: Begin the main questline

### Core Experience

**Atmosphere:**
- Dense, ancient forest with giant trees
- Perpetual mist reducing visibility
- Eerie, mysterious ambiance
- Fey magic permeates the air
- Signs of Rot corruption in certain areas

**Key Locations:**
1. **Elmsong Village** - Hidden fey settlement
2. **Thornmother's Grove** - Dungeon entrance (main quest destination)
3. **Whispering Stones** - Ancient standing stones with lore
4. **Mossheart Clearing** - Magical glowing clearing
5. **Silvershade Outpost** - Ranger station at forest edge
6. **The Rotted Glade** - Corrupted area with dangerous enemies
7. **Crystal Brook** - Sacred stream with visions
8. **The Elder Tree** - Oldest tree in the forest

### Quest Flow

**Main Quests (3):**
1. **Into the Whispering Wood** - Enter the forest, find Elmsong
2. **The Thorn Barrier** - Gather materials, craft potion, clear path
3. **The Sprite Menace** - Deal with aggressive thorn sprites

**Side Quests (3):**
1. **The Spreading Rot** - Cleanse corrupted glade
2. **The Lost Ranger** - Find missing ranger
3. **Whispers of the Fey** - Collect hidden treasures

### Enemies

**Thorn Sprite** (Level 8)
- Small fey creatures
- Ranged attacks with thorns
- Can create illusions
- Spawn in groups of 2-5
- Drop: Fey dust, thorn shards

**Corrupted Bear** (Level 10)
- Large beast twisted by the Rot
- Powerful melee attacks
- Can spit corrosive bile
- Never flees
- Drop: Corrupted fur, bear claws, rot essence

### Settlement: Elmsong

**Buildings:**
- Elder Hall (town center)
- Mistweaver's Cottage (tailor shop)
- The Twisted Root (tavern)
- Briarheart's Hut (alchemist)

**Key NPCs:**
- Elder Sylas (quest giver, village leader)
- Lyra Mistweaver (tailor merchant)
- Fin Briarheart (alchemist merchant)
- Ora Rootkeeper (guard, quest giver)

## 5 Targeted Questions

### Question 1: Atmosphere & Immersion
**Test**: Spend 5 minutes just walking through the forest
- [ ] Does the mist feel appropriate (not too thick, not too thin)?
- [ ] Is the color grading creating the right mood (deep greens, silvers, violets)?
- [ ] Do the ambient sounds (wind, birds, whispers) enhance immersion?
- [ ] Does the music match the mysterious, enchanted atmosphere?
- [ ] Are there enough visual details (giant trees, moss, glowing mushrooms)?

**Expected**: The forest should feel ancient, mysterious, and slightly dangerous. Players should want to explore.

### Question 2: Navigation & Discovery
**Test**: Try to find all 8 landmarks without a map
- [ ] Are landmarks discoverable through exploration?
- [ ] Do visual cues guide players to important locations?
- [ ] Is Elmsong hidden enough to feel like a discovery but not impossible to find?
- [ ] Are the Whispering Stones and other points of interest memorable?
- [ ] Does the forest feel large but not empty?

**Expected**: Players should feel rewarded for exploration. Landmarks should be findable but not obvious.

### Question 3: Quest Flow & Pacing
**Test**: Complete all 6 quests in order
- [ ] Do quests introduce the region gradually?
- [ ] Are quest objectives clear and achievable?
- [ ] Is there good variety (exploration, combat, crafting, collection)?
- [ ] Do quests reveal lore about the Thornmother and the Rot?
- [ ] Is the difficulty curve appropriate (sprites first, then bears)?

**Expected**: Quests should teach players about the region while providing engaging challenges.

### Question 4: Combat & Enemy Variety
**Test**: Fight both enemy types in different scenarios
- [ ] Are Thorn Sprites challenging in groups but manageable solo?
- [ ] Do Corrupted Bears feel like significant threats?
- [ ] Are enemy abilities visually distinct and readable?
- [ ] Is combat balanced for level 8-10 players?
- [ ] Do enemies use the environment (trees, mist) effectively?

**Expected**: Combat should be challenging but fair. Different enemy types should require different tactics.

### Question 5: Settlement & NPC Interaction
**Test**: Spend time in Elmsong village
- [ ] Does the village feel like a living fey settlement?
- [ ] Are NPCs distinct and memorable?
- [ ] Do shops sell appropriate items for the region?
- [ ] Is the tavern a good social hub?
- [ ] Do NPCs react appropriately to the player (wary of outsiders)?

**Expected**: Elmsong should feel like a unique, alien place that players want to return to.

## Integration Points to Verify

### System Integration
- ✅ Terrain system generates appropriate forest landscape
- ✅ Vegetation system places correct tree types and density
- ✅ Streaming system loads region chunks efficiently
- ✅ Environment system applies correct fog and weather
- ✅ Audio system plays region-specific music and ambience
- ✅ Quest system tracks Thornwood quests
- ✅ Enemy AI system spawns and controls region enemies
- ✅ Settlement system generates Elmsong village
- ✅ Save system preserves region progress

### Data Validation
- ✅ All 8 landmarks have valid positions and descriptions
- ✅ Settlement has 4 buildings and 4 NPCs
- ✅ 2 enemy types have spawn locations and loot tables
- ✅ 6 quests have objectives and rewards
- ✅ Audio set has music, ambience, and SFX
- ✅ Color grading applies correctly
- ✅ Weather weights sum to 1.0

## Known Features

### Visual
- **Color Palette**: Deep greens, silvers, violets
- **Fog**: Heavy mist with greenish tint
- **Vegetation**: Dense ancient trees, moss, mushrooms
- **Lighting**: Dappled sunlight through canopy
- **Post-Processing**: Bloom for magical areas, vignette

### Audio
- **Music**: Mysterious, ethereal with woodwinds
- **Ambience**: Wind, bird calls, fey whispers
- **SFX**: Soft footsteps, magical effects, creature sounds

### Gameplay
- **Exploration**: Dense forest with hidden paths
- **Combat**: Mix of ranged (sprites) and melee (bears)
- **Crafting**: Region-specific potions and items
- **Lore**: Fey history, Thornmother, the Rot

## Bug Reporting Template

If you find issues, please report using this format:

```
**Issue**: [Brief description]
**Location**: [Where in Thornwood]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Console Errors**: [Any errors in browser console]
**Quest State**: [Current quest and objective]
**Browser**: [Browser name and version]
```

## Success Criteria

The Thornwood region is considered successful if:

1. ✅ All 8 landmarks are discoverable and interesting
2. ✅ Elmsong settlement feels alive and unique
3. ✅ All 6 quests are completable without bugs
4. ✅ Both enemy types are balanced and fun to fight
5. ✅ Atmosphere is immersive and consistent
6. ✅ Audio enhances the experience
7. ✅ Performance is stable (60fps target)
8. ✅ No crashes or major bugs in 2-hour session

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Frame Rate | 60fps | Dense forest is challenging |
| Memory | < 200MB | Region assets |
| Load Time | < 3s | Chunk streaming |
| Draw Calls | < 500 | Vegetation instancing |

## Comparison to Greenmarch

| Aspect | Greenmarch | Thornwood | Difference |
|--------|------------|-----------|------------|
| Mood | Peaceful, golden | Mysterious, misty | More tension |
| Difficulty | ★★☆☆☆ | ★★★☆☆ | Harder enemies |
| Density | Open fields | Dense forest | More claustrophobic |
| Magic | Subtle | Prominent | More fey influence |
| Corruption | Edge only | Spreading | More Rot presence |

## Next Steps After Review

Based on review findings:

1. **Fix Critical Bugs**: Address any crashes or quest blockers
2. **Balance Adjustments**: Tune enemy difficulty and loot
3. **Atmosphere Polish**: Refine fog, lighting, audio
4. **Performance Optimization**: Improve frame rate in dense areas
5. **Content Expansion**: Add more discoverables and lore

## Technical Notes

### Region Data Location
- `src/content/regions/thornwood.ts` - All region data
- Biome parameters, landmarks, settlement, enemies, quests
- Audio, color grading, weather weights
- Validation function

### Integration Points
- Terrain generation uses Thornwood biome parameters
- Vegetation system reads tree density and types
- Quest system loads Thornwood quests
- Enemy AI spawns region enemies
- Audio system plays region-specific sounds
- Post-processing applies color grading

### Performance Considerations
- Dense vegetation requires instancing
- Heavy fog reduces draw distance
- Multiple ambient sounds need mixing
- Complex terrain needs efficient streaming

---

**Review Date**: ___________  
**Reviewer**: ___________  
**Duration**: ___________  
**Quests Completed**: ___/6  
**Landmarks Discovered**: ___/8  
**Overall Status**: [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES

## Quick Reference

### Key Locations (Coordinates)
- Elmsong: (-1200, -800)
- Thornmother's Grove: (-1400, -1000)
- Whispering Stones: (-1100, -900)
- Mossheart Clearing: (-1300, -700)
- Silvershade Outpost: (-900, -600)
- The Rotted Glade: (-1500, -1100)
- Crystal Brook: (-1000, -1000)
- The Elder Tree: (-1250, -850)

### Enemy Spawn Locations
- Thorn Sprites: (-1150, -850), (-1300, -900), (-1050, -750)
- Corrupted Bears: (-1400, -1000), (-1100, -950), (-1350, -750)

### Quest Givers
- Elder Sylas: Elmsong (elder_hall)
- Lyra Mistweaver: Elmsong (weaver_cottage)
- Fin Briarheart: Elmsong (herbalist_hut)
- Ora Rootkeeper: Elmsong (root_tavern)
- Ranger Captain: Silvershade Outpost

### Key Items
- Moonpetal Flowers (quest item)
- Crystal Dewdrops (quest item)
- Thorn-Dissolving Potion (crafted)
- Forest Key (quest reward)
- Sprite Ward (quest reward)
- Fey Treasure (collectible)
