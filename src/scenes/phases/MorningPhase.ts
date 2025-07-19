import Phaser from 'phaser';

export interface MorningPhaseOptions {
  scene: Phaser.Scene;
  sceneManager: Phaser.Scenes.SceneManager;
}

export interface SpawnConfig {
  maxMesses: number;
  maxBrokenItems: number;
}

export default class MorningPhase {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private complete: boolean = false;

  constructor(opts: MorningPhaseOptions) {
    this.scene = opts.scene;
    this.sceneManager = opts.sceneManager;
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Morning phase specific logic can be added here
    // For now, spawning is handled by MessItemManager with config from getSpawnConfig()
  }

  getSpawnConfig(): SpawnConfig {
    return {
      maxMesses: 5, // 5 messes total
      maxBrokenItems: 0, // No broken items
    };
  }

  getPhaseDescription(): string {
    return "Morning: Time to clean up the messes from last night!";
  }

  getPhaseColor(): number {
    return 0xFFD700; // Gold color for morning
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
