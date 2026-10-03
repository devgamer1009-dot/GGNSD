/**
 * HUD Components
 * P16 - Health, stamina, spells, compass, quest tracker, prompts
 */

import React from 'react';

export interface HUDProps {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  mana: number;
  maxMana: number;
  compassAngle: number;
  questObjective?: string;
  interactionPrompt?: string;
}

/**
 * Health Bar Component
 */
export const HealthBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = (current / max) * 100;
  const color = percentage > 50 ? '#4ade80' : percentage > 25 ? '#fbbf24' : '#ef4444';

  return (
    <div style={{
      width: '200px',
      height: '20px',
      backgroundColor: '#1f2937',
      border: '2px solid #374151',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: color,
        transition: 'width 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}>
        {Math.floor(current)} / {max}
      </div>
    </div>
  );
};

/**
 * Stamina Bar Component
 */
export const StaminaBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = (current / max) * 100;

  return (
    <div style={{
      width: '200px',
      height: '15px',
      backgroundColor: '#1f2937',
      border: '2px solid #374151',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: '#fbbf24',
        transition: 'width 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}>
        {Math.floor(current)} / {max}
      </div>
    </div>
  );
};

/**
 * Spell Resource Display
 */
export const SpellResource: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = (current / max) * 100;

  return (
    <div style={{
      width: '200px',
      height: '15px',
      backgroundColor: '#1f2937',
      border: '2px solid #374151',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: '#3b82f6',
        transition: 'width 0.3s ease',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}>
        {Math.floor(current)} / {max}
      </div>
    </div>
  );
};

/**
 * Compass Component
 */
export const Compass: React.FC<{ angle: number; pois?: Array<{ name: string; angle: number }> }> = ({ angle, pois = [] }) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const directionIndex = Math.round(((angle % 360) + 360) % 360 / 45) % 8;
  const currentDirection = directions[directionIndex];

  return (
    <div style={{
      width: '300px',
      height: '40px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      border: '2px solid #374151',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        color: '#fbbf24',
        fontSize: '18px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}>
        {currentDirection} ({Math.round(angle)}°)
      </div>
      
      {/* POI markers */}
      {pois.map((poi, index) => {
        const relativeAngle = poi.angle - angle;
        const normalizedAngle = ((relativeAngle % 360) + 360) % 360;
        const isVisible = normalizedAngle < 90 || normalizedAngle > 270;
        
        if (!isVisible) return null;
        
        const position = (normalizedAngle / 360) * 300;
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${position}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            ▼ {poi.name}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Quest Tracker Component
 */
export const QuestTracker: React.FC<{ objective?: string }> = ({ objective }) => {
  if (!objective) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #c8a96e',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '300px',
    }}>
      <div style={{
        color: '#c8a96e',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px',
      }}>
        Current Objective
      </div>
      <div style={{
        color: '#fff',
        fontSize: '12px',
      }}>
        {objective}
      </div>
    </div>
  );
};

/**
 * Interaction Prompt Component
 */
export const InteractionPrompt: React.FC<{ prompt?: string }> = ({ prompt }) => {
  if (!prompt) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '150px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #c8a96e',
      borderRadius: '8px',
      padding: '15px 30px',
      textAlign: 'center',
    }}>
      <div style={{
        color: '#c8a96e',
        fontSize: '16px',
        fontWeight: 'bold',
      }}>
        {prompt}
      </div>
    </div>
  );
};

/**
 * Main HUD Component
 */
export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  stamina,
  maxStamina,
  mana,
  maxMana,
  compassAngle,
  questObjective,
  interactionPrompt,
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      {/* Top-left: Health, Stamina, Mana */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <HealthBar current={health} max={maxHealth} />
        <StaminaBar current={stamina} max={maxStamina} />
        <SpellResource current={mana} max={maxMana} />
      </div>

      {/* Top-center: Compass */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <Compass angle={compassAngle} />
      </div>

      {/* Quest Tracker */}
      <QuestTracker objective={questObjective} />

      {/* Interaction Prompt */}
      <InteractionPrompt prompt={interactionPrompt} />
    </div>
  );
};
