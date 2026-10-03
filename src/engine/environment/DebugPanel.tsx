/**
 * Environment Debug Panel - React UI for controlling environment systems
 * Provides controls for time, weather, quality tiers, and visual effects
 */

import React, { useState, useEffect } from 'react';
import type { EnvironmentManager } from './EnvironmentManager.js';
import { WeatherState } from './WeatherSystem.js';
import { SkyQuality } from './SkySystem.js';
import { WaterQuality } from './WaterSystem.js';
import { ShadowQuality } from './ShadowSystem.js';
import { ParticleQuality } from './ParticleSystem.js';

interface DebugPanelProps {
  environment: EnvironmentManager | null;
}

export const EnvironmentDebugPanel: React.FC<DebugPanelProps> = ({ environment }) => {
  const [time, setTime] = useState(0);
  const [weather, setWeather] = useState<WeatherState>(WeatherState.CLEAR);
  const [skyQuality, setSkyQuality] = useState<SkyQuality>(SkyQuality.MEDIUM);
  const [waterQuality, setWaterQuality] = useState<WaterQuality>(WaterQuality.MEDIUM);
  const [shadowQuality, setShadowQuality] = useState<ShadowQuality>(ShadowQuality.MEDIUM);
  const [particleQuality, setParticleQuality] = useState<ParticleQuality>(ParticleQuality.MEDIUM);
  const [waterLevel, setWaterLevel] = useState(0);
  const [waveAmplitude, setWaveAmplitude] = useState(0.5);
  const [windStrength, setWindStrength] = useState(2.0);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [ironcragSnow, setIroncragSnow] = useState(true);

  // Update UI from environment state
  useEffect(() => {
    if (!environment) return;

    const interval = setInterval(() => {
      setTime(environment.getTime());
      setWeather(environment.getWeatherState());
    }, 100);

    return () => clearInterval(interval);
  }, [environment]);

  if (!environment) {
    return <div>Environment not initialized</div>;
  }

  const handleTimeChange = (value: number) => {
    environment.setTime(value);
    setTime(value);
  };

  const handleWeatherChange = (state: WeatherState) => {
    environment.setWeather(state, 2);
    setWeather(state);
  };

  const handleSkyQualityChange = (quality: SkyQuality) => {
    environment.setQuality({
      ...environment.getQuality(),
      sky: quality
    });
    setSkyQuality(quality);
  };

  const handleWaterQualityChange = (quality: WaterQuality) => {
    environment.setQuality({
      ...environment.getQuality(),
      water: quality
    });
    setWaterQuality(quality);
  };

  const handleShadowQualityChange = (quality: ShadowQuality) => {
    environment.setQuality({
      ...environment.getQuality(),
      shadows: quality
    });
    setShadowQuality(quality);
  };

  const handleParticleQualityChange = (quality: ParticleQuality) => {
    environment.setQuality({
      ...environment.getQuality(),
      particles: quality
    });
    setParticleQuality(quality);
  };

  const handleWaterLevelChange = (value: number) => {
    environment.setWaterLevel(value);
    setWaterLevel(value);
  };

  const handleWaveAmplitudeChange = (value: number) => {
    environment.setWaveParameters(value, 0.1, 1.0);
    setWaveAmplitude(value);
  };

  const handleWindStrengthChange = (value: number) => {
    environment.setBaseWind(value, 0);
    setWindStrength(value);
  };

  const handleShadowsToggle = () => {
    const newValue = !shadowsEnabled;
    environment.setShadowsEnabled(newValue);
    setShadowsEnabled(newValue);
  };

  const handleIroncragSnowToggle = () => {
    const newValue = !ironcragSnow;
    environment.setIroncragSnow(newValue);
    setIroncragSnow(newValue);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>Environment Debug</h3>
      
      {/* Time Control */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>
          Time: {environment.getTimeString()} ({Math.floor(time)}s)
        </div>
        <input
          type="range"
          min="0"
          max="1440"
          value={time}
          onChange={(e) => handleTimeChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
          <button onClick={() => handleTimeChange(360)} style={buttonStyle}>Dawn</button>
          <button onClick={() => handleTimeChange(720)} style={buttonStyle}>Day</button>
          <button onClick={() => handleTimeChange(1080)} style={buttonStyle}>Sunset</button>
          <button onClick={() => handleTimeChange(0)} style={buttonStyle}>Night</button>
        </div>
      </div>

      {/* Weather Control */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Weather: {weather}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {Object.values(WeatherState).map(state => (
            <button
              key={state}
              onClick={() => handleWeatherChange(state)}
              style={{
                ...buttonStyle,
                background: weather === state ? '#4ade80' : '#333'
              }}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Tiers */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Sky Quality</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.values(SkyQuality).map(q => (
            <button
              key={q}
              onClick={() => handleSkyQualityChange(q)}
              style={{
                ...buttonStyle,
                background: skyQuality === q ? '#4ade80' : '#333'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Water Quality</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.values(WaterQuality).map(q => (
            <button
              key={q}
              onClick={() => handleWaterQualityChange(q)}
              style={{
                ...buttonStyle,
                background: waterQuality === q ? '#4ade80' : '#333'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Shadow Quality</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.values(ShadowQuality).map(q => (
            <button
              key={q}
              onClick={() => handleShadowQualityChange(q)}
              style={{
                ...buttonStyle,
                background: shadowQuality === q ? '#4ade80' : '#333'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Particle Quality</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.values(ParticleQuality).map(q => (
            <button
              key={q}
              onClick={() => handleParticleQualityChange(q)}
              style={{
                ...buttonStyle,
                background: particleQuality === q ? '#4ade80' : '#333'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Water Controls */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Water Level: {waterLevel.toFixed(1)}</div>
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={waterLevel}
          onChange={(e) => handleWaterLevelChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Wave Amplitude: {waveAmplitude.toFixed(2)}</div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={waveAmplitude}
          onChange={(e) => handleWaveAmplitudeChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Wind Control */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>Wind Strength: {windStrength.toFixed(1)}</div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={windStrength}
          onChange={(e) => handleWindStrengthChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Toggles */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={shadowsEnabled}
            onChange={handleShadowsToggle}
          />
          Shadows Enabled
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={ironcragSnow}
            onChange={handleIroncragSnowToggle}
          />
          Ironcrag Snow
        </label>
      </div>

      {/* Status */}
      <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #444' }}>
        <div>Sun Dir: [{environment.getSunDirection().map(v => v.toFixed(2)).join(', ')}]</div>
        <div>Day Phase: {environment.getDayPhase()}</div>
        <div>Fog Density: {environment.getFogDensity().toFixed(2)}</div>
        <div>Wetness: {environment.getWetness().toFixed(2)}</div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: '#333',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontFamily: 'monospace'
};
