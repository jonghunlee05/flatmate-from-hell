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
  private furnitureData: FurnitureData;
  public isRepairing: boolean = false;
  private repairProgress: number = 0;
  private repairSpeed: number = 1 / (GAME_CONFIG.REPAIR_TIME / 1000); // Progress per second
  private _isCompleted: boolean = false;

  constructor(scene: Phaser.Scene, furnitureData: FurnitureData) {
    super(scene, furnitureData.x, furnitureData.y);
    this.furnitureData = furnitureData;

    console.log(`BrokenItem: Creating broken item on ${furnitureData.name} at (${furnitureData.x}, ${furnitureData.y})`);

    // Create broken item sprite (red triangle to indicate broken state)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(0xff0000, 1); // Red to indicate broken
    this.sprite.fillTriangle(-15, 15, 15, 15, 0, -15);
    this.sprite.lineStyle(2, 0xcc0000);
    this.sprite.strokeTriangle(-15, 15, 15, 15, 0, -15);
    this.sprite.setDepth(1000); // Ensure it's on top
    
    this.add(this.sprite);
    
    // Create progress bar background
    this.progressBarBg = scene.add.graphics();
    this.progressBarBg.fillStyle(0x000000, 0.8);
    this.progressBarBg.fillRect(-35, -50, 70, 10);
    this.progressBarBg.setVisible(false);
    this.progressBarBg.setDepth(1001); // Ensure it's on top
    
    // Create progress bar
    this.progressBar = scene.add.graphics();
    this.progressBar.fillStyle(0x3498db, 1); // Blue for repairing
    this.progressBar.fillRect(-35, -50, 0, 10);
    this.progressBar.setVisible(false);
    this.progressBar.setDepth(1002); // Ensure it's on top
    
    this.add(this.progressBarBg);
    this.add(this.progressBar);
    
    // Set container size for proper interaction
    this.setSize(30, 30);
    
    // Set the entire container to a high depth
    this.setDepth(1000);
    
    console.log(`BrokenItem: Broken item created successfully on ${furnitureData.name}`);
  }

  startRepair() {
    if (!this._isCompleted) {
      this.isRepairing = true;
      this.repairProgress = 0;
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
      this.updateProgressBar();
    }
  }

  stopRepair() {
    this.isRepairing = false;
    this.repairProgress = 0;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  update(time: number, delta: number) {
    if (this.isRepairing && !this._isCompleted) {
      this.repairProgress += this.repairSpeed * (delta / 1000);
      
      if (this.repairProgress >= 1) {
        this.completeRepair();
      } else {
        this.updateProgressBar();
      }
    }
  }

  private updateProgressBar() {
    const fillWidth = 70 * this.repairProgress;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x3498db, 1);
    this.progressBar.fillRect(-35, -50, fillWidth, 10);
  }

  private completeRepair() {
    this._isCompleted = true;
    this.isRepairing = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
    
    // Notify game scene through events
    this.scene.events.emit('itemRepaired', this);
    
    // Destroy immediately
      this.destroy();
  }

  getIsRepairing(): boolean {
    return this.isRepairing;
  }

  isRepaired(): boolean {
    return this._isCompleted;
  }

  isCompleted(): boolean {
    return this._isCompleted;
  }

  getFurnitureData() {
    return this.furnitureData;
  }
} 