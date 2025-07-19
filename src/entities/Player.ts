import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';

export default class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Graphics;
  private currentRoom: number = 0;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private speed: number = GAME_CONFIG.PLAYER_SPEED;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Create player sprite (green square placeholder)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(COLORS.PLAYER, 1);
    this.sprite.fillRect(-16, -16, 32, 32);
    this.sprite.lineStyle(2, 0x00cc00);
    this.sprite.strokeRect(-16, -16, 32, 32);
    
    this.add(this.sprite);
    
    // Add to scene
    scene.add.existing(this);
  }

  update(time: number, delta: number) {
    // Apply velocity with frame rate independence
    const deltaTime = delta / 1000; // Convert to seconds
    
    // Clamp delta time to prevent huge jumps (e.g., when tabbing back to browser)
    const clampedDelta = Math.min(deltaTime, 1/30); // Max 30 FPS equivalent
    
    this.x += this.velocityX * clampedDelta;
    this.y += this.velocityY * clampedDelta;

    // Keep player within bounds
    this.x = Phaser.Math.Clamp(this.x, 16, this.scene.cameras.main.width - 16);
    this.y = Phaser.Math.Clamp(this.y, 16, this.scene.cameras.main.height - 16);
  }

  setVelocity(x: number, y: number) {
    this.velocityX = x;
    this.velocityY = y;
  }

  resetVelocity() {
    this.velocityX = 0;
    this.velocityY = 0;
  }

  setCurrentRoom(roomIndex: number) {
    this.currentRoom = roomIndex;
  }

  getCurrentRoom(): number {
    return this.currentRoom;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }
} 