/**
 * Weather System - Dynamic weather and time of day
 */

import * as THREE from 'three';

export class WeatherSystem {
  private scene: THREE.Scene;
  private timeOfDay: number = 0.5; // 0-1, 0.5 = noon
  private timeSpeed: number = 0.01; // How fast time passes
  private weatherState: 'clear' | 'cloudy' | 'rain' | 'storm' = 'clear';
  private weatherTimer: number = 0;
  private weatherDuration: number = 60; // seconds

  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create sun light
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
  }

  public update(delta: number): void {
    // Update time of day
    this.timeOfDay += this.timeSpeed * delta;
    if (this.timeOfDay > 1) this.timeOfDay = 0;

    // Update sun position and color based on time
    this.updateSun();

    // Update weather
    this.weatherTimer += delta;
    if (this.weatherTimer >= this.weatherDuration) {
      this.changeWeather();
      this.weatherTimer = 0;
      this.weatherDuration = 30 + Math.random() * 60; // 30-90 seconds
    }
  }

  private updateSun(): void {
    // Sun angle based on time of day
    const sunAngle = this.timeOfDay * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 100;
    const sunY = Math.max(10, sunHeight * 100);

    this.sunLight.position.set(sunX, sunY, 50);

    // Sun color based on time
    let sunColor: THREE.Color;
    let sunIntensity: number;
    let ambientIntensity: number;

    if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
      // Night
      sunColor = new THREE.Color(0x4444ff);
      sunIntensity = 0.2;
      ambientIntensity = 0.3;
      this.scene.background = new THREE.Color(0x111133);
    } else if (this.timeOfDay < 0.3 || this.timeOfDay > 0.7) {
      // Dawn/Dusk
      sunColor = new THREE.Color(0xff8844);
      sunIntensity = 0.6;
      ambientIntensity = 0.5;
      this.scene.background = new THREE.Color(0xff9966);
    } else {
      // Day
      sunColor = new THREE.Color(0xffffff);
      sunIntensity = 1.0;
      ambientIntensity = 0.6;
      this.scene.background = new THREE.Color(0x87ceeb);
    }

    this.sunLight.color = sunColor;
    this.sunLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;
  }

  private changeWeather(): void {
    const weathers: Array<'clear' | 'cloudy' | 'rain' | 'storm'> = ['clear', 'cloudy', 'rain', 'storm'];
    const currentIndex = weathers.indexOf(this.weatherState);

    // 70% chance to stay or change to adjacent weather
    if (Math.random() < 0.7) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const newIndex = Math.max(0, Math.min(weathers.length - 1, currentIndex + direction));
      const newWeather = weathers[newIndex];
      if (newWeather) {
        this.weatherState = newWeather;
      }
    } else {
      // 30% chance to change to random weather
      const randomIndex = Math.floor(Math.random() * weathers.length);
      const newWeather = weathers[randomIndex];
      if (newWeather) {
        this.weatherState = newWeather;
      }
    }

    // Update fog based on weather
    if (this.weatherState === 'clear') {
      this.scene.fog = new THREE.Fog(0x87ceeb, 100, 500);
    } else if (this.weatherState === 'cloudy') {
      this.scene.fog = new THREE.Fog(0xaaaaaa, 80, 400);
    } else if (this.weatherState === 'rain') {
      this.scene.fog = new THREE.Fog(0x888888, 60, 300);
    } else if (this.weatherState === 'storm') {
      this.scene.fog = new THREE.Fog(0x555555, 40, 200);
    }
  }

  public getTimeOfDay(): number {
    return this.timeOfDay;
  }

  public setTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  public getWeatherState(): string {
    return this.weatherState;
  }

  public setWeatherState(state: 'clear' | 'cloudy' | 'rain' | 'storm'): void {
    this.weatherState = state;
  }

  public getSunLight(): THREE.DirectionalLight {
    return this.sunLight;
  }

  public getAmbientLight(): THREE.AmbientLight {
    return this.ambientLight;
  }
}
