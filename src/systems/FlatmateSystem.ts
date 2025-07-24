import Phaser from 'phaser';
import FlatmateManager from '../flatmates/FlatmateManager';
import Projectile from '../entities/Projectile';
import TimerManager from './TimerManager';
import { getRoomName, getRandomRoomName } from '../data/roomConfig';
import { MathUtils } from '../utils/MathUtils';
import { StateManager } from './StateManager';

export interface FlatmatePosition {
  room: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export interface DoorConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  targetScene: string;
  targetRoom: string;
  label: string;
}

export default class FlatmateSystem {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private flatmateSprite?: Phaser.GameObjects.Arc;
  private flatmateLabel?: Phaser.GameObjects.Text;
  private currentRoom: string = '';
  private moveSpeed: number = 80; // pixels per second (increased from 50)
  private flatmateTargetX?: number;
  private flatmateTargetY?: number;
  private onRoomChange?: (fromRoom: string, toRoom: string) => void;
  
  // Door movement properties
  private isMovingToDoor: boolean = false;
  private targetDoor?: DoorConfig;
  private doorConfigs: DoorConfig[] = [];
  
  // Chasing properties
  private isChasingPlayer: boolean = false;
  private lastPlayerRoom: string = '';
  private chaseSpeed: number = 100; // Much faster when chasing (increased from 40)
  
  // Dynamic chasing properties
  private chaseMode: 'aggressive' | 'stealth' | 'patrol' | 'ambush' = 'aggressive';
  private lastBehaviorChange: number = 0;
  private behaviorChangeInterval: number = 8000; // Change behavior every 8 seconds
  private chaseIntensity: number = 0.7; // 0-1 scale of how aggressive the chase is
  private lastPlayerPosition: { x: number; y: number; room: string } | null = null;
  private predictionTarget: { x: number; y: number } | null = null;
  private ambushPosition: { x: number; y: number } | null = null;
  
  // Night phase properties
  private projectiles: Projectile[] = [];
  private isNightPhase: boolean = false;
  private player?: any; // Reference to player for collision detection
  
  // Global night phase tracking
  private static globalNightPhase: boolean = false;
  
  // Centralized timer management
  private timerManager: TimerManager;
  private stateManager: StateManager;

  constructor(scene: Phaser.Scene, sceneManager: Phaser.Scenes.SceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.timerManager = TimerManager.getInstance(scene);
    this.stateManager = StateManager.getInstance(scene);
    this.currentRoom = this.stateManager.getFlatmateRoom();
    
    // Ensure flatmate doesn't start in player's bedroom
    if (this.currentRoom === 'Your Bedroom') {
      this.currentRoom = 'Living Room';
      this.stateManager.setFlatmateRoom('Living Room');
    }
    
    // Check if night phase is already active globally
    this.isNightPhase = FlatmateSystem.globalNightPhase;
    
    // Start the chasing system
    this.startChasingSystem();
    
    // Start the movement timer immediately (for random movement when not chasing)
    this.scheduleFlatmateMove();
  }

  update(delta: number): void {
    if (this.flatmateSprite) {
      this.updateFlatmateMovement(delta);
      this.updateFlatmateLabel();
    }
  }

  spawnFlatmateIfNeeded(roomName: string): void {
    const flatmateRoom = this.scene.registry.get('flatmateRoom') || 'Living Room';
    
    // Only spawn if this is the flatmate's current room
    if (roomName !== flatmateRoom) {
      this.removeFlatmate();
      return;
    }

    // Spawn flatmate if not already present
    if (!this.flatmateSprite) {
      this.createFlatmateSprite();
      // Don't schedule another timer - it's already running globally
    }
  }

