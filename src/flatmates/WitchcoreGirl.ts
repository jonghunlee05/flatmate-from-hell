import Phaser from 'phaser';

export default class WitchcoreGirl {
  static executeEveningEvent(scene: Phaser.Scene, eventDescription: string): void {
    switch (eventDescription) {
      case 'summoned a demon that left scorch marks everywhere':
        this.demonSummoningEvent(scene);
        break;
      case 'conducted a ritual that stained the walls with mysterious symbols':
        this.ritualStainsEvent(scene);
        break;
      case 'brewed a potion that exploded in the kitchen':
        this.potionExplosionEvent(scene);
        break;
      case 'summoned spirits that knocked over all the furniture':
        this.spiritChaosEvent(scene);
        break;
      case 'created a portal that sucked up half the room\'s contents':
        this.portalDisasterEvent(scene);
        break;
      default:
        console.warn(`Unknown Witchcore Girl event: ${eventDescription}`);
    }
  }

  private static demonSummoningEvent(scene: Phaser.Scene): void {
    console.log('Witchcore Girl: Demon summoning event - creating scorch marks');
    // TODO: Implement demon summoning effects
    // - Create scorch mark messes in multiple rooms
    // - Maybe add some broken items with demonic damage
    // - Increase flatmate rage significantly
  }

  private static ritualStainsEvent(scene: Phaser.Scene): void {
    console.log('Witchcore Girl: Ritual stains event - staining walls with symbols');
    // TODO: Implement ritual stain effects
    // - Create special "stain" messes that are harder to clean
    // - Maybe add some supernatural broken items
  }

  private static potionExplosionEvent(scene: Phaser.Scene): void {
    console.log('Witchcore Girl: Potion explosion event - kitchen disaster');
    // TODO: Implement potion explosion effects
    // - Spawn multiple messes in Kitchen
    // - Break several kitchen items
    // - Maybe affect other nearby rooms
  }

  private static spiritChaosEvent(scene: Phaser.Scene): void {
    console.log('Witchcore Girl: Spirit chaos event - furniture knocked over');
    // TODO: Implement spirit chaos effects
    // - Spawn messes and broken items in multiple rooms
    // - Maybe add some "floating" visual effects
  }

  private static portalDisasterEvent(scene: Phaser.Scene): void {
    console.log('Witchcore Girl: Portal disaster event - room contents sucked away');
    // TODO: Implement portal disaster effects
    // - Remove some existing messes (sucked into portal)
    // - Add new "portal residue" messes
    // - Maybe break some items with portal damage
  }
} 