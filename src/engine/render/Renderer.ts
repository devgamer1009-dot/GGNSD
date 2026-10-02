/**
 * Main renderer wrapper for Three.js WebGPURenderer with WebGL2 fallback
 * Engine layer — never imports game
 * 
 * ADR-006: Three.js WebGPURenderer with automatic WebGL2 fallback
 * - Import from 'three/webgpu' for WebGPU + TSL support
 * - Automatic fallback to WebGL2 backend if WebGPU unavailable
 * - Detect backend via renderer.backend.isWebGPUBackend after init()
 * - Async initialization required before first render
 */

import * as THREE from 'three/webgpu';
import { detectCapabilities, type GPUCapabilities } from './CapabilityDetector.js';

export interface RendererOptions {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'low-power' | 'high-performance';
  forceWebGL?: boolean;
}

export interface RendererInfo {
  backend: 'WebGPU' | 'WebGL2';
  renderer: string;
  vendor: string;
  capabilities: GPUCapabilities;
}

export class Renderer {
  private threeRenderer: THREE.WebGPURenderer;
  private capabilities: GPUCapabilities | null = null;
  private initialized = false;
  private info: RendererInfo | null = null;

  constructor(options: RendererOptions = {}) {
    this.threeRenderer = new THREE.WebGPURenderer({
      canvas: options.canvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      powerPreference: options.powerPreference ?? 'high-performance',
      forceWebGL: options.forceWebGL ?? false,
    });
  }

  async init(): Promise<RendererInfo> {
    if (this.initialized) {
      return this.info!;
    }

    // Detect capabilities
    this.capabilities = await detectCapabilities();

    // Initialize Three.js renderer (handles WebGPU/WebGL2 fallback)
    await this.threeRenderer.init();

    // Determine which backend is actually running
    // Note: isWebGPUBackend exists at runtime but not in TypeScript types
    const backendObj = this.threeRenderer.backend as unknown as { isWebGPUBackend?: boolean };
    const isWebGPU = backendObj.isWebGPUBackend === true;
    const backend = isWebGPU ? 'WebGPU' : 'WebGL2';

    this.info = {
      backend,
      renderer: this.capabilities.renderer || 'Unknown',
      vendor: this.capabilities.vendor || 'Unknown',
      capabilities: this.capabilities,
    };

    this.initialized = true;
    console.log(`[Renderer] Initialized with ${backend} backend`);
    console.log(`[Renderer] GPU: ${this.info.renderer} (${this.info.vendor})`);

    return this.info;
  }

  get domElement(): HTMLCanvasElement {
    return this.threeRenderer.domElement;
  }

  get three(): THREE.WebGPURenderer {
    return this.threeRenderer;
  }

  getInfo(): RendererInfo | null {
    return this.info;
  }

  setSize(width: number, height: number): void {
    this.threeRenderer.setSize(width, height);
  }

  setPixelRatio(pixelRatio: number): void {
    this.threeRenderer.setPixelRatio(pixelRatio);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.initialized) {
      throw new Error('Renderer not initialized. Call init() first.');
    }
    this.threeRenderer.render(scene, camera);
  }

  setAnimationLoop(callback: ((time: number) => void) | null): void {
    this.threeRenderer.setAnimationLoop(callback);
  }

  dispose(): void {
    this.threeRenderer.dispose();
  }
}
