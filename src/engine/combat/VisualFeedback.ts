/**
 * Visual Feedback System
 * Hit-stop, camera shake, and hit particles
 */

import * as THREE from 'three';

export class VisualFeedback {
  private scene: THREE.Scene;
  
  // Hit-stop
  private hitStopActive: boolean = false;
  private hitStopDuration: number = 0;
  private hitStopTimer: number = 0;
  private timeScale: number = 1.0;

  // Camera shake
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private cameraOffset: THREE.Vector3 = new THREE.Vector3();

  // Particles
  private particleSystem: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsMaterial | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticleSystem();
  }

  /**
   * Initialize particle system
   */
  private initParticleSystem(): void {
    const maxParticles = 100;
    
    this.particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const lifetimes = new Float32Array(maxParticles);
    
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xff4444,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  /**
   * Update visual feedback
   */
  update(deltaTime: number): { timeScale: number; cameraOffset: THREE.Vector3 } {
    // Update hit-stop
    if (this.hitStopActive) {
      this.hitStopTimer += deltaTime;
      if (this.hitStopTimer >= this.hitStopDuration) {
        this.hitStopActive = false;
        this.timeScale = 1.0;
      }
    }

    // Update camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const intensity = this.shakeIntensity * (this.shakeTimer / this.shakeDuration);
      this.cameraOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    } else {
      this.cameraOffset.set(0, 0, 0);
    }

    // Update particles
    this.updateParticles(deltaTime);

    return {
      timeScale: this.timeScale,
      cameraOffset: this.cameraOffset.clone(),
    };
  }

  /**
   * Update particle system
   */
  private updateParticles(deltaTime: number): void {
    if (!this.particleGeometry) return;

    const positionAttr = this.particleGeometry.attributes.position;
    const velocityAttr = this.particleGeometry.attributes.velocity;
    const lifetimeAttr = this.particleGeometry.attributes.lifetime;

    if (!positionAttr || !velocityAttr || !lifetimeAttr) return;

    const positions = positionAttr.array as Float32Array;
    const velocities = velocityAttr.array as Float32Array;
    const lifetimes = lifetimeAttr.array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      if (lifetimes[i]! > 0) {
        lifetimes[i]! -= deltaTime;
        
        // Update position
        positions[i * 3]! += velocities[i * 3]! * deltaTime;
        positions[i * 3 + 1]! += velocities[i * 3 + 1]! * deltaTime;
        positions[i * 3 + 2]! += velocities[i * 3 + 2]! * deltaTime;
        
        // Apply gravity
        velocities[i * 3 + 1]! -= 9.81 * deltaTime;
      }
    }

    positionAttr.needsUpdate = true;
    velocityAttr.needsUpdate = true;
    lifetimeAttr.needsUpdate = true;
  }

  /**
   * Trigger hit-stop
   */
  triggerHitStop(duration: number = 0.1, timeScale: number = 0.2): void {
    this.hitStopActive = true;
    this.hitStopDuration = duration;
    this.hitStopTimer = 0;
    this.timeScale = timeScale;
  }

  /**
   * Trigger camera shake
   */
  triggerCameraShake(intensity: number = 0.2, duration: number = 0.3): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /**
   * Spawn hit particles
   */
  spawnHitParticles(position: THREE.Vector3, count: number = 10): void {
    if (!this.particleGeometry) return;

    const positionAttr = this.particleGeometry.attributes.position;
    const velocityAttr = this.particleGeometry.attributes.velocity;
    const lifetimeAttr = this.particleGeometry.attributes.lifetime;

    if (!positionAttr || !velocityAttr || !lifetimeAttr) return;

    const positions = positionAttr.array as Float32Array;
    const velocities = velocityAttr.array as Float32Array;
    const lifetimes = lifetimeAttr.array as Float32Array;

    // Find dead particles to reuse
    let spawned = 0;
    for (let i = 0; i < lifetimes.length && spawned < count; i++) {
      if (lifetimes[i]! <= 0) {
        // Set position
        positions[i * 3]! = position.x;
        positions[i * 3 + 1]! = position.y;
        positions[i * 3 + 2]! = position.z;

        // Set random velocity
        velocities[i * 3]! = (Math.random() - 0.5) * 5;
        velocities[i * 3 + 1]! = Math.random() * 5;
        velocities[i * 3 + 2]! = (Math.random() - 0.5) * 5;

        // Set lifetime
        lifetimes[i]! = 1.0 + Math.random() * 0.5;

        spawned++;
      }
    }

    positionAttr.needsUpdate = true;
    velocityAttr.needsUpdate = true;
    lifetimeAttr.needsUpdate = true;
  }

  /**
   * Get current time scale
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Check if hit-stop is active
   */
  isHitStopActive(): boolean {
    return this.hitStopActive;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
    }
    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }
  }
}
