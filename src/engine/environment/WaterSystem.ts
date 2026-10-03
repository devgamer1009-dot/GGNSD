/**
 * Water System - Gerstner waves, depth color, foam, sky reflection
 * Quality tiers for scalable performance
 */

import * as THREE from 'three';
import type { TimeSystem } from './TimeSystem.js';
import type { WeatherSystem } from './WeatherSystem.js';

export enum WaterQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export class WaterSystem {
  private quality: WaterQuality = WaterQuality.MEDIUM;
  
  private waterMesh: THREE.Mesh | null = null;
  private waterMaterial: THREE.ShaderMaterial | null = null;
  
  // Water parameters
  private waterLevel: number = 0;
  private waveAmplitude: number = 0.5;
  private waveFrequency: number = 0.1;
  private waveSpeed: number = 1.0;

  constructor(private scene: THREE.Scene) {
    this.createWater();
  }

  /**
   * Create water mesh with Gerstner waves
   */
  private createWater(): void {
    const segments = this.quality === WaterQuality.LOW ? 32 : 
                     this.quality === WaterQuality.MEDIUM ? 64 : 128;
    
    const geometry = new THREE.PlaneGeometry(10000, 10000, segments, segments);
    
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunDirection: { value: new THREE.Vector3(0, 1, 0) },
        cameraPosition: { value: new THREE.Vector3() },
        waveAmplitude: { value: this.waveAmplitude },
        waveFrequency: { value: this.waveFrequency },
        waveSpeed: { value: this.waveSpeed },
        waterColor: { value: new THREE.Vector3(0.1, 0.3, 0.5) },
        foamColor: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
        skyColor: { value: new THREE.Vector3(0.4, 0.6, 0.9) }
      },
      vertexShader: `
        uniform float time;
        uniform float waveAmplitude;
        uniform float waveFrequency;
        uniform float waveSpeed;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;
        
        // Gerstner wave function
        vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float speed, vec2 direction, float steepness) {
          float phase = dot(direction, pos) * frequency + time * speed;
          float sinPhase = sin(phase);
          float cosPhase = cos(phase);
          
          vec3 offset;
          offset.x = steepness * amplitude * direction.x * cosPhase;
          offset.y = amplitude * sinPhase;
          offset.z = steepness * amplitude * direction.y * cosPhase;
          
          return offset;
        }
        
        void main() {
          vec3 pos = position;
          
          // Multiple wave layers
          vec3 wave1 = gerstnerWave(pos.xz, waveAmplitude, waveFrequency, waveSpeed, vec2(1.0, 0.0), 0.5);
          vec3 wave2 = gerstnerWave(pos.xz, waveAmplitude * 0.5, waveFrequency * 2.0, waveSpeed * 1.5, vec2(0.7, 0.7), 0.3);
          vec3 wave3 = gerstnerWave(pos.xz, waveAmplitude * 0.3, waveFrequency * 3.0, waveSpeed * 2.0, vec2(-0.5, 0.8), 0.2);
          
          pos += wave1 + wave2 + wave3;
          
          // Calculate normal (simplified)
          vNormal = normalize(vec3(
            -(wave1.x + wave2.x + wave3.x),
            1.0,
            -(wave1.z + wave2.z + wave3.z)
          ));
          
          // Foam based on wave height
          vFoam = smoothstep(0.3, 0.5, (wave1.y + wave2.y + wave3.y) / waveAmplitude);
          
          vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform vec3 cameraPosition;
        uniform vec3 waterColor;
        uniform vec3 foamColor;
        uniform vec3 skyColor;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vFoam;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 normal = normalize(vNormal);
          
          // Fresnel effect for sky reflection
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.0);
          vec3 reflectionColor = mix(waterColor, skyColor, fresnel);
          
          // Specular highlight
          vec3 halfDir = normalize(sunDirection + viewDir);
          float specular = pow(max(0.0, dot(normal, halfDir)), 64.0);
          
          // Depth color (darker in deep water)
          float depth = smoothstep(0.0, 10.0, vWorldPosition.y);
          vec3 deepColor = waterColor * 0.5;
          vec3 shallowColor = waterColor;
          vec3 finalWaterColor = mix(deepColor, shallowColor, depth);
          
          // Combine
          vec3 finalColor = mix(finalWaterColor, reflectionColor, fresnel * 0.5);
          finalColor += vec3(1.0, 0.9, 0.8) * specular * 0.5;
          
          // Foam
          finalColor = mix(finalColor, foamColor, vFoam * 0.3);
          
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = this.waterLevel;
    this.scene.add(this.waterMesh);
  }

  /**
   * Update water based on time and weather
   */
  update(timeSystem: TimeSystem, weatherSystem: WeatherSystem, deltaTime: number): void {
    if (!this.waterMaterial) return;
    
    const uniforms = this.waterMaterial.uniforms as any;
    if (!uniforms) return;
    
    // Update time
    uniforms.time.value += deltaTime;
    
    // Update sun direction
    const sunDir = timeSystem.getSunDirection();
    uniforms.sunDirection.value.set(sunDir[0], sunDir[1], sunDir[2]);
    
    // Update camera position
    // This should be set from the main render loop
    // uniforms.cameraPosition.value.copy(camera.position);
    
    // Update sky color
    const skyColor = timeSystem.getSkyColor();
    uniforms.skyColor.value.set(skyColor[0], skyColor[1], skyColor[2]);
    
    // Weather affects waves
    const wind = weatherSystem.getWind(0, 0, timeSystem.getTime());
    uniforms.waveAmplitude.value = this.waveAmplitude * (1.0 + wind.strength * 0.2);
    uniforms.waveSpeed.value = this.waveSpeed * (1.0 + wind.strength * 0.1);
  }

  /**
   * Set water quality tier
   */
  setQuality(quality: WaterQuality): void {
    this.quality = quality;
    
    // Recreate water mesh with new resolution
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      if (this.waterMaterial) this.waterMaterial.dispose();
    }
    
    this.createWater();
  }

  /**
   * Get current quality
   */
  getQuality(): WaterQuality {
    return this.quality;
  }

  /**
   * Set water level
   */
  setWaterLevel(level: number): void {
    this.waterLevel = level;
    if (this.waterMesh) {
      this.waterMesh.position.y = level;
    }
  }

  /**
   * Set wave parameters
   */
  setWaveParameters(amplitude: number, frequency: number, speed: number): void {
    this.waveAmplitude = amplitude;
    this.waveFrequency = frequency;
    this.waveSpeed = speed;
    
    if (this.waterMaterial) {
      const uniforms = this.waterMaterial.uniforms as any;
      if (uniforms) {
        uniforms.waveAmplitude.value = amplitude;
        uniforms.waveFrequency.value = frequency;
        uniforms.waveSpeed.value = speed;
      }
    }
  }

  /**
   * Update camera position uniform
   */
  updateCameraPosition(cameraPosition: THREE.Vector3): void {
    if (this.waterMaterial) {
      const uniforms = this.waterMaterial.uniforms as any;
      if (uniforms) {
        uniforms.cameraPosition.value.copy(cameraPosition);
      }
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      if (this.waterMaterial) this.waterMaterial.dispose();
      this.scene.remove(this.waterMesh);
    }
  }
}
