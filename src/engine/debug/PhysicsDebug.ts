/**
 * Physics Debug Visualization
 * P9 - Render physics colliders and character state
 */

import * as THREE from 'three';
import type { PhysicsWorld, PhysicsCharacter } from '../physics/PhysicsWorld.js';
import type { CharacterStateMachine } from '../physics/CharacterStateMachine.js';

export class PhysicsDebug {
  private scene: THREE.Scene;
  private physicsWorld: PhysicsWorld;
  private stateMachine: CharacterStateMachine | null = null;
  
  private debugLines: THREE.LineSegments | null = null;
  private stateText: HTMLDivElement | null = null;
  private visible: boolean = false;

  constructor(scene: THREE.Scene, physicsWorld: PhysicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.createUI();
  }

  /**
   * Create debug UI overlay
   */
  private createUI(): void {
    this.stateText = document.createElement('div');
    this.stateText.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      display: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.stateText);
  }

  /**
   * Set state machine for state display
   */
  setStateMachine(stateMachine: CharacterStateMachine): void {
    this.stateMachine = stateMachine;
  }

  /**
   * Toggle debug visibility
   */
  toggle(): void {
    this.visible = !this.visible;
    
    if (this.stateText) {
      this.stateText.style.display = this.visible ? 'block' : 'none';
    }

    if (!this.visible && this.debugLines) {
      this.scene.remove(this.debugLines);
      this.debugLines.geometry.dispose();
      (this.debugLines.material as THREE.Material).dispose();
      this.debugLines = null;
    }
  }

  /**
   * Update debug visualization
   */
  update(): void {
    if (!this.visible) return;

    // Update state text
    if (this.stateText && this.stateMachine) {
      const stateData = this.stateMachine.getStateData();
      const characters = this.physicsWorld.getAllCharacters();
      
      let text = `<strong>Character State:</strong><br>`;
      text += `State: ${stateData.state}<br>`;
      text += `Previous: ${stateData.previousState || 'none'}<br>`;
      text += `Time: ${stateData.stateTime.toFixed(2)}s<br>`;
      text += `<br><strong>Physics:</strong><br>`;
      
      for (const [id, character] of characters.entries()) {
        text += `ID: ${id}<br>`;
        text += `Pos: (${character.position.x.toFixed(2)}, ${character.position.y.toFixed(2)}, ${character.position.z.toFixed(2)})<br>`;
        text += `Vel: (${character.velocity.x.toFixed(2)}, ${character.velocity.y.toFixed(2)}, ${character.velocity.z.toFixed(2)})<br>`;
        text += `Grounded: ${character.isGrounded}<br>`;
        text += `Slope: ${character.slopeAngle.toFixed(1)}°<br>`;
      }
      
      this.stateText.innerHTML = text;
    }

    // Update collider visualization
    this.updateColliderVisualization();
  }

  /**
   * Update collider line rendering
   */
  private updateColliderVisualization(): void {
    try {
      const { vertices, colors } = this.physicsWorld.getDebugData();

      if (vertices.length === 0) {
        if (this.debugLines) {
          this.scene.remove(this.debugLines);
          this.debugLines.geometry.dispose();
          (this.debugLines.material as THREE.Material).dispose();
          this.debugLines = null;
        }
        return;
      }

      // Convert to Three.js format
      const geometry = new THREE.BufferGeometry();
      
      // Vertices (every 4 values = x,y,z,w, we use x,y,z)
      const positions = new Float32Array((vertices.length / 4) * 3);
      for (let i = 0; i < vertices.length / 4; i++) {
        positions[i * 3] = vertices[i * 4] ?? 0;
        positions[i * 3 + 1] = vertices[i * 4 + 1] ?? 0;
        positions[i * 3 + 2] = vertices[i * 4 + 2] ?? 0;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Colors (every 8 values = r,g,b,a for 2 vertices)
      const colorArray = new Float32Array((vertices.length / 4) * 2 * 3);
      for (let i = 0; i < vertices.length / 4; i++) {
        const r = colors[i * 8] ?? 1;
        const g = colors[i * 8 + 1] ?? 1;
        const b = colors[i * 8 + 2] ?? 1;
        
        colorArray[i * 6] = r;
        colorArray[i * 6 + 1] = g;
        colorArray[i * 6 + 2] = b;
        colorArray[i * 6 + 3] = r;
        colorArray[i * 6 + 4] = g;
        colorArray[i * 6 + 5] = b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 2,
      });

      const lines = new THREE.LineSegments(geometry, material);

      // Replace old debug lines
      if (this.debugLines) {
        this.scene.remove(this.debugLines);
        this.debugLines.geometry.dispose();
        (this.debugLines.material as THREE.Material).dispose();
      }

      this.debugLines = lines;
      this.scene.add(lines);
    } catch (error) {
      // Debug render might fail if no colliders exist yet
      console.warn('[PhysicsDebug] Failed to render debug data:', error);
    }
  }

  /**
   * Check if debug is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.debugLines) {
      this.scene.remove(this.debugLines);
      this.debugLines.geometry.dispose();
      (this.debugLines.material as THREE.Material).dispose();
    }
    if (this.stateText) {
      this.stateText.remove();
    }
  }
}
