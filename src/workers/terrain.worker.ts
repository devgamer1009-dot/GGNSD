/**
 * Terrain generation worker
 * Runs terrain generation off main thread
 * Supports task-based interface with cancellation
 */

import { generateChunk, type TerrainGenParams, type TerrainChunkData } from '../engine/terrain/TerrainGenerator.js';

// Worker message types
interface TaskMessage {
  type: 'task';
  taskId: string;
  data: {
    type: 'generate';
    params: TerrainGenParams;
  };
}

interface CancelMessage {
  type: 'cancel';
  taskId: string;
}

interface LegacyMessage {
  type: 'generate';
  params: TerrainGenParams;
}

type WorkerMessage = TaskMessage | CancelMessage | LegacyMessage;

// Track active tasks for cancellation
const activeTasks = new Map<string, boolean>();

// Handle messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  if (message.type === 'cancel') {
    // Mark task as cancelled
    activeTasks.set(message.taskId, false);
    return;
  }

  if (message.type === 'task') {
    const { taskId, data } = message;
    
    // Mark task as active
    activeTasks.set(taskId, true);

    if (data.type === 'generate') {
      try {
        const chunkData = generateChunk(data.params);
        
        // Check if task was cancelled
        if (!activeTasks.get(taskId)) {
          activeTasks.delete(taskId);
          return;
        }

        // Send result
        self.postMessage({
          type: 'result',
          taskId,
          data: chunkData,
        }, [
          chunkData.heights.buffer,
          chunkData.normals.buffer,
          chunkData.biomes.buffer,
          chunkData.moisture.buffer,
          chunkData.regionIds.buffer,
        ] as Transferable[]);
      } catch (error) {
        self.postMessage({
          type: 'error',
          taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        activeTasks.delete(taskId);
      }
    }
  } else if (message.type === 'generate') {
    // Legacy interface (for backward compatibility)
    const chunkData = generateChunk(message.params);
    
    self.postMessage({
      type: 'chunkGenerated',
      data: chunkData,
    }, [
      chunkData.heights.buffer,
      chunkData.normals.buffer,
      chunkData.biomes.buffer,
      chunkData.moisture.buffer,
      chunkData.regionIds.buffer,
    ] as Transferable[]);
  }
};
