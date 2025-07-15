import BaseRoomScene, { DoorConfig } from './BaseRoomScene';

export default class FlatmateBedroomScene extends BaseRoomScene {
  constructor() {
    super('FlatmateBedroomScene', 'Flatmate Bedroom', 0x9b59b6);
    
    // Configure doors for this room
    this.doorConfigs = [
      {
        x: 100, // Left side - to Living Room
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
    
    // Add room-specific elements
    this.addRoomFurniture();
  }

  private addRoomFurniture() {
    // Add a bed
    this.add.rectangle(200, 200, 120, 80, 0x8B4513, 0.8);
    this.add.text(200, 200, 'BED', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add a wardrobe
    this.add.rectangle(600, 200, 80, 120, 0x654321, 0.8);
    this.add.text(600, 200, 'WARDROBE', {
      fontFamily: 'Courier, monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
} 