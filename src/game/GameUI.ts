/**
 * Game UI - HUD and menus
 */

import * as THREE from 'three';
import type { CharacterController } from './CharacterController.js';
import type { QuestManager } from './QuestManager.js';
import type { CombatSystem } from './CombatSystem.js';

export class GameUI {
  private container: HTMLElement;
  private player: CharacterController;
  private quests: QuestManager;
  private combat: CombatSystem;
  private hud: HTMLDivElement;
  private questTracker: HTMLDivElement;
  private paused: boolean = false;
  private showQuestLog: boolean = false;
  private showInventory: boolean = false;
  private showMap: boolean = false;

  constructor(
    container: HTMLElement,
    player: CharacterController,
    quests: QuestManager,
    combat: CombatSystem
  ) {
    this.container = container;
    this.player = player;
    this.quests = quests;
    this.combat = combat;

    // Create HUD
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-family: monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 8px;
      pointer-events: none;
      z-index: 100;
    `;
    container.appendChild(this.hud);

    // Create quest tracker
    this.questTracker = document.createElement('div');
    this.questTracker.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      font-family: monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 8px;
      max-width: 300px;
      pointer-events: none;
      z-index: 100;
    `;
    container.appendChild(this.questTracker);
  }

  public update(delta: number): void {
    this.updateHUD();
    this.updateQuestTracker();
  }

  private updateHUD(): void {
    const health = this.player.getHealth();
    const maxHealth = this.player.getMaxHealth();
    const stamina = this.player.getStamina();
    const maxStamina = this.player.getMaxStamina();
    const pos = this.player.getPosition();
    const enemies = this.combat.getEnemyCount();

    this.hud.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="color: #ff4444;">❤️ Health: ${Math.floor(health)}/${maxHealth}</div>
        <div style="background: #333; height: 10px; border-radius: 5px; margin-top: 5px;">
          <div style="background: #ff4444; height: 100%; width: ${(health / maxHealth) * 100}%; border-radius: 5px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="color: #44ff44;">⚡ Stamina: ${Math.floor(stamina)}/${maxStamina}</div>
        <div style="background: #333; height: 10px; border-radius: 5px; margin-top: 5px;">
          <div style="background: #44ff44; height: 100%; width: ${(stamina / maxStamina) * 100}%; border-radius: 5px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <div>📍 Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})</div>
      </div>
      <div>
        <div>⚔️ Enemies: ${enemies}</div>
      </div>
      <div style="margin-top: 15px; font-size: 12px; color: #888;">
        <div>WASD - Move | SHIFT - Sprint</div>
        <div>SPACE - Jump | Mouse - Look</div>
        <div>Click - Attack | ESC - Pause</div>
        <div>Q - Quests | I - Inventory | M - Map</div>
      </div>
    `;
  }

  private updateQuestTracker(): void {
    const activeQuest = this.quests.getActiveQuest();

    if (!activeQuest) {
      this.questTracker.innerHTML = `
        <div style="color: #c8a96e; font-weight: bold; margin-bottom: 10px;">
          📜 No Active Quest
        </div>
        <div style="color: #888; font-size: 12px;">
          Explore the world to find quests
        </div>
      `;
      return;
    }

    let progressText = '';
    if (activeQuest.targetCount) {
      const current = activeQuest.currentCount ?? 0;
      progressText = `<div style="color: #44ff44; margin-top: 10px;">Progress: ${current}/${activeQuest.targetCount}</div>`;
    }

    this.questTracker.innerHTML = `
      <div style="color: #c8a96e; font-weight: bold; margin-bottom: 10px;">
        📜 ${activeQuest.name}
      </div>
      <div style="color: #ccc; margin-bottom: 10px;">
        ${activeQuest.description}
      </div>
      <div style="color: #ffcc44; font-weight: bold;">
        Objective: ${activeQuest.objective}
      </div>
      ${progressText}
    `;
  }

  public togglePause(): void {
    this.paused = !this.paused;

    if (this.paused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  private showPauseMenu(): void {
    const menu = document.createElement('div');
    menu.id = 'pause-menu';
    menu.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 40px;
      border-radius: 12px;
      border: 2px solid #c8a96e;
      text-align: center;
      z-index: 200;
    `;
    menu.innerHTML = `
      <h1 style="color: #c8a96e; margin-bottom: 30px;">PAUSED</h1>
      <button id="resume-btn" style="
        background: #c8a96e;
        color: #000;
        border: none;
        padding: 15px 40px;
        font-size: 18px;
        border-radius: 8px;
        cursor: pointer;
        margin: 10px;
      ">Resume</button>
      <button id="quit-btn" style="
        background: #ff4444;
        color: #fff;
        border: none;
        padding: 15px 40px;
        font-size: 18px;
        border-radius: 8px;
        cursor: pointer;
        margin: 10px;
      ">Quit</button>
    `;
    this.container.appendChild(menu);

    document.getElementById('resume-btn')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('quit-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit?')) {
        window.location.reload();
      }
    });
  }

  private hidePauseMenu(): void {
    const menu = document.getElementById('pause-menu');
    if (menu) {
      menu.remove();
    }
  }

  public toggleQuestLog(): void {
    this.showQuestLog = !this.showQuestLog;
    // TODO: Implement quest log UI
  }

  public toggleInventory(): void {
    this.showInventory = !this.showInventory;
    // TODO: Implement inventory UI
  }

  public toggleMap(): void {
    this.showMap = !this.showMap;
    // TODO: Implement map UI
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public dispose(): void {
    this.hud.remove();
    this.questTracker.remove();
    this.hidePauseMenu();
  }
}
