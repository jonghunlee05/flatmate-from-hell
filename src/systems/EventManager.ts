import Phaser from 'phaser';

export type GameEventType = 
  | 'phaseTransition'
  | 'messCleaned'
  | 'itemRepaired'
  | 'showNotification'
  | 'flatmateMoved'
  | 'gameStateChanged'
  | 'timerComplete';

export interface GameEvent {
  type: GameEventType;
  data?: any;
  timestamp: number;
}

export default class EventManager {
  private static instance: EventManager;
  private game: Phaser.Game;
  private eventQueue: GameEvent[] = [];
  private listeners: Map<GameEventType, Array<(event: GameEvent) => void>> = new Map();
  private isProcessing: boolean = false;

  private constructor(game: Phaser.Game) {
    this.game = game;
  }

  static getInstance(game?: Phaser.Game): EventManager {
    if (!EventManager.instance && game) {
      EventManager.instance = new EventManager(game);
    }
    return EventManager.instance;
  }

  emit(eventType: GameEventType, data?: any): void {
    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    this.eventQueue.push(event);
    this.processEvents();
  }

  on(eventType: GameEventType, callback: (event: GameEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: GameEventType, callback: (event: GameEvent) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private processEvents(): void {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const callbacks = this.listeners.get(event.type);

      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`Error in event listener for ${event.type}:`, error);
          }
        });
      }
    }

    this.isProcessing = false;
  }

  // Convenience methods for common events
  emitPhaseTransition(fromPhase: string, toPhase: string): void {
    this.emit('phaseTransition', { fromPhase, toPhase });
  }

  emitMessCleaned(mess: any): void {
    this.emit('messCleaned', mess);
  }

  emitItemRepaired(item: any): void {
    this.emit('itemRepaired', item);
  }

  emitNotification(message: string): void {
    this.emit('showNotification', message);
  }

  emitFlatmateMoved(fromRoom: string, toRoom: string): void {
    this.emit('flatmateMoved', { fromRoom, toRoom });
  }

  emitGameStateChanged(state: any): void {
    this.emit('gameStateChanged', state);
  }

  emitTimerComplete(): void {
    this.emit('timerComplete');
  }

  // Clear all events and listeners
  clear(): void {
    this.eventQueue = [];
    this.listeners.clear();
  }

  // Get current queue size for debugging
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  // Get listener count for debugging
  getListenerCount(eventType: GameEventType): number {
    return this.listeners.get(eventType)?.length || 0;
  }
} 