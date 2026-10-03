/**
 * Input Buffer System
 * Handles combo input buffering for responsive combat
 */

export interface BufferedInput {
  action: string;
  timestamp: number;
  consumed: boolean;
}

export class InputBuffer {
  private buffer: BufferedInput[] = [];
  private bufferWindow: number = 0.3; // seconds to keep inputs
  private maxBufferSize: number = 5;

  /**
   * Add input to buffer
   */
  addInput(action: string, timestamp: number): void {
    // Remove old inputs
    this.cleanup(timestamp);

    // Add new input
    this.buffer.push({
      action,
      timestamp,
      consumed: false,
    });

    // Limit buffer size
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get next unconsumed input
   */
  getNextInput(currentTime: number): BufferedInput | null {
    this.cleanup(currentTime);

    for (const input of this.buffer) {
      if (!input.consumed) {
        return input;
      }
    }
    return null;
  }

  /**
   * Consume an input
   */
  consumeInput(input: BufferedInput): void {
    input.consumed = true;
  }

  /**
   * Check if specific action is buffered
   */
  hasAction(action: string, currentTime: number): boolean {
    this.cleanup(currentTime);
    return this.buffer.some(input => input.action === action && !input.consumed);
  }

  /**
   * Clear all buffered inputs
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Remove old inputs outside buffer window
   */
  private cleanup(currentTime: number): void {
    this.buffer = this.buffer.filter(
      input => currentTime - input.timestamp <= this.bufferWindow
    );
  }

  /**
   * Set buffer window
   */
  setBufferWindow(window: number): void {
    this.bufferWindow = window;
  }

  /**
   * Get buffer size
   */
  getSize(): number {
    return this.buffer.length;
  }

  /**
   * Get all buffered inputs (for debugging)
   */
  getAll(): BufferedInput[] {
    return [...this.buffer];
  }
}
