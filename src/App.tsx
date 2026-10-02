import { useEffect, useRef } from 'react';

/**
 * CrownFall — Boot Screen (P1)
 *
 * Renders a canvas with a procedural starfield and displays "boot OK".
 * This is the minimal main that proves the engine pipeline works.
 */
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Procedural starfield
    const stars: { x: number; y: number; r: number; a: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random(),
      });
    }

    let frameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of stars) {
        const flicker = Math.sin(time * 2 + star.a * 10) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 216, 200, ${star.a * flicker})`;
        ctx.fill();
      }

      // Title
      ctx.fillStyle = '#c8a96e';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('CROWNFALL', canvas.width / 2, canvas.height / 2 - 40);

      // Subtitle
      ctx.fillStyle = '#8a7a5a';
      ctx.font = '18px Georgia, serif';
      ctx.fillText('Medieval Fantasy Open World', canvas.width / 2, canvas.height / 2);

      // Boot status
      ctx.fillStyle = '#4ade80';
      ctx.font = '14px monospace';
      ctx.fillText('[ boot OK ]', canvas.width / 2, canvas.height / 2 + 60);

      // Version
      ctx.fillStyle = '#555';
      ctx.font = '12px monospace';
      ctx.fillText('v0.1.0 — P1 Foundation', canvas.width / 2, canvas.height - 30);

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
