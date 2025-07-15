import Phaser from 'phaser';
import MoodBar from '../../ui/MoodBar';
import Timer from '../../ui/Timer';

export interface AfternoonPhaseOptions {
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

interface BrokenItem {
  rect: Phaser.GameObjects.Rectangle;
  spawnTime: number;
  fixed: boolean;
  clickCount: number;
}

export default class AfternoonPhase {
  private scene: Phaser.Scene;
  private moodBar: MoodBar;
  private timer: Timer;
  private messes: Mess[] = [];
  private brokenItems: BrokenItem[] = [];
  private messTimer: number = 0;
  private nextMessTime: number = 0;
  private brokenItemTimer: number = 0;
  private nextBrokenItemTime: number = 0;
  private moodDelta: number = 0;
  private complete: boolean = false;

  constructor(opts: AfternoonPhaseOptions) {
    this.scene = opts.scene;
    this.moodBar = opts.moodBar;
    this.timer = opts.timer;
    this.messTimer = 0;
    this.nextMessTime = Phaser.Math.Between(5000, 8000);
    this.brokenItemTimer = 0;
    this.nextBrokenItemTime = 10000; // 10s
    this.complete = false;
    this.moodDelta = 0;
    this.timer.start();
    this.timer.on('complete', () => {
      this.complete = true;
    });
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    // Mess spawning
    this.messTimer += delta;
    if (this.messTimer > this.nextMessTime) {
      this.spawnMess();
      this.messTimer = 0;
      this.nextMessTime = Phaser.Math.Between(5000, 8000);
    }
    // Broken item spawning
    this.brokenItemTimer += delta;
    if (this.brokenItemTimer > this.nextBrokenItemTime) {
      this.spawnBrokenItem();
      this.brokenItemTimer = 0;
      this.nextBrokenItemTime = 10000; // always 10s
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
    // Broken item logic
    for (const item of this.brokenItems) {
      // If not fixed and >12s old, penalize mood
      if (!item.fixed && now - item.spawnTime > 12000) {
        item.fixed = true;
        item.rect.destroy();
        this.moodDelta -= 10;
        this.moodBar.setMood(this.moodBar.getMood() - 10);
      }
    }
    // Remove fixed items
    this.brokenItems = this.brokenItems.filter(i => !i.fixed);
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
  }

  private spawnBrokenItem() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const x = Phaser.Math.Between(100, width - 100);
    const y = Phaser.Math.Between(180, height - 100);
    const rect = this.scene.add.rectangle(x, y, 60, 40, 0x2266FF, 1).setOrigin(0.5);
    rect.setInteractive({ useHandCursor: true });
    const item: BrokenItem = { rect, spawnTime: this.scene.time.now, fixed: false, clickCount: 0 };
    rect.on('pointerdown', () => {
      if (!item.fixed) {
        item.clickCount++;
        // Flash effect for feedback
        rect.setFillStyle(0x66AAFF, 1);
        this.scene.time.delayedCall(80, () => rect.setFillStyle(0x2266FF, 1));
        if (item.clickCount >= 5) {
          item.fixed = true;
          rect.destroy();
        }
      }
    });
    this.brokenItems.push(item);
  }

  isComplete() {
    return this.complete;
  }

  getMoodDelta() {
    return this.moodDelta;
  }
}
