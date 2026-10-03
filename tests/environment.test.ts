import { describe, it, expect, beforeEach } from 'vitest';
import { TimeSystem, DayPhase } from '../src/engine/environment/TimeSystem.js';
import { WeatherSystem, WeatherState } from '../src/engine/environment/WeatherSystem.js';

describe('TimeSystem', () => {
  let timeSystem: TimeSystem;

  beforeEach(() => {
    timeSystem = new TimeSystem();
  });

  describe('Time progression', () => {
    it('should start at time 0', () => {
      expect(timeSystem.getTime()).toBe(0);
    });

    it('should advance time based on delta time', () => {
      timeSystem.update(1.0);
      expect(timeSystem.getTime()).toBe(1.0);
    });

    it('should wrap around at 24 minutes (1440 seconds)', () => {
      timeSystem.setTime(1439);
      timeSystem.update(2);
      expect(timeSystem.getTime()).toBe(1);
    });

    it('should respect time scale', () => {
      timeSystem.setTimeScale(2.0);
      timeSystem.update(1.0);
      expect(timeSystem.getTime()).toBe(2.0);
    });
  });

  describe('Day phases', () => {
    it('should return NIGHT at time 0 (midnight)', () => {
      timeSystem.setTime(0);
      expect(timeSystem.getDayPhase()).toBe(DayPhase.NIGHT);
    });

    it('should return DAWN at time 360 (6:00 AM)', () => {
      timeSystem.setTime(360);
      expect(timeSystem.getDayPhase()).toBe(DayPhase.DAWN);
    });

    it('should return DAY at time 720 (noon)', () => {
      timeSystem.setTime(720);
      expect(timeSystem.getDayPhase()).toBe(DayPhase.DAY);
    });

    it('should return SUNSET at time 1080 (6:00 PM)', () => {
      timeSystem.setTime(1080);
      expect(timeSystem.getDayPhase()).toBe(DayPhase.SUNSET);
    });

    it('should return NIGHT at time 1200 (8:00 PM)', () => {
      timeSystem.setTime(1200);
      expect(timeSystem.getDayPhase()).toBe(DayPhase.NIGHT);
    });
  });

  describe('Sun direction', () => {
    it('should return valid sun direction at noon', () => {
      timeSystem.setTime(720);
      const dir = timeSystem.getSunDirection();
      expect(dir).toHaveLength(3);
      expect(dir[1]).toBeGreaterThan(0); // Sun should be above horizon
    });

    it('should return sun below horizon at night', () => {
      timeSystem.setTime(0);
      const dir = timeSystem.getSunDirection();
      expect(dir[1]).toBeLessThan(0); // Sun should be below horizon
    });
  });

  describe('Time string formatting', () => {
    it('should format midnight as 00:00', () => {
      timeSystem.setTime(0);
      expect(timeSystem.getTimeString()).toBe('00:00');
    });

    it('should format noon as 12:00', () => {
      timeSystem.setTime(720);
      expect(timeSystem.getTimeString()).toBe('12:00');
    });

    it('should format 6:30 AM as 06:30', () => {
      timeSystem.setTime(390);
      expect(timeSystem.getTimeString()).toBe('06:30');
    });
  });
});

