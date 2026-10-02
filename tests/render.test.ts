import { describe, it, expect } from 'vitest';
import { isWebGPUSupported, isWebGL2Supported } from '../src/engine/render/CapabilityDetector.ts';

describe('CapabilityDetector', () => {
  it('exports detection functions', () => {
    expect(typeof isWebGPUSupported).toBe('function');
    expect(typeof isWebGL2Supported).toBe('function');
  });

  it('returns boolean values', () => {
    // In node environment, these will be false (no browser APIs)
    expect(typeof isWebGPUSupported()).toBe('boolean');
    expect(typeof isWebGL2Supported()).toBe('boolean');
  });
});
