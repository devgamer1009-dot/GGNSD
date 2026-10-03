/**
 * Wind Shader - Vertex shader for vegetation wind animation
 * P10 - GPU-based wind animation using environment wind API
 */

import * as THREE from 'three';
import type { WindSample } from '../environment/WeatherSystem.js';

/**
 * Create wind-animated material for vegetation
 */
export function createWindMaterial(baseColor: number = 0x2d5016): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: 1.0 },
      uWindDirection: { value: new THREE.Vector2(1, 0) },
      uColor: { value: new THREE.Color(baseColor) },
      uWindFrequency: { value: 2.0 },
      uWindAmplitude: { value: 0.1 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uWindDirection;
      uniform float uWindFrequency;
      uniform float uWindAmplitude;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vHeight = position.y;
        
        // Calculate wind displacement
        // Only affect upper parts of vegetation (based on height)
        float heightFactor = smoothstep(0.0, 2.0, position.y);
        
        // Wind wave pattern
        float wave = sin(uTime * uWindFrequency + position.x * 0.5 + position.z * 0.3);
        wave += sin(uTime * uWindFrequency * 0.7 + position.x * 0.3 + position.z * 0.5) * 0.5;
        
        // Apply wind displacement
        vec3 displaced = position;
        displaced.x += uWindDirection.x * wave * uWindAmplitude * uWindStrength * heightFactor;
        displaced.z += uWindDirection.y * wave * uWindAmplitude * uWindStrength * heightFactor;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;
      
      void main() {
        // Simple lighting
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        float diffuse = max(dot(vNormal, lightDir), 0.3);
        
        // Height-based color variation
        vec3 color = uColor * (0.8 + 0.2 * vHeight);
        
        gl_FragColor = vec4(color * diffuse, 1.0);
      }
    `,
  });
}

/**
 * Create grass material with wind animation
 */
export function createGrassMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: 1.0 },
      uWindDirection: { value: new THREE.Vector2(1, 0) },
      uColor: { value: new THREE.Color(0x4a7c2e) },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uWindDirection;
      
      varying vec3 vNormal;
      varying float vHeight;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vHeight = position.y;
        
        // Grass bends more than trees
        float heightFactor = smoothstep(0.0, 0.5, position.y);
        
        // Faster, more chaotic wind for grass
        float wave = sin(uTime * 3.0 + position.x * 2.0 + position.z * 1.5);
        wave += sin(uTime * 2.3 + position.x * 1.7 + position.z * 2.1) * 0.5;
        
        vec3 displaced = position;
        displaced.x += uWindDirection.x * wave * 0.15 * uWindStrength * heightFactor;
        displaced.z += uWindDirection.y * wave * 0.15 * uWindStrength * heightFactor;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      
      varying vec3 vNormal;
      varying float vHeight;
      
      void main() {
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        float diffuse = max(dot(vNormal, lightDir), 0.4);
        
        // Grass gets lighter at tips
        vec3 color = mix(uColor * 0.7, uColor * 1.2, vHeight);
        
        gl_FragColor = vec4(color * diffuse, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

/**
 * Update wind uniforms from weather system
 */
export function updateWindUniforms(
  material: THREE.ShaderMaterial,
  wind: WindSample,
  time: number
): void {
  if (material.uniforms.uTime) material.uniforms.uTime.value = time;
  if (material.uniforms.uWindStrength) material.uniforms.uWindStrength.value = wind.strength;
  if (material.uniforms.uWindDirection) {
    (material.uniforms.uWindDirection.value as THREE.Vector2).set(wind.x, wind.z);
  }
}

/**
 * Create billboard material for distant trees
 */
export function createBillboardMaterial(texture: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uWindStrength: { value: 1.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // Billboard always faces camera
        vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        
        // Add slight wind sway to billboard
        float sway = sin(uTime * 2.0) * 0.05 * uWindStrength;
        mvPosition.x += sway;
        
        // Scale to screen size
        mvPosition.xy += position.xy * vec2(2.0, 2.0);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      
      varying vec2 vUv;
      
      void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        
        // Discard transparent pixels
        if (texColor.a < 0.5) discard;
        
        gl_FragColor = texColor;
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}
