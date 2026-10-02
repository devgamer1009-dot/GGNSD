/**
 * Capability detection for WebGPU/WebGL2
 * Engine layer — never imports game
 */

export interface GPUCapabilities {
  webgpu: boolean;
  webgl2: boolean;
  adapter?: GPUAdapter;
  device?: GPUDevice;
  renderer?: string;
  vendor?: string;
}

export async function detectCapabilities(): Promise<GPUCapabilities> {
  const caps: GPUCapabilities = {
    webgpu: false,
    webgl2: false,
  };

  // Check WebGPU
  if ('gpu' in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        caps.webgpu = true;
        caps.adapter = adapter;
        const info = adapter.info;
        caps.renderer = info?.device || 'Unknown GPU';
        caps.vendor = info?.vendor || 'Unknown Vendor';
        
        try {
          caps.device = await adapter.requestDevice();
        } catch (e) {
          console.warn('Failed to create GPU device:', e);
        }
      }
    } catch (e) {
      console.warn('WebGPU detection failed:', e);
    }
  }

  // Check WebGL2
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (gl) {
    caps.webgl2 = true;
    if (!caps.webgpu) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        caps.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        caps.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    }
  }

  return caps;
}

export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}

export function isWebGL2Supported(): boolean {
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2');
}
