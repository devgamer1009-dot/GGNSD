/**
 * Environment Manager - Orchestrates all environment systems
 * Provides unified API for time, weather, wind, and visual effects
 */

import * as THREE from 'three';
import { TimeSystem, DayPhase } from './TimeSystem.js';
import { WeatherSystem, WeatherState } from './WeatherSystem.js';
import { SkySystem, SkyQuality } from './SkySystem.js';
import { WaterSystem, WaterQuality } from './WaterSystem.js';
import { ShadowSystem, ShadowQuality } from './ShadowSystem.js';
import { ParticleSystem, ParticleQuality } from './ParticleSystem.js';

export interface EnvironmentQuality {
  sky: SkyQuality;
  water: WaterQuality;
  shadows: ShadowQuality;
  particles: ParticleQuality;
}

export interface EnvironmentAPI {
  // Time
  getSunDirection(): [number, number, number];
  getDayPhase(): DayPhase;
  getTimeString(): string;
  
  // Weather
  getWeatherState(): WeatherState;
  getWeatherAtPosition(x: number, z: number): WeatherState;
  
  // Wind
  getWind(x: number, z: number, t: number): { x: number; z: number; strength: number; direction: number };
  
  // Visual
  isWet(): boolean;
  getWetness(): number;
  getFogDensity(): number;
}

export class EnvironmentManager implements EnvironmentAPI {
  private timeSystem: TimeSystem;
  private weatherSystem: WeatherSystem;
  private skySystem: SkySystem;
  private waterSystem: WaterSystem;
  private shadowSystem: ShadowSystem;
  private particleSystem: ParticleSystem;
  
  private quality: EnvironmentQuality = {
    sky: SkyQuality.MEDIUM,
    water: WaterQuality.MEDIUM,
    shadows: ShadowQuality.MEDIUM,
    particles: ParticleQuality.MEDIUM
  };

  constructor(private scene: THREE.Scene) {
    this.timeSystem = new TimeSystem();
    this.weatherSystem = new WeatherSystem();
    this.skySystem = new SkySystem(scene);
    this.waterSystem = new WaterSystem(scene);
    this.shadowSystem = new ShadowSystem(scene);
    this.particleSystem = new ParticleSystem(scene);
  }

  /**
   * Update all environment systems
   */
  update(deltaTime: number, cameraPosition: THREE.Vector3): void {
    // Update time
    this.timeSystem.update(deltaTime);
    
    // Update weather
    this.weatherSystem.update(deltaTime);
    
    // Update sky
    this.skySystem.update(this.timeSystem, this.weatherSystem, deltaTime);
    
    // Update water
    this.waterSystem.update(this.timeSystem, this.weatherSystem, deltaTime);
    this.waterSystem.updateCameraPosition(cameraPosition);
    
    // Update shadows
    this.shadowSystem.update(this.timeSystem, cameraPosition);
    
    // Update particles
    this.particleSystem.update(this.weatherSystem, this.timeSystem, cameraPosition, deltaTime);
  }

  // === Time API ===
  
  getSunDirection(): [number, number, number] {
    return this.timeSystem.getSunDirection();
  }

  getDayPhase(): DayPhase {
    return this.timeSystem.getDayPhase();
  }

  getTimeString(): string {
    return this.timeSystem.getTimeString();
  }

  setTime(time: number): void {
    this.timeSystem.setTime(time);
  }

  getTime(): number {
    return this.timeSystem.getTime();
  }

  // === Weather API ===
  
  getWeatherState(): WeatherState {
    return this.weatherSystem.getWeatherState();
  }

  getWeatherAtPosition(x: number, z: number): WeatherState {
    return this.weatherSystem.getWeatherAtPosition(x, z);
  }

  setWeather(state: WeatherState, duration: number = 5): void {
    this.weatherSystem.setWeather(state, duration);
  }

  forceWeather(state: WeatherState): void {
    this.weatherSystem.forceWeather(state);
  }

  // === Wind API ===
  
  getWind(x: number, z: number, t: number): { x: number; z: number; strength: number; direction: number } {
    return this.weatherSystem.getWind(x, z, t);
  }

  setBaseWind(strength: number, direction: number): void {
    this.weatherSystem.setBaseWind(strength, direction);
  }

  // === Visual API ===
  
  isWet(): boolean {
    return this.weatherSystem.isWet();
  }

  getWetness(): number {
    return this.weatherSystem.getWetness();
  }

  getFogDensity(): number {
    return this.weatherSystem.getFogDensity();
  }

  getCloudCover(): number {
    return this.weatherSystem.getCloudCover();
  }

  // === Quality Settings ===
  
  setQuality(quality: EnvironmentQuality): void {
    this.quality = quality;
    this.skySystem.setQuality(quality.sky);
    this.waterSystem.setQuality(quality.water);
    this.shadowSystem.setQuality(quality.shadows);
    this.particleSystem.setQuality(quality.particles);
  }

  getQuality(): EnvironmentQuality {
    return this.quality;
  }

  // === Water Controls ===
  
  setWaterLevel(level: number): void {
    this.waterSystem.setWaterLevel(level);
  }

  setWaveParameters(amplitude: number, frequency: number, speed: number): void {
    this.waterSystem.setWaveParameters(amplitude, frequency, speed);
  }

  // === Shadow Controls ===
  
  setShadowsEnabled(enabled: boolean): void {
    this.shadowSystem.setShadowsEnabled(enabled);
  }

  // === Region-Specific Weather ===
  
  setIroncragSnow(enabled: boolean): void {
    this.weatherSystem.setIroncragSnow(enabled);
  }

  // === System Access ===
  
  getTimeSystem(): TimeSystem {
    return this.timeSystem;
  }

  getWeatherSystem(): WeatherSystem {
    return this.weatherSystem;
  }

  getSkySystem(): SkySystem {
    return this.skySystem;
  }

  getWaterSystem(): WaterSystem {
    return this.waterSystem;
  }

  getShadowSystem(): ShadowSystem {
    return this.shadowSystem;
  }

  getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  // === Cleanup ===
  
  dispose(): void {
    this.skySystem.dispose();
    this.waterSystem.dispose();
    this.shadowSystem.dispose();
    this.particleSystem.dispose();
  }
}