  private createFlatmateSprite(): void {
    // Create flatmate as a red circle
    this.flatmateSprite = this.scene.add.circle(200, 200, 15, 0xff0000);
    
    // Add label
    this.flatmateLabel = this.scene.add.text(200, 200, 'FLATMATE', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Set initial random position
    this.setNewFlatmateTarget();
  }

  private startChasingSystem(): void {
    // Start a timer that checks player location and decides whether to chase
    this.timerManager.addTimer('chaseBehavior', 1000, () => {
      this.updateChasingBehavior();
    }, true);
  }

  private updateChasingBehavior(): void {
    if (!this.player) return;
    
    const playerRoom = this.getPlayerRoom();
    const flatmateRoom = this.getCurrentRoom();
    const currentTime = this.scene.time.now;
    
    // Update player position tracking
    this.updatePlayerPositionTracking();
    
    // Update last known player room
    if (playerRoom !== this.lastPlayerRoom) {
      this.lastPlayerRoom = playerRoom;
      console.log(`Player moved to ${playerRoom}, flatmate in ${flatmateRoom}`);
    }
    
    // Change behavior periodically
    if (currentTime - this.lastBehaviorChange > this.behaviorChangeInterval) {
      this.changeChaseBehavior();
      this.lastBehaviorChange = currentTime;
    }
    
    // Decide whether to chase based on phase, distance, and current behavior
    if (this.shouldChasePlayer()) {
      if (!this.isChasingPlayer) {
        console.log(`Flatmate starting to chase player in ${this.chaseMode} mode!`);
        this.isChasingPlayer = true;
        this.startChasingPlayer();
      }
    } else {
      if (this.isChasingPlayer) {
        console.log('Flatmate stopping chase, returning to random movement');
        this.isChasingPlayer = false;
        this.stopChasingPlayer();
      }
    }
  }

  private updatePlayerPositionTracking(): void {
    if (!this.player) return;
    
    const currentPosition = {
      x: this.player.x,
      y: this.player.y,
      room: this.getPlayerRoom()
    };
    
    // Store last position for prediction
    this.lastPlayerPosition = currentPosition;
    
    // Update chase intensity based on player movement
    this.updateChaseIntensity();
  }

  private updateChaseIntensity(): void {
    if (!this.lastPlayerPosition || !this.player) return;
    
    const currentRoom = this.getCurrentRoom();
    const playerRoom = this.getPlayerRoom();
    
    // Increase intensity if player is moving between rooms frequently
    if (currentRoom !== playerRoom) {
      this.chaseIntensity = Math.min(1.0, this.chaseIntensity + 0.1);
    } else {
      // Gradually decrease intensity when in same room
      this.chaseIntensity = Math.max(0.3, this.chaseIntensity - 0.05);
    }
    
    // Night phase increases intensity
    if (this.isNightPhase) {
      this.chaseIntensity = Math.max(this.chaseIntensity, 0.8);
    }
  }

  private changeChaseBehavior(): void {
    const behaviors: Array<'aggressive' | 'stealth' | 'patrol' | 'ambush'> = ['aggressive', 'stealth', 'patrol', 'ambush'];
    
    // Weight behaviors based on current situation
    const weights = this.calculateBehaviorWeights();
    
    // Select behavior based on weights
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < behaviors.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        this.chaseMode = behaviors[i];
        break;
      }
    }
    
    console.log(`Flatmate changing behavior to: ${this.chaseMode}`);
    
