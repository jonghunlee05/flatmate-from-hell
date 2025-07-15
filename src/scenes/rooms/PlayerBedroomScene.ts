import BaseRoomScene, { DoorConfig } from './BaseRoomScene';

export default class PlayerBedroomScene extends BaseRoomScene {
  constructor() {
    super('PlayerBedroomScene', 'Your Bedroom', 0x4a90e2);
    
    // Configure doors for this room
    this.doorConfigs = [
      {
        x: 700, // Right side of room, near the edge
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ];
  }

  create() {
    super.create();
    
    // Set player starting position for this room
    this.game.registry.set('playerX', 300);
    this.game.registry.set('playerY', 400);
    
    // Add room-specific elements
    this.addRoomFurniture();
  }

  private addRoomFurniture() {
    // Add a bed (simple rectangle)
    this.add.rectangle(200, 200, 120, 80, 0x8B4513, 0.8);
    this.add.text(200, 200, 'BED', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add a desk
    this.add.rectangle(600, 200, 100, 60, 0x654321, 0.8);
    this.add.text(600, 200, 'DESK', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
} 