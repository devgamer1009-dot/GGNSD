/**
 * Game Screen Components
 * P16 - Inventory, skills, map, journal, crafting, dialogue
 */

import React, { useState } from 'react';
import { UIScreen } from './UIManager.js';

export interface GameScreenProps {
  onNavigate: (screen: UIScreen) => void;
  onClose: () => void;
}

/**
 * Inventory Screen Component
 */
export const InventoryScreen: React.FC<GameScreenProps> = ({ onClose }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Mock inventory data
  const items = [
    { id: 'sword', name: 'Iron Sword', type: 'weapon', quantity: 1 },
    { id: 'shield', name: 'Wooden Shield', type: 'armor', quantity: 1 },
    { id: 'potion', name: 'Health Potion', type: 'consumable', quantity: 5 },
    { id: 'gold', name: 'Gold Coins', type: 'currency', quantity: 150 },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      zIndex: 1000,
      padding: '40px',
    }}>
      {/* Left: Equipment slots */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <h2 style={{ color: '#c8a96e', fontSize: '36px' }}>Equipment</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 80px)',
          gap: '10px',
        }}>
          {['Head', 'Chest', 'Legs', 'Weapon', 'Shield', 'Boots'].map(slot => (
            <div key={slot} style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#374151',
              border: '2px solid #c8a96e',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
            }}>
              {slot}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Inventory grid */}
      <div style={{
        flex: '2',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <h2 style={{ color: '#c8a96e', fontSize: '36px' }}>Inventory</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 60px)',
          gap: '10px',
        }}>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: selectedItem === item.id ? '#c8a96e' : '#374151',
                border: '2px solid #c8a96e',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '10px',
              }}
            >
              <div>{item.name}</div>
              <div>x{item.quantity}</div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#374151',
            color: '#fff',
            border: '2px solid #c8a96e',
            borderRadius: '4px',
            cursor: 'pointer',
            alignSelf: 'flex-end',
          }}
        >
          Close (ESC)
        </button>
      </div>
    </div>
  );
};

/**
 * Map Screen Component
 */
export const MapScreen: React.FC<GameScreenProps> = ({ onClose }) => {
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
      zIndex: 1000,
      padding: '40px',
    }}>
      <h2 style={{ color: '#c8a96e', fontSize: '36px', marginBottom: '20px' }}>World Map</h2>
      
      <div style={{
        width: '800px',
        height: '600px',
        backgroundColor: '#1f2937',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        position: 'relative',
      }}>
        {/* Fog of war overlay would go here */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '18px',
        }}>
          Map content would be rendered here
        </div>
      </div>
      
      <button
        onClick={onClose}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#374151',
          color: '#fff',
          border: '2px solid #c8a96e',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Close (ESC)
      </button>
    </div>
  );
};

/**
 * Journal Screen Component
 */
export const JournalScreen: React.FC<GameScreenProps> = ({ onClose }) => {
  const quests = [
    { id: 'q1', name: 'A Knight\'s Awakening', status: 'completed' },
    { id: 'q2', name: 'Wolf Problem', status: 'active' },
    { id: 'q3', name: 'The Lost Locket', status: 'available' },
  ];

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
      zIndex: 1000,
      padding: '40px',
    }}>
      <h2 style={{ color: '#c8a96e', fontSize: '36px', marginBottom: '20px' }}>Quest Journal</h2>
      
      <div style={{
        width: '600px',
        backgroundColor: '#1f2937',
        border: '2px solid #c8a96e',
        borderRadius: '8px',
        padding: '20px',
      }}>
        {quests.map(quest => (
          <div key={quest.id} style={{
            padding: '15px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: '16px' }}>{quest.name}</div>
            <div style={{
              color: quest.status === 'completed' ? '#4ade80' : 
                     quest.status === 'active' ? '#fbbf24' : '#9ca3af',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}>
              {quest.status}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={onClose}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#374151',
          color: '#fff',
          border: '2px solid #c8a96e',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Close (ESC)
      </button>
    </div>
  );
};

/**
 * Dialogue Screen Component
 */
export const DialogueScreen: React.FC<GameScreenProps & {
  speaker: string;
  text: string;
  choices?: Array<{ id: string; text: string }>;
  onChoice?: (choiceId: string) => void;
}> = ({ onClose, speaker, text, choices = [], onChoice }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '800px',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #c8a96e',
      borderRadius: '8px',
      padding: '30px',
      zIndex: 1000,
    }}>
      <div style={{
        color: '#c8a96e',
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '15px',
      }}>
        {speaker}
      </div>
      
      <div style={{
        color: '#fff',
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '20px',
      }}>
        {text}
      </div>
      
      {choices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => onChoice?.(choice.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#374151',
                color: '#fff',
                border: '2px solid #c8a96e',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
      
      {choices.length === 0 && (
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#374151',
            color: '#fff',
            border: '2px solid #c8a96e',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Continue (Space)
        </button>
      )}
    </div>
  );
};
