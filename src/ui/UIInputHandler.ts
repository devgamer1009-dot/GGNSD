/**
 * UI Input Handler
 * P16 - Keyboard and gamepad navigation for all UI screens
 */

import { useEffect, useCallback } from 'react';
import { UIScreen, UIManager } from './UIManager.js';

export interface UIInputHandlerProps {
  uiManager: UIManager;
  onAction: (action: string) => void;
}

/**
 * UI Input Handler Hook
 */
export const useUIInputHandler = ({ uiManager, onAction }: UIInputHandlerProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentScreen = uiManager.getCurrentScreen();
    const key = e.key.toLowerCase();

    // Global actions (work on any screen)
    if (key === 'escape') {
      if (currentScreen === UIScreen.NONE) {
        uiManager.setPaused(true);
      } else if (currentScreen === UIScreen.PAUSE) {
        uiManager.setPaused(false);
        uiManager.navigateTo(UIScreen.NONE);
      } else {
        uiManager.goBack();
      }
      e.preventDefault();
      return;
    }

    if (key === 'p') {
      uiManager.togglePhotoMode();
      e.preventDefault();
      return;
    }

    // Screen-specific actions
    if (currentScreen === UIScreen.NONE) {
      switch (key) {
        case 'i':
          uiManager.navigateTo(UIScreen.INVENTORY);
          onAction('open_inventory');
          break;
        case 'k':
          uiManager.navigateTo(UIScreen.SKILLS);
          onAction('open_skills');
          break;
        case 'm':
          uiManager.navigateTo(UIScreen.MAP);
          onAction('open_map');
          break;
        case 'j':
          uiManager.navigateTo(UIScreen.JOURNAL);
          onAction('open_journal');
          break;
        case 'c':
          uiManager.navigateTo(UIScreen.CRAFTING);
          onAction('open_crafting');
          break;
      }
    }
  }, [uiManager, onAction]);

  const handleGamepadInput = useCallback(() => {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    const gamepad = gamepads[0];
    if (!gamepad) return;

    const currentScreen = uiManager.getCurrentScreen();

    // Check button presses
    gamepad.buttons.forEach((button, index) => {
      if (!button.pressed) return;

      // Global actions
      if (index === 9) { // Start button
        if (currentScreen === UIScreen.NONE) {
          uiManager.setPaused(true);
        } else if (currentScreen === UIScreen.PAUSE) {
          uiManager.setPaused(false);
          uiManager.navigateTo(UIScreen.NONE);
        } else {
          uiManager.goBack();
        }
      }

      // Screen-specific actions (only when not in a menu)
      if (currentScreen === UIScreen.NONE) {
        switch (index) {
          case 0: // A button
            uiManager.navigateTo(UIScreen.JOURNAL);
            onAction('open_journal');
            break;
          case 1: // B button
            uiManager.navigateTo(UIScreen.MAP);
            onAction('open_map');
            break;
          case 2: // X button
            uiManager.navigateTo(UIScreen.SKILLS);
            onAction('open_skills');
            break;
          case 3: // Y button
            uiManager.navigateTo(UIScreen.INVENTORY);
            onAction('open_inventory');
            break;
        }
      }
    });
  }, [uiManager, onAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    // Gamepad polling
    const gamepadInterval = setInterval(handleGamepadInput, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(gamepadInterval);
    };
  }, [handleKeyDown, handleGamepadInput]);
};

/**
 * UI Navigation Helper
 */
export class UINavigation {
  private focusIndex: number = 0;
  private focusableElements: HTMLElement[] = [];

  /**
   * Set focusable elements
   */
  setFocusableElements(elements: HTMLElement[]): void {
    this.focusableElements = elements;
    this.focusIndex = 0;
    this.updateFocus();
  }

  /**
   * Move focus up
   */
  moveUp(): void {
    if (this.focusableElements.length === 0) return;
    this.focusIndex = (this.focusIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
    this.updateFocus();
  }

  /**
   * Move focus down
   */
  moveDown(): void {
    if (this.focusableElements.length === 0) return;
    this.focusIndex = (this.focusIndex + 1) % this.focusableElements.length;
    this.updateFocus();
  }

  /**
   * Move focus left
   */
  moveLeft(): void {
    this.moveUp(); // Simplified for vertical menus
  }

  /**
   * Move focus right
   */
  moveRight(): void {
    this.moveDown(); // Simplified for vertical menus
  }

  /**
   * Activate focused element
   */
  activate(): void {
    if (this.focusableElements.length === 0) return;
    const element = this.focusableElements[this.focusIndex];
    if (element) {
      element.click();
    }
  }

  /**
   * Update focus visual
   */
  private updateFocus(): void {
    this.focusableElements.forEach((el, index) => {
      if (index === this.focusIndex) {
        el.style.outline = '3px solid #c8a96e';
        el.style.outlineOffset = '2px';
        el.focus();
      } else {
        el.style.outline = 'none';
      }
    });
  }

  /**
   * Get current focus index
   */
  getFocusIndex(): number {
    return this.focusIndex;
  }
}
