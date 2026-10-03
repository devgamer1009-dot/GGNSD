/**
 * Slice Demo - P19 Integration
 * A playable ~30 minute experience showcasing all systems
 */

import * as THREE from 'three';
import { GameStateManager, GamePhase } from './GameStateManager.js';
import { SaveManager } from '../engine/saves/SaveManager.js';
import { AudioSystem } from '../engine/audio/AudioSystem.js';
import { QuestSystem } from '../engine/quests/QuestSystem.js';
import { InventorySystem } from '../engine/quests/InventorySystem.js';
import { WorldFlagsSystem } from '../engine/quests/WorldFlagsSystem.js';
import { FactionSystem } from '../engine/ai/FactionEventSystem.js';
import { SLICE_QUESTS } from '../content/quests/slice-quests.js';

export class SliceDemo {
  private gameState: GameStateManager;
  private saveManager: SaveManager;
  private audioSystem: AudioSystem;
  private questSystem: QuestSystem;
  private inventorySystem: InventorySystem;
  private worldFlagsSystem: WorldFlagsSystem;
  private factionSystem: FactionSystem;
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  private isRunning: boolean = false;
  private clock: THREE.Clock;

  constructor() {
    this.gameState = new GameStateManager();
    this.saveManager = new SaveManager();
    this.audioSystem = new AudioSystem();
    this.inventorySystem = new InventorySystem();
    this.worldFlagsSystem = new WorldFlagsSystem();
    this.factionSystem = new FactionSystem();
    this.questSystem = new QuestSystem(
      this.inventorySystem,
      this.worldFlagsSystem,
      this.factionSystem
    );
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
  }

  /**
   * Initialize the demo
   */
  async init(): Promise<void> {
    console.log('[SliceDemo] Initializing...');

    // Initialize systems
    await this.saveManager.init();
    await this.audioSystem.init();
    
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Setup camera
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Load quests
    this.loadQuests();
    
    // Setup scene
    this.setupScene();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start intro
    this.startIntro();
    
    console.log('[SliceDemo] Initialized');
  }

  /**
   * Load SLICE quests
   */
  private loadQuests(): void {
    // Load first 3 quests
    const quests = SLICE_QUESTS.slice(0, 3);
    for (const quest of quests) {
      this.questSystem.addQuest(quest);
    }
  }

  /**
   * Setup basic scene
   */
  private setupScene(): void {
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    
    // Add some objects
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xc8a96e });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 1, 0);
    this.scene.add(cube);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Keyboard input
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Game state changes
    this.gameState.onStateChange((state) => {
      console.log('[SliceDemo] Game state changed:', state.phase);
    });
  }

  /**
   * Handle keyboard input
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.togglePause();
        break;
      case 's':
      case 'S':
        this.saveGame();
        break;
      case 'l':
      case 'L':
        this.loadGame();
        break;
      case 'q':
      case 'Q':
        this.advanceQuest();
        break;
    }
  }

  /**
   * Start intro sequence
   */
  private startIntro(): void {
    console.log('[SliceDemo] Starting intro...');
    this.gameState.setPhase(GamePhase.INTRO);
    
    // Play intro music
    this.audioSystem.setMusicState('explore' as any);
    
    // Simulate intro completion after 3 seconds
    setTimeout(() => {
      this.gameState.completeIntro();
      console.log('[SliceDemo] Intro complete, starting exploration');
    }, 3000);
  }

  /**
   * Toggle pause
   */
  private togglePause(): void {
    const state = this.gameState.getState();
    if (state.phase === GamePhase.PAUSED) {
      this.gameState.setPhase(GamePhase.EXPLORATION);
      console.log('[SliceDemo] Unpaused');
    } else {
      this.gameState.setPhase(GamePhase.PAUSED);
      console.log('[SliceDemo] Paused');
    }
  }

  /**
   * Save game
   */
  private async saveGame(): Promise<void> {
    try {
      await this.saveManager.save(1, 'Slice Demo Save');
      console.log('[SliceDemo] Game saved');
    } catch (error) {
      console.error('[SliceDemo] Failed to save:', error);
    }
  }

  /**
   * Load game
   */
  private async loadGame(): Promise<void> {
    try {
      const saveData = await this.saveManager.load(1);
      if (saveData) {
        console.log('[SliceDemo] Game loaded');
      } else {
        console.log('[SliceDemo] No save found');
      }
    } catch (error) {
      console.error('[SliceDemo] Failed to load:', error);
    }
  }

  /**
   * Advance quest (for testing)
   */
  private advanceQuest(): void {
    const state = this.gameState.getState();
    
    if (!state.currentQuestId) {
      // Start first quest
      this.questSystem.startQuest('q1_wake_up');
      this.gameState.startQuest('q1_wake_up');
      console.log('[SliceDemo] Started quest: q1_wake_up');
    } else {
      // Complete current quest
      this.questSystem.completeQuest(state.currentQuestId);
      this.gameState.completeQuest(state.currentQuestId);
      console.log(`[SliceDemo] Completed quest: ${state.currentQuestId}`);
      
      // Start next quest if available
      const nextQuestId = this.getNextQuestId(state.currentQuestId);
      if (nextQuestId) {
        this.questSystem.startQuest(nextQuestId);
        this.gameState.startQuest(nextQuestId);
        console.log(`[SliceDemo] Started next quest: ${nextQuestId}`);
      }
    }
  }

  /**
   * Get next quest ID
   */
  private getNextQuestId(currentQuestId: string): string | null {
    const questOrder = ['q1_wake_up', 'q2_wolf_problem', 'q3_bandit_camp'];
    const currentIndex = questOrder.indexOf(currentQuestId);
    if (currentIndex < questOrder.length - 1) {
      return questOrder[currentIndex + 1] ?? null;
    }
    return null;
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.gameLoop());
    
    const deltaTime = this.clock.getDelta();
    
    // Update game state
    this.gameState.updatePlaytime(deltaTime);
    
    // Update systems
    this.update(deltaTime);
    
    // Render
    this.render();
  }

  /**
   * Update all systems
   */
  private update(deltaTime: number): void {
    const state = this.gameState.getState();
    
    // Skip updates if paused
    if (state.phase === GamePhase.PAUSED) {
      return;
    }
    
    // Rotate camera around scene
    const time = this.clock.getElapsedTime();
    this.camera.position.x = Math.sin(time * 0.1) * 15;
    this.camera.position.z = Math.cos(time * 0.1) * 15;
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Render the scene
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Start the demo
   */
  start(): void {
    this.isRunning = true;
    this.clock.start();
    this.gameLoop();
    console.log('[SliceDemo] Started');
  }

  /**
   * Stop the demo
   */
  stop(): void {
    this.isRunning = false;
    console.log('[SliceDemo] Stopped');
  }

  /**
   * Get game state manager
   */
  getGameState(): GameStateManager {
    return this.gameState;
  }

  /**
   * Get save manager
   */
  getSaveManager(): SaveManager {
    return this.saveManager;
  }

  /**
   * Get audio system
   */
  getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  /**
   * Get quest system
   */
  getQuestSystem(): QuestSystem {
    return this.questSystem;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop();
    this.saveManager.dispose();
    this.audioSystem.dispose();
    this.renderer.dispose();
    console.log('[SliceDemo] Disposed');
  }
}
