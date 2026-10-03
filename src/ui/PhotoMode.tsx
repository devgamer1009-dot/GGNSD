/**
 * Photo Mode
 * P16 - Free camera, depth of field, time-of-day control, high-res capture
 */

import React, { useState } from 'react';

export interface PhotoModeProps {
  isActive: boolean;
  onToggle: () => void;
  onCapture: (settings: PhotoSettings) => void;
}

export interface PhotoSettings {
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofAperture: number;
  timeOfDay: number; // 0-24
  filter: 'none' | 'warm' | 'cool' | 'vintage' | 'dramatic';
  resolution: '1x' | '2x' | '4x';
}

/**
 * Photo Mode Controls Component
 */
export const PhotoModeControls: React.FC<PhotoModeProps> = ({ isActive, onToggle, onCapture }) => {
  const [settings, setSettings] = useState<PhotoSettings>({
    dofEnabled: true,
    dofFocusDistance: 10,
    dofAperture: 2.8,
    timeOfDay: 12,
    filter: 'none',
    resolution: '2x',
  });

  if (!isActive) return null;

  const updateSetting = <K extends keyof PhotoSettings>(key: K, value: PhotoSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 2000,
    }}>
      {/* Photo mode indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        padding: '10px 20px',
        color: '#c8a96e',
        fontSize: '16px',
        fontWeight: 'bold',
      }}>
        📷 PHOTO MODE - Press P to exit
      </div>

      {/* Controls panel */}
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '100px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        padding: '20px',
        width: '300px',
        pointerEvents: 'auto',
      }}>
        <h3 style={{ color: '#c8a96e', fontSize: '18px', marginBottom: '15px' }}>
          Photo Settings
        </h3>

        {/* Depth of Field */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={settings.dofEnabled}
              onChange={(e) => updateSetting('dofEnabled', e.target.checked)}
            />
            {' '}Depth of Field
          </label>
          
          {settings.dofEnabled && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ color: '#fff', fontSize: '12px' }}>
                  Focus Distance: {settings.dofFocusDistance}m
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.dofFocusDistance}
                  onChange={(e) => updateSetting('dofFocusDistance', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', fontSize: '12px' }}>
                  Aperture: f/{settings.dofAperture}
                </label>
                <input
                  type="range"
                  min="1.4"
                  max="16"
                  step="0.1"
                  value={settings.dofAperture}
                  onChange={(e) => updateSetting('dofAperture', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Time of Day */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Time of Day: {Math.floor(settings.timeOfDay)}:{String(Math.floor((settings.timeOfDay % 1) * 60)).padStart(2, '0')}
          </label>
          <input
            type="range"
            min="0"
            max="24"
            step="0.1"
            value={settings.timeOfDay}
            onChange={(e) => updateSetting('timeOfDay', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Filter
          </label>
          <select
            value={settings.filter}
            onChange={(e) => updateSetting('filter', e.target.value as PhotoSettings['filter'])}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#374151',
              color: '#fff',
              border: '2px solid #c8a96e',
              borderRadius: '4px',
            }}
          >
            <option value="none">None</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="vintage">Vintage</option>
            <option value="dramatic">Dramatic</option>
          </select>
        </div>

        {/* Resolution */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Capture Resolution
          </label>
          <select
            value={settings.resolution}
            onChange={(e) => updateSetting('resolution', e.target.value as PhotoSettings['resolution'])}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#374151',
              color: '#fff',
              border: '2px solid #c8a96e',
              borderRadius: '4px',
            }}
          >
            <option value="1x">1x (1920x1080)</option>
            <option value="2x">2x (3840x2160)</option>
            <option value="4x">4x (7680x4320)</option>
          </select>
        </div>

        {/* Capture button */}
        <button
          onClick={() => onCapture(settings)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#c8a96e',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          📸 Capture (F12)
        </button>
      </div>

      {/* Camera controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        padding: '10px 20px',
        color: '#fff',
        fontSize: '14px',
      }}>
        WASD: Move Camera | Mouse: Look | Scroll: Zoom | F12: Capture
      </div>
    </div>
  );
};
