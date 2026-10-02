/**
 * Terrain generation worker
 * Runs terrain generation off main thread
 */

import { generateChunk, type TerrainGenParams, type TerrainChunkData } from '../engine/terrain/TerrainGenerator.js';

// Worker message types
interface GenerateChunkMessage {
  type: 'generate';
  params: TerrainGenParams;
}

interface WorkerResponse {
  type: 'chunkGenerated';
  data: TerrainChunkData;
}

// Handle messages from main thread
self.onmessage = (e: MessageEvent<GenerateChunkMessage>) => {
  const { type, params } = e.data;
  
  if (type === 'generate') {
    const chunkData = generateChunk(params);
    
    // Transfer typed arrays for zero-copy
    const response: WorkerResponse = {
      type: 'chunkGenerated',
      data: chunkData,
    };
    
    // Transfer ownership of typed arrays
    self.postMessage(response, [
      chunkData.heights.buffer,
      chunkData.normals.buffer,
      chunkData.biomes.buffer,
      chunkData.moisture.buffer,
      chunkData.regionIds.buffer,
    ] as Transferable[]);
  }
};
