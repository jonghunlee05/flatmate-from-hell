import Phaser from 'phaser';
import Mess from '../entities/Mess';
import BrokenItem from '../entities/BrokenItem';
import { GlobalMess, GlobalBrokenItem } from './GlobalSpawnManager';

export interface SpawnConfig {
  maxMesses: number;
  maxBrokenItems: number;
}

export default class MessItemManager {
  private scene: Phaser.Scene;
  private messes: Mess[] = [];
  private brokenItems: BrokenItem[] = [];
  private onMessCleaned?: (mess: Mess) => void;
  private onItemRepaired?: (item: BrokenItem) => void;

  constructor(scene: Phaser.Scene, config: SpawnConfig) {
    this.scene = scene;
    console.log(`MessItemManager initialized for room: ${this.getRoomName()}`);
  }

  // Load and display items for the current room from global registry
  loadItemsForCurrentRoom(): void {
    const currentRoomName = this.getRoomName();
    console.log(`Loading items for room: ${currentRoomName}`);
    
    // Clear existing local items
    this.clearLocalItems();
    
    // Import GlobalSpawnManager to access global registry
    const GlobalSpawnManager = require('./GlobalSpawnManager').default;
    console.log(`Global registry has ${GlobalSpawnManager.globalMesses.length} messes and ${GlobalSpawnManager.globalBrokenItems.length} broken items`);
    
         // Load messes for current room
     GlobalSpawnManager.globalMesses.forEach((globalMess: GlobalMess) => {
      if (globalMess.roomName === currentRoomName) {
        console.log(`Creating visual mess for global mess ${globalMess.id} at (${globalMess.x}, ${globalMess.y})`);
        const mess = new Mess(this.scene, globalMess.x, globalMess.y, globalMess.roomIndex);
        
        this.messes.push(mess);
        
        // Add click handler
        mess.setInteractive({ useHandCursor: true });
        mess.on('pointerdown', () => this.cleanMess(mess));
        
        // Store reference to global ID
        (mess as any).globalId = globalMess.id;
        
        // Ensure visibility
        mess.setVisible(true);
        mess.setActive(true);
        
        if (!this.scene.children.exists(mess)) {
          this.scene.add.existing(mess);
        }
      }
    });
    
         // Load broken items for current room
     GlobalSpawnManager.globalBrokenItems.forEach((globalItem: GlobalBrokenItem) => {
      if (globalItem.roomName === currentRoomName) {
        console.log(`Creating visual broken item for global item ${globalItem.id} on ${globalItem.furnitureData.name}`);
        const furnitureData = {
          ...globalItem.furnitureData,
          x: globalItem.x,
          y: globalItem.y
        };
        
        const brokenItem = new BrokenItem(this.scene, furnitureData);
        
        this.brokenItems.push(brokenItem);
        
        // Add click handler
        brokenItem.setInteractive({ useHandCursor: true });
        brokenItem.on('pointerdown', () => this.repairItem(brokenItem));
        
        // Store reference to global ID
        (brokenItem as any).globalId = globalItem.id;
        
        // Ensure visibility
        brokenItem.setVisible(true);
        brokenItem.setActive(true);
        
        if (!this.scene.children.exists(brokenItem)) {
          this.scene.add.existing(brokenItem);
        }
      }
    });
    
    console.log(`Loaded ${this.messes.length} messes and ${this.brokenItems.length} broken items for ${currentRoomName}`);
  }

  private cleanMess(mess: Mess): void {
    const index = this.messes.indexOf(mess);
    if (index > -1) {
      this.messes.splice(index, 1);
      mess.destroy();
      
      // Remove from global registry
      const globalId = (mess as any).globalId;
      if (globalId) {
        const GlobalSpawnManager = require('./GlobalSpawnManager').default;
                 const globalIndex = GlobalSpawnManager.globalMesses.findIndex((m: GlobalMess) => m.id === globalId);
        if (globalIndex > -1) {
          GlobalSpawnManager.globalMesses.splice(globalIndex, 1);
          console.log(`Removed mess ${globalId} from global registry`);
        }
      }
      
      this.onMessCleaned?.(mess);
    }
  }

  private repairItem(item: BrokenItem): void {
    const index = this.brokenItems.indexOf(item);
    if (index > -1) {
      this.brokenItems.splice(index, 1);
      item.destroy();
      
      // Remove from global registry
      const globalId = (item as any).globalId;
      if (globalId) {
        const GlobalSpawnManager = require('./GlobalSpawnManager').default;
                 const globalIndex = GlobalSpawnManager.globalBrokenItems.findIndex((i: GlobalBrokenItem) => i.id === globalId);
        if (globalIndex > -1) {
          GlobalSpawnManager.globalBrokenItems.splice(globalIndex, 1);
          console.log(`Removed broken item ${globalId} from global registry`);
        }
      }
      
      this.onItemRepaired?.(item);
    }
  }

  private getRoomName(): string {
    const sceneKey = this.scene.scene.key || 'Unknown Room';
    
    // Map scene keys to room names used in items.json
    const roomNameMap: Record<string, string> = {
      'PlayerBedroomScene': 'Your Bedroom',
      'FlatmateBedroomScene': 'Flatmate Bedroom',
      'LivingRoomScene': 'Living Room',
      'KitchenScene': 'Kitchen',
      'BathroomScene': 'Bathroom',
      'LaundryScene': 'Laundry'
    };
    
    return roomNameMap[sceneKey] || sceneKey;
  }

  private clearLocalItems(): void {
    // Destroy all local messes
    this.messes.forEach(mess => mess.destroy());
    this.messes = [];
    
    // Destroy all local broken items
    this.brokenItems.forEach(item => item.destroy());
    this.brokenItems = [];
  }

  // Public getters
  getMesses(): Mess[] {
    return this.messes;
  }

  getBrokenItems(): BrokenItem[] {
    return this.brokenItems;
  }

  getActiveMessesCount(): number {
    return this.messes.length;
  }

  getActiveBrokenItemsCount(): number {
    return this.brokenItems.length;
  }

  // Callback setters
  setMessCleanedCallback(callback: (mess: Mess) => void): void {
    this.onMessCleaned = callback;
  }

  setItemRepairedCallback(callback: (item: BrokenItem) => void): void {
    this.onItemRepaired = callback;
  }

  // Cleanup methods
  clearAll(): void {
    this.clearLocalItems();
  }

  reset(): void {
    this.clearLocalItems();
  }

  // Legacy method for compatibility (does nothing now)
  updateSpawnConfig(config: Partial<SpawnConfig>): void {
    // Spawning is now handled by GlobalSpawnManager
  }

  // Legacy method for compatibility (does nothing now)
  update(delta: number): void {
    // Spawning is now handled by GlobalSpawnManager
  }
} 