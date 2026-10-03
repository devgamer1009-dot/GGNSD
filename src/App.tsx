import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * CrownFall — Playable Game
 * Third-person character with WASD controls
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 2, z: 0 });
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 100, 500);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7d44,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    // Add some height variation to ground
    const positionAttribute = groundGeometry.attributes.position;
    if (positionAttribute) {
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const height = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2;
        positionAttribute.setZ(i, height);
      }
      groundGeometry.computeVertexNormals();
    }
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Player character (simple cube)
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a96e,
      roughness: 0.6,
      metalness: 0.3,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 2, 0);
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);

    // Add some trees
    const treeGeometry = new THREE.ConeGeometry(2, 6, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    });
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });

    for (let i = 0; i < 50; i++) {
      const tree = new THREE.Group();
      
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      tree.add(trunk);
      
      const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
      leaves.position.y = 5;
      leaves.castShadow = true;
      tree.add(leaves);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 80;
      tree.position.set(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      
      scene.add(tree);
    }

    // Add some rocks
    const rockGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < 30; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 60;
      rock.position.set(
        Math.cos(angle) * distance,
        0.75,
        Math.sin(angle) * distance
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // Input handling
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
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
      container.requestPointerLock();
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

    // Game loop
    const playerVelocity = new THREE.Vector3();
    const playerSpeed = 10;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // FPS counter
      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }

      // Player movement
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
        
        // Rotate player to face movement direction
        player.rotation.y = yaw + Math.PI;
      }

      // Update player position state
      setPlayerPos({
        x: Math.round(player.position.x * 10) / 10,
        y: Math.round(player.position.y * 10) / 10,
        z: Math.round(player.position.z * 10) / 10,
      });

      // Camera follow (third person)
      const cameraOffset = new THREE.Vector3(0, 5, 10);
      cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      
      const targetCameraPos = player.position.clone().add(cameraOffset);
      camera.position.lerp(targetCameraPos, 0.1);
      camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

      // Render
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
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
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
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
      
      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        lineHeight: '1.6',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#c8a96e' }}>
          CrownFall
        </div>
        <div>FPS: {fps}</div>
        <div>Position: ({playerPos.x}, {playerPos.y}, {playerPos.z})</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
          <div>Click to lock mouse</div>
          <div>WASD - Move</div>
          <div>Mouse - Look around</div>
          <div>ESC - Unlock mouse</div>
        </div>
      </div>
    </div>
  );
}
