/**
 * Sky System - Atmospheric scattering, clouds, fog
 * Quality tiers for scalable performance
 */

import * as THREE from 'three';
import type { TimeSystem } from './TimeSystem.js';
import type { WeatherSystem } from './WeatherSystem.js';

export enum SkyQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export class SkySystem {
  private quality: SkyQuality = SkyQuality.MEDIUM;
  
  // Sky dome
  private skyDome: THREE.Mesh | null = null;
  private skyMaterial: THREE.ShaderMaterial | null = null;
  
  // Clouds
  private cloudLayer: THREE.Mesh | null = null;
  private cloudMaterial: THREE.ShaderMaterial | null = null;
  
  // Fog
  private fogColor: THREE.Color = new THREE.Color(0.4, 0.6, 0.9);
  private fogNear: number = 100;
  private fogFar: number = 2000;

  constructor(private scene: THREE.Scene) {
    this.createSkyDome();
    this.createCloudLayer();
  }

  /**
   * Create sky dome with atmospheric scattering
   */
  private createSkyDome(): void {
    const geometry = new THREE.SphereGeometry(5000, 32, 32);
    
    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3(0, 1, 0) },
        rayleighCoefficient: { value: 2.0 },
        mieCoefficient: { value: 0.005 },
        sunIntensity: { value: 1.0 },
        skyColor: { value: new THREE.Vector3(0.4, 0.6, 0.9) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform float rayleighCoefficient;
        uniform float mieCoefficient;
        uniform float sunIntensity;
        uniform vec3 skyColor;
        
        varying vec3 vWorldPosition;
        
        // Simplified Rayleigh scattering
        vec3 rayleigh(float cosTheta) {
          return vec3(0.3, 0.5, 1.0) * (1.0 + cosTheta * cosTheta);
        }
        
        // Simplified Mie scattering
        vec3 mie(float cosTheta) {
          float g = 0.76;
          float g2 = g * g;
          float miePhase = (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
          return vec3(1.0, 0.9, 0.8) * miePhase;
        }
        
        void main() {
          vec3 viewDir = normalize(vWorldPosition - cameraPosition);
          float cosTheta = dot(viewDir, sunDirection);
          
          // Atmospheric scattering
          vec3 rayleighColor = rayleigh(cosTheta) * rayleighCoefficient;
          vec3 mieColor = mie(cosTheta) * mieCoefficient * sunIntensity;
          
          // Combine with base sky color
          vec3 finalColor = skyColor * (rayleighColor + mieColor);
          
          // Sun glow
          float sunGlow = pow(max(0.0, cosTheta), 32.0) * sunIntensity;
          finalColor += vec3(1.0, 0.9, 0.7) * sunGlow * 0.5;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    this.skyDome = new THREE.Mesh(geometry, this.skyMaterial);
    this.scene.add(this.skyDome);
  }

  /**
   * Create cloud layer
   */
  private createCloudLayer(): void {
    const geometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    
    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        cloudCover: { value: 0.3 },
        windDirection: { value: new THREE.Vector2(1, 0) },
        opacity: { value: 0.6 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float cloudCover;
        uniform vec2 windDirection;
        uniform float opacity;
        
        varying vec2 vUv;
        
        // Simple noise function
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          vec2 uv = vUv * 10.0;
          uv += windDirection * time * 0.02;
          
          float clouds = fbm(uv);
          clouds = smoothstep(1.0 - cloudCover, 1.0, clouds);
          
          vec3 cloudColor = vec3(1.0, 1.0, 1.0);
          gl_FragColor = vec4(cloudColor, clouds * opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    this.cloudLayer = new THREE.Mesh(geometry, this.cloudMaterial);
    this.cloudLayer.rotation.x = -Math.PI / 2;
    this.cloudLayer.position.y = 500;
    this.scene.add(this.cloudLayer);
  }

  /**
   * Update sky based on time and weather
   */
  update(timeSystem: TimeSystem, weatherSystem: WeatherSystem, deltaTime: number): void {
    if (!this.skyMaterial || !this.cloudMaterial) return;
    
    const skyUniforms = this.skyMaterial.uniforms as any;
    const cloudUniforms = this.cloudMaterial.uniforms as any;
    
    if (!skyUniforms || !cloudUniforms) return;
    
    // Update sun direction
    const sunDir = timeSystem.getSunDirection();
    skyUniforms.sunDirection.value.set(sunDir[0], sunDir[1], sunDir[2]);
    
    // Update sun intensity
    skyUniforms.sunIntensity.value = timeSystem.getSunIntensity();
    
    // Update sky color
    const skyColor = timeSystem.getSkyColor();
    skyUniforms.skyColor.value.set(skyColor[0], skyColor[1], skyColor[2]);
    
    // Update clouds
    cloudUniforms.time.value += deltaTime;
    cloudUniforms.cloudCover.value = weatherSystem.getCloudCover();
    
    const wind = weatherSystem.getWind(0, 0, timeSystem.getTime());
    cloudUniforms.windDirection.value.set(wind.x, wind.z);
    
    // Update fog
    this.updateFog(timeSystem, weatherSystem);
  }

  /**
   * Update fog based on weather
   */
  private updateFog(timeSystem: TimeSystem, weatherSystem: WeatherSystem): void {
    const fogDensity = weatherSystem.getFogDensity();
    const skyColor = timeSystem.getSkyColor();
    
    // Fog color matches sky color but desaturated
    this.fogColor.setRGB(
      skyColor[0] * 0.7 + 0.3,
      skyColor[1] * 0.7 + 0.3,
      skyColor[2] * 0.7 + 0.3
    );
    
    // Fog distance based on density
    this.fogNear = 100;
    this.fogFar = 2000 - fogDensity * 1500;
    
    // Apply to scene
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.near = this.fogNear;
      this.scene.fog.far = this.fogFar;
    } else {
      this.scene.fog = new THREE.Fog(this.fogColor, this.fogNear, this.fogFar);
    }
  }

  /**
   * Set sky quality tier
   */
  setQuality(quality: SkyQuality): void {
    this.quality = quality;
    
    // Adjust sky dome resolution
    if (this.skyDome && this.skyDome.geometry) {
      const segments = quality === SkyQuality.LOW ? 16 : quality === SkyQuality.MEDIUM ? 32 : 64;
      const newGeometry = new THREE.SphereGeometry(5000, segments, segments);
      this.skyDome.geometry.dispose();
      this.skyDome.geometry = newGeometry;
    }
    
    // Adjust cloud detail
    if (this.cloudMaterial && this.cloudMaterial.uniforms) {
      const cloudOpacity = quality === SkyQuality.LOW ? 0.4 : quality === SkyQuality.MEDIUM ? 0.6 : 0.8;
      (this.cloudMaterial.uniforms as any).opacity.value = cloudOpacity;
    }
  }

  /**
   * Get current quality
   */
  getQuality(): SkyQuality {
    return this.quality;
  }

  /**
   * Get fog parameters
   */
  getFogParams(): { color: THREE.Color; near: number; far: number } {
    return {
      color: this.fogColor.clone(),
      near: this.fogNear,
      far: this.fogFar
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.skyDome) {
      this.skyDome.geometry.dispose();
      if (this.skyMaterial) this.skyMaterial.dispose();
      this.scene.remove(this.skyDome);
    }
    
    if (this.cloudLayer) {
      this.cloudLayer.geometry.dispose();
      if (this.cloudMaterial) this.cloudMaterial.dispose();
      this.scene.remove(this.cloudLayer);
    }
  }
}
