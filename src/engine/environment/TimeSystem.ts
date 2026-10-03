/**
 * Time System - 24-minute day cycle
 * Manages sun/moon positions, time of day, and day phases
 */

export enum DayPhase {
  DAWN = 'dawn',
  DAY = 'day',
  SUNSET = 'sunset',
  NIGHT = 'night'
}

export interface CelestialPosition {
  azimuth: number; // horizontal angle (0-360)
  altitude: number; // vertical angle (-90 to 90)
}

export class TimeSystem {
  private time: number = 0; // 0-1440 seconds (24 minutes)
  private timeScale: number = 1;
  private readonly DAY_LENGTH = 1440; // 24 minutes in seconds

  // Sun/moon orbital parameters
  private readonly SUN_RISE = 360; // 6:00 AM
  private readonly SUN_SET = 1080; // 6:00 PM
  private readonly MOON_RISE = 1080; // 6:00 PM
  private readonly MOON_SET = 360; // 6:00 AM

  update(deltaTime: number): void {
    this.time = (this.time + deltaTime * this.timeScale) % this.DAY_LENGTH;
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time % this.DAY_LENGTH;
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Get normalized time (0-1)
   */
  getNormalizedTime(): number {
    return this.time / this.DAY_LENGTH;
  }

  /**
   * Get current day phase
   */
  getDayPhase(): DayPhase {
    if (this.time >= 300 && this.time < 420) return DayPhase.DAWN; // 5:00-7:00
    if (this.time >= 420 && this.time < 1020) return DayPhase.DAY; // 7:00-17:00
    if (this.time >= 1020 && this.time < 1140) return DayPhase.SUNSET; // 17:00-19:00
    return DayPhase.NIGHT; // 19:00-5:00
  }

  /**
   * Get sun position based on time
   */
  getSunPosition(): CelestialPosition {
    const normalizedTime = this.getNormalizedTime();
    
    // Sun rises at 6:00 (0.25), sets at 18:00 (0.75)
    const sunProgress = (normalizedTime - 0.25) / 0.5; // 0-1 during day
    
    let altitude: number;
    if (sunProgress < 0 || sunProgress > 1) {
      altitude = -30; // Below horizon at night
    } else {
      // Parabolic arc: peaks at noon (sunProgress = 0.5)
      altitude = 90 * Math.sin(sunProgress * Math.PI);
    }

    // Azimuth rotates 180 degrees from east to west
    const azimuth = 90 + sunProgress * 180;

    return { azimuth, altitude };
  }

  /**
   * Get moon position (opposite to sun)
   */
  getMoonPosition(): CelestialPosition {
    const sunPos = this.getSunPosition();
    
    // Moon is opposite to sun
    let azimuth = sunPos.azimuth + 180;
    if (azimuth > 360) azimuth -= 360;
    
    let altitude = -sunPos.altitude; // Opposite altitude

    return { azimuth, altitude };
  }

  /**
   * Get sun direction vector (normalized)
   */
  getSunDirection(): [number, number, number] {
    const pos = this.getSunPosition();
    const azimuthRad = (pos.azimuth * Math.PI) / 180;
    const altitudeRad = (pos.altitude * Math.PI) / 180;

    const x = Math.cos(altitudeRad) * Math.sin(azimuthRad);
    const y = Math.sin(altitudeRad);
    const z = Math.cos(altitudeRad) * Math.cos(azimuthRad);

    return [x, y, z];
  }

  /**
   * Get ambient light intensity based on time
   */
  getAmbientIntensity(): number {
    const phase = this.getDayPhase();
    switch (phase) {
      case DayPhase.DAWN:
      case DayPhase.SUNSET:
        return 0.4;
      case DayPhase.DAY:
        return 0.6;
      case DayPhase.NIGHT:
        return 0.15;
    }
  }

  /**
   * Get sun light intensity based on altitude
   */
  getSunIntensity(): number {
    const pos = this.getSunPosition();
    if (pos.altitude < 0) return 0;
    return Math.max(0, pos.altitude / 90);
  }

  /**
   * Get sky color based on time
   */
  getSkyColor(): [number, number, number] {
    const phase = this.getDayPhase();
    switch (phase) {
      case DayPhase.DAWN:
        return [0.8, 0.5, 0.3]; // Orange-pink
      case DayPhase.DAY:
        return [0.4, 0.6, 0.9]; // Blue
      case DayPhase.SUNSET:
        return [0.9, 0.4, 0.2]; // Orange-red
      case DayPhase.NIGHT:
        return [0.05, 0.05, 0.15]; // Dark blue
    }
  }

  /**
   * Get time as HH:MM string
   */
  getTimeString(): string {
    const hours = Math.floor(this.time / 60);
    const minutes = Math.floor(this.time % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
