import Phaser from 'phaser';

export default class Room extends Phaser.GameObjects.Container {
  public readonly index: number;
  public readonly name: string;
  public readonly width: number;
  public readonly height: number;
  public readonly centerX: number;
  public readonly centerY: number;
  
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, name: string, color: number, index: number) {
    super(scene, x, y);
    
    this.index = index;
    this.name = name;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;

    // Create room background with yellow color
    this.background = scene.add.rectangle(0, 0, width, height, 0xffff00, 0.3);
    
    // Create room border
    this.border = scene.add.rectangle(0, 0, width, height, color, 0);
    this.border.setStrokeStyle(3, color);
    
    // Create room name text
    this.nameText = scene.add.text(0, -height / 2 + 20, name, {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5);
    
    this.add([this.background, this.border, this.nameText]);
  }

  public isPointInside(x: number, y: number): boolean {
    const localX = x - this.x;
    const localY = y - this.y;
    
    return localX >= 0 && localX <= this.width &&
           localY >= 0 && localY <= this.height;
  }

  public getRandomPosition(): { x: number, y: number } {
    const margin = 20;
    return {
      x: this.x + margin + Math.random() * (this.width - 2 * margin),
      y: this.y + margin + Math.random() * (this.height - 2 * margin)
    };
  }

  public highlight() {
    this.border.setStrokeStyle(5, 0x39ff14);
  }

  public unhighlight() {
    this.border.setStrokeStyle(3, this.border.strokeColor);
  }
} 