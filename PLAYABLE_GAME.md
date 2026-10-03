# CrownFall - Playable Game

## 🎮 How to Play

### Start the Game
```bash
npm run dev
```

Then open your browser to the URL shown (usually http://localhost:5173)

### Controls

**Movement:**
- `W` - Move forward
- `A` - Move left
- `S` - Move backward
- `D` - Move right
- `SHIFT` - Sprint (uses stamina)
- `SPACE` - Jump

**Camera:**
- **Click** to lock mouse pointer
- **Move mouse** to look around
- `ESC` - Unlock mouse pointer

**Combat:**
- **Left-click** - Attack enemies (when in range)

**UI:**
- `Q` - Toggle quest log (coming soon)
- `I` - Toggle inventory (coming soon)
- `M` - Toggle map (coming soon)
- `ESC` - Pause game

### Gameplay

1. **Start**: You spawn in a procedural world with terrain, trees, and rocks
2. **Explore**: Move around using WASD, look around with mouse
3. **Fight**: Red enemies will chase you - click to attack them
4. **Quests**: Complete 3 quests automatically as you explore and fight
5. **Weather**: Watch the day/night cycle and weather change dynamically

### HUD Information

**Top-Left:**
- ❤️ Health bar (red)
- ⚡ Stamina bar (green)
- 📍 Your position coordinates
- ⚔️ Number of enemies remaining
- Control hints

**Top-Right:**
- 📜 Current quest name and description
- 🎯 Quest objective
- 📊 Quest progress (if applicable)

## 🎯 Quests

### Quest 1: A Knight's Awakening
- **Objective**: Reach the village marker at position (50, 0, 50)
- **Reward**: Unlocks Quest 2

### Quest 2: Clear the Threat
- **Objective**: Defeat 3 enemies
- **Reward**: Unlocks Quest 3

### Quest 3: Gather Resources
- **Objective**: Collect 5 items (coming soon)
- **Reward**: Quest completion

## 🌍 World Features

### Terrain
- Procedurally generated heightmap using seeded noise
- 200x200 unit area with hills and valleys
- 100 trees scattered around
- 50 rocks for decoration

### Enemies
- 5 red enemies spawn around the map
- AI behavior: idle → chase → attack
- Each enemy has 100 HP
- Deal 15 damage per attack (every 2 seconds)

### Weather
- Dynamic day/night cycle
- 4 weather states: clear, cloudy, rain, storm
- Fog changes with weather
- Sun position and color change with time

## 🏗️ Technical Details

### Architecture
- **SimpleTerrain**: Procedural terrain generation with noise
- **CharacterController**: Player movement, camera, physics
- **CombatSystem**: Enemy AI, attack mechanics
- **QuestManager**: Quest tracking and progression
- **WeatherSystem**: Time of day and weather effects
- **GameUI**: HUD and menu system
- **CrownFallGame**: Main game loop and system integration

### Performance
- Build size: 696.71 kB (186.58 kB gzipped)
- Target: 60 FPS
- Shadow maps: 2048x2048
- Pixel ratio: Capped at 2x for performance

### Technologies
- Three.js for 3D rendering
- TypeScript for type safety
- Vite for fast builds
- React for UI framework

## 🐛 Known Issues

1. **Bundle size warning** - Over 500 kB, could be optimized with code splitting
2. **Quest 3 incomplete** - Item collection not yet implemented
3. **No save system** - Game state not persisted
4. **Limited content** - Only one area to explore

## 🚀 Future Improvements

1. **More quests** - Expand quest system with more variety
2. **Inventory system** - Collect and use items
3. **Save/Load** - Persist game state to localStorage
4. **More enemies** - Different enemy types with unique behaviors
5. **NPCs** - Non-player characters to interact with
6. **More terrain** - Larger world with multiple biomes
7. **Sound effects** - Add audio for attacks, footsteps, weather
8. **Particle effects** - Visual effects for combat and weather
9. **Mini-map** - Show player position and objectives
10. **Difficulty settings** - Easy/Normal/Hard modes

## 📝 Development Notes

This is a complete, playable game built from scratch in TypeScript with Three.js. All systems are integrated and working together:

- ✅ Terrain generation
- ✅ Player movement and camera
- ✅ Combat system
- ✅ Quest system
- ✅ Weather system
- ✅ UI/HUD
- ✅ Enemy AI
- ✅ Day/night cycle

The game is fully functional and can be extended with more content and features.

## 🎨 Art Style

- **Terrain**: Green grass with procedural height variation
- **Trees**: Simple cone + cylinder design (pine trees)
- **Rocks**: Dodecahedron geometry with grey material
- **Player**: Golden capsule with sword and shield
- **Enemies**: Red capsules with dark weapons
- **Lighting**: Dynamic sun with shadows
- **Fog**: Distance-based fog that changes with weather

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Run all checks
npm run check
```

## 📊 Game Stats

- **World Size**: 200x200 units
- **Trees**: 100
- **Rocks**: 50
- **Enemies**: 5
- **Quests**: 3
- **Weather States**: 4
- **Player Stats**: Health (100), Stamina (100)
- **Enemy Stats**: Health (100), Damage (15), Speed (5)

## 🎓 Learning Points

This project demonstrates:
- 3D game development with Three.js
- Procedural terrain generation
- Character controller with physics
- Enemy AI with state machines
- Quest system design
- Weather and time-of-day systems
- UI/HUD implementation
- Game loop and system integration
- TypeScript for large-scale games
- Performance optimization

---

**Enjoy the game!** 🎮⚔️🛡️
