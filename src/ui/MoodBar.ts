import Phaser from 'phaser';

export default class MoodBar extends Phaser.GameObjects.Container {
  private barBg: Phaser.GameObjects.Rectangle;
  private barFill: Phaser.GameObjects.Rectangle;
  private barText: Phaser.GameObjects.Text;
  private barWidth: number;
  private barHeight: number;
  private mood: number = 100;

  constructor(scene: Phaser.Scene, x: number, y: number, width = 320, height = 32) {
    super(scene, x, y);
    this.barWidth = width;
    this.barHeight = height;
    this.barBg = scene.add.rectangle(0, 0, width, height, 0x222222, 1).setOrigin(0, 0.5);
    this.barFill = scene.add.rectangle(0, 0, width, height, 0x39FF14, 1).setOrigin(0, 0.5);
    this.barText = scene.add.text(width / 2, 0, 'Mood: 100%', {
      fontFamily: 'Courier, monospace', fontSize: '18px', color: '#fff'
    }).setOrigin(0.5);
    this.add([this.barBg, this.barFill, this.barText]);
    scene.add.existing(this);
    this.setMood(100);
  }

  setMood(mood: number) {
    this.mood = Phaser.Math.Clamp(mood, 0, 100);
    this.barFill.width = (this.barWidth * this.mood) / 100;
    this.barFill.setFillStyle(this.mood > 30 ? 0x39FF14 : 0xFF4500, 1);
    this.barText.setText(`Mood: ${Math.round(this.mood)}%`);
  }

  getMood() {
    return this.mood;
  }
} 