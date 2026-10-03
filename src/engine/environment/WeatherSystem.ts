/**
 * Weather System - Weather states, transitions, and wind field
 * Works with streamed cells, never assumes full world is loaded
 */

export enum WeatherState {
  CLEAR = 'clear',
  OVERCAST = 'overcast',
  RAIN = 'rain',
  STORM = 'storm',
  FOG = 'fog',
  SNOW = 'snow'
}

export interface WindSample {
  x: number;
  z: number;
  strength: number;
  direction: number; // radians
}

export interface WeatherTransition {
  from: WeatherState;
  to: WeatherState;
  progress: number; // 0-1
  duration: number; // seconds
}

export class WeatherSystem {
  private currentState: WeatherState = WeatherState.CLEAR;
  private targetState: WeatherState = WeatherState.CLEAR;
  private transition: WeatherTransition | null = null;
  
  // Wind field parameters
  private baseWindStrength: number = 2.0;
  private baseWindDirection: number = 0; // radians
  private windGustTime: number = 0;
  private windGustStrength: number = 0;
  
  // Weather parameters
  private cloudCover: number = 0; // 0-1
  private precipitation: number = 0; // 0-1
  private fogDensity: number = 0; // 0-1
  
  // Region-specific overrides
  private ironcragSnowEnabled: boolean = true;

  update(deltaTime: number): void {
    // Update wind gusts
    this.windGustTime += deltaTime;
    this.windGustStrength = Math.sin(this.windGustTime * 0.5) * 0.5 + 0.5;
    
    // Update weather transition
    if (this.transition) {
      this.transition.progress += deltaTime / this.transition.duration;
      
      if (this.transition.progress >= 1) {
        this.currentState = this.transition.to;
        this.transition = null;
      }
      
      // Interpolate weather parameters
      this.updateWeatherParameters();
    }
  }

  /**
   * Transition to new weather state
   */
  setWeather(state: WeatherState, duration: number = 5): void {
    if (state === this.currentState && !this.transition) {
      return;
    }

    this.targetState = state;
    this.transition = {
      from: this.currentState,
      to: state,
      progress: 0,
      duration
    };
  }

  /**
   * Get current weather state (or transitioning state)
   */
  getWeatherState(): WeatherState {
    if (this.transition && this.transition.progress > 0.5) {
      return this.transition.to;
    }
    return this.currentState;
  }

  /**
   * Get weather state at specific world position
   * Allows region-specific weather (e.g., snow in Ironcrag)
   */
  getWeatherAtPosition(x: number, z: number): WeatherState {
    const baseState = this.getWeatherState();
    
    // Ironcrag region (northeast) gets snow instead of rain
    if (this.ironcragSnowEnabled && this.isInIroncrag(x, z)) {
      if (baseState === WeatherState.RAIN || baseState === WeatherState.STORM) {
        return WeatherState.SNOW;
      }
    }
    
    return baseState;
  }

  /**
   * Check if position is in Ironcrag region
   */
  private isInIroncrag(x: number, z: number): boolean {
    // Ironcrag is at region ID 2, centered around (1200, -1000)
    const dx = x - 1200;
    const dz = z - (-1000);
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < 700; // Ironcrag radius
  }

  /**
   * Get wind at world position and time
   * Works with streamed cells - uses local coordinates
   */
  getWind(x: number, z: number, time: number): WindSample {
    // Base wind
    let strength = this.baseWindStrength;
    let direction = this.baseWindDirection;
    
    // Add gusts
    strength += this.windGustStrength * 1.5;
    
    // Weather affects wind
    const state = this.getWeatherState();
    if (state === WeatherState.STORM) {
      strength *= 2.0;
    } else if (state === WeatherState.RAIN) {
      strength *= 1.3;
    }
    
    // Spatial variation (simple noise-like pattern)
    const spatialFreq = 0.01;
    const spatialOffset = Math.sin(x * spatialFreq + z * spatialFreq) * 0.3;
    direction += spatialOffset;
    
    // Temporal variation
    const temporalOffset = Math.sin(time * 0.3) * 0.2;
    direction += temporalOffset;
    
    return {
      x: Math.cos(direction) * strength,
      z: Math.sin(direction) * strength,
      strength,
      direction
    };
  }

  /**
   * Get cloud cover (0-1)
   */
  getCloudCover(): number {
    return this.cloudCover;
  }

  /**
   * Get precipitation intensity (0-1)
   */
  getPrecipitation(): number {
    return this.precipitation;
  }

  /**
   * Get fog density (0-1)
   */
  getFogDensity(): number {
    return this.fogDensity;
  }

  /**
   * Check if surface should look wet
   */
  isWet(): boolean {
    const state = this.getWeatherState();
    return state === WeatherState.RAIN || state === WeatherState.STORM;
  }

  /**
   * Get wetness amount (0-1)
   */
  getWetness(): number {
    if (!this.isWet()) return 0;
    return this.precipitation;
  }

  /**
   * Update weather parameters based on transition
   */
  private updateWeatherParameters(): void {
    if (!this.transition) return;
    
    const t = this.transition.progress;
    const fromParams = this.getWeatherParams(this.transition.from);
    const toParams = this.getWeatherParams(this.transition.to);
    
    // Smooth interpolation
    const smoothT = t * t * (3 - 2 * t); // Smoothstep
    
    this.cloudCover = fromParams.cloudCover + (toParams.cloudCover - fromParams.cloudCover) * smoothT;
    this.precipitation = fromParams.precipitation + (toParams.precipitation - fromParams.precipitation) * smoothT;
    this.fogDensity = fromParams.fogDensity + (toParams.fogDensity - fromParams.fogDensity) * smoothT;
  }

  /**
   * Get weather parameters for a state
   */
  private getWeatherParams(state: WeatherState): { cloudCover: number; precipitation: number; fogDensity: number } {
    switch (state) {
      case WeatherState.CLEAR:
        return { cloudCover: 0.1, precipitation: 0, fogDensity: 0 };
      case WeatherState.OVERCAST:
        return { cloudCover: 0.8, precipitation: 0, fogDensity: 0.1 };
      case WeatherState.RAIN:
        return { cloudCover: 0.9, precipitation: 0.7, fogDensity: 0.2 };
      case WeatherState.STORM:
        return { cloudCover: 1.0, precipitation: 1.0, fogDensity: 0.3 };
      case WeatherState.FOG:
        return { cloudCover: 0.5, precipitation: 0, fogDensity: 0.8 };
      case WeatherState.SNOW:
        return { cloudCover: 0.7, precipitation: 0.5, fogDensity: 0.15 };
    }
  }

  /**
   * Set base wind parameters
   */
  setBaseWind(strength: number, direction: number): void {
    this.baseWindStrength = strength;
    this.baseWindDirection = direction;
  }

  /**
   * Enable/disable Ironcrag snow
   */
  setIroncragSnow(enabled: boolean): void {
    this.ironcragSnowEnabled = enabled;
  }

  /**
   * Force instant weather change (no transition)
   */
  forceWeather(state: WeatherState): void {
    this.currentState = state;
    this.targetState = state;
    this.transition = null;
    this.updateWeatherParameters();
    
    // Set parameters directly
    const params = this.getWeatherParams(state);
    this.cloudCover = params.cloudCover;
    this.precipitation = params.precipitation;
    this.fogDensity = params.fogDensity;
  }
}
