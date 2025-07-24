import Phaser from 'phaser';

export default class PartyBro {
  static executeEveningEvent(scene: Phaser.Scene, eventDescription: string): void {
    switch (eventDescription) {
      case 'threw a wild party and trashed the living room':
        this.wildPartyEvent(scene);
        break;
      case 'spilled beer all over the kitchen counter':
        this.beerSpillEvent(scene);
        break;
      case 'left empty pizza boxes scattered everywhere':
        this.pizzaBoxesEvent(scene);
        break;
      case 'broke the TV while playing drinking games':
        this.brokenTVEvent(scene);
        break;
      case 'passed out on the couch and made a mess':
        this.couchMessEvent(scene);
        break;
      default:
        console.warn(`Unknown Party Bro event: ${eventDescription}`);
    }
  }

  private static wildPartyEvent(scene: Phaser.Scene): void {
    console.log('Party Bro: Wild party event - spawning messes in Living Room');
    // TODO: Implement wild party mess spawning in Living Room
    // - Spawn multiple messes in Living Room
    // - Maybe add some broken items
    // - Increase flatmate rage
  }

  private static beerSpillEvent(scene: Phaser.Scene): void {
    console.log('Party Bro: Beer spill event - spawning messes in Kitchen');
    // TODO: Implement beer spill mess spawning in Kitchen
    // - Spawn sticky messes in Kitchen
    // - Maybe break some kitchen items
  }

  private static pizzaBoxesEvent(scene: Phaser.Scene): void {
    console.log('Party Bro: Pizza boxes event - spawning messes everywhere');
    // TODO: Implement pizza boxes scattered across multiple rooms
    // - Spawn messes in 2-3 random rooms
    // - Increase mess count significantly
  }

  private static brokenTVEvent(scene: Phaser.Scene): void {
    console.log('Party Bro: Broken TV event - spawning broken item in Living Room');
    // TODO: Implement broken TV in Living Room
    // - Spawn a broken TV item in Living Room
    // - Maybe add some mess around it
  }

  private static couchMessEvent(scene: Phaser.Scene): void {
    console.log('Party Bro: Couch mess event - spawning mess in Living Room');
    // TODO: Implement couch mess in Living Room
    // - Spawn mess on/around the couch
    // - Maybe add some broken items nearby
    }
} 