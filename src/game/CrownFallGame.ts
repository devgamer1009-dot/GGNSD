/**
 * CrownFall - Main Game Class
 * Combines all systems into a playable game
 */

import * as THREE from 'three';
import { SimpleTerrain } from './SimpleTerrain.js';
import { CharacterController } from './CharacterController.js';
import { CombatSystem } from './CombatSystem.js';
import { QuestManager } from './QuestManager.js';
import { WeatherSystem } from './WeatherSystem.js';
import { GameUI } from './GameUI.js';

export class CrownFallGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private terrain: SimpleTerrain;
  private player: CharacterController;
  private combat: CombatSystem;
  private quests: QuestManager;
  private weather: WeatherSystem;
  private ui: GameUI;

  private isRunning = false;
  private container: HTMLElement;
  private keys: Record<string, boolean> = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 500);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Initialize systems
    this.terrain = new SimpleTerrain(this.scene);
    this.player = new CharacterController(this.scene, this.camera);
    this.combat = new CombatSystem(this.scene, this.player);
    this.quests = new QuestManager();
    this.weather = new WeatherSystem(this.scene);
    this.ui = new GameUI(container, this.player, this.quests, this.combat);

    // Setup
    this.setupLighting();
    this.setupWorld();
    this.setupInput();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting(): void {
    // Lighting is handled by WeatherSystem
  }

  private setupWorld(): void {
    // Generate terrain
    this.terrain.generate(12345);

    // Add enemies
    this.combat.spawnEnemies(5);

    // Start first quest
    this.quests.startQuest('q1_wake_up');
  }

  private setupInput(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse
    this.container.addEventListener('click', () => {
      if (!this.ui.isPaused()) {
        this.container.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.container) {
        this.player.rotateCamera(e.movementX, e.movementY);
      }
    });

    // Mouse click for attack
    this.container.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement === this.container && e.button === 0) {
        this.combat.playerAttack();
      }
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = true;

    // UI shortcuts
    if (e.key === 'Escape') {
      this.ui.togglePause();
    }
    if (e.key === 'q' && !this.ui.isPaused()) {
      this.ui.toggleQuestLog();
    }
    if (e.key === 'i' && !this.ui.isPaused()) {
      this.ui.toggleInventory();
    }
    if (e.key === 'm' && !this.ui.isPaused()) {
      this.ui.toggleMap();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys[e.key.toLowerCase()] = false;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (!this.ui.isPaused()) {
      // Update player movement
      this.player.update(delta, this.keys, this.terrain);

      // Update combat
      this.combat.update(delta);

      // Update weather
      this.weather.update(delta);

      // Update quests
      this.quests.update(delta, this.player.getPosition());
    }

    // Update UI (always, even when paused)
    this.ui.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    this.stop();
    this.ui.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
