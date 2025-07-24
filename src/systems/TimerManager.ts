import Phaser from 'phaser';

export interface TimerData {
  id: string;
  delay: number;
  callback: Function;
  loop: boolean;
  timer?: Phaser.Time.TimerEvent;
  lastExecution: number;
  isActive: boolean;
  options?: {
    randomRange?: { min: number; max: number };
    condition?: () => boolean;
  };
}

export default class TimerManager {
  private static instance: TimerManager;
  private scene: Phaser.Scene;
  private timers: Map<string, TimerData> = new Map();
  private isPaused: boolean = false;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static getInstance(scene: Phaser.Scene): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager(scene);
    }
    return TimerManager.instance;
  }

  addTimer(
    id: string, 
    delay: number, 
    callback: Function, 
    loop: boolean = false,
    options?: TimerData['options']
  ): void {
    // Remove existing timer if it exists
    this.removeTimer(id);

    const timerData: TimerData = {
      id,
      delay,
      callback,
      loop,
      lastExecution: 0,
      isActive: true,
      options
    };

    // Create the actual Phaser timer
    if (options?.randomRange) {
      // For random delay timers
      const randomDelay = Phaser.Math.Between(options.randomRange.min, options.randomRange.max);
      timerData.timer = this.scene.time.addEvent({
        delay: randomDelay,
        loop: false,
        callback: () => {
          this.executeTimer(id);
          if (loop) {
            // Schedule next execution with new random delay
            this.scheduleNextRandomExecution(id);
          }
        }
      });
    } else {
      // For fixed delay timers
      timerData.timer = this.scene.time.addEvent({
        delay,
        loop,
        callback: () => {
          this.executeTimer(id);
        }
      });
    }

    this.timers.set(id, timerData);
  }

  private executeTimer(id: string): void {
    const timerData = this.timers.get(id);
    if (!timerData || !timerData.isActive || this.isPaused) return;

    // Check condition if specified
    if (timerData.options?.condition && !timerData.options.condition()) {
      return;
    }

    timerData.lastExecution = this.scene.time.now;
    timerData.callback();
  }

  private scheduleNextRandomExecution(id: string): void {
    const timerData = this.timers.get(id);
    if (!timerData || !timerData.options?.randomRange) return;

    const randomDelay = Phaser.Math.Between(
      timerData.options.randomRange.min, 
      timerData.options.randomRange.max
    );

    timerData.timer = this.scene.time.addEvent({
      delay: randomDelay,
      loop: false,
      callback: () => {
        this.executeTimer(id);
        this.scheduleNextRandomExecution(id);
      }
    });
  }

  removeTimer(id: string): void {
    const timerData = this.timers.get(id);
    if (timerData?.timer) {
      timerData.timer.destroy();
    }
    this.timers.delete(id);
  }

  pauseTimer(id: string): void {
    const timerData = this.timers.get(id);
    if (timerData) {
      timerData.isActive = false;
    }
  }

  resumeTimer(id: string): void {
    const timerData = this.timers.get(id);
    if (timerData) {
      timerData.isActive = true;
    }
  }

  pauseAll(): void {
    this.isPaused = true;
    this.timers.forEach(timerData => {
      timerData.isActive = false;
    });
  }

  resumeAll(): void {
    this.isPaused = false;
    this.timers.forEach(timerData => {
      timerData.isActive = true;
    });
  }

  update(delta: number): void {
    // Update any timers that need manual updating
    this.timers.forEach(timerData => {
      if (timerData.isActive && !timerData.timer) {
        // Handle any timers that don't use Phaser's built-in timer
        const currentTime = this.scene.time.now;
        if (currentTime - timerData.lastExecution >= timerData.delay) {
          this.executeTimer(timerData.id);
        }
      }
    });
  }

  cleanup(): void {
    this.timers.forEach(timerData => {
      if (timerData.timer) {
        timerData.timer.destroy();
      }
    });
    this.timers.clear();
  }

  getTimer(id: string): TimerData | undefined {
    return this.timers.get(id);
  }

  isTimerActive(id: string): boolean {
    const timerData = this.timers.get(id);
    return timerData?.isActive || false;
  }

  // Convenience methods for common timer patterns
  addRandomTimer(id: string, minDelay: number, maxDelay: number, callback: Function, loop: boolean = false): void {
    this.addTimer(id, 0, callback, loop, { randomRange: { min: minDelay, max: maxDelay } });
  }

  addConditionalTimer(id: string, delay: number, callback: Function, condition: () => boolean, loop: boolean = false): void {
    this.addTimer(id, delay, callback, loop, { condition });
  }
} 