describe('WeatherSystem', () => {
  let weatherSystem: WeatherSystem;

  beforeEach(() => {
    weatherSystem = new WeatherSystem();
  });

  describe('Weather state transitions', () => {
    it('should start with CLEAR weather', () => {
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.CLEAR);
    });

    it('should transition to new weather state', () => {
      weatherSystem.setWeather(WeatherState.RAIN, 1.0);
      weatherSystem.update(0.5); // 50% through transition
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.CLEAR); // Still transitioning
      
      weatherSystem.update(0.6); // Complete transition
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.RAIN);
    });

    it('should force instant weather change', () => {
      weatherSystem.forceWeather(WeatherState.STORM);
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.STORM);
    });

    it('should not transition if already in target state', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      weatherSystem.setWeather(WeatherState.RAIN, 1.0);
      weatherSystem.update(0.5);
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.RAIN);
    });
  });

  describe('Weather parameters', () => {
    it('should have no precipitation in CLEAR weather', () => {
      weatherSystem.forceWeather(WeatherState.CLEAR);
      expect(weatherSystem.getPrecipitation()).toBe(0);
    });

    it('should have precipitation in RAIN weather', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      expect(weatherSystem.getPrecipitation()).toBeGreaterThan(0);
    });

    it('should have high precipitation in STORM weather', () => {
      weatherSystem.forceWeather(WeatherState.STORM);
      expect(weatherSystem.getPrecipitation()).toBeGreaterThan(0.8);
    });

    it('should have fog in FOG weather', () => {
      weatherSystem.forceWeather(WeatherState.FOG);
      expect(weatherSystem.getFogDensity()).toBeGreaterThan(0.5);
    });

    it('should have high cloud cover in OVERCAST weather', () => {
      weatherSystem.forceWeather(WeatherState.OVERCAST);
      expect(weatherSystem.getCloudCover()).toBeGreaterThan(0.7);
    });
  });

  describe('Wetness', () => {
    it('should not be wet in CLEAR weather', () => {
      weatherSystem.forceWeather(WeatherState.CLEAR);
      expect(weatherSystem.isWet()).toBe(false);
      expect(weatherSystem.getWetness()).toBe(0);
    });

    it('should be wet in RAIN weather', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      expect(weatherSystem.isWet()).toBe(true);
      expect(weatherSystem.getWetness()).toBeGreaterThan(0);
    });

    it('should be wet in STORM weather', () => {
      weatherSystem.forceWeather(WeatherState.STORM);
      expect(weatherSystem.isWet()).toBe(true);
    });

    it('should not be wet in SNOW weather', () => {
      weatherSystem.forceWeather(WeatherState.SNOW);
      expect(weatherSystem.isWet()).toBe(false);
    });
  });

  describe('Wind field', () => {
    it('should return wind sample', () => {
      const wind = weatherSystem.getWind(0, 0, 0);
      expect(wind).toHaveProperty('x');
      expect(wind).toHaveProperty('z');
      expect(wind).toHaveProperty('strength');
      expect(wind).toHaveProperty('direction');
    });

    it('should have base wind strength', () => {
      weatherSystem.setBaseWind(5.0, 0);
      const wind = weatherSystem.getWind(0, 0, 0);
      expect(wind.strength).toBeGreaterThan(0);
    });

    it('should vary wind with position', () => {
      const wind1 = weatherSystem.getWind(0, 0, 0);
      const wind2 = weatherSystem.getWind(100, 100, 0);
      // Wind should be different at different positions
      expect(wind1.direction).not.toBe(wind2.direction);
    });

    it('should vary wind with time', () => {
      const wind1 = weatherSystem.getWind(0, 0, 0);
      const wind2 = weatherSystem.getWind(0, 0, 10);
      // Wind should be different at different times
      expect(wind1.direction).not.toBe(wind2.direction);
    });

    it('should have stronger wind in STORM', () => {
      weatherSystem.forceWeather(WeatherState.CLEAR);
      const clearWind = weatherSystem.getWind(0, 0, 0);
      
      weatherSystem.forceWeather(WeatherState.STORM);
      const stormWind = weatherSystem.getWind(0, 0, 0);
      
      expect(stormWind.strength).toBeGreaterThan(clearWind.strength);
    });
  });

  describe('Region-specific weather', () => {
    it('should return SNOW in Ironcrag when raining', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      weatherSystem.setIroncragSnow(true);
      
      // Ironcrag is at (1200, -1000)
      const weather = weatherSystem.getWeatherAtPosition(1200, -1000);
      expect(weather).toBe(WeatherState.SNOW);
    });

    it('should return RAIN outside Ironcrag when raining', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      weatherSystem.setIroncragSnow(true);
      
      // Outside Ironcrag
      const weather = weatherSystem.getWeatherAtPosition(0, 0);
      expect(weather).toBe(WeatherState.RAIN);
    });

    it('should respect Ironcrag snow toggle', () => {
      weatherSystem.forceWeather(WeatherState.RAIN);
      weatherSystem.setIroncragSnow(false);
      
      const weather = weatherSystem.getWeatherAtPosition(1200, -1000);
      expect(weather).toBe(WeatherState.RAIN);
    });
  });

  describe('Weather transitions', () => {
    it('should interpolate cloud cover during transition', () => {
      weatherSystem.forceWeather(WeatherState.CLEAR);
      const initialClouds = weatherSystem.getCloudCover();
      
      weatherSystem.setWeather(WeatherState.OVERCAST, 2.0);
      weatherSystem.update(1.0); // 50% through transition
      
      const midClouds = weatherSystem.getCloudCover();
      expect(midClouds).toBeGreaterThan(initialClouds);
    });

    it('should complete transition after duration', () => {
      weatherSystem.forceWeather(WeatherState.CLEAR);
      weatherSystem.setWeather(WeatherState.RAIN, 1.0);
      
      weatherSystem.update(1.5); // Past transition duration
      
      expect(weatherSystem.getWeatherState()).toBe(WeatherState.RAIN);
      expect(weatherSystem.getPrecipitation()).toBeGreaterThan(0);
    });
  });
});
