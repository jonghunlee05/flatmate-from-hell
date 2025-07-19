import Phaser from 'phaser';
import { SpawnConfig } from '../scenes/phases/MorningPhase';
import itemsData from '../data/items.json';

// Global registry for items across all rooms
export interface GlobalMess {
  id: string;
  roomName: string;
  x: number;
  y: number;
  roomIndex: number;
}

export interface GlobalBrokenItem {
  id: string;
  roomName: string;
  x: number;
  y: number;
  furnitureData: any;
  roomIndex: number;
}

export default class GlobalSpawnManager {
  private static instance: GlobalSpawnManager;
  private currentSpawnConfig: SpawnConfig;
  private isActive: boolean = false;
  private sceneManager: Phaser.Scenes.SceneManager | null = null;
  private phaseStartTime: number = 0;
  private spawnTimes: number[] = []; // When each item should spawn
  private nextSpawnIndex: number = 0;

  // Global registry for items across all rooms
  public static globalMesses: GlobalMess[] = [];
  public static globalBrokenItems: GlobalBrokenItem[] = [];

  private constructor() {
    // Default config
    this.currentSpawnConfig = {
      maxMesses: 0,
      maxBrokenItems: 0
    };
  }

  static getInstance(): GlobalSpawnManager {
    if (!GlobalSpawnManager.instance) {
      GlobalSpawnManager.instance = new GlobalSpawnManager();
    }
    return GlobalSpawnManager.instance;
  }

  initialize(sceneManager: Phaser.Scenes.SceneManager): void {
    this.sceneManager = sceneManager;
    this.isActive = true;
    console.log('GlobalSpawnManager initialized');
  }

  update(delta: number): void {
    if (!this.isActive || !this.sceneManager) return;

    const currentTime = this.sceneManager.game.getTime();
    const phaseElapsed = currentTime - this.phaseStartTime;

    // Check if it's time to spawn the next item
    while (this.nextSpawnIndex < this.spawnTimes.length && 
           phaseElapsed >= this.spawnTimes[this.nextSpawnIndex]) {
      
      console.log(`GlobalSpawnManager: Spawning item ${this.nextSpawnIndex + 1}/${this.spawnTimes.length} at ${(phaseElapsed/1000).toFixed(1)}s`);
      this.spawnNextItem();
      this.nextSpawnIndex++;
    }
  }

  private spawnNextItem(): void {
    const totalItems = this.currentSpawnConfig.maxMesses + this.currentSpawnConfig.maxBrokenItems;
    const currentMesses = GlobalSpawnManager.globalMesses.length;
    const currentBrokenItems = GlobalSpawnManager.globalBrokenItems.length;
    
    // Determine what type of item to spawn
    if (currentMesses < this.currentSpawnConfig.maxMesses && currentBrokenItems < this.currentSpawnConfig.maxBrokenItems) {
      // Spawn either mess or broken item randomly
      if (Math.random() < 0.5) {
        this.spawnMess();
      } else {
        this.spawnBrokenItem();
      }
    } else if (currentMesses < this.currentSpawnConfig.maxMesses) {
      // Only messes can be spawned
      this.spawnMess();
    } else if (currentBrokenItems < this.currentSpawnConfig.maxBrokenItems) {
      // Only broken items can be spawned
      this.spawnBrokenItem();
    }
  }

  private spawnMess(): void {
    // Always spawn in a random room
    const randomRoomName = this.getRandomRoomName();
    const roomIndex = this.getRoomIndex(randomRoomName);
    
    // Try to find a valid position that doesn't overlap with furniture
    let x: number, y: number;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Random position within room bounds (approximate)
      x = Phaser.Math.Between(100, 700);
      y = Phaser.Math.Between(100, 500);
      attempts++;
    } while (this.isPositionOverlappingFurniture(x, y, randomRoomName) && attempts < maxAttempts);
    
    // If we couldn't find a non-overlapping position, use the last generated position
    if (attempts >= maxAttempts) {
      console.log(`GlobalSpawnManager: Could not find non-overlapping position for mess in ${randomRoomName}, using fallback position`);
    }
    
