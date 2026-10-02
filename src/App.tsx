import { useEffect, useRef, useState } from 'react';
import { Renderer, DebugOverlay } from './engine/render/index.js';
import { TerrainSystem } from './engine/terrain/index.js';
import * as THREE from 'three/webgpu';

/**
 * CrownFall — Terrain Test (P5)
 *
 * Free camera flying over procedurally generated terrain.
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>('Initializing...');
  const [chunksLoaded, setChunksLoaded] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let debugOverlay: DebugOverlay | null = null;
    let terrainSystem: TerrainSystem | null = null;

    const init = async () => {
      try {
        // Create renderer
        renderer = new Renderer({
          antialias: true,
          powerPreference: 'high-performance',
        });

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
        scene.background = new THREE.Color(0x87ceeb); // Sky blue
        scene.fog = new THREE.Fog(0x87ceeb, 500, 2000);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          5000
        );
        camera.position.set(0, 100, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(500, 1000, 500);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Initialize terrain system
        terrainSystem = new TerrainSystem(128, 800, 12345, 4000);
        terrainSystem.init();

        // Terrain material
        const terrainMaterial = new THREE.MeshStandardMaterial({
          vertexColors: true,
          flatShading: false,
        });

        // Track loaded chunks
        const chunkMeshes = new Map<string, THREE.Mesh>();

        terrainSystem.onChunkLoad((chunkData) => {
          const key = `${chunkData.chunkX},${chunkData.chunkZ}`;
          
          // Remove old mesh if exists
          const oldMesh = chunkMeshes.get(key);
          if (oldMesh) {
            scene.remove(oldMesh);
            oldMesh.geometry.dispose();
          }

          // Create geometry
          const verticesPerSide = chunkData.resolution + 1;
          const geometry = new THREE.BufferGeometry();

          // Positions
          const positions = new Float32Array(verticesPerSide * verticesPerSide * 3);
          const colors = new Float32Array(verticesPerSide * verticesPerSide * 3);
          
          for (let z = 0; z < verticesPerSide; z++) {
            for (let x = 0; x < verticesPerSide; x++) {
              const idx = z * verticesPerSide + x;
              const vertIdx = idx * 3;

              // World position
              const worldX = chunkData.chunkX * chunkData.size + (x / chunkData.resolution) * chunkData.size - 2000;
              const worldZ = chunkData.chunkZ * chunkData.size + (z / chunkData.resolution) * chunkData.size - 2000;
              const worldY = chunkData.heights[idx]! * 200; // Scale height

              positions[vertIdx] = worldX;
              positions[vertIdx + 1] = worldY;
              positions[vertIdx + 2] = worldZ;

              // Color based on biome
              const biome = chunkData.biomes[idx]!;
              let r = 0.5, g = 0.5, b = 0.5;
              
              if (biome === 0) { r = 0.1; g = 0.2; b = 0.5; } // Ocean
              else if (biome === 1) { r = 0.8; g = 0.7; b = 0.5; } // Beach
              else if (biome === 2) { r = 0.4; g = 0.6; b = 0.2; } // Plains
              else if (biome === 3) { r = 0.2; g = 0.4; b = 0.1; } // Forest
              else if (biome === 4) { r = 0.5; g = 0.5; b = 0.3; } // Hills
              else if (biome === 5) { r = 0.4; g = 0.4; b = 0.4; } // Mountains
              else if (biome === 6) { r = 0.9; g = 0.9; b = 0.95; } // Snow
              else if (biome === 7) { r = 0.9; g = 0.8; b = 0.5; } // Desert

              colors[vertIdx] = r;
              colors[vertIdx + 1] = g;
              colors[vertIdx + 2] = b;
            }
          }

          // Indices
          const indices = [];
          for (let z = 0; z < verticesPerSide - 1; z++) {
            for (let x = 0; x < verticesPerSide - 1; x++) {
              const topLeft = z * verticesPerSide + x;
              const topRight = topLeft + 1;
              const bottomLeft = (z + 1) * verticesPerSide + x;
              const bottomRight = bottomLeft + 1;

              indices.push(topLeft, bottomLeft, topRight);
              indices.push(topRight, bottomLeft, bottomRight);
            }
          }

          geometry.setIndex(indices);
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geometry.computeVertexNormals();

          const mesh = new THREE.Mesh(geometry, terrainMaterial);
          scene.add(mesh);
          chunkMeshes.set(key, mesh);

          setChunksLoaded(chunkMeshes.size);
        });

        // Camera controls
        const keys: Record<string, boolean> = {};
        let yaw = 0;
        let pitch = 0;
        let isPointerLocked = false;

        window.addEventListener('keydown', (e) => {
          keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
          keys[e.code] = false;
        });

        container.addEventListener('click', () => {
          container.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
          isPointerLocked = document.pointerLockElement === container;
        });

        document.addEventListener('mousemove', (e) => {
          if (isPointerLocked) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
          }
        });

        // Debug overlay
        debugOverlay = new DebugOverlay(renderer);

        // Animation loop
        let lastTime = performance.now();
        const cameraVelocity = new THREE.Vector3();

        renderer.setAnimationLoop(() => {
          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          // Camera movement
          const speed = keys['ShiftLeft'] ? 200 : 100;
          const forward = new THREE.Vector3(
            -Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            -Math.cos(yaw) * Math.cos(pitch)
          );
          const right = new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
          );

          cameraVelocity.set(0, 0, 0);

          if (keys['KeyW']) cameraVelocity.add(forward.clone().multiplyScalar(speed * dt));
          if (keys['KeyS']) cameraVelocity.add(forward.clone().multiplyScalar(-speed * dt));
          if (keys['KeyA']) cameraVelocity.add(right.clone().multiplyScalar(-speed * dt));
          if (keys['KeyD']) cameraVelocity.add(right.clone().multiplyScalar(speed * dt));
          if (keys['Space']) cameraVelocity.y += speed * dt;
          if (keys['KeyC']) cameraVelocity.y -= speed * dt;

          camera.position.add(cameraVelocity);
          camera.rotation.set(pitch, yaw, 0, 'YXZ');

          // Update terrain
          terrainSystem!.update(camera.position.x, camera.position.z);
          terrainSystem!.unloadDistantChunks(camera.position.x, camera.position.z, 1500);

          renderer!.render(scene, camera);
          debugOverlay?.update(now);
        });

        console.log('[CrownFall] Terrain system initialized');
      } catch (err) {
        console.error('[CrownFall] Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    init();

    return () => {
      debugOverlay?.dispose();
      terrainSystem?.dispose();
      renderer?.dispose();
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

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '4px',
        lineHeight: '1.6',
      }}>
        <div><strong>CrownFall P5 — Terrain</strong></div>
        <div>Backend: {backend}</div>
        <div>Chunks: {chunksLoaded}</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
          <div>Click to lock mouse</div>
          <div>WASD — Move</div>
          <div>Space/C — Up/Down</div>
          <div>Shift — Fast</div>
          <div>F3 — Debug overlay</div>
        </div>
      </div>
    </div>
  );
}
