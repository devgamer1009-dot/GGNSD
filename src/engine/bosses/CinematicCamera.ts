/**
 * Cinematic Camera System - Boss intro and phase transition cameras
 * P21 - Manages cinematic camera tracks for boss fights
 */

import * as THREE from 'three';
import { CinematicTrack, CameraKeyframe } from './BossFramework.js';

export class CinematicCamera {
  private camera: THREE.PerspectiveCamera;
  private currentTrack?: CinematicTrack;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private onComplete?: () => void;
  private onDialogue?: (line: string, index: number) => void;
  private dialogueIndex: number = 0;
  private lastDialogueTime: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /**
   * Play a cinematic track
   */
  play(track: CinematicTrack, onComplete?: () => void): void {
    this.currentTrack = track;
    this.startTime = performance.now() / 1000;
    this.isPlaying = true;
    this.dialogueIndex = 0;
    this.lastDialogueTime = 0;
    this.onComplete = onComplete;

    console.log(`[CinematicCamera] Playing track: ${track.duration}s, ${track.cameraPath.length} keyframes`);
  }

  /**
   * Update cinematic camera
   */
  update(currentTime: number): boolean {
    if (!this.isPlaying || !this.currentTrack) return false;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.currentTrack.duration, 1);

    // Interpolate camera position and lookAt
    const { position, lookAt, fov } = this.interpolateKeyframes(progress);

    // Apply to camera
    this.camera.position.copy(position);
    this.camera.lookAt(lookAt);
    
    if (fov !== undefined) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // Handle dialogue
    if (this.currentTrack.dialogue && this.dialogueIndex < this.currentTrack.dialogue.length) {
      const dialogueTime = (this.dialogueIndex / this.currentTrack.dialogue.length) * this.currentTrack.duration;
      
      if (elapsed >= dialogueTime && elapsed - this.lastDialogueTime > 0.5) {
        const line = this.currentTrack.dialogue[this.dialogueIndex];
        if (line && this.onDialogue) {
          this.onDialogue(line, this.dialogueIndex);
        }
        this.dialogueIndex++;
        this.lastDialogueTime = elapsed;
      }
    }

    // Check if complete
    if (progress >= 1) {
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return true;
    }

    return false;
  }

  /**
   * Interpolate between keyframes
   */
  private interpolateKeyframes(progress: number): {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov?: number;
  } {
    if (!this.currentTrack || this.currentTrack.cameraPath.length === 0) {
      return {
        position: new THREE.Vector3(),
        lookAt: new THREE.Vector3(),
      };
    }

    const keyframes = this.currentTrack.cameraPath;
    
    // Find surrounding keyframes
    let prevKeyframe = keyframes[0]!;
    let nextKeyframe = keyframes[keyframes.length - 1]!;

    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i];
      const next = keyframes[i + 1];
      
      if (current && next && progress >= current.time && progress <= next.time) {
        prevKeyframe = current;
        nextKeyframe = next;
        break;
      }
    }

    // Calculate interpolation factor
    const duration = nextKeyframe.time - prevKeyframe.time;
    const t = duration > 0 ? (progress - prevKeyframe.time) / duration : 0;
    const smoothT = this.smoothstep(t);

    // Interpolate position
    const position = new THREE.Vector3().lerpVectors(
      prevKeyframe.position,
      nextKeyframe.position,
      smoothT
    );

    // Interpolate lookAt
    const lookAt = new THREE.Vector3().lerpVectors(
      prevKeyframe.lookAt,
      nextKeyframe.lookAt,
      smoothT
    );

    // Interpolate FOV if present
    let fov: number | undefined;
    if (prevKeyframe.fov !== undefined && nextKeyframe.fov !== undefined) {
      fov = prevKeyframe.fov + (nextKeyframe.fov - prevKeyframe.fov) * smoothT;
    }

    return { position, lookAt, fov };
  }

  /**
   * Smoothstep interpolation
   */
  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /**
   * Stop cinematic
   */
  stop(): void {
    this.isPlaying = false;
    this.currentTrack = undefined;
  }

  /**
   * Check if cinematic is playing
   */
  isCinematicPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set dialogue callback
   */
  setOnDialogue(callback: (line: string, index: number) => void): void {
    this.onDialogue = callback;
  }

  /**
   * Get current progress
   */
  getProgress(): number {
    if (!this.isPlaying || !this.currentTrack) return 0;
    
    const elapsed = (performance.now() / 1000) - this.startTime;
    return Math.min(elapsed / this.currentTrack.duration, 1);
  }

  /**
   * Get current track
   */
  getCurrentTrack(): CinematicTrack | undefined {
    return this.currentTrack;
  }
}

/**
 * Create a simple orbit camera track
 */
export function createOrbitTrack(
  center: THREE.Vector3,
  radius: number,
  height: number,
  duration: number,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2
): CinematicTrack {
  const keyframes: CameraKeyframe[] = [];
  const steps = 8;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    
    const position = new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      center.y + height,
      center.z + Math.sin(angle) * radius
    );

    keyframes.push({
      time: t,
      position,
      lookAt: center.clone(),
      fov: 60,
    });
  }

  return {
    duration,
    cameraPath: keyframes,
  };
}

/**
 * Create a zoom-in camera track
 */
export function createZoomTrack(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  lookAt: THREE.Vector3,
  duration: number,
  startFov: number = 60,
  endFov: number = 45
): CinematicTrack {
  return {
    duration,
    cameraPath: [
      {
        time: 0,
        position: startPos.clone(),
        lookAt: lookAt.clone(),
        fov: startFov,
      },
      {
        time: 1,
        position: endPos.clone(),
        lookAt: lookAt.clone(),
        fov: endFov,
      },
    ],
  };
}

/**
 * Create a dramatic reveal track
 */
export function createRevealTrack(
  bossPosition: THREE.Vector3,
  distance: number,
  duration: number
): CinematicTrack {
  const startPos = new THREE.Vector3(
    bossPosition.x,
    bossPosition.y + distance * 2,
    bossPosition.z + distance * 2
  );

  const endPos = new THREE.Vector3(
    bossPosition.x + distance * 0.5,
    bossPosition.y + distance * 0.3,
    bossPosition.z + distance * 0.5
  );

  return {
    duration,
    cameraPath: [
      {
        time: 0,
        position: startPos,
        lookAt: bossPosition.clone(),
        fov: 70,
      },
      {
        time: 0.5,
        position: new THREE.Vector3().lerpVectors(startPos, endPos, 0.5),
        lookAt: bossPosition.clone(),
        fov: 60,
      },
      {
        time: 1,
        position: endPos,
        lookAt: bossPosition.clone(),
        fov: 50,
      },
    ],
  };
}
