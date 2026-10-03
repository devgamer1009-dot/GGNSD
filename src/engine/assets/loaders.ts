/**
 * Asset Loaders
 * P8 - GLTF + Meshopt + KTX2 loaders with API verification
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/**
 * Loader manager for all asset types
 */
export class AssetLoaders {
  private gltfLoader: GLTFLoader;
  private ktx2Loader: KTX2Loader | null = null;
  private textureLoader: THREE.TextureLoader;
  private initialized = false;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Initialize loaders with renderer for KTX2 support
   */
  async init(renderer?: THREE.WebGLRenderer): Promise<void> {
    if (this.initialized) return;

    // Enable Meshopt decoder for compressed glTF
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    // Initialize KTX2 loader if renderer provided
    if (renderer) {
      try {
        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/libs/basis/');
        
        // Type assertion for renderer compatibility
        const anyRenderer = renderer as any;
        if (anyRenderer.getContext) {
          this.ktx2Loader.detectSupport(anyRenderer);
        }
      } catch (error) {
        console.warn('[AssetLoaders] KTX2 initialization failed:', error);
        this.ktx2Loader = null;
      }
    }

    this.initialized = true;
    console.log('[AssetLoaders] Initialized');
  }

  /**
   * Load glTF/GLB model
   */
  async loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load glTF: ${url} - ${error}`));
        }
      );
    });
  }

  /**
   * Load texture
   */
  async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load texture: ${url} - ${error}`));
        }
      );
    });
  }

  /**
   * Load KTX2 texture (if supported)
   */
  async loadKTX2(url: string): Promise<THREE.CompressedTexture | null> {
    if (!this.ktx2Loader) {
      console.warn('[AssetLoaders] KTX2 not supported, falling back to regular texture');
      return null;
    }

    return new Promise((resolve, reject) => {
      this.ktx2Loader!.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load KTX2: ${url} - ${error}`));
        }
      );
    });
  }

  /**
   * Check if KTX2 is supported
   */
  isKTX2Supported(): boolean {
    return this.ktx2Loader !== null;
  }

  /**
   * Dispose all loaders
   */
  dispose(): void {
    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
    }
  }
}
