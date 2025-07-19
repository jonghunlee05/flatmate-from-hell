import Phaser from 'phaser';
import flatmateData from '../data/flatmates.json';
import PartyBro from './PartyBro';
import WitchcoreGirl from './WitchcoreGirl';
// import StartupGuy from './StartupGuy'; // TODO: Fix import issue

export interface Flatmate {
  id: string;
  name: string;
  quote: string;
  difficulty: string;
  eveningEvents: string[];
}

export interface EveningEvent {
  id: string;
  description: string;
  execute: (scene: Phaser.Scene) => void;
}

export default class FlatmateManager {
  static getFlatmateById(id: string): Flatmate | null {
    const flatmate = flatmateData.flatmates.find(f => f.id === id);
    return flatmate || null;
  }

  static getSelectedFlatmate(scene: Phaser.Scene): Flatmate | null {
    const selectedId = scene.game.registry.get('selectedFlatmateId');
    if (!selectedId) return null;
    return this.getFlatmateById(selectedId);
  }

  static getRandomEveningEvent(flatmate: Flatmate): string {
    const randomIndex = Math.floor(Math.random() * flatmate.eveningEvents.length);
    return flatmate.eveningEvents[randomIndex];
  }

  static triggerEveningEvent(sceneManager: Phaser.Scenes.SceneManager): void {
    // Get the first active scene to access the registry
    const activeScene = sceneManager.getScene('LivingRoomScene') || 
                       sceneManager.getScene('KitchenScene') || 
                       sceneManager.getScene('BathroomScene') ||
                       sceneManager.getScene('PlayerBedroomScene') ||
                       sceneManager.getScene('FlatmateBedroomScene') ||
                       sceneManager.getScene('LaundryScene');
    
    if (!activeScene) {
      console.warn('No active scene found for evening event');
      return;
    }

    const flatmate = this.getSelectedFlatmate(activeScene);
    if (!flatmate) {
      console.warn('No flatmate selected for evening event');
      return;
    }

    const event = this.getRandomEveningEvent(flatmate);
    console.log(`Evening phase: ${flatmate.name} triggered event: ${event}`);
    
    // Show notification
    this.showEveningEventNotification(activeScene, flatmate.name, event);
    
    // Execute the event logic (to be implemented)
    this.executeEveningEvent(activeScene, flatmate.id, event);
  }

  private static showEveningEventNotification(scene: Phaser.Scene, flatmateName: string, event: string): void {
    // Show notification using scene events
    scene.events.emit('showNotification', `EVENING CHAOS! ${flatmateName} has done ${event}.`);
  }

  private static executeEveningEvent(scene: Phaser.Scene, flatmateId: string, eventDescription: string): void {
    // This will be expanded to call specific event handlers for each flatmate
    switch (flatmateId) {
      case 'party_bro':
        this.executePartyBroEvent(scene, eventDescription);
        break;
      case 'witchcore_girl':
        this.executeWitchcoreGirlEvent(scene, eventDescription);
        break;
      case 'startup_guy':
        this.executeStartupGuyEvent(scene, eventDescription);
        break;
      default:
        console.warn(`No event handler for flatmate: ${flatmateId}`);
    }
  }

  private static executePartyBroEvent(scene: Phaser.Scene, eventDescription: string): void {
    PartyBro.executeEveningEvent(scene, eventDescription);
  }

  private static executeWitchcoreGirlEvent(scene: Phaser.Scene, eventDescription: string): void {
    WitchcoreGirl.executeEveningEvent(scene, eventDescription);
  }

  private static executeStartupGuyEvent(scene: Phaser.Scene, eventDescription: string): void {
    // TODO: Fix StartupGuy import issue
    console.log('Startup Guy event would execute:', eventDescription);
  }
} 