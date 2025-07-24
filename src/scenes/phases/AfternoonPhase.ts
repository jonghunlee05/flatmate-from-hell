import Phaser from 'phaser';
import { SpawnConfig } from './MorningPhase';

export interface AfternoonPhaseOptions {
  scene: Phaser.Scene;
  sceneManager: Phaser.Scenes.SceneManager;
}

export default class AfternoonPhase {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private complete: boolean = false;

  constructor(opts: AfternoonPhaseOptions) {
    this.scene = opts.scene;
    this.sceneManager = opts.sceneManager;
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Afternoon phase specific logic can be added here
    // For now, spawning is handled by MessItemManager with config from getSpawnConfig()
  }

  getSpawnConfig(): SpawnConfig {
    return {
      maxMesses: 3, // 3 messes total
      maxBrokenItems: 3 // 3 broken items total
    };
      }

  getPhaseDescription(): string {
    return "Afternoon: Both messes and broken items need attention!";
  }

  getPhaseColor(): number {
    return 0xFFA500; // Orange color for afternoon
  }

  isComplete(): boolean {
    return this.complete;
  }

  setComplete(): void {
    this.complete = true;
  }

  reset(): void {
    this.complete = false;
  }
}
