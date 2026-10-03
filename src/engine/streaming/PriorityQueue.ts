/**
 * Priority queue for chunk loading
 * Orders by distance (closer = higher priority) and velocity (moving toward = higher priority)
 */

export interface PriorityItem<T> {
  data: T;
  priority: number;
  timestamp: number;
}

export class PriorityQueue<T> {
  private heap: PriorityItem<T>[] = [];

  /**
   * Add item to queue
   */
  enqueue(data: T, priority: number): void {
    const item: PriorityItem<T> = {
      data,
      priority,
      timestamp: Date.now(),
    };

    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const top = this.heap[0]!;
    const bottom = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }

    return top.data;
  }

  /**
   * Peek at highest priority item without removing
   */
  peek(): T | undefined {
    return this.heap[0]?.data;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Remove specific item
   */
  remove(predicate: (item: T) => boolean): boolean {
    const index = this.heap.findIndex((item) => predicate(item.data));
    if (index === -1) return false;

    const bottom = this.heap.pop()!;
    if (index < this.heap.length) {
      this.heap[index] = bottom;
      this.bubbleUp(index);
      this.sinkDown(index);
    }

    return true;
  }

  /**
   * Check if item exists
   */
  has(predicate: (item: T) => boolean): boolean {
    return this.heap.some((item) => predicate(item.data));
  }

  /**
   * Get all items (for debugging)
   */
  toArray(): T[] {
    return this.heap.map((item) => item.data);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex]!.priority <= this.heap[index]!.priority) break;

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      let leftIndex = 2 * index + 1;
      let rightIndex = 2 * index + 2;
      let smallest = index;

      if (leftIndex < length && this.heap[leftIndex]!.priority < this.heap[smallest]!.priority) {
        smallest = leftIndex;
      }

      if (rightIndex < length && this.heap[rightIndex]!.priority < this.heap[smallest]!.priority) {
        smallest = rightIndex;
      }

      if (smallest === index) break;

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = temp;
  }
}
