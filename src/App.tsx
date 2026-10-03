import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TerrainSystem } from './engine/terrain/TerrainSystem.js';
import { StreamingManager } from './engine/streaming/StreamingManager.js';
import { EnvironmentManager } from './engine/environment/EnvironmentManager.js';
import { PhysicsWorld } from './engine/physics/PhysicsWorld.js';
import { AudioManager } from './engine/audio/AudioManager.js';
import { SaveManager } from './engine/saves/SaveManager.js';
import { QuestSystem } from './engine/quests/QuestSystem.js';
import { InventorySystem } from './engine/quests/InventorySystem.js';
import { WorldFlagsSystem } from './engine/quests/WorldFlagsSystem.js';
import { FactionSystem } from './engine/ai/FactionEventSystem.js';
import { SLICE_QUESTS } from './content/quests/slice-quests.js';
import { GameUI } from './ui/GameUI.js';
import { UIManager } from './ui/UIManager.js';

/**
 * CrownFall - Full Game
 * Integrates all systems: terrain, environment, physics, combat, quests, UI
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  
  // Game systems
  const systemsRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    terrain?: TerrainSystem;
    streaming?: StreamingManager;
    environment?: EnvironmentManager;
    physics?: PhysicsWorld;
    audio?: AudioManager;
    save?: SaveManager;
    quests?: QuestSystem;
    inventory?: InventorySystem;
    flags?: WorldFlagsSystem;
    factions?: FactionSystem;
    ui?: UIManager;
  }>({});

  // Player state
  const [playerState, setPlayerState] = useState({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    mana: 100,
    maxMana: 100,
    position: { x: 0, y: 5, z: 0 },
    rotation: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let disposed = false;

    const init = async () => {
      try {
        setLoadingProgress(10);

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        systemsRef.current.scene = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          5000
        );
        camera.position.set(0, 10, 20);
        systemsRef.current.camera = camera;

        setLoadingProgress(20);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        systemsRef.current.renderer = renderer;

        setLoadingProgress(30);

        // Initialize physics
        const physics = new PhysicsWorld();
        await physics.init();
        systemsRef.current.physics = physics;

        setLoadingProgress(40);

        // Initialize terrain streaming
        const streaming = new StreamingManager(
          128, // chunk size
          { full: 400, near: 800, far: 1600, unloaded: 2400 },
          12345, // seed
          '1.0.0',
          100 // max chunks
        );
        await streaming.init();
        systemsRef.current.streaming = streaming;

        setLoadingProgress(50);

        // Initialize environment
        const environment = new EnvironmentManager(scene);
        systemsRef.current.environment = environment;

        setLoadingProgress(60);

        // Initialize audio
        const audio = new AudioManager();
        await audio.init();
        systemsRef.current.audio = audio;

        setLoadingProgress(70);

        // Initialize save system
        const save = new SaveManager();
        await save.init();
        systemsRef.current.save = save;

        // Initialize quest system
        const inventory = new InventorySystem();
        const flags = new WorldFlagsSystem();
        const factions = new FactionSystem();
        const quests = new QuestSystem(inventory, flags, factions);

        // Load SLICE quests
        for (const quest of SLICE_QUESTS) {
          quests.addQuest(quest);
        }

        systemsRef.current.inventory = inventory;
        systemsRef.current.flags = flags;
        systemsRef.current.factions = factions;
        systemsRef.current.quests = quests;

        setLoadingProgress(80);

        // Initialize UI manager
        const ui = new UIManager();
        systemsRef.current.ui = ui;

        // Create player character
        const playerGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const playerMaterial = new THREE.MeshStandardMaterial({
          color: 0xc8a96e,
          roughness: 0.6,
          metalness: 0.3,
        });
        const player = new THREE.Mesh(playerGeometry, playerMaterial);
        player.position.set(0, 2, 0);
        player.castShadow = true;
        scene.add(player);

        // Create physics body for player
        physics.createCharacter('player', { x: 0, y: 2, z: 0 }, 1.8, 0.5);

        setLoadingProgress(90);

        // Input handling
        const keys: Record<string, boolean> = {};
        const handleKeyDown = (e: KeyboardEvent) => {
          keys[e.key.toLowerCase()] = true;
          
          // UI shortcuts
          if (e.key === 'Escape') ui.setPaused(!ui.getState().isPaused);
          if (e.key === 'i' || e.key === 'I') ui.navigateTo('inventory' as any);
          if (e.key === 'q' || e.key === 'Q') ui.navigateTo('journal' as any);
          if (e.key === 'm' || e.key === 'M') ui.navigateTo('map' as any);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
          keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Mouse look
        let yaw = 0;
        let pitch = 0;
        let isPointerLocked = false;

        const handleClick = () => {
          if (!isPointerLocked) {
            container.requestPointerLock();
          }
        };
        container.addEventListener('click', handleClick);

        const handlePointerLockChange = () => {
          isPointerLocked = document.pointerLockElement === container;
        };
        document.addEventListener('pointerlockchange', handlePointerLockChange);

        const handleMouseMove = (e: MouseEvent) => {
          if (isPointerLocked) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
          }
        };
        document.addEventListener('mousemove', handleMouseMove);

        // Resize handler
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        setLoadingProgress(100);

        // Game loop
        const clock = new THREE.Clock();
        const playerVelocity = new THREE.Vector3();
        const playerSpeed = 10;

        const animate = () => {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);

          const deltaTime = clock.getDelta();

          // Update physics
          physics.step(deltaTime);

          // Update streaming
          streaming.update(camera.position.x, camera.position.z);

          // Update environment
          environment.update(deltaTime, camera.position);

          // Player movement
          if (!ui.getState().isPaused) {
            playerVelocity.set(0, 0, 0);
            const moveSpeed = playerSpeed * deltaTime;

            if (keys['w']) playerVelocity.z -= moveSpeed;
            if (keys['s']) playerVelocity.z += moveSpeed;
            if (keys['a']) playerVelocity.x -= moveSpeed;
            if (keys['d']) playerVelocity.x += moveSpeed;

            // Apply rotation to movement
            if (playerVelocity.length() > 0) {
              playerVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
              player.position.add(playerVelocity);
              player.rotation.y = yaw + Math.PI;
            }

            // Update player state
            setPlayerState({
              ...playerState,
              position: {
                x: Math.round(player.position.x * 10) / 10,
                y: Math.round(player.position.y * 10) / 10,
                z: Math.round(player.position.z * 10) / 10,
              },
              rotation: yaw,
            });

            // Update physics character
            const char = physics.getCharacter('player');
            if (char) {
              char.position.x = player.position.x;
              char.position.y = player.position.y;
              char.position.z = player.position.z;
            }
          }

          // Camera follow (third person)
          const cameraOffset = new THREE.Vector3(0, 5, 10);
          cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
          cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
          
          const targetCameraPos = player.position.clone().add(cameraOffset);
          camera.position.lerp(targetCameraPos, 0.1);
          camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

          // Render
          renderer.render(scene, camera);
        };

        animate();
        setGameReady(true);
        setLoading(false);

        // Cleanup function
        return () => {
          disposed = true;
          cancelAnimationFrame(animationId);
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('resize', handleResize);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('pointerlockchange', handlePointerLockChange);
          container.removeEventListener('click', handleClick);
          
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          
          renderer.dispose();
          physics.dispose();
          streaming.dispose();
          environment.dispose();
          audio.dispose();
          save.dispose();
        };
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    init();

    return () => {
      disposed = true;
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
            width: `${loadingProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #c8a96e, #d4b87a)',
            transition: 'width 0.3s',
          }} />
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#888' }}>
          {loadingProgress}%
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game UI */}
      {gameReady && systemsRef.current.ui && (
        <GameUI
          playerState={playerState}
          questObjective="Speak to Elder Bram in Briarhollow"
          interactionPrompt={undefined}
          dialogueData={undefined}
          onAction={(action) => {
            console.log('UI Action:', action);
          }}
          onDialogueChoice={(choiceId) => {
            console.log('Dialogue choice:', choiceId);
          }}
          onPhotoCapture={(settings) => {
            console.log('Photo capture:', settings);
          }}
          onResume={() => {
            systemsRef.current.ui?.setPaused(false);
          }}
        />
      )}
    </div>
  );
}
