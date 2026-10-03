/**
 * Main UI Component
 * P16 - Integrates all UI components
 */

import React, { useEffect, useState } from 'react';
import { UIManager, UIScreen } from './UIManager.js';
import { HUD } from './HUD.js';
import { MainMenu, PauseMenu, SettingsMenu, DeathScreen, LoadingScreen } from './Menus.js';
import { InventoryScreen, MapScreen, JournalScreen, DialogueScreen } from './GameScreens.js';
import { PhotoModeControls, PhotoSettings } from './PhotoMode.js';
import { AccessibilityProvider, Subtitle } from './Accessibility.js';
import { useUIInputHandler } from './UIInputHandler.js';

export interface UIProps {
  // Simulation state (read-only)
  playerState: {
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    mana: number;
    maxMana: number;
    position: { x: number; y: number; z: number };
    rotation: number;
  };
  
  // Game state
  questObjective?: string;
  interactionPrompt?: string;
  dialogueData?: {
    speaker: string;
    text: string;
    choices?: Array<{ id: string; text: string }>;
  };
  
  // Callbacks
  onAction: (action: string) => void;
  onDialogueChoice?: (choiceId: string) => void;
  onPhotoCapture?: (settings: PhotoSettings) => void;
  onResume?: () => void;
}

/**
 * Main UI Component
 */
export const GameUI: React.FC<UIProps> = ({
  playerState,
  questObjective,
  interactionPrompt,
  dialogueData,
  onAction,
  onDialogueChoice,
  onPhotoCapture,
  onResume,
}) => {
  const [uiManager] = useState(() => new UIManager());
  const [currentScreen, setCurrentScreen] = useState<UIScreen>(UIScreen.NONE);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Register screen change callback
  useEffect(() => {
    uiManager.onScreenChange((screen) => {
      setCurrentScreen(screen);
    });
  }, [uiManager]);

  // Setup input handler
  useUIInputHandler({ uiManager, onAction });

  // Handle resume
  const handleResume = () => {
    uiManager.setPaused(false);
    uiManager.navigateTo(UIScreen.NONE);
    onResume?.();
  };

  // Handle photo capture
  const handlePhotoCapture = (settings: PhotoSettings) => {
    onPhotoCapture?.(settings);
  };

  // Simulate loading progress
  useEffect(() => {
    if (currentScreen === UIScreen.LOADING) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            uiManager.navigateTo(UIScreen.NONE);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [currentScreen, uiManager]);

  const accessibility = uiManager.getAccessibility();

  return (
    <AccessibilityProvider settings={accessibility}>
      {/* HUD (always visible when not in menu) */}
      {currentScreen === UIScreen.NONE && !uiManager.isPhotoModeActive() && (
        <HUD
          health={playerState.health}
          maxHealth={playerState.maxHealth}
          stamina={playerState.stamina}
          maxStamina={playerState.maxStamina}
          mana={playerState.mana}
          maxMana={playerState.maxMana}
          compassAngle={playerState.rotation}
          questObjective={questObjective}
          interactionPrompt={interactionPrompt}
        />
      )}

      {/* Dialogue */}
      {currentScreen === UIScreen.DIALOGUE && dialogueData && (
        <DialogueScreen
          speaker={dialogueData.speaker}
          text={dialogueData.text}
          choices={dialogueData.choices}
          onChoice={onDialogueChoice}
          onClose={() => uiManager.goBack()}
          onNavigate={() => {}}
        />
      )}

      {/* Subtitle */}
      {accessibility.subtitlesEnabled && dialogueData && (
        <Subtitle text={dialogueData.text} speaker={dialogueData.speaker} />
      )}

      {/* Photo Mode */}
      <PhotoModeControls
        isActive={uiManager.isPhotoModeActive()}
        onToggle={() => uiManager.togglePhotoMode()}
        onCapture={handlePhotoCapture}
      />

      {/* Menu Screens */}
      {currentScreen === UIScreen.MAIN_MENU && (
        <MainMenu onNavigate={(screen) => uiManager.navigateTo(screen)} />
      )}

      {currentScreen === UIScreen.PAUSE && (
        <PauseMenu
          onNavigate={(screen) => uiManager.navigateTo(screen)}
          onResume={handleResume}
        />
      )}

      {currentScreen === UIScreen.SETTINGS && (
        <SettingsMenu onNavigate={(screen) => uiManager.navigateTo(screen)} />
      )}

      {currentScreen === UIScreen.DEATH && (
        <DeathScreen onNavigate={(screen) => uiManager.navigateTo(screen)} onResume={onResume} />
      )}

      {currentScreen === UIScreen.LOADING && (
        <LoadingScreen progress={loadingProgress} />
      )}

      {currentScreen === UIScreen.INVENTORY && (
        <InventoryScreen
          onNavigate={(screen) => uiManager.navigateTo(screen)}
          onClose={() => uiManager.goBack()}
        />
      )}

      {currentScreen === UIScreen.MAP && (
        <MapScreen
          onNavigate={(screen) => uiManager.navigateTo(screen)}
          onClose={() => uiManager.goBack()}
        />
      )}

      {currentScreen === UIScreen.JOURNAL && (
        <JournalScreen
          onNavigate={(screen) => uiManager.navigateTo(screen)}
          onClose={() => uiManager.goBack()}
        />
      )}
    </AccessibilityProvider>
  );
};
