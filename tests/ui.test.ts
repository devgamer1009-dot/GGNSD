import { describe, it, expect, beforeEach } from 'vitest';
import { UIManager, UIScreen, AccessibilitySettings } from '../src/ui/UIManager.js';

describe('UIManager', () => {
  let uiManager: UIManager;

  beforeEach(() => {
    uiManager = new UIManager();
  });

  describe('Screen Navigation', () => {
    it('should start with no screen', () => {
      expect(uiManager.getCurrentScreen()).toBe(UIScreen.NONE);
    });

    it('should navigate to screen', () => {
      uiManager.navigateTo(UIScreen.INVENTORY);
      expect(uiManager.getCurrentScreen()).toBe(UIScreen.INVENTORY);
    });

    it('should track previous screen', () => {
      uiManager.navigateTo(UIScreen.INVENTORY);
      uiManager.navigateTo(UIScreen.MAP);
      
      const state = uiManager.getState();
      expect(state.previousScreen).toBe(UIScreen.INVENTORY);
    });

    it('should go back to previous screen', () => {
      uiManager.navigateTo(UIScreen.INVENTORY);
      uiManager.navigateTo(UIScreen.MAP);
      uiManager.goBack();
      
      expect(uiManager.getCurrentScreen()).toBe(UIScreen.INVENTORY);
    });

    it('should go to NONE when no previous screen', () => {
      uiManager.navigateTo(UIScreen.INVENTORY);
      uiManager.goBack();
      uiManager.goBack();
      
      expect(uiManager.getCurrentScreen()).toBe(UIScreen.NONE);
    });

    it('should not navigate to same screen', () => {
      uiManager.navigateTo(UIScreen.INVENTORY);
      const state1 = uiManager.getState();
      
      uiManager.navigateTo(UIScreen.INVENTORY);
      const state2 = uiManager.getState();
      
      expect(state1.previousScreen).toBe(state2.previousScreen);
    });
  });

  describe('Pause State', () => {
    it('should set paused state', () => {
      uiManager.setPaused(true);
      expect(uiManager.getState().isPaused).toBe(true);
    });

    it('should navigate to pause screen when pausing', () => {
      uiManager.setPaused(true);
      expect(uiManager.getCurrentScreen()).toBe(UIScreen.PAUSE);
    });
  });

  describe('Photo Mode', () => {
    it('should toggle photo mode', () => {
      expect(uiManager.isPhotoModeActive()).toBe(false);
      
      uiManager.togglePhotoMode();
      expect(uiManager.isPhotoModeActive()).toBe(true);
      
      uiManager.togglePhotoMode();
      expect(uiManager.isPhotoModeActive()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have default accessibility settings', () => {
      const settings = uiManager.getAccessibility();
      expect(settings.uiScale).toBe(1.0);
      expect(settings.colorblindMode).toBe('none');
      expect(settings.subtitlesEnabled).toBe(true);
    });

    it('should update accessibility settings', () => {
      uiManager.updateAccessibility({
        uiScale: 1.5,
        colorblindMode: 'protanopia',
      });
      
      const settings = uiManager.getAccessibility();
      expect(settings.uiScale).toBe(1.5);
      expect(settings.colorblindMode).toBe('protanopia');
    });
  });

  describe('Key Bindings', () => {
    it('should have default key bindings', () => {
      const binding = uiManager.getKeyBinding('open_inventory');
      expect(binding).toBeDefined();
      expect(binding?.key).toBe('i');
    });

    it('should rebind keys', () => {
      uiManager.rebindKey('open_inventory', 'x');
      const binding = uiManager.getKeyBinding('open_inventory');
      expect(binding?.key).toBe('x');
    });
  });

  describe('Screen Change Callbacks', () => {
    it('should notify on screen change', () => {
      let notifiedScreen: UIScreen | null = null;
      
      uiManager.onScreenChange((screen) => {
        notifiedScreen = screen;
      });
      
      uiManager.navigateTo(UIScreen.INVENTORY);
      expect(notifiedScreen).toBe(UIScreen.INVENTORY);
    });

    it('should notify multiple callbacks', () => {
      let count = 0;
      
      uiManager.onScreenChange(() => count++);
      uiManager.onScreenChange(() => count++);
      
      uiManager.navigateTo(UIScreen.INVENTORY);
      expect(count).toBe(2);
    });
  });
});

describe('UIScreen', () => {
  it('should have all screen types', () => {
    expect(UIScreen.NONE).toBe('none');
    expect(UIScreen.MAIN_MENU).toBe('main_menu');
    expect(UIScreen.PAUSE).toBe('pause');
    expect(UIScreen.INVENTORY).toBe('inventory');
    expect(UIScreen.SKILLS).toBe('skills');
    expect(UIScreen.MAP).toBe('map');
    expect(UIScreen.JOURNAL).toBe('journal');
    expect(UIScreen.CRAFTING).toBe('crafting');
    expect(UIScreen.DIALOGUE).toBe('dialogue');
    expect(UIScreen.SETTINGS).toBe('settings');
    expect(UIScreen.DEATH).toBe('death');
    expect(UIScreen.LOADING).toBe('loading');
  });
});
