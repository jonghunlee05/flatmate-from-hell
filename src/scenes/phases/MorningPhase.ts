import Phaser from 'phaser';
import MoodBar from '../../ui/MoodBar';
import Timer from '../../ui/Timer';

export interface MorningPhaseOptions {
  scene: Phaser.Scene;
  moodBar: MoodBar;
  timer: Timer;
}

interface Mess {
  rect: Phaser.GameObjects.Rectangle;
  spawnTime: number;
  cleaned: boolean;
  holdStart?: number;
}

export default class MorningPhase {
  private scene: Phaser.Scene;
  private moodBar: MoodBar;
  private timer: Timer;
  private messes: Mess[] = [];
  private messTimer: number = 0;
  private nextMessTime: number = 0;
  private moodDelta: number = 0;
  private complete: boolean = false;
  private messesSpawned: number = 0;
  private maxMesses: number = 8; // Morning: 8 messes total

  constructor(opts: MorningPhaseOptions) {
    this.scene = opts.scene;
    this.moodBar = opts.moodBar;
    this.timer = opts.timer;
    this.messTimer = 0;
    this.nextMessTime = Phaser.Math.Between(3000, 6000); // Faster spawning
    this.complete = false;
    this.moodDelta = 0;
    this.messesSpawned = 0;
    this.timer.start();
    this.timer.on('complete', () => {
      this.complete = true;
    });
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Mess spawning - spawn messes throughout the 60-second phase
    this.messTimer += delta;
    if (this.messTimer > this.nextMessTime && this.messesSpawned < this.maxMesses) {
      this.spawnMess();
      this.messTimer = 0;
      this.nextMessTime = Phaser.Math.Between(3000, 6000);
    }
    
    // Mess logic
    const now = this.scene.time.now;
    for (const mess of this.messes) {
      // If not cleaned and >10s old, penalize mood
      if (!mess.cleaned && now - mess.spawnTime > 10000) {
        mess.cleaned = true;
        mess.rect.destroy();
        this.moodDelta -= 5;
        this.moodBar.setMood(this.moodBar.getMood() - 5);
      }
      // If being held, check for cleaning
      if (!mess.cleaned && mess.holdStart !== undefined) {
        if (now - mess.holdStart > 2000) {
          mess.cleaned = true;
          mess.rect.destroy();
        }
      }
    }
    // Remove cleaned messes
    this.messes = this.messes.filter(m => !m.cleaned);
  }

  private spawnMess() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const x = Phaser.Math.Between(100, width - 100);
    const y = Phaser.Math.Between(180, height - 100);
    const rect = this.scene.add.rectangle(x, y, 60, 40, 0xFF2222, 1).setOrigin(0.5);
    rect.setInteractive({ useHandCursor: true });
    const mess: Mess = { rect, spawnTime: this.scene.time.now, cleaned: false };
    rect.on('pointerdown', () => {
      if (!mess.cleaned) mess.holdStart = this.scene.time.now;
    });
    rect.on('pointerup', () => {
      mess.holdStart = undefined;
    });
    rect.on('pointerout', () => {
      mess.holdStart = undefined;
    });
    this.messes.push(mess);
    this.messesSpawned++;
  }

  isComplete() {
    return this.complete;
  }

  getMoodDelta() {
    return this.moodDelta;
  }
}
