import Phaser from 'phaser';
import MoodBar from '../../ui/MoodBar';
import Timer from '../../ui/Timer';

export interface EveningPhaseOptions {
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

interface FlyingObject {
  rect: Phaser.GameObjects.Rectangle;
  velocity: { x: number; y: number };
  dodged: boolean;
}

export default class EveningPhase {
  private scene: Phaser.Scene;
  private moodBar: MoodBar;
  private timer: Timer;
  private messes: Mess[] = [];
  private brokenItems: BrokenItem[] = [];
  private flyingObjects: FlyingObject[] = [];
  private messTimer: number = 0;
  private nextMessTime: number = 0;
  private brokenItemTimer: number = 0;
  private nextBrokenItemTime: number = 0;
  private chaosTimer: number = 0;
  private nextChaosTime: number = 0;
  private rageBar: Phaser.GameObjects.Rectangle;
  private rageFill: Phaser.GameObjects.Rectangle;
  private rageText: Phaser.GameObjects.Text;
  private rageLevel: number = 0;
  private moodDelta: number = 0;
  private complete: boolean = false;

  constructor(opts: EveningPhaseOptions) {
    this.scene = opts.scene;
    this.moodBar = opts.moodBar;
    this.timer = opts.timer;
    this.messTimer = 0;
    this.nextMessTime = Phaser.Math.Between(5000, 8000);
    this.brokenItemTimer = 0;
    this.nextBrokenItemTime = 10000;
    this.chaosTimer = 0;
    this.nextChaosTime = 15000; // 15s
    this.complete = false;
    this.moodDelta = 0;
    this.rageLevel = 0;
    
    // Create rage bar
    const width = this.scene.cameras.main.width;
    this.rageBar = this.scene.add.rectangle(width / 2 - 160, 100, 320, 20, 0x222222, 1).setOrigin(0, 0.5);
    this.rageFill = this.scene.add.rectangle(width / 2 - 160, 100, 0, 20, 0xFF4500, 1).setOrigin(0, 0.5);
    this.rageText = this.scene.add.text(width / 2, 100, 'Rage: 0%', {
      fontFamily: 'Courier, monospace', fontSize: '16px', color: '#fff'
    }).setOrigin(0.5);
    
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
    
    // Chaos events
    this.chaosTimer += delta;
    if (this.chaosTimer > this.nextChaosTime) {
      this.triggerChaos();
      this.chaosTimer = 0;
      this.nextChaosTime = 15000;
    }
    
    // Update flying objects
    this.updateFlyingObjects(delta);
    
    // Mess logic
    const now = this.scene.time.now;
    for (const mess of this.messes) {
      if (!mess.cleaned && now - mess.spawnTime > 10000) {
        mess.cleaned = true;
        mess.rect.destroy();
        this.moodDelta -= 5;
        this.moodBar.setMood(this.moodBar.getMood() - 5);
        this.increaseRage(5);
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
        this.increaseRage(10);
      }
    }
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

  private triggerChaos() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create flying object from random edge
    const side = Phaser.Math.Between(0, 3);
    let x, y, vx, vy;
    
    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(0, width);
        y = -50;
        vx = Phaser.Math.Between(-200, 200);
        vy = Phaser.Math.Between(100, 300);
        break;
      case 1: // right
        x = width + 50;
        y = Phaser.Math.Between(0, height);
        vx = Phaser.Math.Between(-300, -100);
        vy = Phaser.Math.Between(-200, 200);
        break;
      case 2: // bottom
        x = Phaser.Math.Between(0, width);
        y = height + 50;
        vx = Phaser.Math.Between(-200, 200);
        vy = Phaser.Math.Between(-300, -100);
        break;
      default: // left
        x = -50;
        y = Phaser.Math.Between(0, height);
        vx = Phaser.Math.Between(100, 300);
        vy = Phaser.Math.Between(-200, 200);
    }
    
    const rect = this.scene.add.rectangle(x, y, 40, 40, 0xFF0000, 1).setOrigin(0.5);
    rect.setInteractive({ useHandCursor: true });
    
    const flyingObject: FlyingObject = {
      rect,
      velocity: { x: vx, y: vy },
      dodged: false
    };
    
    rect.on('pointerdown', () => {
      if (!flyingObject.dodged) {
        flyingObject.dodged = true;
        rect.destroy();
        // Flash screen red
        const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0.3);
        this.scene.time.delayedCall(200, () => flash.destroy());
      }
    });
    
    this.flyingObjects.push(flyingObject);
  }

  private updateFlyingObjects(delta: number) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    for (const obj of this.flyingObjects) {
      if (!obj.dodged) {
        obj.rect.x += obj.velocity.x * delta / 1000;
        obj.rect.y += obj.velocity.y * delta / 1000;
        
        // Check if object hits player (center of screen)
        const playerX = width / 2;
        const playerY = height / 2;
        const distance = Phaser.Math.Distance.Between(obj.rect.x, obj.rect.y, playerX, playerY);
        
        if (distance < 50) {
          obj.dodged = true;
          obj.rect.destroy();
          this.moodDelta -= 15;
          this.moodBar.setMood(this.moodBar.getMood() - 15);
          this.increaseRage(15);
          
          // Flash screen red
          const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0.5);
          this.scene.time.delayedCall(300, () => flash.destroy());
        }
        
        // Remove if off screen
        if (obj.rect.x < -100 || obj.rect.x > width + 100 || 
            obj.rect.y < -100 || obj.rect.y > height + 100) {
          obj.dodged = true;
          obj.rect.destroy();
        }
      }
    }
    
    this.flyingObjects = this.flyingObjects.filter(obj => !obj.dodged);
  }

  private increaseRage(amount: number) {
    this.rageLevel = Phaser.Math.Clamp(this.rageLevel + amount, 0, 100);
    this.rageFill.width = (320 * this.rageLevel) / 100;
    this.rageText.setText(`Rage: ${Math.round(this.rageLevel)}%`);
    
    if (this.rageLevel >= 100) {
      // Game over condition
      this.moodDelta -= 50;
      this.moodBar.setMood(this.moodBar.getMood() - 50);
    }
  }

  isComplete() {
    return this.complete;
  }

  getMoodDelta() {
    return this.moodDelta;
  }

  getRageLevel() {
    return this.rageLevel;
  }
}
