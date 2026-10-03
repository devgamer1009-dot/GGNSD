/**
 * Worker pool for parallel chunk generation
 * Manages multiple workers and distributes work
 */

export interface WorkerTask {
  id: string;
  data: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private busyWorkers: Map<Worker, string> = new Map();
  private workerUrl: string;
  private poolSize: number;

  constructor(workerUrl: string, poolSize: number = 4) {
    this.workerUrl = workerUrl;
    this.poolSize = poolSize;
  }

  /**
   * Initialize worker pool
   */
  init(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      
      worker.onmessage = (e) => {
        this.handleWorkerMessage(worker, e.data);
      };

      worker.onerror = (error) => {
        this.handleWorkerError(worker, error);
      };

      this.workers.push(worker);
    }
  }

  /**
   * Submit task to worker pool
   */
  submit<T>(taskId: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        data,
        resolve: resolve as (result: any) => void,
        reject,
      };

      // Store in active tasks
      this.activeTasks.set(taskId, task);

      // Try to find idle worker
      const idleWorker = this.getIdleWorker();
      if (idleWorker) {
        this.executeTask(idleWorker, task);
      } else {
        // Queue task
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Cancel pending task
   */
  cancel(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    // Remove from queue if queued
    const queueIndex = this.taskQueue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }

    // Find busy worker and send cancel message
    for (const [worker, busyTaskId] of this.busyWorkers.entries()) {
      if (busyTaskId === taskId) {
        worker.postMessage({ type: 'cancel', taskId });
        this.busyWorkers.delete(worker);
        break;
      }
    }

    // Reject and remove from active tasks
    task.reject(new Error('Task cancelled'));
    this.activeTasks.delete(taskId);
    
    // Process next task
    this.processQueue();
  }

  /**
   * Get number of idle workers
   */
  getIdleCount(): number {
    return this.workers.length - this.busyWorkers.size;
  }

  /**
   * Get number of busy workers
   */
  getBusyCount(): number {
    return this.busyWorkers.size;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Dispose all workers
   */
  dispose(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.busyWorkers.clear();
    
    // Reject all pending tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker pool disposed'));
    }
    this.taskQueue = [];

    // Reject all active tasks
    for (const task of this.activeTasks.values()) {
      task.reject(new Error('Worker pool disposed'));
    }
    this.activeTasks.clear();
  }

  private getIdleWorker(): Worker | null {
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker)) {
        return worker;
      }
    }
    return null;
  }

  private executeTask(worker: Worker, task: WorkerTask): void {
    this.busyWorkers.set(worker, task.id);
    worker.postMessage({ type: 'task', taskId: task.id, data: task.data });
  }

  private handleWorkerMessage(worker: Worker, message: any): void {
    const taskId = this.busyWorkers.get(worker);
    if (!taskId) return;

    const task = this.activeTasks.get(taskId);
    if (!task) {
      this.busyWorkers.delete(worker);
      this.processQueue();
      return;
    }

    if (message.type === 'result') {
      task.resolve(message.data);
      this.activeTasks.delete(taskId);
    } else if (message.type === 'error') {
      task.reject(new Error(message.error));
      this.activeTasks.delete(taskId);
    }

    this.busyWorkers.delete(worker);
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    const taskId = this.busyWorkers.get(worker);
    if (taskId) {
      const task = this.activeTasks.get(taskId);
      if (task) {
        task.reject(error);
        this.activeTasks.delete(taskId);
      }
      this.busyWorkers.delete(worker);
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const idleWorker = this.getIdleWorker();
    if (idleWorker) {
      const task = this.taskQueue.shift()!;
      this.executeTask(idleWorker, task);
    }
  }
}
