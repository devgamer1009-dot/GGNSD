# UI System

## Overview

The UI system provides a complete DOM + CSS interface for CrownFall without owning simulation state. All UI components read from the simulation but never modify it directly, ensuring clean separation of concerns.

## Architecture

```
GameUI (main component)
├── UIManager (state management)
├── HUD (heads-up display)
│   ├── HealthBar
│   ├── StaminaBar
│   ├── SpellResource
│   ├── Compass
│   ├── QuestTracker
│   └── InteractionPrompt
├── Menus
│   ├── MainMenu
│   ├── PauseMenu
│   ├── SettingsMenu
│   ├── DeathScreen
│   └── LoadingScreen
├── GameScreens
│   ├── InventoryScreen
│   ├── MapScreen
│   ├── JournalScreen
│   └── DialogueScreen
├── PhotoMode
│   └── PhotoModeControls
├── Accessibility
│   ├── AccessibilityProvider
│   ├── Subtitle
│   ├── HoldToToggleButton
│   └── KeyRebinding
└── UIInputHandler (keyboard + gamepad)
```

## Key Principle: No Simulation Ownership

**UI reads from simulation, never writes to it.**

```typescript
// ✅ CORRECT: UI reads simulation state
const health = simulation.getPlayerHealth();
<HealthBar current={health} max={100} />

// ❌ WRONG: UI modifying simulation
onClick={() => simulation.setPlayerHealth(50)}
```

All simulation changes go through action callbacks:

```typescript
<GameUI
  playerState={simulation.getPlayerState()}
  onAction={(action) => simulation.handleAction(action)}
/>
```

## Screen Navigation

### Screen Types

```typescript
enum UIScreen {
  NONE = 'none',
  MAIN_MENU = 'main_menu',
  PAUSE = 'pause',
  INVENTORY = 'inventory',
  SKILLS = 'skills',
  MAP = 'map',
  JOURNAL = 'journal',
  CRAFTING = 'crafting',
  DIALOGUE = 'dialogue',
  SETTINGS = 'settings',
  DEATH = 'death',
  LOADING = 'loading',
}
```

### Navigation Flow

```typescript
const uiManager = new UIManager();

// Navigate to screen
uiManager.navigateTo(UIScreen.INVENTORY);

// Go back
uiManager.goBack();

// Pause game
uiManager.setPaused(true);

// Photo mode
uiManager.togglePhotoMode();
```

## HUD Components

### Health Bar

```typescript
<HealthBar current={85} max={100} />
```

**Features:**
- Color changes based on health percentage
- Smooth transitions
- Numeric display

### Stamina Bar

```typescript
<StaminaBar current={60} max={100} />
```

### Spell Resource (Mana)

```typescript
<SpellResource current={45} max={100} />
```

### Compass

```typescript
<Compass angle={45} pois={[
  { name: 'Briarhollow', angle: 90 },
  { name: 'Highspire', angle: 180 },
]} />
```

**Features:**
- Shows current direction (N, NE, E, etc.)
- POI markers within view
- Smooth rotation

### Quest Tracker

```typescript
<QuestTracker objective="Speak to Elder Bram" />
```

### Interaction Prompt

```typescript
<InteractionPrompt prompt="Press E to interact" />
```

## Menu Components

### Main Menu

```typescript
<MainMenu
  onNavigate={(screen) => uiManager.navigateTo(screen)}
/>
```

**Options:**
- New Game
- Continue
- Settings
- Quit

### Pause Menu

```typescript
<PauseMenu
  onNavigate={(screen) => uiManager.navigateTo(screen)}
  onResume={() => uiManager.setPaused(false)}
/>
```

**Options:**
- Resume
- Settings
- Main Menu
- Quit

### Settings Menu

```typescript
<SettingsMenu
  onNavigate={(screen) => uiManager.navigateTo(screen)}
/>
```

**Settings:**
- Graphics Quality (Low/Medium/High/Ultra)
- Volume (0-100%)
- Mouse Sensitivity (1-100%)

### Death Screen

```typescript
<DeathScreen
  onNavigate={(screen) => uiManager.navigateTo(screen)}
  onResume={() => respawnPlayer()}
/>
```

