# CONTENT PLAN — CrownFall Design Bible

> P2 Design Phase · Original IP · All content below is fictional.

---

## BRIEF (verbatim)

> Crownfall. The old king is dead, his crown shattered into five shards held by rival powers; a blight (the Rot) is spreading. You are an exiled squire turned wandering knight. Original IP only. Medieval fantasy: castles, villages, knights, mages, dragons, the Rot undead.
>
> Scale (configurable): world 4×4 km first; grow only when benchmarks allow. Slice = Greenmarch only, ~30 min. Full targets: 5 regions, 4 towns + capital, ~80 named NPCs, 30 quests, 8 enemy types, 5 bosses plus a dragon.
>
> Define scope tiers SLICE / BETA / FULL with exact content counts, and a cut list in priority order.

---

## World Scale

| Parameter       | SLICE     | BETA      | FULL      |
| --------------- | --------- | --------- | --------- |
| World size      | 2×2 km    | 3×3 km    | 4×4 km    |
| Regions         | 1         | 3         | 5 + capital |
| Render distance | 500m      | 1000m     | 2000m     |
| Chunk size      | 64×64m    | 64×64m    | 64×64m    |
| Target FPS      | 60        | 60        | 60 (high) / 30 (low) |

Scale grows only when benchmarks pass. Never ship a region that tanks FPS.

---

## Scope Tiers

### SLICE — Vertical Slice (Greenmarch only, ~30 min playtime)

The proof of concept. One region, fully playable, fully polished.

| Category          | Count | Notes                              |
| ----------------- | ----- | ---------------------------------- |
| Regions           | 1     | Greenmarch only                    |
| Towns             | 1     | Briarhollow (village)              |
| Named NPCs        | 12    | Quest-givers, merchants, villagers |
| Quests            | 5     | Main (2) + side (3)               |
| Enemy types       | 3     | Bandit, Wolf, Rot Husk             |
| Bosses            | 1     | The Blight-Knight (Greenmarch)     |
| Dungeons          | 1     | The Hollow Barrow                  |
| Discoverables     | 8     | Points of interest, lore           |
| Waystones         | 3     | Fast travel points                 |
| Loot items        | 15    | Weapons, armor, consumables        |
| Skill tree nodes  | 9     | 3 per branch (Martial/Ranger/Arcane) |
| Playtime          | ~30 min | Main quest + 1 side quest        |

**Goal:** Prove the loop. Explore → Fight → Loot → Upgrade → Story.

---

### BETA — Three Regions + Capital Hub

The playable demo. Enough content for 4-6 hours.

| Category          | Count | Notes                              |
| ----------------- | ----- | ---------------------------------- |
| Regions           | 3     | Greenmarch, Thornwood, Ironcrag    |
| Towns             | 3     | + Goldacre (market town)           |
| Capital           | 1     | Highspire (hub, not explorable interiors) |
| Named NPCs        | 40    | Across all regions + capital       |
| Quests            | 15    | Main (5) + side (10)              |
| Enemy types       | 6     | + Rot Beast, Ice Wraith, Bandit Archer |
| Bosses            | 3     | + Thornmother, Forge-Lord Kaelin   |
| Dungeons          | 3     | 1 per region                       |
| Discoverables     | 25    | Lore, vistas, hidden areas         |
| Waystones         | 10    |                                    |
| Loot items        | 50    | Per tier (Common→Epic)             |
| Skill tree nodes  | 18    | 6 per branch                       |
| Playtime          | 4-6 hours |                                |

**Goal:** Prove the world. Region variety. Travel. Scaling difficulty.

---

### FULL — Complete Game

The final product. 20-30 hours.

| Category          | Count | Notes                              |
| ----------------- | ----- | ---------------------------------- |
| Regions           | 5     | All five                           |
| Towns             | 4     | + Tidegate (Saltfen port)          |
| Capital           | 1     | Highspire (full interiors)         |
| Named NPCs        | 80    | All regions + capital              |
| Quests            | 30    | Main (10) + side (20)             |
| Enemy types       | 8     | + Saltfiend, Ash Wraith            |
| Bosses            | 5     | + Salt Baron, Ember Cultist Leader |
| Dragon            | 1     | Vaeltharax (final boss)            |
| Dungeons          | 5     | 1 per region + 1 capital dungeon   |
| Discoverables     | 50    |                                    |
| Waystones         | 20    |                                    |
| Loot items        | 120   | Including Legendary tier           |
| Skill tree nodes  | 30    | 10 per branch (max level 30)       |
| Playtime          | 20-30 hours |                              |

**Goal:** Ship it. Complete story. All regions. All bosses. The dragon.

---

## Region Breakdown (Summary)

| Region     | Tier        | Settlements | Quests | Boss              | Dungeon          |
| ---------- | ----------- | ----------- | ------ | ----------------- | ---------------- |
| Greenmarch | SLICE+BETA+FULL | 3 | 8 | Blight-Knight | Hollow Barrow |
| Thornwood  | BETA+FULL   | 2           | 6      | Thornmother       | Rootmaze         |
| Ironcrag   | BETA+FULL   | 3           | 6      | Forge-Lord Kaelin | Deep Forge       |
| Saltfen    | FULL        | 3           | 5      | Salt Baron        | Sunken Crypt     |
| Ashfell    | FULL        | 1           | 5      | Cultist Leader + Dragon | Molten Core |
| Highspire  | BETA hub, FULL full | — | 5 | — | Shattered Throne |

---

## Cut List (Priority Order)

If scope must shrink, cut in this order. **Never cut SLICE content.**

| Priority | Cut Item                        | Saves   | Impact   |
| -------- | ------------------------------- | ------- | -------- |
| 1        | Photo mode filters (keep 3)     | 1 week  | Low      |
| 2        | Weather system (keep day/night) | 1 week  | Low      |
| 3        | Horse gallop (keep walk)        | 3 days  | Low      |
| 4        | Umbramancy school (keep 2)      | 1 week  | Medium   |
| 5        | Saltfen region                  | 2 weeks | Medium   |
| 6        | Ashfell region                  | 2 weeks | Medium   |
| 7        | Highspire interiors             | 1 week  | Medium   |
| 8        | Side quests (keep main only)    | 2 weeks | High     |
| 9        | Skill tree branches (keep 1)    | 1 week  | High     |
| 10       | Dragon final boss               | 2 weeks | Critical |

**Hard rule:** SLICE is sacred. If we ship only SLICE, it ships polished.

---

## Milestones
SLICE → P13 (Greenmarch) · BETA → P21 (3 regions) · FULL → P25 (all regions)

## Success Criteria
**SLICE:** 30 min playtest, all 5 quests finishable, boss fair, 60 fps.
**BETA:** 4-6 hours, 3 distinct regions, fast travel works, save/load stable.
**FULL:** 20-30 hours, dragon epic, all story resolves, no game-breaking bugs.
