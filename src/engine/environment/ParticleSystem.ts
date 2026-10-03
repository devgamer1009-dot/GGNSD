/**
 * Particle System - Rain and snow particles
 * Handles precipitation effects with wind influence
 */

import * as THREE from 'three';
import { type WeatherSystem, WeatherState } from './WeatherSystem.js';
import type { TimeSystem } from './TimeSystem.js';

export enum ParticleQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export class ParticleSystem {
  private quality: ParticleQuality = ParticleQuality.MEDIUM;
  
  private rainParticles: THREE.Points | null = null;
  private snowParticles: THREE.Points | null = null;
  
  private rainGeometry: THREE.BufferGeometry | null = null;
  private snowGeometry: THREE.BufferGeometry | null = null;
  
  private rainMaterial: THREE.PointsMaterial | null = null;
  private snowMaterial: THREE.PointsMaterial | null = null;
  
  // Particle counts based on quality
  private rainCount: number = 5000;
  private snowCount: number = 3000;
  
  // Particle bounds
  private particleRadius: number = 50;
  private particleHeight: number = 30;
  
  // Velocity arrays
  private rainVelocities: Float32Array | null = null;
  private snowVelocities: Float32Array | null = null;

  constructor(private scene: THREE.Scene) {
    this.setupParticleCounts();
    this.createRainSystem();
    this.createSnowSystem();
  }

  /**
   * Setup particle counts based on quality
   */
  private setupParticleCounts(): void {
    switch (this.quality) {
      case ParticleQuality.LOW:
        this.rainCount = 2000;
        this.snowCount = 1000;
        break;
      case ParticleQuality.MEDIUM:
        this.rainCount = 5000;
        this.snowCount = 3000;
        break;
      case ParticleQuality.HIGH:
        this.rainCount = 10000;
        this.snowCount = 6000;
        break;
    }
  }

  /**
   * Create rain particle system
   */
  private createRainSystem(): void {
    this.rainGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount * 3);
    
    // Initialize rain particles
    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * this.particleRadius * 2;
      positions[i3 + 1] = Math.random() * this.particleHeight;
      positions[i3 + 2] = (Math.random() - 0.5) * this.particleRadius * 2;
      
      // Rain falls straight down with slight variation
      this.rainVelocities[i3] = (Math.random() - 0.5) * 0.5;
      this.rainVelocities[i3 + 1] = -15 - Math.random() * 5; // Fall speed
      this.rainVelocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.rainParticles = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  /**
   * Create snow particle system
   */
  private createSnowSystem(): void {
    this.snowGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount * 3);
    
    // Initialize snow particles
    for (let i = 0; i < this.snowCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * this.particleRadius * 2;
      positions[i3 + 1] = Math.random() * this.particleHeight;
      positions[i3 + 2] = (Math.random() - 0.5) * this.particleRadius * 2;
      
      // Snow falls slowly with drift
      this.snowVelocities[i3] = (Math.random() - 0.5) * 1.0;
      this.snowVelocities[i3 + 1] = -2 - Math.random() * 1; // Slow fall
      this.snowVelocities[i3 + 2] = (Math.random() - 0.5) * 1.0;
    }
    
