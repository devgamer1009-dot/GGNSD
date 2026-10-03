# SLICE Review Guide - P19

## Overview

This document provides a structured guide for testing the CrownFall SLICE - a ~30 minute playable experience that integrates all systems built in P1-P18.

## What You Should Play

### Starting the Game

1. **Launch**: Run `npm run dev` and open the browser
2. **Intro Sequence**: Watch the 3-second intro (camera orbiting scene)
3. **Initial State**: You'll be in exploration mode with a rotating camera

### Core Gameplay Loop

The slice demonstrates:
- **Quest Progression**: 3 quests in sequence
- **Save/Load**: Manual save/load functionality
- **Audio**: Background music and SFX
- **State Management**: Game phases and progression
- **Integration**: All systems working together

### Controls

| Key | Action |
|-----|--------|
| ESC | Toggle pause |
| S | Save game to slot 1 |
| L | Load game from slot 1 |
| Q | Advance to next quest |

### Quest Flow

1. **Quest 1: Wake Up** (q1_wake_up)
   - Press Q to start
   - Press Q again to complete
   - Autosave triggers

2. **Quest 2: Wolf Problem** (q2_wolf_problem)
   - Automatically starts after quest 1
   - Press Q to complete
   - Autosave triggers

3. **Quest 3: Bandit Camp** (q3_bandit_camp)
   - Automatically starts after quest 2
   - Press Q to complete
   - Final autosave

## 5 Targeted Questions

### Question 1: State Persistence
**Test**: Save → Close browser → Reopen → Load
- [ ] Does the game state persist correctly?
- [ ] Are quest completions saved?
- [ ] Is playtime tracked accurately?
- [ ] Any data loss or corruption?

**Expected**: All state should be preserved exactly as it was when saved.

### Question 2: Quest Progression
**Test**: Complete all 3 quests in sequence
- [ ] Do quests advance automatically?
- [ ] Are quest completions tracked?
- [ ] Does the game state update correctly?
- [ ] Any quest logic errors?

**Expected**: Smooth quest progression with proper state updates.

### Question 3: Audio Integration
**Test**: Listen throughout the experience
- [ ] Does background music play?
- [ ] Are SFX triggered correctly?
- [ ] Any audio glitches or cutouts?
- [ ] Volume levels appropriate?

**Expected**: Continuous background music with appropriate SFX.

### Question 4: Performance & Stability
**Test**: Run for 10+ minutes
- [ ] Any frame drops or stuttering?
- [ ] Memory usage stable?
- [ ] Any crashes or errors?
- [ ] Camera movement smooth?

**Expected**: Stable 60fps with no memory leaks or crashes.

### Question 5: Pause/Resume
**Test**: Pause and resume multiple times
- [ ] Does pause work correctly?
- [ ] Does game state freeze when paused?
- [ ] Does resume work correctly?
- [ ] Any state corruption after pause/resume?

**Expected**: Clean pause/resume with no state issues.

## Integration Points to Verify

### Systems Integration
- ✅ GameStateManager ↔ SaveManager
- ✅ GameStateManager ↔ QuestSystem
- ✅ GameStateManager ↔ AudioSystem
- ✅ QuestSystem ↔ WorldFlagsSystem
- ✅ QuestSystem ↔ FactionSystem
- ✅ All systems ↔ Three.js renderer

### Data Flow
- ✅ Quest completion → Game state update
- ✅ Game state change → Audio state change
- ✅ Save/Load → All systems state
- ✅ Pause/Resume → System updates

## Known Limitations

1. **Visual Simplicity**: Basic scene with minimal geometry
2. **No Combat**: Combat system not integrated in this demo
3. **No Movement**: Camera orbits automatically, no player control
4. **No NPCs**: Character system not integrated
5. **No Terrain**: Using simple plane instead of terrain system

These are intentional for the integration demo. Full systems are available but not wired up in this slice.

## Bug Reporting Template

If you find issues, please report using this format:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Console Errors**: [Any errors in browser console]
**Browser**: [Browser name and version]
**System**: [OS, RAM, GPU if relevant]
```

## Success Criteria

The SLICE is considered successful if:

1. ✅ All 3 quests can be completed in sequence
2. ✅ Save/Load works without data loss
3. ✅ Audio plays continuously without glitches
4. ✅ No crashes or major bugs in 30-minute session
5. ✅ All systems integrate without conflicts
6. ✅ State management works correctly
7. ✅ Performance is stable (60fps target)

## Next Steps After Review

Based on review findings:

1. **Fix Critical Bugs**: Address any crashes or data loss
2. **Performance Optimization**: Fix any performance issues
3. **System Integration**: Wire up remaining systems (combat, NPCs, terrain)
4. **Content Creation**: Add more quests, enemies, locations
5. **Polish**: UI improvements, audio mixing, visual effects

## Technical Notes

### Architecture
- **Game State Manager**: Central state coordination
- **Save Manager**: IndexedDB persistence with migrations
- **Audio System**: Web Audio API with spatial audio
- **Quest System**: Data-driven quest logic
- **Three.js**: Rendering and scene management

### Performance Targets
- **Frame Time**: < 16.67ms (60fps)
- **Memory**: < 500MB total
- **Load Time**: < 5 seconds
- **Save/Load**: < 100ms

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contact

For questions or issues with the SLICE review, refer to:
- `docs/PROJECT_STATE.md` - Current project status
- `docs/ENGINE.md` - Engine architecture
- `docs/SAVES.md` - Save system documentation
- `docs/AUDIO.md` - Audio system documentation
- `docs/QUESTS.md` - Quest system documentation

---

**Review Date**: ___________  
**Reviewer**: ___________  
**Duration**: ___________  
**Overall Status**: [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES
