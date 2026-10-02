import { useEffect, useRef, useState } from 'react';
import { Renderer, DebugOverlay } from './engine/render/index.js';
import { createWorld, type Component } from './engine/ecs/index.js';
import { createEventBus } from './engine/events/index.js';
import { createInputSystem } from './engine/input/index.js';
import { createGameLoop } from './engine/loop/index.js';
import { createDebugConsole } from './engine/debug/index.js';
import * as THREE from 'three/webgpu';

// Components
class Position implements Component {
  constructor(public x = 0, public y = 0, public z = 0) {}
}

class Velocity implements Component {
  constructor(public x = 0, public y = 0, public z = 0) {}
}

class Player implements Component {}

/**
 * CrownFall — Test Scene (P4)
 *
 * Controllable cube with camera using engine core systems.
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>('Initializing...');
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let debugOverlay: DebugOverlay | null = null;

    // Engine systems
    const world = createWorld();
    const events = createEventBus();
    const input = createInputSystem();
    const gameLoop = createGameLoop(1 / 60);
    const debugConsole = createDebugConsole();

    // Setup input bindings
    input.bindAction('moveForward', { key: 'KeyW' });
    input.bindAction('moveBackward', { key: 'KeyS' });
    input.bindAction('moveLeft', { key: 'KeyA' });
    input.bindAction('moveRight', { key: 'KeyD' });

    const init = async () => {
      try {
        // Create renderer
        renderer = new Renderer({
          antialias: true,
          powerPreference: 'high-performance',
        });

        // Initialize
        const info = await renderer.init();
        setBackend(`${info.backend} — ${info.renderer}`);

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
        scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);

        // Create player cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xc8a96e });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Create ECS entity for player
        const playerEntity = world.createEntity();
        world.addComponent(playerEntity, new Position(0, 0, 0));
        world.addComponent(playerEntity, new Velocity(0, 0, 0));
        world.addComponent(playerEntity, new Player());

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);

        // Debug overlay
        debugOverlay = new DebugOverlay(renderer);

        // Debug console commands
        debugConsole.registerCommand('pos', () => {
          const pos = world.getComponent(playerEntity, Position);
          return pos ? `Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})` : 'No position';
        });

        debugConsole.registerCommand('entities', () => {
          return `Entities: ${world.getEntityCount()}`;
        });

        // Game loop
        gameLoop.start({
          update: (dt) => {
            input.update();

            // Movement system
            const pos = world.getComponent(playerEntity, Position);
            const vel = world.getComponent(playerEntity, Velocity);
            
            if (pos && vel) {
              const speed = 5;
              vel.x = 0;
              vel.z = 0;

              if (input.isActionPressed('moveForward')) vel.z = -speed;
              if (input.isActionPressed('moveBackward')) vel.z = speed;
              if (input.isActionPressed('moveLeft')) vel.x = -speed;
              if (input.isActionPressed('moveRight')) vel.x = speed;

              pos.x += vel.x * dt;
              pos.z += vel.z * dt;

              // Update Three.js cube
              cube.position.set(pos.x, pos.y, pos.z);
            }

            events.emit('tick', dt);
          },
          render: (alpha) => {
            // Camera follow
            const pos = world.getComponent(playerEntity, Position);
            if (pos) {
              camera.position.x = pos.x;
              camera.position.z = pos.z + 10;
              camera.lookAt(pos.x, pos.y, pos.z);
            }

            renderer!.render(scene, camera);
            debugOverlay?.update(performance.now());
          },
        });

        // Update tick counter
        events.on('tick', () => {
          setTicks((t) => t + 1);
        });

        console.log('[CrownFall] Engine initialized');
        console.log(`[CrownFall] Backend: ${info.backend}`);
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
      gameLoop.stop();
      debugOverlay?.dispose();
      debugConsole.dispose();
      renderer?.dispose();
      input.dispose();
      events.clear();
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
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: '#4ade80',
          fontFamily: 'monospace',
          fontSize: '14px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '4px',
          lineHeight: '1.6',
        }}
      >
        <div><strong>CrownFall P4 — Engine Core</strong></div>
        <div>Backend: {backend}</div>
        <div>Ticks: {ticks}</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          <div>WASD — Move cube</div>
          <div>F3 — Debug overlay</div>
          <div>` — Debug console</div>
        </div>
      </div>
    </div>
  );
}
