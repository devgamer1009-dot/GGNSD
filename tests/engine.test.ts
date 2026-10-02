import { describe, it, expect } from 'vitest';
import { ENGINE_VERSION } from '../src/engine/index.ts';

describe('Engine layer', () => {
  it('exports a version string', () => {
    expect(typeof ENGINE_VERSION).toBe('string');
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
