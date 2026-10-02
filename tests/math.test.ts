import { describe, it, expect } from 'vitest';
import { Vec2, Vec3, Mat4, Pool, vec2Pool, vec3Pool } from '../src/engine/math/MathUtils.js';

describe('Vec2', () => {
  it('should initialize with default values', () => {
    const v = new Vec2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('should initialize with provided values', () => {
    const v = new Vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('should set values', () => {
    const v = new Vec2();
    v.set(5, 6);
    expect(v.x).toBe(5);
    expect(v.y).toBe(6);
  });

  it('should add vectors', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    a.add(b);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
  });

  it('should subtract vectors', () => {
    const a = new Vec2(5, 7);
    const b = new Vec2(2, 3);
    a.sub(b);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  it('should scale vector', () => {
    const v = new Vec2(2, 3);
    v.scale(2);
    expect(v.x).toBe(4);
    expect(v.y).toBe(6);
  });

  it('should calculate length', () => {
    const v = new Vec2(3, 4);
    expect(v.length()).toBe(5);
  });

  it('should normalize vector', () => {
    const v = new Vec2(3, 4);
    v.normalize();
    expect(v.length()).toBeCloseTo(1);
    expect(v.x).toBeCloseTo(0.6);
    expect(v.y).toBeCloseTo(0.8);
  });

  it('should calculate dot product', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    expect(a.dot(b)).toBe(11);
  });
});

describe('Vec3', () => {
  it('should initialize with default values', () => {
    const v = new Vec3();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
  });

  it('should initialize with provided values', () => {
    const v = new Vec3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  it('should set values', () => {
    const v = new Vec3();
    v.set(4, 5, 6);
    expect(v.x).toBe(4);
    expect(v.y).toBe(5);
    expect(v.z).toBe(6);
  });

  it('should add vectors', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);
    a.add(b);
    expect(a.x).toBe(5);
    expect(a.y).toBe(7);
    expect(a.z).toBe(9);
  });

  it('should subtract vectors', () => {
    const a = new Vec3(5, 7, 9);
    const b = new Vec3(1, 2, 3);
    a.sub(b);
    expect(a.x).toBe(4);
    expect(a.y).toBe(5);
    expect(a.z).toBe(6);
  });

  it('should scale vector', () => {
    const v = new Vec3(1, 2, 3);
    v.scale(2);
    expect(v.x).toBe(2);
    expect(v.y).toBe(4);
    expect(v.z).toBe(6);
  });

  it('should calculate length', () => {
    const v = new Vec3(1, 2, 2);
    expect(v.length()).toBe(3);
  });

  it('should normalize vector', () => {
    const v = new Vec3(1, 2, 2);
    v.normalize();
    expect(v.length()).toBeCloseTo(1);
  });

  it('should calculate dot product', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);
    expect(a.dot(b)).toBe(32);
  });

  it('should calculate cross product', () => {
    const a = new Vec3(1, 0, 0);
    const b = new Vec3(0, 1, 0);
    a.cross(b);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(a.z).toBe(1);
  });
});

describe('Mat4', () => {
  it('should initialize as identity matrix', () => {
    const m = new Mat4();
    expect(m.m00).toBe(1);
    expect(m.m11).toBe(1);
    expect(m.m22).toBe(1);
    expect(m.m33).toBe(1);
    expect(m.m01).toBe(0);
    expect(m.m10).toBe(0);
  });

  it('should reset to identity', () => {
    const m = new Mat4();
    m.translate(1, 2, 3);
    m.identity();
    expect(m.m00).toBe(1);
    expect(m.m30).toBe(0);
    expect(m.m31).toBe(0);
    expect(m.m32).toBe(0);
  });

  it('should translate matrix', () => {
    const m = new Mat4();
    m.translate(1, 2, 3);
    expect(m.m30).toBe(1);
    expect(m.m31).toBe(2);
    expect(m.m32).toBe(3);
  });

  it('should scale matrix', () => {
    const m = new Mat4();
    m.scale(2, 3, 4);
    expect(m.m00).toBe(2);
    expect(m.m11).toBe(3);
    expect(m.m22).toBe(4);
  });

  it('should rotate around Y axis', () => {
    const m = new Mat4();
    m.rotateY(Math.PI / 2);
    expect(m.m00).toBeCloseTo(0);
    expect(m.m20).toBeCloseTo(-1);
    expect(m.m02).toBeCloseTo(1);
    expect(m.m22).toBeCloseTo(0);
  });

  it('should multiply matrices', () => {
    const a = new Mat4();
    a.translate(1, 0, 0);
    
    const b = new Mat4();
    b.translate(0, 1, 0);
    
    a.multiply(b);
    expect(a.m30).toBe(1);
    expect(a.m31).toBe(1);
  });

  it('should convert to array', () => {
    const m = new Mat4();
    const arr = m.toArray();
    expect(arr).toBeInstanceOf(Float32Array);
    expect(arr.length).toBe(16);
    expect(arr[0]).toBe(1); // m00
    expect(arr[5]).toBe(1); // m11
    expect(arr[10]).toBe(1); // m22
    expect(arr[15]).toBe(1); // m33
  });
});

describe('Pool', () => {
  it('should create pool with initial size', () => {
    const pool = new Pool(() => new Vec2(), 5);
    expect(pool.size).toBe(5);
  });

  it('should acquire items from pool', () => {
    const pool = new Pool(() => new Vec2(), 5);
    const item = pool.acquire();
    expect(item).toBeInstanceOf(Vec2);
    expect(pool.size).toBe(4);
  });

  it('should create new items when pool is empty', () => {
    const pool = new Pool(() => new Vec2(), 0);
    const item = pool.acquire();
    expect(item).toBeInstanceOf(Vec2);
    expect(pool.size).toBe(0);
  });

  it('should release items back to pool', () => {
    const pool = new Pool(() => new Vec2(), 5);
    const item = pool.acquire();
    pool.release(item);
    expect(pool.size).toBe(5);
  });
});

describe('Global Pools', () => {
  it('should provide vec2Pool', () => {
    const v = vec2Pool.acquire();
    expect(v).toBeInstanceOf(Vec2);
    vec2Pool.release(v);
  });

  it('should provide vec3Pool', () => {
    const v = vec3Pool.acquire();
    expect(v).toBeInstanceOf(Vec3);
    vec3Pool.release(v);
  });
});