    // Apply behavior-specific changes
    this.applyBehaviorChanges();
  }

  private calculateBehaviorWeights(): number[] {
    const playerRoom = this.getPlayerRoom();
    const flatmateRoom = this.getCurrentRoom();
    const inSameRoom = playerRoom === flatmateRoom;
    
    // Base weights
    let aggressive = 0.3;
    let stealth = 0.2;
    let patrol = 0.3;
    let ambush = 0.2;
    
    // Adjust based on situation
    if (this.isNightPhase) {
      aggressive += 0.3;
      stealth -= 0.1;
      patrol -= 0.1;
      ambush += 0.2;
    }
    
    if (inSameRoom) {
      aggressive += 0.2;
      stealth += 0.1;
      patrol -= 0.2;
      ambush += 0.1;
    } else {
      patrol += 0.2;
      ambush += 0.1;
      aggressive -= 0.1;
    }
    
    if (this.chaseIntensity > 0.8) {
      aggressive += 0.2;
      stealth -= 0.1;
    }
    
    // Normalize weights
    const total = aggressive + stealth + patrol + ambush;
    return [aggressive / total, stealth / total, patrol / total, ambush / total];
  }

  private applyBehaviorChanges(): void {
    switch (this.chaseMode) {
      case 'aggressive':
        this.chaseSpeed = 120; // Fastest
        this.behaviorChangeInterval = 6000; // Change behavior more frequently
        break;
      case 'stealth':
        this.chaseSpeed = 60; // Slower but more unpredictable
        this.behaviorChangeInterval = 12000; // Change behavior less frequently
        break;
      case 'patrol':
        this.chaseSpeed = 80; // Medium speed
        this.behaviorChangeInterval = 10000;
        break;
      case 'ambush':
        this.chaseSpeed = 90; // Fast but calculated
        this.behaviorChangeInterval = 15000; // Stay in ambush mode longer
        this.setupAmbush();
        break;
    }
  }

  private setupAmbush(): void {
    if (!this.player) return;
    
    // Predict where player might go and set up ambush position
    const playerRoom = this.getPlayerRoom();
    const flatmateRoom = this.getCurrentRoom();
    
    if (playerRoom === flatmateRoom) {
      // Set ambush position near player but out of sight
      const ambushX = this.player.x + MathUtils.random(-100, 100);
      const ambushY = this.player.y + MathUtils.random(-100, 100);
      
      // Constrain to room boundaries
      const clampedPosition = MathUtils.clampToRoomBounds(
        ambushX, ambushY,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        50
      );
      this.ambushPosition = clampedPosition;
      
      console.log('Flatmate setting up ambush position');
    }
  }

  private shouldChasePlayer(): boolean {
    const playerRoom = this.getPlayerRoom();
    const flatmateRoom = this.getCurrentRoom();
    
    // Base chase probability based on phase
    let baseChaseProbability = this.isNightPhase ? 0.8 : 0.3;
    
    // Adjust based on chase mode
    switch (this.chaseMode) {
      case 'aggressive':
        baseChaseProbability += 0.3;
        break;
      case 'stealth':
        baseChaseProbability -= 0.1;
        break;
      case 'patrol':
        baseChaseProbability += 0.1;
        break;
      case 'ambush':
        // In ambush mode, only chase if player is close or moving
        if (playerRoom === flatmateRoom) {
          return this.shouldAmbushChase();
        }
        baseChaseProbability += 0.2;
        break;
    }
    
    // Adjust based on chase intensity
    baseChaseProbability *= this.chaseIntensity;
    
    // Cap probability
    baseChaseProbability = Math.min(0.95, baseChaseProbability);
    
    // During night phase, always chase if not in same room
    if (this.isNightPhase && flatmateRoom !== playerRoom) {
      return true;
    }
    
    // Apply probability
    return Math.random() < baseChaseProbability;
  }

  private shouldAmbushChase(): boolean {
    if (!this.player || !this.ambushPosition) return false;
    
    const distanceToPlayer = MathUtils.distance(
      this.ambushPosition.x, this.ambushPosition.y,
      this.player.x, this.player.y
    );
    
    // Chase if player is close to ambush position or moving quickly
    const isCloseToAmbush = distanceToPlayer < 80;
    const isPlayerMoving = this.isPlayerMovingQuickly();
    
    return isCloseToAmbush || isPlayerMoving;
  }

  private isPlayerMovingQuickly(): boolean {
    if (!this.player || !this.lastPlayerPosition) return false;
    
    const currentTime = this.scene.time.now;
    const timeDiff = currentTime - this.lastBehaviorChange;
    
    if (timeDiff < 1000) return false; // Need some time to measure movement
    
    const distance = MathUtils.distance(
      this.lastPlayerPosition.x, this.lastPlayerPosition.y,
      this.player.x, this.player.y
    );
    
    // Consider player moving quickly if they've moved more than 50 pixels in 1 second
    return distance > 50;
  }

  private updateChaseTarget(): void {
    if (!this.player) return;
    
    switch (this.chaseMode) {
      case 'aggressive':
        // Direct pursuit
        this.flatmateTargetX = this.player.x;
        this.flatmateTargetY = this.player.y;
        break;
        
      case 'stealth':
        // Try to approach from behind or side
        this.flatmateTargetX = this.player.x + Phaser.Math.Between(-30, 30);
        this.flatmateTargetY = this.player.y + Phaser.Math.Between(-30, 30);
        break;
        
      case 'patrol':
        // Move to strategic positions around player
        const patrolAngle = this.scene.time.now * 0.001; // Rotate around player
        const patrolRadius = 60;
        this.flatmateTargetX = this.player.x + Math.cos(patrolAngle) * patrolRadius;
        this.flatmateTargetY = this.player.y + Math.sin(patrolAngle) * patrolRadius;
        break;
        
      case 'ambush':
        // Move to ambush position if set, otherwise approach carefully
        if (this.ambushPosition) {
          this.flatmateTargetX = this.ambushPosition.x;
          this.flatmateTargetY = this.ambushPosition.y;
        } else {
          this.flatmateTargetX = this.player.x + Phaser.Math.Between(-50, 50);
          this.flatmateTargetY = this.player.y + Phaser.Math.Between(-50, 50);
        }
        break;
    }
  }

  private getChaseDistance(): number {
    switch (this.chaseMode) {
      case 'aggressive':
        return 15; // Close pursuit
      case 'stealth':
        return 40; // Keep distance
      case 'patrol':
        return 30; // Medium distance
      case 'ambush':
        return 25; // Close enough to strike
      default:
        return 20;
    }
  }

  private startChasingPlayer(): void {
    // Cancel any existing random movement
    this.timerManager.removeTimer('flatmateMove');
    
    // Start moving toward player's room
    this.moveFlatmateToPlayerRoom();
  }

  private stopChasingPlayer(): void {
    // Resume random movement
    this.scheduleFlatmateMove();
  }

  private moveFlatmateToPlayerRoom(): void {
    const playerRoom = this.getPlayerRoom();
    const flatmateRoom = this.getCurrentRoom();
    
    if (playerRoom === flatmateRoom) {
      // Already in same room, start chasing within the room
      this.chasePlayerInRoom();
      return;
    }
    
    // Player is in different room, move to that room
    console.log(`Flatmate chasing player to ${playerRoom}`);
    
    // Find the door that leads to the player's room
    const targetDoor = this.findDoorToRoom(playerRoom);
    
    if (targetDoor) {
      // Start moving to the door
      this.isMovingToDoor = true;
      this.targetDoor = targetDoor;
      this.flatmateTargetX = targetDoor.x + targetDoor.width / 2;
      this.flatmateTargetY = targetDoor.y + targetDoor.height / 2;
      console.log(`Flatmate chasing to door: ${targetDoor.label}`);
    } else {
      console.warn(`No door found to ${playerRoom}, teleporting instead`);
      // Fallback to teleport if no door found
      this.teleportToRoom(playerRoom);
    }
  }

  private chasePlayerInRoom(): void {
    if (!this.player || !this.flatmateSprite) return;
    
    // Set target to player's current position
    this.flatmateTargetX = this.player.x;
    this.flatmateTargetY = this.player.y;
    
    console.log('Flatmate chasing player within room');
  }

  private scheduleFlatmateMove(): void {
    this.timerManager.removeTimer('flatmateMove');

    console.log('Scheduling flatmate move');
    
    // Use random timer for movement
    this.timerManager.addRandomTimer('flatmateMove', 5000, 15000, () => {
      console.log('Flatmate move timer triggered!');
      this.moveFlatmateToAnotherRoom();
    });
  }

  private moveFlatmateToAnotherRoom(): void {
    const rooms = ['Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry']; // Exclude 'Your Bedroom'
    const currentRoom = this.stateManager.getFlatmateRoom();
    const availableRooms = rooms.filter(room => room !== currentRoom);
    const nextRoom = MathUtils.randomElement(availableRooms);
    
    console.log(`Flatmate moving from ${currentRoom} to ${nextRoom}`);
    console.log(`Available rooms: ${availableRooms.join(', ')}`);
    
    // Find the door that leads to the target room
    const targetDoor = this.findDoorToRoom(nextRoom);
    
    if (targetDoor) {
      // Start moving to the door
      this.isMovingToDoor = true;
      this.targetDoor = targetDoor;
      this.flatmateTargetX = targetDoor.x + targetDoor.width / 2;
      this.flatmateTargetY = targetDoor.y + targetDoor.height / 2;
      console.log(`Flatmate moving to door: ${targetDoor.label}`);
    } else {
      console.warn(`No door found to ${nextRoom}, teleporting instead`);
      // Fallback to teleport if no door found
      this.teleportToRoom(nextRoom);
    }
  }

  private findDoorToRoom(targetRoom: string): DoorConfig | undefined {
    // Get door configs from the current scene
    const currentScene = this.sceneManager.getScene(this.scene.scene.key);
    if (!currentScene) {
      console.warn('No current scene found');
      return undefined;
    }

    // Access doorConfigs safely with type checking
    const sceneWithDoors = currentScene as any;
    if (!sceneWithDoors.doorConfigs) {
      console.warn('No door configs found in current scene');
      return undefined;
    }

    const doorConfigs = sceneWithDoors.doorConfigs as DoorConfig[];
    return doorConfigs.find(door => door.targetRoom === targetRoom);
  }

  private teleportToRoom(roomName: string): void {
    // Update state
    this.stateManager.setFlatmateRoom(roomName);
    
    // Notify listeners
    this.onRoomChange?.(this.currentRoom, roomName);
    
    // Schedule next move
    this.scheduleFlatmateMove();
  }

  private updateFlatmateMovement(delta: number): void {
    if (!this.flatmateSprite) return;

    const deltaSeconds = delta / 1000;
    const moveSpeed = this.isChasingPlayer ? this.chaseSpeed : this.moveSpeed; // Use base speed for normal movement, chase speed when chasing
    
    // Check if we're moving to a door
    if (this.isMovingToDoor && this.targetDoor && this.flatmateTargetX && this.flatmateTargetY) {
      const distance = MathUtils.distance(
        this.flatmateSprite.x, this.flatmateSprite.y,
        this.flatmateTargetX, this.flatmateTargetY
      );

      if (distance > 10) {
        // Move towards door
        const angle = MathUtils.angle(
          this.flatmateSprite.x, this.flatmateSprite.y,
          this.flatmateTargetX, this.flatmateTargetY
        );
        
        const velocity = MathUtils.velocityFromAngle(angle, moveSpeed, deltaSeconds);
        
        // Update position
        this.flatmateSprite.x += velocity.x;
        this.flatmateSprite.y += velocity.y;
      } else {
        // Reached the door, transition to new room
        console.log(`Flatmate reached door to ${this.targetDoor.targetRoom}`);
        this.transitionThroughDoor();
      }
      return;
    }
    
    // Chasing behavior within room
    if (this.isChasingPlayer && this.player) {
      this.updateChaseTarget();
      
      if (this.flatmateTargetX !== undefined && this.flatmateTargetY !== undefined) {
        const distance = MathUtils.distance(
          this.flatmateSprite.x, this.flatmateSprite.y,
          this.flatmateTargetX, this.flatmateTargetY
        );

        if (distance > this.getChaseDistance()) {
          // Move towards target
          const angle = MathUtils.angle(
            this.flatmateSprite.x, this.flatmateSprite.y,
            this.flatmateTargetX, this.flatmateTargetY
          );
          
          const velocity = MathUtils.velocityFromAngle(angle, moveSpeed, deltaSeconds);
          
          // Update position with boundary checking
          const newX = this.flatmateSprite.x + velocity.x;
          const newY = this.flatmateSprite.y + velocity.y;
          
          // Constrain to room boundaries
          const clampedPosition = MathUtils.clampToRoomBounds(
            newX, newY, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height, 
            50
          );
          this.flatmateSprite.x = clampedPosition.x;
          this.flatmateSprite.y = clampedPosition.y;
        }
      }
      return;
    }
    
    // Normal random movement within room boundaries (when not chasing)
    if (!this.flatmateTargetX || !this.flatmateTargetY) {
      this.setNewFlatmateTarget();
    }
    
    if (this.flatmateTargetX && this.flatmateTargetY) {
      const distance = MathUtils.distance(
        this.flatmateSprite.x, this.flatmateSprite.y,
        this.flatmateTargetX, this.flatmateTargetY
      );

      if (distance > 10) {
        // Move towards target
        const angle = MathUtils.angle(
          this.flatmateSprite.x, this.flatmateSprite.y,
          this.flatmateTargetX, this.flatmateTargetY
        );
        
        const velocity = MathUtils.velocityFromAngle(angle, moveSpeed, deltaSeconds);
        
        // Update position with boundary checking
        const newX = this.flatmateSprite.x + velocity.x;
        const newY = this.flatmateSprite.y + velocity.y;
        
        // Constrain to room boundaries
        const clampedPosition = MathUtils.clampToRoomBounds(
          newX, newY, 
          this.scene.cameras.main.width, 
          this.scene.cameras.main.height, 
          50
        );
        this.flatmateSprite.x = clampedPosition.x;
        this.flatmateSprite.y = clampedPosition.y;
      } else {
        // Reached target, set new one
        this.setNewFlatmateTarget();
      }
    }
  }

  private transitionThroughDoor(): void {
    if (!this.targetDoor) return;
    
    const fromRoom = this.currentRoom;
    const toRoom = this.targetDoor.targetRoom;
    
    console.log(`Flatmate transitioning from ${fromRoom} to ${toRoom} through door`);
    
    // Update state
    this.stateManager.setFlatmateRoom(toRoom);
    this.currentRoom = toRoom;
    
    // Reset door movement state
    this.isMovingToDoor = false;
    this.targetDoor = undefined;
    this.flatmateTargetX = undefined;
    this.flatmateTargetY = undefined;
    
    // Notify listeners
    this.onRoomChange?.(fromRoom, toRoom);
    
    // If chasing, continue chasing in new room
    if (this.isChasingPlayer) {
      this.moveFlatmateToPlayerRoom();
    } else {
      // Schedule next random move
      this.scheduleFlatmateMove();
    }
  }

  private setNewFlatmateTarget(): void {
    if (!this.flatmateSprite) return;
    
    // Set target within room boundaries (with padding)
    const randomPosition = MathUtils.randomPositionInRoom(
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      100
    );
    this.flatmateTargetX = randomPosition.x;
    this.flatmateTargetY = randomPosition.y;
  }

  private updateFlatmateLabel(): void {
    if (this.flatmateSprite && this.flatmateLabel) {
      this.flatmateLabel.setPosition(this.flatmateSprite.x, this.flatmateSprite.y - 32);
    }
  }

  private removeFlatmate(): void {
    if (this.flatmateSprite) {
      this.flatmateSprite.destroy();
      this.flatmateSprite = undefined;
    }
    if (this.flatmateLabel) {
      this.flatmateLabel.destroy();
      this.flatmateLabel = undefined;
    }
    // Don't destroy the timers - they should run globally
  }

  // Cleanup method for when scene is destroyed
  destroy(): void {
    this.timerManager.cleanup();
    this.removeFlatmate();
  }

  getCurrentRoom(): string {
    return this.stateManager.getFlatmateRoom();
  }

  isInRoom(roomName: string): boolean {
    return this.getCurrentRoom() === roomName;
  }

  setRoomChangeCallback(callback: (fromRoom: string, toRoom: string) => void): void {
    this.onRoomChange = callback;
  }

  reset(): void {
    this.removeFlatmate();
    this.stateManager.setFlatmateRoom('Living Room');
    this.currentRoom = 'Living Room';
  }

  // Static method to check if night phase is globally active
  static isNightPhaseActive(): boolean {
    return FlatmateSystem.globalNightPhase;
  }

  // Night phase methods
  setNightPhase(isNight: boolean): void {
    FlatmateSystem.globalNightPhase = isNight;
    this.isNightPhase = isNight;
    
    if (isNight) {
      console.log('Night phase activated - flatmate becomes aggressive and starts chasing!');
      this.startGlobalNightPhase();
      // Force start chasing during night phase
      if (!this.isChasingPlayer) {
        this.isChasingPlayer = true;
        this.startChasingPlayer();
      }
    } else {
      console.log('Night phase deactivated - flatmate returns to normal');
      this.stopGlobalNightPhase();
      // Stop chasing and return to random movement
      if (this.isChasingPlayer) {
        this.isChasingPlayer = false;
        this.stopChasingPlayer();
      }
    }
  }

  private startGlobalNightPhase(): void {
    // Only start global timer if it's not already running
    if (!this.timerManager.isTimerActive('globalThrow')) {
      this.timerManager.addTimer('globalThrow', 2000, () => {
        this.throwGlobalProjectile();
      }, true);
    }
  }

  private stopGlobalNightPhase(): void {
    // Stop global throwing timer
    this.timerManager.removeTimer('globalThrow');
    
    // Clear existing projectiles in this scene
    this.projectiles.forEach(projectile => projectile.destroy());
    this.projectiles = [];
  }

  private throwGlobalProjectile(): void {
    if (!this.player) return;
    
    // During night phase, flatmate can throw projectiles at player from any room
    const flatmateRoom = this.getCurrentRoom();
    const playerRoom = this.getPlayerRoom();
    
    // Only throw if player is in the same room as flatmate
    if (flatmateRoom === playerRoom) {
      if (!this.flatmateSprite) return;
      
      const distance = MathUtils.distance(
        this.flatmateSprite.x, this.flatmateSprite.y,
        this.player.x, this.player.y
      );
      
      if (distance < 300) { // Only throw if player is within 300 pixels
        console.log('Flatmate throwing projectile at player!');
        
        // Create projectile aimed at player
        const projectile = new Projectile(
          this.scene,
          this.flatmateSprite.x,
          this.flatmateSprite.y,
          this.player.x,
          this.player.y
        );
        
        this.projectiles.push(projectile);
      }
    } else {
      // Flatmate is in a different room - create a "ghost" projectile that appears from off-screen
      console.log(`Flatmate in ${flatmateRoom} throwing projectile at player in ${playerRoom}!`);
      
      // Create projectile from off-screen edge
      const projectile = this.createGhostProjectile();
      if (projectile) {
        this.projectiles.push(projectile);
      }
    }
  }



  private createGhostProjectile(): Projectile | null {
    if (!this.player) return null;
    
    // Determine which edge to spawn from based on flatmate's room relative to player's room
    const flatmateRoom = this.getCurrentRoom();
    const playerRoom = this.getPlayerRoom();
    
    let spawnX: number;
    let spawnY: number;
    
    // Simple logic: spawn from a random edge of the screen
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (edge) {
      case 0: // top
        spawnX = Math.random() * this.scene.cameras.main.width;
        spawnY = -20;
        break;
      case 1: // right
        spawnX = this.scene.cameras.main.width + 20;
        spawnY = Math.random() * this.scene.cameras.main.height;
        break;
      case 2: // bottom
        spawnX = Math.random() * this.scene.cameras.main.width;
        spawnY = this.scene.cameras.main.height + 20;
        break;
      case 3: // left
        spawnX = -20;
        spawnY = Math.random() * this.scene.cameras.main.height;
        break;
      default:
        spawnX = -20;
        spawnY = -20;
    }
    
    // Create projectile aimed at player
    return new Projectile(
      this.scene,
      spawnX,
      spawnY,
      this.player.x,
      this.player.y
    );
  }

  private getPlayerRoom(): string {
    // Get player's current room from state manager
    const playerRoom = this.stateManager.getPlayerRoom();
    
    // If not in state, try to determine from current scene
    if (playerRoom === 'Living Room') {
      const sceneKey = this.scene.scene.key;
      return getRoomName(sceneKey);
    }
    
    return playerRoom;
  }

  setPlayerReference(player: any): void {
    this.player = player;
  }

  updateProjectiles(time: number, delta: number): void {
    // Update all projectiles and check for collisions
    this.projectiles = this.projectiles.filter(projectile => {
      if (!projectile.active) return false;
      
      // Check collision with player
      if (this.player && this.checkProjectilePlayerCollision(projectile, this.player)) {
        this.onPlayerHit(projectile);
        return false;
      }
      
      return true;
    });
  }

  private checkProjectilePlayerCollision(projectile: Projectile, player: any): boolean {
    const projectileBounds = projectile.getBounds();
    const playerBounds = new Phaser.Geom.Rectangle(player.x - 15, player.y - 15, 30, 30);
    
    return Phaser.Geom.Rectangle.Overlaps(projectileBounds, playerBounds);
  }

  private onPlayerHit(projectile: Projectile): void {
    console.log('Player hit by projectile!');
    
    // Damage player (reduce health by 15)
    const gameState = this.stateManager.getGameState();
    const newHealth = Math.max(0, gameState.playerHealth - 15);
    this.stateManager.updateGameState({ playerHealth: newHealth });
    
    // Show hit notification
    this.scene.events.emit('playerHit', { damage: 15, newHealth });
    
    // Destroy the projectile
    projectile.destroy();
  }
} 