    this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    this.snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    this.snowParticles = new THREE.Points(this.snowGeometry, this.snowMaterial);
    this.snowParticles.visible = false;
    this.scene.add(this.snowParticles);
  }

  /**
   * Update particle systems based on weather
   */
  update(
    weatherSystem: WeatherSystem,
    timeSystem: TimeSystem,
    cameraPosition: THREE.Vector3,
    deltaTime: number
  ): void {
    const weatherState = weatherSystem.getWeatherState();
    const precipitation = weatherSystem.getPrecipitation();
    
    // Update rain
    if (weatherState === WeatherState.RAIN || weatherState === WeatherState.STORM) {
      this.updateRain(weatherSystem, cameraPosition, deltaTime, precipitation);
      if (this.rainParticles) this.rainParticles.visible = true;
    } else {
      if (this.rainParticles) this.rainParticles.visible = false;
    }
    
    // Update snow
    if (weatherState === WeatherState.SNOW) {
      this.updateSnow(weatherSystem, timeSystem, cameraPosition, deltaTime, precipitation);
      if (this.snowParticles) this.snowParticles.visible = true;
    } else {
      if (this.snowParticles) this.snowParticles.visible = false;
    }
  }

  /**
   * Update rain particles
   */
  private updateRain(
    weatherSystem: WeatherSystem,
    cameraPosition: THREE.Vector3,
    deltaTime: number,
    intensity: number
  ): void {
    if (!this.rainGeometry || !this.rainVelocities || !this.rainParticles) return;
    
    const positionAttr = this.rainGeometry.attributes.position;
    if (!positionAttr) return;
    
    const positions = positionAttr.array as Float32Array;
    const velocities = this.rainVelocities;
    const wind = weatherSystem.getWind(0, 0, 0);
    
    // Update particle positions
    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3;
      
      // Apply velocity and wind
      positions[i3]! += (velocities[i3]! + wind.x * 2) * deltaTime;
      positions[i3 + 1]! += velocities[i3 + 1]! * deltaTime * intensity;
      positions[i3 + 2]! += (velocities[i3 + 2]! + wind.z * 2) * deltaTime;
      
      // Reset particles that fall below ground
      if (positions[i3 + 1]! < 0) {
        positions[i3]! = cameraPosition.x + (Math.random() - 0.5) * this.particleRadius * 2;
        positions[i3 + 1]! = cameraPosition.y + this.particleHeight;
        positions[i3 + 2]! = cameraPosition.z + (Math.random() - 0.5) * this.particleRadius * 2;
      }
    }
    
    positionAttr.needsUpdate = true;
    
    // Center particles around camera
    this.rainParticles.position.set(cameraPosition.x, 0, cameraPosition.z);
  }

  /**
   * Update snow particles
   */
  private updateSnow(
    weatherSystem: WeatherSystem,
    timeSystem: TimeSystem,
    cameraPosition: THREE.Vector3,
    deltaTime: number,
    intensity: number
  ): void {
    if (!this.snowGeometry || !this.snowVelocities || !this.snowParticles) return;
    
    const positionAttr = this.snowGeometry.attributes.position;
    if (!positionAttr) return;
    
    const positions = positionAttr.array as Float32Array;
    const velocities = this.snowVelocities;
    const wind = weatherSystem.getWind(0, 0, timeSystem.getTime());
    const time = timeSystem.getTime();
    
    // Update particle positions
    for (let i = 0; i < this.snowCount; i++) {
      const i3 = i * 3;
      
      // Snow drifts with wind and has gentle swaying motion
      const sway = Math.sin(time * 0.5 + i * 0.1) * 0.5;
      
      positions[i3]! += (velocities[i3]! + wind.x * 3 + sway) * deltaTime;
      positions[i3 + 1]! += velocities[i3 + 1]! * deltaTime * intensity;
      positions[i3 + 2]! += (velocities[i3 + 2]! + wind.z * 3) * deltaTime;
      
      // Reset particles that fall below ground
      if (positions[i3 + 1]! < 0) {
        positions[i3]! = cameraPosition.x + (Math.random() - 0.5) * this.particleRadius * 2;
        positions[i3 + 1]! = cameraPosition.y + this.particleHeight;
        positions[i3 + 2]! = cameraPosition.z + (Math.random() - 0.5) * this.particleRadius * 2;
      }
    }
    
    positionAttr.needsUpdate = true;
    
    // Center particles around camera
    this.snowParticles.position.set(cameraPosition.x, 0, cameraPosition.z);
  }

  /**
   * Set particle quality tier
   */
  setQuality(quality: ParticleQuality): void {
    this.quality = quality;
    
    // Recreate particle systems with new counts
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      if (this.rainGeometry) this.rainGeometry.dispose();
      if (this.rainMaterial) this.rainMaterial.dispose();
    }
    
    if (this.snowParticles) {
      this.scene.remove(this.snowParticles);
      if (this.snowGeometry) this.snowGeometry.dispose();
      if (this.snowMaterial) this.snowMaterial.dispose();
    }
    
    this.setupParticleCounts();
    this.createRainSystem();
    this.createSnowSystem();
  }

  /**
   * Get current quality
   */
  getQuality(): ParticleQuality {
    return this.quality;
  }

  /**
   * Set particle bounds
   */
  setParticleBounds(radius: number, height: number): void {
    this.particleRadius = radius;
    this.particleHeight = height;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      if (this.rainGeometry) this.rainGeometry.dispose();
      if (this.rainMaterial) this.rainMaterial.dispose();
    }
    
    if (this.snowParticles) {
      this.scene.remove(this.snowParticles);
      if (this.snowGeometry) this.snowGeometry.dispose();
      if (this.snowMaterial) this.snowMaterial.dispose();
    }
  }
}
