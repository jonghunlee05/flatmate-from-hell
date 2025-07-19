import Phaser from 'phaser';
import { SpawnConfig } from './MorningPhase';

export interface NightPhaseOptions {
  scene: Phaser.Scene;
  sceneManager: Phaser.Scenes.SceneManager;
}

export default class NightPhase {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private complete: boolean = false;

  constructor(opts: NightPhaseOptions) {
    this.scene = opts.scene;
    this.sceneManager = opts.sceneManager;
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Night phase specific logic can be added here
    // Future: Add stealth mechanics and flatmate rage management
    // For now, spawning is handled by MessItemManager with config from getSpawnConfig()
  }

  getSpawnConfig(): SpawnConfig {
    return {
      maxMesses: 0, // No messes at night
      maxBrokenItems: 0 // No broken items at night
    };
  }

  getPhaseDescription(): string {
    return "Night: Time to rest and prepare for tomorrow!";
  }

  getPhaseColor(): number {
    return 0x191970; // Midnight blue for night
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