**Options:**
- Respawn
- Load Last Save

### Loading Screen

```typescript
<LoadingScreen progress={75} />
```

## Game Screen Components

### Inventory Screen

```typescript
<InventoryScreen
  onNavigate={(screen) => uiManager.navigateTo(screen)}
  onClose={() => uiManager.goBack()}
/>
```

**Features:**
- Equipment slots (Head, Chest, Legs, Weapon, Shield, Boots)
- Inventory grid (8x6)
- Item selection
- Drag and drop (future)

### Map Screen

```typescript
<MapScreen
  onNavigate={(screen) => uiManager.navigateTo(screen)}
  onClose={() => uiManager.goBack()}
/>
```

**Features:**
- Fog of war
- POI markers
- Fast travel points
- Zoom/pan controls

### Journal Screen

```typescript
<JournalScreen
  onNavigate={(screen) => uiManager.navigateTo(screen)}
  onClose={() => uiManager.goBack()}
/>
```

**Features:**
- Quest list with status
- Quest details
- Quest objectives

### Dialogue Screen

```typescript
<DialogueScreen
  speaker="Elder Bram"
  text="Welcome to Briarhollow, young knight."
  choices={[
    { id: 'accept', text: 'I will help you.' },
    { id: 'decline', text: 'Not interested.' },
  ]}
  onChoice={(choiceId) => handleDialogueChoice(choiceId)}
  onClose={() => uiManager.goBack()}
  onNavigate={() => {}}
/>
```

## Photo Mode

### Controls

```typescript
<PhotoModeControls
  isActive={uiManager.isPhotoModeActive()}
  onToggle={() => uiManager.togglePhotoMode()}
  onCapture={(settings) => captureScreenshot(settings)}
/>
```

**Features:**
- Free camera movement (WASD)
- Depth of field control
  - Focus distance (1-100m)
  - Aperture (f/1.4 - f/16)
- Time of day control (0-24 hours)
- Filters (None, Warm, Cool, Vintage, Dramatic)
- Resolution (1x, 2x, 4x)
- High-res capture

### Photo Settings

```typescript
interface PhotoSettings {
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofAperture: number;
  timeOfDay: number;
  filter: 'none' | 'warm' | 'cool' | 'vintage' | 'dramatic';
  resolution: '1x' | '2x' | '4x';
}
```

## Accessibility

### Settings

```typescript
interface AccessibilitySettings {
  uiScale: number; // 0.5 - 2.0
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  subtitlesEnabled: boolean;
  reducedShake: boolean;
  holdToToggle: boolean;
  holdDuration: number; // seconds
}
```

### Colorblind Modes

```typescript
<AccessibilityProvider settings={accessibilitySettings}>
  <GameUI ... />
</AccessibilityProvider>
```

**Supported modes:**
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)

### Subtitles

```typescript
<Subtitle
  text="Welcome to Briarhollow"
  speaker="Elder Bram"
  duration={3000}
/>
```

### Hold-to-Toggle

```typescript
<HoldToToggleButton
  label="Sprint"
  enabled={isSprinting}
  onToggle={() => toggleSprint()}
  holdDuration={500}
/>
```

### Key Rebinding

```typescript
<KeyRebinding
  bindings={[
    { action: 'open_inventory', key: 'i', gamepadButton: 3 },
    { action: 'open_map', key: 'm', gamepadButton: 1 },
  ]}
  onRebind={(action, newKey) => rebindKey(action, newKey)}
/>
```

### Camera Shake Reduction

```typescript
const shakeIntensity = reduceCameraShake(1.0, accessibility.reducedShake);
// Returns 0.3 if reducedShake is true
```

## Input Handling

### Keyboard Navigation

```typescript
useUIInputHandler({ uiManager, onAction });
```

**Default bindings:**
- `I` - Open inventory
- `K` - Open skills
- `M` - Open map
- `J` - Open journal
- `C` - Open crafting
- `ESC` - Pause/Back
- `P` - Toggle photo mode

### Gamepad Navigation

