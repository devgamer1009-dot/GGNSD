/**
 * Accessibility System
 * P16 - Scalable UI, colorblind palettes, subtitles, reduced shake, hold-to-toggle, rebinding
 */

import React, { useEffect, useState } from 'react';
import { AccessibilitySettings, KeyBinding } from './UIManager.js';

/**
 * Accessibility Provider Component
 */
export const AccessibilityProvider: React.FC<{
  settings: AccessibilitySettings;
  children: React.ReactNode;
}> = ({ settings, children }) => {
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Apply colorblind filters
    switch (settings.colorblindMode) {
      case 'protanopia':
        setFilterStyle({ filter: 'url(#protanopia)' });
        break;
      case 'deuteranopia':
        setFilterStyle({ filter: 'url(#deuteranopia)' });
        break;
      case 'tritanopia':
        setFilterStyle({ filter: 'url(#tritanopia)' });
        break;
      default:
        setFilterStyle({});
    }
  }, [settings.colorblindMode]);

  return (
    <>
      {/* SVG filters for colorblind modes */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0
                                                  0.558, 0.442, 0, 0, 0
                                                  0, 0.242, 0.758, 0, 0
                                                  0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0
                                                  0.7, 0.3, 0, 0, 0
                                                  0, 0.3, 0.7, 0, 0
                                                  0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0
                                                  0, 0.433, 0.567, 0, 0
                                                  0, 0.475, 0.525, 0, 0
                                                  0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      <div style={{
        transform: `scale(${settings.uiScale})`,
        transformOrigin: 'top left',
        ...filterStyle,
      }}>
        {children}
      </div>
    </>
  );
};

/**
 * Subtitle Component
 */
export const Subtitle: React.FC<{
  text: string;
  speaker?: string;
  duration?: number;
}> = ({ text, speaker, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #c8a96e',
      borderRadius: '8px',
      padding: '15px 30px',
      maxWidth: '800px',
      textAlign: 'center',
      zIndex: 1500,
    }}>
      {speaker && (
        <div style={{
          color: '#c8a96e',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '5px',
        }}>
          {speaker}
        </div>
      )}
      <div style={{
        color: '#fff',
        fontSize: '18px',
        lineHeight: '1.5',
      }}>
        {text}
      </div>
    </div>
  );
};

/**
 * Hold-to-Toggle Button Component
 */
export const HoldToToggleButton: React.FC<{
  label: string;
  enabled: boolean;
  onToggle: () => void;
  holdDuration?: number;
}> = ({ label, enabled, onToggle, holdDuration = 500 }) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const handleMouseDown = () => {
    setIsHolding(true);
    setHoldProgress(0);
    
    const interval = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + (100 / (holdDuration / 10));
        if (newProgress >= 100) {
          clearInterval(interval);
          onToggle();
          setIsHolding(false);
          return 0;
        }
        return newProgress;
      });
    }, 10);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    setHoldProgress(0);
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        padding: '10px 20px',
        backgroundColor: enabled ? '#c8a96e' : '#374151',
        color: enabled ? '#000' : '#fff',
        border: '2px solid #c8a96e',
        borderRadius: '4px',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {isHolding && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${holdProgress}%`,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          transition: 'width 0.01s linear',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {label}
      </span>
    </button>
  );
};

/**
 * Key Rebinding Component
 */
export const KeyRebinding: React.FC<{
  bindings: KeyBinding[];
  onRebind: (action: string, newKey: string) => void;
}> = ({ bindings, onRebind }) => {
  const [rebindingAction, setRebindingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!rebindingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      onRebind(rebindingAction, e.key.toLowerCase());
      setRebindingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rebindingAction, onRebind]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {bindings.map(binding => (
        <div
          key={binding.action}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#374151',
            borderRadius: '4px',
          }}
        >
          <span style={{ color: '#fff', fontSize: '14px' }}>
            {binding.action.replace(/_/g, ' ').toUpperCase()}
          </span>
          <button
            onClick={() => setRebindingAction(binding.action)}
            style={{
              padding: '5px 15px',
              backgroundColor: rebindingAction === binding.action ? '#c8a96e' : '#1f2937',
              color: rebindingAction === binding.action ? '#000' : '#fff',
              border: '2px solid #c8a96e',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '100px',
            }}
          >
            {rebindingAction === binding.action ? 'Press any key...' : binding.key.toUpperCase()}
          </button>
        </div>
      ))}
    </div>
  );
};

/**
 * Camera Shake Reducer
 */
export function reduceCameraShake(shakeIntensity: number, reducedShake: boolean): number {
  return reducedShake ? shakeIntensity * 0.3 : shakeIntensity;
}
