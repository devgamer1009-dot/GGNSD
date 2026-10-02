/**
 * Debug overlay (F3 toggle) showing performance stats
 * Engine layer — never imports game
 */

import type { Renderer } from './Renderer.js';
import * as THREE from 'three/webgpu';

export class DebugOverlay {
  private container: HTMLDivElement;
  private visible = false;
  private renderer: Renderer;
  private frameTimes: number[] = [];
  private lastTime = 0;
  private fps = 0;
  private frameMs = 0;
  private avgFrameMs = 0;
  private low1Percent = 0;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 9999;
      display: none;
      min-width: 250px;
    `;
    document.body.appendChild(this.container);

    // F3 toggle
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  update(time: number): void {
    if (!this.visible) return;

    // Calculate frame time
    if (this.lastTime > 0) {
      const delta = time - this.lastTime;
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 300) {
        this.frameTimes.shift();
      }
    }
    this.lastTime = time;

    // Calculate stats every 500ms
    if (this.frameTimes.length > 0 && time % 500 < 20) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.fps = Math.round(1000 / avg);
      this.avgFrameMs = avg;
      this.frameMs = this.frameTimes[this.frameTimes.length - 1] || 0;

      // 1% low
      const sorted = [...this.frameTimes].sort((a, b) => b - a);
      const count1Percent = Math.max(1, Math.floor(sorted.length * 0.01));
      this.low1Percent = sorted.slice(0, count1Percent).reduce((a, b) => a + b, 0) / count1Percent;

      this.render();
    }
  }

  private render(): void {
    const info = this.renderer.getInfo();
    const threeInfo = this.renderer.three.info;

    const html = `
      <div><strong>CrownFall Debug (F3)</strong></div>
      <div>FPS: ${this.fps}</div>
      <div>Frame: ${this.frameMs.toFixed(2)}ms (avg: ${this.avgFrameMs.toFixed(2)}ms)</div>
      <div>1% Low: ${this.low1Percent.toFixed(2)}ms</div>
      <div>Draw Calls: ${threeInfo.render.calls}</div>
      <div>Triangles: ${threeInfo.render.triangles}</div>
      <div>Points: ${threeInfo.render.points}</div>
      <div>Lines: ${threeInfo.render.lines}</div>
      <div>Geometries: ${threeInfo.memory.geometries}</div>
      <div>Textures: ${threeInfo.memory.textures}</div>
      <div>Programs: ${(threeInfo as unknown as { programs?: unknown[] }).programs?.length || 0}</div>
      <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
        <div>Backend: ${info?.backend || 'N/A'}</div>
        <div>GPU: ${info?.renderer || 'N/A'}</div>
        <div>Vendor: ${info?.vendor || 'N/A'}</div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  dispose(): void {
    this.container.remove();
  }
}
