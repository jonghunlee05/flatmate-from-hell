import BaseRoomScene, { DoorConfig } from './BaseRoomScene';

export default class BathroomScene extends BaseRoomScene {
  constructor() {
    super('BathroomScene', 'Bathroom', 0x3498db);
    
    // Configure doors for this room
    this.doorConfigs = [
      {
        x: 600, // Top - to Living Room
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
    // Add a toilet
    this.add.rectangle(200, 200, 60, 80, 0xffffff, 0.8);
    this.add.text(200, 200, 'TOILET', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#000000'
    }).setOrigin(0.5);
    
    // Add a sink
    this.add.rectangle(400, 200, 80, 60, 0xcccccc, 0.8);
    this.add.text(400, 200, 'SINK', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#000000'
    }).setOrigin(0.5);
    
    // Add a shower
    this.add.rectangle(600, 200, 80, 100, 0xcccccc, 0.8);
    this.add.text(600, 200, 'SHOWER', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#000000'
    }).setOrigin(0.5);
  }
} 