import Phaser from 'phaser';

export interface GameState {
  currentPhase: 'morning' | 'afternoon' | 'evening' | 'night';
  phaseTime: number;
  messesSpawned: number;
  messesCleaned: number;
  brokenItemsSpawned: number;
  brokenItemsFixed: number;
  playerMood: number;
  cleanliness: number;
  flatmateRage: number;
  playerHealth: number;
}

export default class GameStateManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private onStateChange?: (state: GameState) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameState = this.getInitialState();
    this.loadStateFromRegistry();
  }

  private getInitialState(): GameState {
    return {
      currentPhase: 'morning',
      phaseTime: 0,
      messesSpawned: 0,
      messesCleaned: 0,
      brokenItemsSpawned: 0,
      brokenItemsFixed: 0,
      playerMood: 100,
      cleanliness: 100,
      flatmateRage: 0,
      playerHealth: 100
    };
  }

  private loadStateFromRegistry(): void {
    const storedState = this.scene.game.registry.get('gameState');
    if (storedState) {
      this.gameState = { ...this.gameState, ...storedState };
    }
  }

  update(delta: number): void {
    // PARAMETER DECAY DISABLED - Keep values static for now
    // this.updateParameterDecay(delta);
    
    // Save state to registry
    this.saveStateToRegistry();
    
    // Notify listeners
    this.onStateChange?.(this.gameState);
  }

  private updateParameterDecay(delta: number): void {
    const deltaSeconds = delta / 1000;
    
    // Cleanliness decreases when messes are present
    const activeMesses = this.getActiveMessesCount();
    if (activeMesses > 0) {
      const cleanlinessDecayRate = 0.5 + activeMesses * 1.5;
      this.gameState.cleanliness = Math.max(0, this.gameState.cleanliness - cleanlinessDecayRate * deltaSeconds);
    } else {
      // Gradually increase cleanliness when no messes are present
      const cleanlinessRecoveryRate = 0.3;
      this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + cleanlinessRecoveryRate * deltaSeconds);
    }
    
    // Mood decays based on cleanliness
    const cleanlinessFactor = Math.pow((100 - this.gameState.cleanliness) / 100, 2);
    const baseMoodDecayRate = 0.1;
    const cleanlinessMoodDecay = cleanlinessFactor * 2.0;
    const moodDecayRate = baseMoodDecayRate + cleanlinessMoodDecay;
    this.gameState.playerMood = Math.max(0, this.gameState.playerMood - moodDecayRate * deltaSeconds);
  }

  private getActiveMessesCount(): number {
    // Get active messes from the current scene's MessItemManager
    const currentScene = this.scene as any;
    if (currentScene.messItemManager) {
      return currentScene.messItemManager.getActiveMessesCount();
    }
    return 0;
  }

  private saveStateToRegistry(): void {
    this.scene.game.registry.set('gameState', this.gameState);
  }

  // State getters
  getState(): GameState {
    return { ...this.gameState };
  }

  getCurrentPhase(): string {
    return this.gameState.currentPhase;
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

  getMessesCleaned(): number {
    return this.gameState.messesCleaned;
  }

  getItemsFixed(): number {
    return this.gameState.brokenItemsFixed;
  }

  // State setters
  setCurrentPhase(phase: 'morning' | 'afternoon' | 'evening' | 'night'): void {
    this.gameState.currentPhase = phase;
  }

  onMessCleaned(): void {
    this.gameState.messesCleaned++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 5);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 10);
  }

  onItemRepaired(): void {
    this.gameState.brokenItemsFixed++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 3);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 5);
    this.gameState.playerHealth = Math.min(100, this.gameState.playerHealth + 2);
    this.gameState.flatmateRage = Math.max(0, this.gameState.flatmateRage - 3);
  }

  onPlayerHit(): void {
    this.gameState.playerHealth = Math.max(0, this.gameState.playerHealth - 15);
    console.log(`Player hit! Health: ${this.gameState.playerHealth}`);
  }

  setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  reset(): void {
    this.gameState = this.getInitialState();
    this.saveStateToRegistry();
  }
} 