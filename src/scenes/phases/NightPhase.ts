import Phaser from 'phaser';
import MoodBar from '../../ui/MoodBar';
import Timer from '../../ui/Timer';

export interface NightPhaseOptions {
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

interface SupernaturalEvent {
  rect: Phaser.GameObjects.Rectangle;
  spawnTime: number;
  banished: boolean;
  tapCount: number;
  lastTapTime: number;
  type: 'ghost' | 'floating_mess';
}

export default class NightPhase {
  private scene: Phaser.Scene;
  private moodBar: MoodBar;
  private timer: Timer;
  private messes: Mess[] = [];
  private brokenItems: BrokenItem[] = [];
  private supernaturalEvents: SupernaturalEvent[] = [];
  private messTimer: number = 0;
  private nextMessTime: number = 0;
  private brokenItemTimer: number = 0;
  private nextBrokenItemTime: number = 0;
  private supernaturalTimer: number = 0;
  private nextSupernaturalTime: number = 0;
  private moodDelta: number = 0;
  private complete: boolean = false;

  constructor(opts: NightPhaseOptions) {
    this.scene = opts.scene;
    this.moodBar = opts.moodBar;
    this.timer = opts.timer;
    this.messTimer = 0;
    this.nextMessTime = Phaser.Math.Between(5000, 8000);
    this.brokenItemTimer = 0;
    this.nextBrokenItemTime = 10000;
    this.supernaturalTimer = 0;
    this.nextSupernaturalTime = Phaser.Math.Between(8000, 12000);
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
      this.nextBrokenItemTime = 10000;
    }
    
    // Supernatural events
    this.supernaturalTimer += delta;
    if (this.supernaturalTimer > this.nextSupernaturalTime) {
      this.spawnSupernaturalEvent();
      this.supernaturalTimer = 0;
      this.nextSupernaturalTime = Phaser.Math.Between(8000, 12000);
    }
    
    // Mess logic
    const now = this.scene.time.now;
    for (const mess of this.messes) {
      if (!mess.cleaned && now - mess.spawnTime > 10000) {
        mess.cleaned = true;
        mess.rect.destroy();
        this.moodDelta -= 5;
        this.moodBar.setMood(this.moodBar.getMood() - 5);
      }
      if (!mess.cleaned && mess.holdStart !== undefined) {
        if (now - mess.holdStart > 2000) {
          mess.cleaned = true;
          mess.rect.destroy();
        }
      }
    }
    this.messes = this.messes.filter(m => !m.cleaned);
    
    // Broken item logic
    for (const item of this.brokenItems) {
      if (!item.fixed && now - item.spawnTime > 12000) {
        item.fixed = true;
        item.rect.destroy();
        this.moodDelta -= 10;
        this.moodBar.setMood(this.moodBar.getMood() - 10);
      }
    }
    this.brokenItems = this.brokenItems.filter(i => !i.fixed);
    
    // Supernatural event logic
    for (const event of this.supernaturalEvents) {
      if (!event.banished && now - event.spawnTime > 15000) {
        event.banished = true;
        event.rect.destroy();
        this.moodDelta -= 20;
        this.moodBar.setMood(this.moodBar.getMood() - 20);
      }
    }
    this.supernaturalEvents = this.supernaturalEvents.filter(e => !e.banished);
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

  private spawnSupernaturalEvent() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const x = Phaser.Math.Between(100, width - 100);
    const y = Phaser.Math.Between(180, height - 100);
    
    const eventType = Math.random() > 0.5 ? 'ghost' : 'floating_mess';
    const color = eventType === 'ghost' ? 0x8A2BE2 : 0xFF69B4; // Purple for ghost, pink for floating mess
    const size = eventType === 'ghost' ? 50 : 40;
    
    const rect = this.scene.add.rectangle(x, y, size, size, color, 1).setOrigin(0.5);
    rect.setInteractive({ useHandCursor: true });
    
    // Add eerie glow effect
    const glow = this.scene.add.rectangle(x, y, size + 10, size + 10, color, 0.3).setOrigin(0.5);
    
    const event: SupernaturalEvent = {
      rect,
      spawnTime: this.scene.time.now,
      banished: false,
      tapCount: 0,
      lastTapTime: 0,
      type: eventType
    };
    
    // Add floating animation
    this.scene.tweens.add({
      targets: [rect, glow],
      y: y + 20,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    rect.on('pointerdown', () => {
      if (!event.banished) {
        const now = this.scene.time.now;
        event.tapCount++;
        event.lastTapTime = now;
        
        // Flash effect
        rect.setFillStyle(color === 0x8A2BE2 ? 0x9932CC : 0xFF1493, 1);
        glow.setFillStyle(color === 0x8A2BE2 ? 0x9932CC : 0xFF1493, 0.5);
        this.scene.time.delayedCall(100, () => {
          rect.setFillStyle(color, 1);
          glow.setFillStyle(color, 0.3);
        });
        
        // Play eerie SFX placeholder (visual feedback)
        this.playEerieSFX();
        
        // Check if 3 fast taps completed
        if (event.tapCount >= 3) {
          event.banished = true;
          rect.destroy();
          glow.destroy();
          
          // Banish effect
          const banishEffect = this.scene.add.rectangle(x, y, 100, 100, 0xFFFFFF, 0.8);
          this.scene.tweens.add({
            targets: banishEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => banishEffect.destroy()
          });
        }
      }
    });
    
    this.supernaturalEvents.push(event);
  }

  private playEerieSFX() {
    // Placeholder for eerie sound effect
    // In a real implementation, this would play an audio file
    // For now, we'll create a visual "sound wave" effect
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create a ripple effect from the center
    const ripple = this.scene.add.circle(width / 2, height / 2, 10, 0x8A2BE2, 0.5);
    this.scene.tweens.add({
      targets: ripple,
      radius: 200,
      alpha: 0,
      duration: 1000,
      onComplete: () => ripple.destroy()
    });
  }

  isComplete() {
    return this.complete;
  }

  getMoodDelta() {
    return this.moodDelta;
  }
}
