import BaseRoomScene, { DoorConfig } from './BaseRoomScene';

export default class LaundryScene extends BaseRoomScene {
  constructor() {
    super('LaundryScene', 'Laundry', 0x95a5a6);
    
    // Configure doors for this room
    this.doorConfigs = [
      {
        x: 800, // Top - to Living Room
        y: 100,
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
    // Add a washing machine
    this.add.rectangle(200, 200, 80, 100, 0xffffff, 0.8);
    this.add.text(200, 200, 'WASHER', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#000000'
    }).setOrigin(0.5);
    
    // Add a dryer
    this.add.rectangle(400, 200, 80, 100, 0xffffff, 0.8);
    this.add.text(400, 200, 'DRYER', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#000000'
    }).setOrigin(0.5);
    
    // Add a laundry basket
    this.add.rectangle(600, 200, 60, 80, 0x8B4513, 0.8);
    this.add.text(600, 200, 'BASKET', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
} 