**Default bindings:**
- `A` (0) - Open journal
- `B` (1) - Open map
- `X` (2) - Open skills
- `Y` (3) - Open inventory
- `Start` (9) - Pause/Back

### UI Navigation Helper

```typescript
const navigation = new UINavigation();
navigation.setFocusableElements(buttons);
navigation.moveDown();
navigation.activate();
```

## Integration

### Complete Setup

```typescript
import { GameUI } from './ui/GameUI.js';
import { UIManager } from './ui/UIManager.js';

const uiManager = new UIManager();

<GameUI
  playerState={simulation.getPlayerState()}
  questObjective={simulation.getCurrentObjective()}
  interactionPrompt={simulation.getInteractionPrompt()}
  dialogueData={simulation.getDialogueData()}
  onAction={(action) => simulation.handleAction(action)}
  onDialogueChoice={(choiceId) => simulation.handleDialogueChoice(choiceId)}
  onPhotoCapture={(settings) => captureScreenshot(settings)}
  onResume={() => simulation.resume()}
/>
```

### Action Handling

```typescript
simulation.handleAction('open_inventory');
simulation.handleAction('open_map');
simulation.handleAction('pause');
```

## Styling

### Color Palette

```css
/* Primary */
--gold: #c8a96e;
--dark-gold: #a0845c;

/* Backgrounds */
--bg-dark: rgba(0, 0, 0, 0.95);
--bg-medium: rgba(0, 0, 0, 0.8);
--bg-light: #374151;

/* Text */
--text-primary: #fff;
--text-secondary: #9ca3af;

/* Status */
--health-high: #4ade80;
--health-medium: #fbbf24;
--health-low: #ef4444;
--stamina: #fbbf24;
--mana: #3b82f6;
```

### Responsive Design

```typescript
// UI scales with accessibility settings
<div style={{
  transform: `scale(${accessibility.uiScale})`,
  transformOrigin: 'top left',
}}>
  {children}
</div>
```

## Performance

### Optimization

- **React.memo** for expensive components
- **useCallback** for event handlers
- **useMemo** for computed values
- **CSS transitions** instead of JS animations
- **Lazy loading** for screens

### Budget

| Component | Render Time | Notes |
|-----------|-------------|-------|
| HUD | < 1ms | Always visible |
| Menus | < 2ms | Only when open |
| Photo Mode | < 3ms | Only when active |

## Testing

### Manual Testing

**Keyboard Navigation:**
1. Press `I` - Inventory opens
2. Press `ESC` - Returns to game
3. Press `M` - Map opens
4. Press `ESC` - Returns to game
5. Press `P` - Photo mode activates
6. Press `P` - Photo mode deactivates

**Gamepad Navigation:**
1. Press `Y` - Inventory opens
2. Press `Start` - Returns to game
3. Press `B` - Map opens
4. Press `Start` - Returns to game

**Accessibility:**
1. Change UI scale to 1.5x
2. Enable colorblind mode
3. Test subtitles
4. Test hold-to-toggle
5. Rebind keys

## Known Limitations

1. **No drag-and-drop** - Inventory items can't be dragged yet
2. **No map rendering** - Map is placeholder
3. **No skills tree** - Skills screen not implemented
4. **No crafting UI** - Crafting screen not implemented
5. **No save/load UI** - Save slots not implemented

## Future Improvements

- [ ] Drag-and-drop inventory
- [ ] Map rendering with fog of war
- [ ] Skills tree visualization
- [ ] Crafting recipe browser
- [ ] Save/load slots
- [ ] Tooltip system
- [ ] Notification system
- [ ] Minimap
- [ ] Damage numbers
- [ ] Quest markers

## Files

- `src/ui/UIManager.ts` - State management
- `src/ui/HUD.tsx` - HUD components
- `src/ui/Menus.tsx` - Menu components
- `src/ui/GameScreens.tsx` - Game screen components
- `src/ui/PhotoMode.tsx` - Photo mode
- `src/ui/Accessibility.tsx` - Accessibility features
- `src/ui/UIInputHandler.ts` - Input handling
- `src/ui/GameUI.tsx` - Main UI component
- `src/ui/index.ts` - Module exports
