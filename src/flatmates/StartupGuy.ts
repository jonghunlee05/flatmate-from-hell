import Phaser from 'phaser';

export default class StartupGuy {
  static executeEveningEvent(scene: Phaser.Scene, eventDescription: string): void {
    switch (eventDescription) {
      case 'tested his \'revolutionary\' dishwashing app and flooded the kitchen':
        this.dishwashingAppEvent(scene);
        break;
      case 'conducted a \'disruption workshop\' that destroyed the dining table':
        this.disruptionWorkshopEvent(scene);
        break;
      case 'demoed his \'smart home\' system that malfunctioned and broke everything':
        this.smartHomeMalfunctionEvent(scene);
        break;
      case 'held a \'pitch meeting\' that turned into a food fight':
        this.pitchMeetingEvent(scene);
        break;
      case 'experimented with his \'automated cleaning robot\' that went haywire':
        this.cleaningRobotEvent(scene);
        break;
      default:
        console.warn(`Unknown Startup Guy event: ${eventDescription}`);
    }
  }

  private static dishwashingAppEvent(scene: Phaser.Scene): void {
    console.log('Startup Guy: Dishwashing app event - kitchen flooding');
    // TODO: Implement dishwashing app disaster
    // - Spawn water-related messes in Kitchen
    // - Maybe break some kitchen appliances
    // - Affect nearby rooms with water damage
  }

  private static disruptionWorkshopEvent(scene: Phaser.Scene): void {
    console.log('Startup Guy: Disruption workshop event - dining table destroyed');
    // TODO: Implement disruption workshop disaster
    // - Spawn messes in Living Room/Dining area
    // - Break dining table and related furniture
    // - Maybe add some "innovation" themed broken items
  }

  private static smartHomeMalfunctionEvent(scene: Phaser.Scene): void {
    console.log('Startup Guy: Smart home malfunction event - system-wide chaos');
    // TODO: Implement smart home malfunction
    // - Spawn messes and broken items across multiple rooms
    // - Maybe add some tech-themed broken items
    // - Increase flatmate rage due to tech frustration
  }

  private static pitchMeetingEvent(scene: Phaser.Scene): void {
    console.log('Startup Guy: Pitch meeting event - food fight chaos');
    // TODO: Implement pitch meeting food fight
    // - Spawn food-related messes in Living Room/Kitchen
    // - Maybe break some presentation equipment
    // - Add some "pitch deck" themed messes
  }

  private static cleaningRobotEvent(scene: Phaser.Scene): void {
    console.log('Startup Guy: Cleaning robot event - robot went haywire');
    // TODO: Implement cleaning robot disaster
    // - Spawn messes across multiple rooms (robot went everywhere)
    // - Maybe add some robot parts as broken items
    // - Create a trail of cleaning product messes
  }
} 