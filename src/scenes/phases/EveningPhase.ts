import Phaser from 'phaser';
import FlatmateManager from '../../flatmates/FlatmateManager';
import { SpawnConfig } from './MorningPhase';

export interface EveningPhaseOptions {
  scene: Phaser.Scene;
  sceneManager: Phaser.Scenes.SceneManager;
}

export default class EveningPhase {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private complete: boolean = false;
  private eventTriggered: boolean = false;

  constructor(opts: EveningPhaseOptions) {
    this.scene = opts.scene;
    this.sceneManager = opts.sceneManager;
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Trigger flatmate event once per evening phase
    if (!this.eventTriggered) {
      this.triggerFlatmateEvent();
      this.eventTriggered = true;
        }
      }

  private triggerFlatmateEvent(): void {
    FlatmateManager.triggerEveningEvent(this.sceneManager);
  }

  getSpawnConfig(): SpawnConfig {
    return {
      maxMesses: 0, // No messes - chaos events instead
      maxBrokenItems: 0 // No broken items - chaos events instead
    };
  }

  getPhaseDescription(): string {
    return "Evening: Chaos events and flatmate interactions!";
  }

  getPhaseColor(): number {
    return 0x8B008B; // Dark magenta for evening
  }

  isComplete(): boolean {
    return this.complete;
  }

  setComplete(): void {
    this.complete = true;
  }

  reset(): void {
    this.complete = false;
    this.eventTriggered = false;
  }
}
