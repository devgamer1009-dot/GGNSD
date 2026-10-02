# GAMEPLAY — CrownFall Design Bible

> P2 Design Phase · Original IP · All content below is fictional.

---

## BRIEF (verbatim)

> Crownfall. The old king is dead, his crown shattered into five shards held by rival powers; a blight (the Rot) is spreading. You are an exiled squire turned wandering knight. Original IP only. Medieval fantasy: castles, villages, knights, mages, dragons, the Rot undead.
>
> Pillars: awe at scale; freedom (regions open from the start, gates are power not walls); responsive movement and weighty melee; living world; showcase visuals; photo mode.
>
> Gameplay: horse riding, sword and shield, bow, three spell schools, stamina, dodge/parry, lock-on, cultivation-style Core? NO: use a classic gear + skill-tree progression. Photo mode, fast travel, fog-of-war map.

---

## Pillars (Gameplay)

1. **Awe at scale** — The world is bigger than you. Always.
2. **Freedom** — All regions open from the start. Gates are power-gates, not walls.
3. **Responsive movement & weighty melee** — Every swing has consequence.
4. **Living world** — NPCs live. Weather shifts. The Rot advances.
5. **Showcase visuals** — Every frame is a painting.
6. **Photo mode** — The player is a tourist as well as a hero.

---

## Movement

| Action        | Input            | Feel                              |
| ------------- | ---------------- | --------------------------------- |
| Walk          | WASD             | Grounded, 4 m/s                   |
| Sprint        | Shift (hold)     | 7 m/s, drains stamina             |
| Dodge/Roll    | Space (tap)      | i-frames, 0.4s, 12m distance      |
| Jump          | Space (in air)   | No double-jump. Gravity is heavy. |
| Climb         | Auto on ledges   | Stamina cost. Can hang.           |
| Swim          | Auto in water    | Slow. Drowning timer 30s.         |
| Horse mount   | E near horse     | Instant. Horse has stamina.       |
| Horse gallop  | Shift on horse   | 18 m/s. Can trample small foes.   |

**Feel:** Weighty. No floaty jumps. Momentum matters. Turning has inertia.

---

## Combat — Melee

**Philosophy:** Dark Souls-lite. Commit to attacks. Punish greed.

| Action       | Stamina Cost | i-frames | Notes                        |
| ------------ | ------------ | -------- | ---------------------------- |
| Light attack | 10           | 0        | Fast, 0.3s windup            |
| Heavy attack | 25           | 0        | Slow, 0.8s, breaks guard     |
| Block        | 0 (hold)     | 0        | Drains stamina on hit        |
| Parry        | 15           | 0.2s     | Perfect-timed, staggers foe  |
| Dodge        | 20           | 0.4s     | Invincibility frames         |
| Lock-on      | Tab          | —        | Sticky camera on target      |

**Weapon types:** Sword, greatsword, axe, mace, spear. Each has unique moveset.
**Shield:** Small (fast parry), medium (balanced), great (slow, high guard).

---

## Combat — Ranged

| Weapon    | Ammo      | DPS   | Notes                        |
| --------- | --------- | ----- | ---------------------------- |
| Short bow | Arrows    | Med   | Fast draw, low damage        |
| Long bow  | Arrows    | High  | Slow draw, headshot bonus    |
| Crossbow  | Bolts     | High  | Slow reload, armor pierce    |

Arrows are craftable. Rare arrows (fire, poison, Rot-bane) found as loot.

---

## Combat — Magic (Three Schools)

### Pyromancy — Fire & Destruction
- Fireball, Flame Wall, Meteor (ultimate)
- Short cooldowns. High burst.
- Scales with **Will** stat.

### Hydromancy — Water & Healing
- Heal, Frost Nova, Tidal Surge
- Defensive. Sustain-focused.
- Scales with **Faith** stat.

### Umbramancy — Shadow & Control
- Shadow Step (teleport), Fear, Soul Drain
- Utility. Crowd control.
- Scales with **Cunning** stat.

**Spell slots:** 4 equipped at a time. Swap at campfires.
**Mana:** Regenerates slowly. Potions exist but are scarce.

---

## Progression — Gear + Skill Tree

**NO cultivation system.** Classic RPG progression.

### Gear
- **Weapons:** Common → Uncommon → Rare → Epic → Legendary (5 tiers)
- **Armor:** Head, chest, legs, hands, feet (5 slots)
- **Accessories:** 2 rings, 1 amulet
- **Upgrades:** Smithing at forges. Requires materials + gold.

### Skill Tree (3 branches)

| Branch     | Focus          | Key Skills                          |
| ---------- | -------------- | ----------------------------------- |
| Martial    | Melee, defense | Parry master, Iron Will, Cleave     |
| Ranger     | Ranged, stealth| Eagle Eye, Shadow Walk, Volley      |
| Arcane     | Magic, utility | Spell Echo, Mana Font, Ward         |

- **Skill points:** 1 per level. Max level 30.
- **Respec:** Available at Mages' Compact shrines (costs gold).
- **No auto-level.** Player chooses every point.

### Stats
Strength (melee), Dexterity (speed), Vitality (HP/stamina), Will (fire), Faith (water), Cunning (shadow/crit).

---

## Stamina System

Max 100 (base). Regen 15/s (out of combat), 8/s (in combat). At 0: no dodge/attack for 1.5s. Does NOT affect movement speed.

---

## Photo Mode

Pause game. Free camera. 8 filters. FOV slider (30°–120°). Hide HUD. Depth of field. Export PNG at 2x.

---

## Map & Fast Travel

Fog of war. Reveal by climbing. Player markers (20 max). Hand-drawn parchment style. Waystones for fast travel (must discover first, free). No fast travel in combat/dungeons.

---

## Living World

Day/night (24 min = 1 day). Weather (clear, rain, fog, snow, storm). NPC schedules. Rot spreads. Wildlife migrates.

---

## Session Loop
Explore → Fight → Loot → Upgrade → Story → Repeat