    const messId = `mess_${Date.now()}_${Math.random()}`;
    
    // Add to global registry
    const globalMess: GlobalMess = {
      id: messId,
      roomName: randomRoomName,
      x,
      y,
      roomIndex
    };
    
    GlobalSpawnManager.globalMesses.push(globalMess);
    
    console.log(`GlobalSpawnManager: Mess spawned in ${randomRoomName} at (${x}, ${y})`);
    console.log(`GlobalSpawnManager: Total messes in registry: ${GlobalSpawnManager.globalMesses.length}`);
    console.log(`GlobalSpawnManager: Current spawn config - maxMesses: ${this.currentSpawnConfig.maxMesses}, maxBrokenItems: ${this.currentSpawnConfig.maxBrokenItems}`);
    
    // Try to show notification, but don't crash if it fails
    try {
      this.showGlobalNotification(`Mess generated at ${randomRoomName}`);
    } catch (error) {
      console.warn('GlobalSpawnManager: Could not show notification for mess spawn:', error);
    }
  }

  private isPositionOverlappingFurniture(x: number, y: number, roomName: string): boolean {
    const roomFurniture = itemsData.furniture[roomName as keyof typeof itemsData.furniture];
    
    if (!roomFurniture || roomFurniture.length === 0) {
      return false; // No furniture in this room
    }
    
    // Check if the position overlaps with any furniture
    for (const furniture of roomFurniture) {
      const furnitureLeft = furniture.x - furniture.width / 2;
      const furnitureRight = furniture.x + furniture.width / 2;
      const furnitureTop = furniture.y - furniture.height / 2;
      const furnitureBottom = furniture.y + furniture.height / 2;
      
      // Add some padding around furniture (20 pixels)
      const padding = 20;
      
      if (x >= furnitureLeft - padding && 
          x <= furnitureRight + padding && 
          y >= furnitureTop - padding && 
          y <= furnitureBottom + padding) {
        return true; // Position overlaps with furniture
      }
    }
    
    return false; // Position doesn't overlap with any furniture
  }

  private spawnBrokenItem(): void {
    // Always spawn in a random room
    const randomRoomName = this.getRandomRoomName();
    const roomFurniture = itemsData.furniture[randomRoomName as keyof typeof itemsData.furniture];
    
    if (!roomFurniture || roomFurniture.length === 0) {
      console.log(`GlobalSpawnManager: No furniture found for room: ${randomRoomName}`);
      return;
    }
    
    const randomFurniture = roomFurniture[Math.floor(Math.random() * roomFurniture.length)];
    const roomIndex = this.getRoomIndex(randomRoomName);
    
    const itemId = `broken_${Date.now()}_${Math.random()}`;
    
    // Add to global registry
    const globalBrokenItem: GlobalBrokenItem = {
      id: itemId,
      roomName: randomRoomName,
      x: randomFurniture.x,
      y: randomFurniture.y,
      furnitureData: randomFurniture,
      roomIndex
    };
    
    GlobalSpawnManager.globalBrokenItems.push(globalBrokenItem);
    
    console.log(`GlobalSpawnManager: Broken item spawned in ${randomRoomName} on ${randomFurniture.name}`);
    
    // Try to show notification, but don't crash if it fails
    try {
      this.showGlobalNotification(`${randomFurniture.name} broke at ${randomRoomName}`);
    } catch (error) {
      console.warn('GlobalSpawnManager: Could not show notification for broken item spawn:', error);
    }
  }

  private getRandomRoomName(): string {
    const rooms = ['Your Bedroom', 'Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry'];
    return rooms[Math.floor(Math.random() * rooms.length)];
  }

  private getRoomIndex(roomName: string): number {
    const roomMap: Record<string, number> = {
      'Your Bedroom': 0,
      'Flatmate Bedroom': 1,
      'Living Room': 2,
      'Kitchen': 3,
      'Bathroom': 4,
      'Laundry': 5
    };
    return roomMap[roomName] || 0;
  }

  private showGlobalNotification(message: string): void {
    // Emit global notification event
    if (this.sceneManager) {
      try {
        this.sceneManager.game.events.emit('showNotification', message);
        console.log(`GlobalSpawnManager: Notification sent: ${message}`);
      } catch (error) {
        console.error('GlobalSpawnManager: Error sending notification:', error);
      }
    } else {
      console.warn('GlobalSpawnManager: SceneManager not available for notification');
    }
  }

  updateSpawnConfig(config: SpawnConfig): void {
    console.log('GlobalSpawnManager: Updating spawn config', config);
    this.currentSpawnConfig = config;
    
    // Reset phase timing
    this.phaseStartTime = this.sceneManager?.game.getTime() || 0;
    this.nextSpawnIndex = 0;
    
    // Generate random spawn times for all items
    this.generateSpawnTimes();
  }

  private generateSpawnTimes(): void {
    this.spawnTimes = [];
    const totalItems = this.currentSpawnConfig.maxMesses + this.currentSpawnConfig.maxBrokenItems;
    const phaseDuration = 60000; // 60 seconds
    
    console.log(`GlobalSpawnManager: Generating ${totalItems} spawn times for ${phaseDuration}ms phase`);
    console.log(`GlobalSpawnManager: Config - maxMesses: ${this.currentSpawnConfig.maxMesses}, maxBrokenItems: ${this.currentSpawnConfig.maxBrokenItems}`);
    
    if (totalItems === 0) {
      console.log('GlobalSpawnManager: No items to spawn');
      return;
    }
    
    // Distribute spawns evenly throughout the phase
    const timeInterval = phaseDuration / (totalItems + 1); // +1 to avoid spawning at exactly 0s
    
    for (let i = 0; i < totalItems; i++) {
      // Spawn between 3 seconds and phase end, distributed evenly
      const spawnTime = 3000 + (i + 1) * timeInterval;
      this.spawnTimes.push(spawnTime);
    }
    
    // Add some randomness to the timing (±2 seconds)
    this.spawnTimes = this.spawnTimes.map(time => {
      const randomOffset = Phaser.Math.Between(-2000, 2000);
      return Math.max(1000, Math.min(phaseDuration - 1000, time + randomOffset));
    });
    
    // Sort spawn times chronologically
    this.spawnTimes.sort((a, b) => a - b);
    
    console.log('GlobalSpawnManager: Spawn times generated:', this.spawnTimes.map(t => `${t/1000}s`));
  }

  stop(): void {
    this.isActive = false;
  }

  start(): void {
    this.isActive = true;
  }

  reset(): void {
    this.phaseStartTime = this.sceneManager?.game.getTime() || 0;
    this.nextSpawnIndex = 0;
    this.spawnTimes = [];
  }

  // Static methods for global registry management
  static clearGlobalRegistry(): void {
    GlobalSpawnManager.globalMesses = [];
    GlobalSpawnManager.globalBrokenItems = [];
    console.log('GlobalSpawnManager: Global registry cleared');
  }

  static debugGlobalRegistry(): void {
    console.log('=== Global Registry Debug ===');
    console.log(`Global Messes: ${GlobalSpawnManager.globalMesses.length}`);
    GlobalSpawnManager.globalMesses.forEach(mess => {
      console.log(`  - ${mess.id} in ${mess.roomName} at (${mess.x}, ${mess.y})`);
    });
    console.log(`Global Broken Items: ${GlobalSpawnManager.globalBrokenItems.length}`);
    GlobalSpawnManager.globalBrokenItems.forEach(item => {
      console.log(`  - ${item.id} in ${item.roomName} on ${item.furnitureData.name}`);
    });
    console.log('============================');
  }

  // Manual spawn test method
  forceSpawnTest(): void {
    console.log('GlobalSpawnManager: Force spawning test items...');
    this.spawnMess();
    this.spawnBrokenItem();
  }
} 