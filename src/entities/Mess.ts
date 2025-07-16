import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';

export default class Mess extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBarBg: Phaser.GameObjects.Graphics;
  public readonly roomIndex: number;
  public isBeingCleaned: boolean = false;
  private cleaningProgress: number = 0;
  private cleaningSpeed: number = 1 / (GAME_CONFIG.CLEANING_TIME / 1000); // Progress per second
  private isCleaned: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, roomIndex: number) {
    super(scene, x, y);
    this.roomIndex = roomIndex;

    // Create mess sprite (brown circle placeholder)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(COLORS.MESS, 1);
    this.sprite.fillCircle(0, 0, 12);
    this.sprite.lineStyle(2, 0x654321);
    this.sprite.strokeCircle(0, 0, 12);
    
    // Create progress bar background
    this.progressBarBg = scene.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 0.8);
    this.progressBarBg.fillRect(-20, -30, 40, 6);
    this.progressBarBg.setVisible(false); // Hidden by default
    
    // Create progress bar
    this.progressBar = scene.add.graphics();
    this.progressBar.setVisible(false); // Hidden by default
    
    this.add([this.sprite, this.progressBarBg, this.progressBar]);
  }

  update(time: number, delta: number) {
    if (this.isBeingCleaned && !this.isCleaned) {
      this.cleaningProgress += this.cleaningSpeed * (delta / 1000);
      
      if (this.cleaningProgress >= 1) {
        this.completeCleaning();
      } else {
        this.updateProgressBar();
      }
    }
  }

  startCleaning() {
    if (!this.isCleaned) {
      this.isBeingCleaned = true;
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
    }
  }

  stopCleaning() {
    this.isBeingCleaned = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  private updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x39ff14, 1);
    this.progressBar.fillRect(-20, -30, 40 * this.cleaningProgress, 6);
  }

  private completeCleaning() {
    this.isCleaned = true;
    this.isBeingCleaned = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
    
    // Notify game scene - use try-catch to handle any issues
    try {
      const gameScene = this.scene as any;
      if (gameScene && typeof gameScene.onMessCleaned === 'function') {
        gameScene.onMessCleaned();
      }
    } catch (error) {
      console.warn('Could not notify scene of mess cleaning:', error);
    }
    
    // Destroy immediately to ensure proper cleanup
    this.destroy();
  }

  getRoomIndex(): number {
    return this.roomIndex;
  }

  isCleaning(): boolean {
    return this.isBeingCleaned;
  }

  isCompleted(): boolean {
    return this.isCleaned;
  }
} 