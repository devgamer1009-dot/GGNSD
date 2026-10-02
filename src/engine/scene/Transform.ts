/**
 * Transform hierarchy — parent-child relationships
 * Engine layer — never imports game
 */

import { Vec3, Mat4 } from '../math/MathUtils.js';

export class Transform {
  position = new Vec3();
  rotation = new Vec3(); // Euler angles (radians)
  scale = new Vec3(1, 1, 1);

  parent: Transform | null = null;
  children: Transform[] = [];

  private localMatrix = new Mat4();
  private worldMatrix = new Mat4();
  private dirty = true;

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    this.dirty = true;
    return this;
  }

  setRotation(x: number, y: number, z: number): this {
    this.rotation.set(x, y, z);
    this.dirty = true;
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    this.dirty = true;
    return this;
  }

  addChild(child: Transform): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    child.markDirty();
  }

  removeChild(child: Transform): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child.markDirty();
    }
  }

  private markDirty(): void {
    this.dirty = true;
    for (const child of this.children) {
      child.markDirty();
    }
  }

  getLocalMatrix(): Mat4 {
    if (this.dirty) {
      this.updateLocalMatrix();
    }
    return this.localMatrix;
  }

  getWorldMatrix(): Mat4 {
    if (this.dirty) {
      this.updateWorldMatrix();
    }
    return this.worldMatrix;
  }

  private updateLocalMatrix(): void {
    this.localMatrix.identity();
    this.localMatrix.translate(this.position.x, this.position.y, this.position.z);
    this.localMatrix.rotateY(this.rotation.y);
    this.localMatrix.scale(this.scale.x, this.scale.y, this.scale.z);
    this.dirty = false;
  }

  private updateWorldMatrix(): void {
    this.updateLocalMatrix();
    
    if (this.parent) {
      this.worldMatrix = new Mat4();
      // Copy parent's world matrix and multiply by local
      const parentWorld = this.parent.getWorldMatrix();
      // Simple multiplication (would need proper matrix multiply)
      this.worldMatrix = this.localMatrix;
    } else {
      this.worldMatrix = this.localMatrix;
    }
  }
}

export function createTransform(): Transform {
  return new Transform();
}
