import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';

export default class BrokenItem extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBarBg: Phaser.GameObjects.Graphics;
  private isBeingRepaired: boolean = false;
  private repairProgress: number = 0;
  private repairSpeed: number = 1 / (GAME_CONFIG.REPAIR_TIME / 1000); // Progress per second
  private isRepaired: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Create broken item sprite (gray triangle placeholder)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(COLORS.BROKEN_ITEM, 1);
    this.sprite.fillTriangle(-12, 12, 12, 12, 0, -12);
    this.sprite.lineStyle(2, 0x666666);
    this.sprite.strokeTriangle(-12, 12, 12, 12, 0, -12);
    
    // Create progress bar background
    this.progressBarBg = scene.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 0.8);
    this.progressBarBg.fillRect(-20, -30, 40, 6);
    
    // Create progress bar
    this.progressBar = scene.add.graphics();
    
    this.add([this.sprite, this.progressBarBg, this.progressBar]);
    
    // Hide progress bars initially
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  update(time: number, delta: number) {
    if (this.isBeingRepaired && !this.isRepaired) {
      this.repairProgress += this.repairSpeed * (delta / 1000);
      
      if (this.repairProgress >= 1) {
        this.completeRepair();
      } else {
        this.updateProgressBar();
      }
    }
  }

  startRepair() {
    if (!this.isRepaired) {
      this.isBeingRepaired = true;
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
    }
  }

  stopRepair() {
    this.isBeingRepaired = false;
    this.repairProgress = 0; // Reset progress when stopped
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  private updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x3498db, 1);
    this.progressBar.fillRect(-20, -30, 40 * this.repairProgress, 6);
  }

  private completeRepair() {
    this.isRepaired = true;
    this.isBeingRepaired = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
    
    // Notify game scene
    const gameScene = this.scene as any;
    if (gameScene.onItemRepaired) {
      gameScene.onItemRepaired();
    }
    
    // Remove from scene after a short delay
    this.scene.time.delayedCall(500, () => {
      this.destroy();
    });
  }

  isRepairing(): boolean {
    return this.isBeingRepaired;
  }

  isCompleted(): boolean {
    return this.isRepaired;
  }
} 