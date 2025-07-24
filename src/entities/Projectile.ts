import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Arc;
  private velocityX: number;
  private velocityY: number;
  private speed: number = 400; // pixels per second (doubled from 200)
  private lifetime: number = 3000; // 3 seconds
  private startTime: number;

  constructor(scene: Phaser.Scene, x: number, y: number, targetX: number, targetY: number) {
    super(scene, x, y);
    
    this.startTime = scene.time.now;
    
    // Create projectile sprite (red circle)
    this.sprite = scene.add.circle(0, 0, 8, 0xff0000, 1);
    this.add(this.sprite);
    
    // Calculate direction to target
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    this.velocityX = Math.cos(angle) * this.speed;
    this.velocityY = Math.sin(angle) * this.speed;
    
    scene.add.existing(this);
    this.setDepth(1000); // Ensure projectile is on top
    
    // Add update listener
    scene.events.on('update', this.update, this);
  }

  update(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    
    // Update position
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
    
    // Check if projectile is out of bounds or expired
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const isOutOfBounds = this.x < -50 || this.x > width + 50 || 
                         this.y < -50 || this.y > height + 50;
    const isExpired = time - this.startTime > this.lifetime;
    
    if (isOutOfBounds || isExpired) {
      this.destroy();
    }
  }

  destroy(): void {
    // Remove update listener
    this.scene.events.off('update', this.update, this);
    super.destroy();
  }

  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 8, this.y - 8, 16, 16);
  }
} 