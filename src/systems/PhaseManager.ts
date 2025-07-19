import Phaser from 'phaser';
import { getPhaseConfig, PhaseConfig } from '../data/phaseConfigs';
import { SpawnConfig } from '../scenes/phases/MorningPhase';
import FlatmateManager from '../flatmates/FlatmateManager';

export type PhaseType = 'morning' | 'afternoon' | 'evening' | 'night' | 'complete';

export interface PhaseTransitionEvent {
  fromPhase: PhaseType;
  toPhase: PhaseType;
  timestamp: number;
}

export default class PhaseManager {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private currentPhase: PhaseType = 'morning';
  private phaseTimer: number = 0;
  private onPhaseTransition?: (event: PhaseTransitionEvent) => void;

  constructor(scene: Phaser.Scene, sceneManager: Phaser.Scenes.SceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    console.log('PhaseManager initialized with new phaseConfigs system');
  }

  update(time: number, delta: number): void {
    // Update phase timer
    this.phaseTimer += delta;

    // Get current phase config for duration
    const currentConfig = getPhaseConfig(this.currentPhase);
    const phaseDuration = currentConfig.duration;

    // Check for phase transition
    if (this.phaseTimer >= phaseDuration) {
      this.transitionToNextPhase();
    }
  }

  private transitionToNextPhase(): void {
    const phases: PhaseType[] = ['morning', 'afternoon', 'evening', 'night'];
    const currentIndex = phases.indexOf(this.currentPhase);
    
    // Don't cycle from night - day ends
    if (this.currentPhase === 'night') {
      console.log('=== DAY COMPLETE ===');
      this.onPhaseTransition?.({
        fromPhase: this.currentPhase,
        toPhase: 'complete',
        timestamp: Date.now()
      });
      return;
    }

    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];
    
    const transitionEvent: PhaseTransitionEvent = {
      fromPhase: this.currentPhase,
      toPhase: nextPhase,
      timestamp: Date.now()
    };

    const currentConfig = getPhaseConfig(this.currentPhase);
    console.log(`=== PHASE TRANSITION: ${this.currentPhase.toUpperCase()} → ${nextPhase.toUpperCase()} ===`);
    console.log(`Phase duration: ${currentConfig.duration}ms (${currentConfig.duration/1000}s)`);
    
    // Update current phase and reset timer
    this.currentPhase = nextPhase;
    this.phaseTimer = 0;

    // Trigger evening chaos event if entering evening phase
    if (nextPhase === 'evening') {
      console.log('=== EVENING CHAOS EVENT TRIGGERED ===');
      FlatmateManager.triggerEveningEvent(this.sceneManager);
    }

    // Notify listeners
    this.onPhaseTransition?.(transitionEvent);
  }

  getCurrentPhase(): PhaseType {
    return this.currentPhase;
  }

  getCurrentSpawnConfig(): SpawnConfig {
    const currentConfig = getPhaseConfig(this.currentPhase);
    return currentConfig.spawnConfig;
  }

  getCurrentPhaseDescription(): string {
    const currentConfig = getPhaseConfig(this.currentPhase);
    return currentConfig.description;
  }

  getCurrentPhaseColor(): number {
    const currentConfig = getPhaseConfig(this.currentPhase);
    return currentConfig.color;
  }

  getRemainingTime(): number {
    const currentConfig = getPhaseConfig(this.currentPhase);
    return Math.max(0, currentConfig.duration - this.phaseTimer);
  }

  setPhaseTransitionCallback(callback: (event: PhaseTransitionEvent) => void): void {
    this.onPhaseTransition = callback;
  }

  // Save state to registry
  saveState(): void {
    this.scene.game.registry.set('phaseManagerState', {
      currentPhase: this.currentPhase,
      phaseTimer: this.phaseTimer
    });
  }

  // Load state from registry
  loadState(): void {
    const state = this.scene.game.registry.get('phaseManagerState');
    if (state) {
      console.log(`Loading PhaseManager state: ${state.currentPhase}, timer: ${state.phaseTimer}ms`);
      this.currentPhase = state.currentPhase;
      this.phaseTimer = state.phaseTimer;
    } else {
      console.log('No PhaseManager state found, starting fresh');
    }
  }

  reset(): void {
    this.currentPhase = 'morning';
    this.phaseTimer = 0;
    // Clear saved state
    this.scene.game.registry.remove('phaseManagerState');
  }

  forcePhaseTransition(): void {
    console.log('Force phase transition called');
    this.transitionToNextPhase();
  }

  forceNextPhase(): void {
    console.log('ADMIN: Force next phase called');
    this.transitionToNextPhase();
  }

  fastForward(seconds: number): void {
    console.log(`ADMIN: Fast-forwarding phase timer by ${seconds} seconds`);
    this.phaseTimer += seconds * 1000; // Convert to milliseconds
    
    // Check if this triggers a phase transition
    const currentConfig = getPhaseConfig(this.currentPhase);
    if (this.phaseTimer >= currentConfig.duration) {
      console.log('ADMIN: Fast-forward triggered phase transition');
      this.transitionToNextPhase();
    }
  }
} 