import BaseRoomScene, { DoorConfig } from './BaseRoomScene';

export default class LivingRoomScene extends BaseRoomScene {
  constructor() {
    super('LivingRoomScene', 'Living Room', 0x27ae60);
    
    // Configure doors for this room
    this.doorConfigs = [
      {
        x: 100, // Left side - to Player Bedroom
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'PlayerBedroomScene',
        targetRoom: 'Your Bedroom',
        label: 'Your Bedroom'
      },
      {
        x: 1180, // Right side - to Flatmate Bedroom
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'FlatmateBedroomScene',
        targetRoom: 'Flatmate Bedroom',
        label: 'Flatmate Bedroom'
      },
      {
        x: 400, // Bottom - to Kitchen
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'KitchenScene',
        targetRoom: 'Kitchen',
        label: 'Kitchen'
      },
      {
        x: 600, // Bottom - to Bathroom
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'BathroomScene',
        targetRoom: 'Bathroom',
        label: 'Bathroom'
      },
      {
        x: 800, // Bottom - to Laundry
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'LaundryScene',
        targetRoom: 'Laundry',
        label: 'Laundry'
      }
    ];
  }

  create() {
    super.create();
    
    // Add room-specific elements
    this.addRoomFurniture();
  }

  private addRoomFurniture() {
    // Add a couch
    this.add.rectangle(200, 200, 150, 80, 0x8B4513, 0.8);
    this.add.text(200, 200, 'COUCH', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add a TV
    this.add.rectangle(600, 200, 100, 60, 0x000000, 0.8);
    this.add.text(600, 200, 'TV', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add a coffee table
    this.add.rectangle(400, 300, 80, 50, 0x654321, 0.8);
    this.add.text(400, 300, 'TABLE', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
} 