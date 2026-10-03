import { useEffect, useRef, useState } from 'react';
import { CrownFallGame } from './game/CrownFallGame.js';

/**
 * CrownFall - Main App Component
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<CrownFallGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Create and start game
      const game = new CrownFallGame(container);
      gameRef.current = game;
      game.start();
      setLoading(false);
    } catch (err) {
      console.error('Failed to start game:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#ff4444',
        fontFamily: 'monospace',
        padding: '20px',
      }}>
        <h1>⚠️ Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#c8a96e',
        fontFamily: 'Georgia, serif',
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>CrownFall</h1>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>Loading...</p>
        <div style={{
          width: '400px',
          height: '20px',
          background: '#333',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #c8a96e, #d4b87a)',
            animation: 'loading 2s ease-in-out infinite',
          }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
}
