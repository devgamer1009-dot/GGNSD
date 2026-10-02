/**
 * Math utilities — zero-allocation design
 * Engine layer — never imports game
 * 
 * All operations use pooled vectors to avoid GC pressure.
 */

export class Vec2 {
  constructor(public x = 0, public y = 0) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vec2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vec2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vec2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }
}

export class Vec3 {
  constructor(public x = 0, public y = 0, public z = 0) {}

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: Vec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: Vec3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: Vec3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): this {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

export class Mat4 {
  // Column-major order (OpenGL style)
  m00 = 1; m01 = 0; m02 = 0; m03 = 0;
  m10 = 0; m11 = 1; m12 = 0; m13 = 0;
  m20 = 0; m21 = 0; m22 = 1; m23 = 0;
  m30 = 0; m31 = 0; m32 = 0; m33 = 1;

  identity(): this {
    this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
    this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
    this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
    this.m30 = 0; this.m31 = 0; this.m32 = 0; this.m33 = 1;
    return this;
  }

  multiply(m: Mat4): this {
    const a00 = this.m00, a01 = this.m01, a02 = this.m02, a03 = this.m03;
    const a10 = this.m10, a11 = this.m11, a12 = this.m12, a13 = this.m13;
    const a20 = this.m20, a21 = this.m21, a22 = this.m22, a23 = this.m23;
    const a30 = this.m30, a31 = this.m31, a32 = this.m32, a33 = this.m33;

    const b00 = m.m00, b01 = m.m01, b02 = m.m02, b03 = m.m03;
    const b10 = m.m10, b11 = m.m11, b12 = m.m12, b13 = m.m13;
    const b20 = m.m20, b21 = m.m21, b22 = m.m22, b23 = m.m23;
    const b30 = m.m30, b31 = m.m31, b32 = m.m32, b33 = m.m33;

    this.m00 = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    this.m01 = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    this.m02 = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    this.m03 = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;

    this.m10 = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    this.m11 = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    this.m12 = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    this.m13 = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;

    this.m20 = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    this.m21 = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    this.m22 = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    this.m23 = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;

    this.m30 = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    this.m31 = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    this.m32 = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    this.m33 = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  translate(x: number, y: number, z: number): this {
    this.m30 += this.m00 * x + this.m10 * y + this.m20 * z;
    this.m31 += this.m01 * x + this.m11 * y + this.m21 * z;
    this.m32 += this.m02 * x + this.m12 * y + this.m22 * z;
    this.m33 += this.m03 * x + this.m13 * y + this.m23 * z;
    return this;
  }

  scale(x: number, y: number, z: number): this {
    this.m00 *= x; this.m01 *= x; this.m02 *= x; this.m03 *= x;
    this.m10 *= y; this.m11 *= y; this.m12 *= y; this.m13 *= y;
    this.m20 *= z; this.m21 *= z; this.m22 *= z; this.m23 *= z;
    return this;
  }

  rotateY(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const m00 = this.m00, m01 = this.m01, m02 = this.m02, m03 = this.m03;
    const m20 = this.m20, m21 = this.m21, m22 = this.m22, m23 = this.m23;

    this.m00 = m00 * c + m20 * s;
    this.m01 = m01 * c + m21 * s;
    this.m02 = m02 * c + m22 * s;
    this.m03 = m03 * c + m23 * s;

    this.m20 = m20 * c - m00 * s;
    this.m21 = m21 * c - m01 * s;
    this.m22 = m22 * c - m02 * s;
    this.m23 = m23 * c - m03 * s;

    return this;
  }

  toArray(): Float32Array {
    return new Float32Array([
      this.m00, this.m01, this.m02, this.m03,
      this.m10, this.m11, this.m12, this.m13,
      this.m20, this.m21, this.m22, this.m23,
      this.m30, this.m31, this.m32, this.m33,
    ]);
  }
}

/**
 * Object pools for zero-allocation operations
 */
export class Pool<T> {
  private items: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 10) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.items.push(factory());
    }
  }

  acquire(): T {
    if (this.items.length > 0) {
      return this.items.pop()!;
    }
    return this.factory();
  }

  release(item: T): void {
    this.items.push(item);
  }

  get size(): number {
    return this.items.length;
  }
}

// Global pools
export const vec2Pool = new Pool(() => new Vec2(), 32);
export const vec3Pool = new Pool(() => new Vec3(), 32);
export const mat4Pool = new Pool(() => new Mat4(), 16);
