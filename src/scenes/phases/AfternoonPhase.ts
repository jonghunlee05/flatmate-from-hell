import Phaser from 'phaser';
import MoodBar from '../../ui/MoodBar';
import Timer from '../../ui/Timer';
import BrokenItem from '../../entities/BrokenItem';
import FurnitureManager from '../../systems/FurnitureManager';

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
  private messesSpawned: number = 0;
  private brokenItemsSpawned: number = 0;
  private maxMesses: number = 6; // Afternoon: 6 messes
  private maxBrokenItems: number = 3; // Afternoon: 3 broken items

  constructor(opts: AfternoonPhaseOptions) {
    this.scene = opts.scene;
    this.moodBar = opts.moodBar;
    this.timer = opts.timer;
    this.messTimer = 0;
    this.nextMessTime = Phaser.Math.Between(4000, 7000);
    this.brokenItemTimer = 0;
    this.nextBrokenItemTime = 8000; // First broken item after 8 seconds
    this.complete = false;
    this.moodDelta = 0;
    this.messesSpawned = 0;
    this.brokenItemsSpawned = 0;
    this.timer.start();
    this.timer.on('complete', () => {
      this.complete = true;
    });
  }

  update(time: number, delta: number) {
    if (this.complete) return;
    
    // Mess spawning
    this.messTimer += delta;
    if (this.messTimer > this.nextMessTime && this.messesSpawned < this.maxMesses) {
      this.spawnMess();
      this.messTimer = 0;
      this.nextMessTime = Phaser.Math.Between(4000, 7000);
    }
    
    // Broken item spawning
    this.brokenItemTimer += delta;
    if (this.brokenItemTimer > this.nextBrokenItemTime && this.brokenItemsSpawned < this.maxBrokenItems) {
      this.spawnBrokenItem();
      this.brokenItemTimer = 0;
      this.nextBrokenItemTime = Phaser.Math.Between(8000, 12000); // Spawn broken items every 8-12 seconds
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
      if (!item.isCompleted()) {
        // For now, we'll use a simple timeout - in a full implementation we'd track spawn time
        this.moodDelta -= 0.1; // Small continuous penalty
        this.moodBar.setMood(this.moodBar.getMood() - 0.1);
      }
    }
    // Remove completed items
    this.brokenItems = this.brokenItems.filter(i => !i.isCompleted());
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

  private spawnBrokenItem() {
    // Get a random room for the broken item
    const rooms = ['Kitchen', 'Living Room', 'Your Bedroom', 'Flatmate Bedroom', 'Bathroom', 'Laundry'];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const furnitureData = FurnitureManager.getRandomFurniture(randomRoom);
    
    if (furnitureData) {
      const brokenItem = new BrokenItem(this.scene, furnitureData);
      this.brokenItems.push(brokenItem);
      this.scene.add.existing(brokenItem);
      this.brokenItemsSpawned++;
    }
  }

  isComplete() {
    return this.complete;
  }

  getMoodDelta() {
    return this.moodDelta;
  }
}
