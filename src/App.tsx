import { useEffect, useRef, useState } from 'react';
import { Renderer, DebugOverlay } from './engine/render/index.js';
import * as THREE from 'three/webgpu';

/**
 * CrownFall — Boot Screen (P3)
 *
 * Initializes Three.js WebGPURenderer with WebGL2 fallback.
 * Shows capability detection and error screen if unsupported.
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>('Initializing...');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let debugOverlay: DebugOverlay | null = null;
    let animationId = 0;

    const init = async () => {
      try {
        // Create renderer
        renderer = new Renderer({
          antialias: true,
          powerPreference: 'high-performance',
        });

        // Initialize (handles WebGPU/WebGL2 fallback)
        const info = await renderer.init();
        setBackend(`${info.backend} — ${info.renderer}`);

        // Add canvas to container
        container.appendChild(renderer.domElement);

        // Handle resize
        const resize = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          renderer!.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0f);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 5;

        // Add a simple cube to test rendering
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0xc8a96e });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Debug overlay
        debugOverlay = new DebugOverlay(renderer);

        // Animation loop
        let time = 0;
        renderer.setAnimationLoop((timestamp) => {
          time = timestamp;
          cube.rotation.x = time * 0.001;
          cube.rotation.y = time * 0.002;

          renderer!.render(scene, camera);
          debugOverlay?.update(time);
        });

        console.log('[CrownFall] Boot OK');
        console.log(`[CrownFall] Backend: ${info.backend}`);
        console.log(`[CrownFall] GPU: ${info.renderer} (${info.vendor})`);
      } catch (err) {
        console.error('[CrownFall] Initialization failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'WebGPU and WebGL2 are not supported in this browser.'
        );
      }
    };

    init();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      debugOverlay?.dispose();
      renderer?.dispose();
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
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
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Graphics Initialization Failed</h2>
        <p style={{ fontSize: '14px', maxWidth: '600px', lineHeight: '1.6' }}>{error}</p>
        <p style={{ fontSize: '12px', marginTop: '20px', color: '#888' }}>
          Please try a different browser (Chrome, Edge, or Firefox with WebGPU support).
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#4ade80',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '8px 16px',
          borderRadius: '4px',
        }}
      >
        [ boot OK ] — {backend}
        <br />
        <span style={{ fontSize: '10px', color: '#888' }}>Press F3 for debug overlay</span>
      </div>
    </div>
  );
}
