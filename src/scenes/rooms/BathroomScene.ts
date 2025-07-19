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

  protected createDoors(): void {
    // Create door rectangles
    this.doorConfigs.forEach(doorConfig => {
      const door = this.add.rectangle(
        doorConfig.x + doorConfig.width / 2,
        doorConfig.y + doorConfig.height / 2,
        doorConfig.width,
        doorConfig.height,
        0x654321,
        0.8
      ).setStrokeStyle(2, 0x39ff14);
      
      // Add door label
      this.add.text(
        doorConfig.x + doorConfig.width / 2,
        doorConfig.y + doorConfig.height / 2,
        doorConfig.label,
        {
          fontFamily: 'Courier, monospace',
          fontSize: '12px',
          color: '#ffffff'
        }
      ).setOrigin(0.5);
      
      this.doors.push(door);
    });
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