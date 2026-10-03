/**
 * Menu Components
 * P16 - Main menu, pause, settings, death, loading screens
 */

import React, { useState } from 'react';
import { UIScreen } from './UIManager.js';

export interface MenuProps {
  onNavigate: (screen: UIScreen) => void;
  onResume?: () => void;
  onQuit?: () => void;
}

/**
 * Button Component
 */
const MenuButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, onClick, disabled = false }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '300px',
        padding: '15px 30px',
        backgroundColor: hovered ? '#c8a96e' : '#374151',
        color: hovered ? '#000' : '#fff',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );
};

/**
 * Main Menu Component
 */
export const MainMenu: React.FC<MenuProps> = ({ onNavigate }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      zIndex: 1000,
    }}>
      <h1 style={{
        color: '#c8a96e',
        fontSize: '64px',
        fontWeight: 'bold',
        marginBottom: '40px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      }}>
        CROWNFALL
      </h1>
      
      <MenuButton label="New Game" onClick={() => onNavigate(UIScreen.LOADING)} />
      <MenuButton label="Continue" onClick={() => onNavigate(UIScreen.LOADING)} />
      <MenuButton label="Settings" onClick={() => onNavigate(UIScreen.SETTINGS)} />
      <MenuButton label="Quit" onClick={() => window.close()} />
    </div>
  );
};

/**
 * Pause Menu Component
 */
export const PauseMenu: React.FC<MenuProps> = ({ onNavigate, onResume }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      zIndex: 1000,
    }}>
      <h2 style={{
        color: '#c8a96e',
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '20px',
      }}>
        PAUSED
      </h2>
      
      <MenuButton label="Resume" onClick={() => onResume?.()} />
      <MenuButton label="Settings" onClick={() => onNavigate(UIScreen.SETTINGS)} />
      <MenuButton label="Main Menu" onClick={() => onNavigate(UIScreen.MAIN_MENU)} />
      <MenuButton label="Quit" onClick={() => window.close()} />
    </div>
  );
};

/**
 * Settings Menu Component
 */
export const SettingsMenu: React.FC<MenuProps> = ({ onNavigate }) => {
  const [graphicsQuality, setGraphicsQuality] = useState('high');
  const [volume, setVolume] = useState(80);
  const [mouseSensitivity, setMouseSensitivity] = useState(50);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '40px',
    }}>
      <h2 style={{
        color: '#c8a96e',
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '20px',
      }}>
        SETTINGS
      </h2>

      {/* Graphics Quality */}
      <div style={{ width: '400px', marginBottom: '20px' }}>
        <label style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
          Graphics Quality
        </label>
        <select
          value={graphicsQuality}
          onChange={(e) => setGraphicsQuality(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#374151',
            color: '#fff',
            border: '2px solid #c8a96e',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>

      {/* Volume */}
      <div style={{ width: '400px', marginBottom: '20px' }}>
        <label style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
          Volume: {volume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Mouse Sensitivity */}
      <div style={{ width: '400px', marginBottom: '20px' }}>
        <label style={{ color: '#fff', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
          Mouse Sensitivity: {mouseSensitivity}%
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={mouseSensitivity}
          onChange={(e) => setMouseSensitivity(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <MenuButton label="Back" onClick={() => onNavigate(UIScreen.PAUSE)} />
    </div>
  );
};

/**
 * Death Screen Component
 */
export const DeathScreen: React.FC<MenuProps> = ({ onResume }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(139, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
      zIndex: 1000,
    }}>
      <h1 style={{
        color: '#fff',
        fontSize: '72px',
        fontWeight: 'bold',
        textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
      }}>
        YOU DIED
      </h1>
      
      <MenuButton label="Respawn" onClick={() => onResume?.()} />
      <MenuButton label="Load Last Save" onClick={() => onResume?.()} />
    </div>
  );
};

/**
 * Loading Screen Component
 */
export const LoadingScreen: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '30px',
      zIndex: 1000,
    }}>
      <h2 style={{
        color: '#c8a96e',
        fontSize: '36px',
        fontWeight: 'bold',
      }}>
        LOADING
      </h2>
      
      <div style={{
        width: '400px',
        height: '20px',
        backgroundColor: '#374151',
        border: '2px solid #c8a96e',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#c8a96e',
          transition: 'width 0.3s ease',
        }} />
      </div>
      
      <div style={{
        color: '#fff',
        fontSize: '18px',
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
};
