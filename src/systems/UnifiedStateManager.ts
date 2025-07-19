import Phaser from 'phaser';
import { getPhaseConfig, PhaseConfig } from '../data/phaseConfigs';
import EventManager from './EventManager';

export interface GameState {
  currentPhase: string;
  phaseTime: number;
  phaseDuration: number;
  messesSpawned: number;
  messesCleaned: number;
  brokenItemsSpawned: number;
  brokenItemsFixed: number;
  playerMood: number;
  cleanliness: number;
  flatmateRage: number;
  playerHealth: number;
  dayNumber: number;
}

export default class UnifiedStateManager {
  private static instance: UnifiedStateManager;
  private scene: Phaser.Scene;
  private gameState: GameState;
  private eventManager: EventManager;
  private onStateChange?: (state: GameState) => void;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventManager = EventManager.getInstance(scene.game);
    this.gameState = this.getInitialState();
    this.loadStateFromRegistry();
  }

  static getInstance(scene: Phaser.Scene): UnifiedStateManager {
    if (!UnifiedStateManager.instance) {
      UnifiedStateManager.instance = new UnifiedStateManager(scene);
    }
    return UnifiedStateManager.instance;
  }

  private getInitialState(): GameState {
    return {
      currentPhase: 'morning',
      phaseTime: 0,
      phaseDuration: 60000,
      messesSpawned: 0,
      messesCleaned: 0,
      brokenItemsSpawned: 0,
      brokenItemsFixed: 0,
      playerMood: 100,
      cleanliness: 100,
      flatmateRage: 0,
      playerHealth: 100,
      dayNumber: 1
    };
  }

  update(delta: number): void {
    // Update phase timer
    this.gameState.phaseTime += delta;

    // Check for phase transition
    if (this.gameState.phaseTime >= this.gameState.phaseDuration) {
      this.transitionToNextPhase();
    }

    // Save state to registry
    this.saveStateToRegistry();
    
    // Notify listeners
    this.onStateChange?.(this.gameState);
  }

  private transitionToNextPhase(): void {
    const phases = ['morning', 'afternoon', 'evening', 'night'];
    const currentIndex = phases.indexOf(this.gameState.currentPhase);
    
    // Don't cycle from night - day ends
    if (this.gameState.currentPhase === 'night') {
      console.log('=== DAY COMPLETE ===');
      this.eventManager.emitPhaseTransition(this.gameState.currentPhase, 'complete');
      this.startNewDay();
      return;
    }

    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];
    
    console.log(`=== PHASE TRANSITION: ${this.gameState.currentPhase.toUpperCase()} → ${nextPhase.toUpperCase()} ===`);
    
    // Update state
    this.gameState.currentPhase = nextPhase;
    this.gameState.phaseTime = 0;
    
    // Update phase duration from config
    const phaseConfig = getPhaseConfig(nextPhase);
    this.gameState.phaseDuration = phaseConfig.duration;

    // Emit event
    this.eventManager.emitPhaseTransition(phases[currentIndex], nextPhase);
  }

  private startNewDay(): void {
    this.gameState.dayNumber++;
    this.gameState.currentPhase = 'morning';
    this.gameState.phaseTime = 0;
    this.gameState.phaseDuration = getPhaseConfig('morning').duration;
    
    // Reset daily counters
    this.gameState.messesSpawned = 0;
    this.gameState.messesCleaned = 0;
    this.gameState.brokenItemsSpawned = 0;
    this.gameState.brokenItemsFixed = 0;
    
    // Maintain player stats but with some decay
    this.gameState.playerMood = Math.max(50, this.gameState.playerMood - 10);
    this.gameState.cleanliness = Math.max(30, this.gameState.cleanliness - 20);
    this.gameState.flatmateRage = Math.min(100, this.gameState.flatmateRage + 15);
  }

  // State getters
  getState(): GameState {
    return { ...this.gameState };
  }

  getCurrentPhase(): string {
    return this.gameState.currentPhase;
  }

  getCurrentPhaseConfig(): PhaseConfig {
    return getPhaseConfig(this.gameState.currentPhase);
  }

  getRemainingTime(): number {
    return Math.max(0, this.gameState.phaseDuration - this.gameState.phaseTime);
  }

  getPlayerMood(): number {
    return this.gameState.playerMood;
  }

  getCleanliness(): number {
    return this.gameState.cleanliness;
  }

  getFlatmateRage(): number {
    return this.gameState.flatmateRage;
  }

  getPlayerHealth(): number {
    return this.gameState.playerHealth;
  }

  getDayNumber(): number {
    return this.gameState.dayNumber;
  }

  // State setters and event handlers
  onMessCleaned(): void {
    this.gameState.messesCleaned++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 5);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 10);
    this.eventManager.emitGameStateChanged(this.gameState);
  }

  onItemRepaired(): void {
    this.gameState.brokenItemsFixed++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 3);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 5);
    this.gameState.playerHealth = Math.min(100, this.gameState.playerHealth + 2);
    this.gameState.flatmateRage = Math.max(0, this.gameState.flatmateRage - 3);
    this.eventManager.emitGameStateChanged(this.gameState);
  }

  onMessSpawned(): void {
    this.gameState.messesSpawned++;
  }

  onItemSpawned(): void {
    this.gameState.brokenItemsSpawned++;
  }

  // Callback setters
  setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  // State persistence
  private saveStateToRegistry(): void {
    this.scene.game.registry.set('unifiedGameState', this.gameState);
  }

  private loadStateFromRegistry(): void {
    const storedState = this.scene.game.registry.get('unifiedGameState');
    if (storedState) {
      this.gameState = { ...this.gameState, ...storedState };
    }
  }

  reset(): void {
    this.gameState = this.getInitialState();
    this.saveStateToRegistry();
  }

  // Force phase transition for testing
  forcePhaseTransition(): void {
    console.log('Force phase transition called');
    this.transitionToNextPhase();
  }
} 