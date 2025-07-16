import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';

export interface FurnitureData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export default class BrokenItem extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBarBg: Phaser.GameObjects.Graphics;
  private isBeingRepaired: boolean = false;
  private repairProgress: number = 0;
  private repairSpeed: number = 1 / (GAME_CONFIG.REPAIR_TIME / 1000); // Progress per second (3 seconds)
  private isRepaired: boolean = false;
  private furnitureData: FurnitureData;

  constructor(scene: Phaser.Scene, furnitureData: FurnitureData) {
    super(scene, furnitureData.x, furnitureData.y);
    this.furnitureData = furnitureData;

    // Create broken item sprite (red triangle to indicate broken state)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(0xff0000, 1); // Red to indicate broken
    this.sprite.fillTriangle(-15, 15, 15, 15, 0, -15);
    this.sprite.lineStyle(2, 0xcc0000);
    this.sprite.strokeTriangle(-15, 15, 15, 15, 0, -15);
    
    // Create progress bar background
    this.progressBarBg = scene.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 0.8);
    this.progressBarBg.fillRect(-25, -40, 50, 8);
    
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

  isRepairing() {
    return this.isBeingRepaired;
  }

  isCompleted() {
    return this.isRepaired;
  }

  private updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x3498db, 1);
    this.progressBar.fillRect(-25, -40, 50 * this.repairProgress, 8);
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

  getFurnitureData() {
    return this.furnitureData;
  }
} 