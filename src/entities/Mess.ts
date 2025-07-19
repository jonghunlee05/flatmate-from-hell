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
  private _isCompleted: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, roomIndex: number) {
    super(scene, x, y);
    this.roomIndex = roomIndex;

    // Create mess sprite (brown circle placeholder)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(COLORS.MESS, 1);
    this.sprite.fillCircle(0, 0, 12);
    this.sprite.lineStyle(2, 0x654321);
    this.sprite.strokeCircle(0, 0, 12);
    
    this.add(this.sprite);
    
    // Create progress bar background
    this.progressBarBg = scene.add.graphics();
    this.progressBarBg.fillStyle(0x000000, 0.8);
    this.progressBarBg.fillRect(-30, -40, 60, 8);
    this.progressBarBg.setVisible(false);
    
    // Create progress bar
    this.progressBar = scene.add.graphics();
    this.progressBar.fillStyle(0x39ff14, 1);
    this.progressBar.fillRect(-30, -40, 0, 8);
    this.progressBar.setVisible(false);
    
    this.add(this.progressBarBg);
    this.add(this.progressBar);
    
    // Set container size for proper interaction
    this.setSize(24, 24);
  }

  startCleaning() {
    if (!this._isCompleted) {
      this.isBeingCleaned = true;
      this.cleaningProgress = 0;
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
      this.updateProgressBar();
    }
  }

  stopCleaning() {
    this.isBeingCleaned = false;
    this.cleaningProgress = 0;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  update(time: number, delta: number) {
    if (this.isBeingCleaned && !this._isCompleted) {
      this.cleaningProgress += this.cleaningSpeed * (delta / 1000);
      
      if (this.cleaningProgress >= 1) {
        this.completeCleaning();
      } else {
        this.updateProgressBar();
      }
    }
  }

  private updateProgressBar() {
    const fillWidth = 60 * this.cleaningProgress;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x39ff14, 1);
    this.progressBar.fillRect(-30, -40, fillWidth, 8);
  }

  private completeCleaning() {
    this._isCompleted = true;
    this.isBeingCleaned = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
    
    // Notify game scene through events
    this.scene.events.emit('messCleaned', this);
    
    // Destroy immediately
    this.destroy();
  }

  getRoomIndex(): number {
    return this.roomIndex;
  }

  isCleaning(): boolean {
    return this.isBeingCleaned;
  }

  isCleaned(): boolean {
    return this._isCompleted;
  }

  isCompleted(): boolean {
    return this._isCompleted;
  }
} 