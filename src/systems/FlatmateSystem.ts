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
  private static instance: FlatmateSystem;
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
  private flatmateMoveTimer?: Phaser.Time.TimerEvent;

  private constructor(scene: Phaser.Scene, sceneManager: Phaser.Scenes.SceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.timerManager = TimerManager.getInstance(scene);
    this.stateManager = StateManager.getInstance(scene);
    this.currentRoom = this.stateManager.getFlatmateRoom();
    
    console.log(`FlatmateSystem initialized - Scene: ${scene.scene.key}, Initial room: ${this.currentRoom}`);
    
    // Ensure flatmate doesn't start in player's bedroom
    if (this.currentRoom === 'Your Bedroom') {
      this.currentRoom = 'Living Room';
      this.stateManager.setFlatmateRoom('Living Room');
      console.log('Flatmate moved from Your Bedroom to Living Room');
    }
    
    // Check if night phase is already active globally
    this.isNightPhase = FlatmateSystem.globalNightPhase;
    
    // Start the chasing system
    this.startChasingSystem();
    
    // Start the movement timer immediately (for random movement when not chasing)
    this.scheduleFlatmateMove();
    
    console.log('FlatmateSystem initialization complete');
    console.log(`Final flatmate room: ${this.currentRoom}`);
  }

  static getInstance(scene: Phaser.Scene, sceneManager: Phaser.Scenes.SceneManager): FlatmateSystem {
    if (!FlatmateSystem.instance) {
      FlatmateSystem.instance = new FlatmateSystem(scene, sceneManager);
    } else {
      // Update scene reference for existing instance
      FlatmateSystem.instance.updateScene(scene);
    }
    return FlatmateSystem.instance;
  }

  private updateScene(scene: Phaser.Scene): void {
    this.scene = scene;
    console.log(`FlatmateSystem scene updated to: ${scene.scene.key}`);
  }

  update(delta: number): void {
    if (this.flatmateSprite) {
      this.updateFlatmateMovement(delta);
      this.updateFlatmateLabel();
    }
  }

  spawnFlatmateIfNeeded(roomName: string): void {
    const flatmateRoom = this.stateManager.getFlatmateRoom();
    
    console.log(`Checking flatmate spawn - Current room: ${roomName}, Flatmate room: ${flatmateRoom}`);
    console.log(`Flatmate sprite exists: ${!!this.flatmateSprite}`);
    
    // Only spawn if this is the flatmate's current room
    if (roomName !== flatmateRoom) {
      console.log(`Room mismatch - removing flatmate from ${roomName}`);
      this.removeFlatmate();
      return;
    }

    // Spawn flatmate if not already present
    if (!this.flatmateSprite) {
      console.log(`Spawning flatmate in ${roomName}`);
      this.createFlatmateSprite();
      // Don't schedule another timer - it's already running globally
    } else {
      console.log(`Flatmate already exists in ${roomName}`);
    }
    
    // Debug: Force spawn for testing if still no flatmate
    if (!this.flatmateSprite && roomName === flatmateRoom) {
      console.log('FORCE SPAWNING flatmate for testing');
      this.createFlatmateSprite();
    }
  }

  private createFlatmateSprite(): void {
    console.log('Creating flatmate sprite');
    
    // Create flatmate as a red circle
    this.flatmateSprite = this.scene.add.circle(200, 200, 15, 0xff0000);
    console.log(`Flatmate sprite created at (${this.flatmateSprite.x}, ${this.flatmateSprite.y})`);
    
    // Add label
    this.flatmateLabel = this.scene.add.text(200, 200, 'FLATMATE', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    console.log('Flatmate label created');
    
    // Set initial random position
    this.setNewFlatmateTarget();
    console.log('Flatmate sprite creation complete');
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
        console.log(`Flatmate starting to chase player in ${this.chaseMode} mode! (Night phase: ${this.isNightPhase})`);
        this.isChasingPlayer = true;
        this.startChasingPlayer();
      }
    } else {
      if (this.isChasingPlayer) {
        console.log(`Flatmate stopping chase, returning to random movement (Night phase: ${this.isNightPhase})`);
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
    
    // Only chase during night phase
    if (!this.isNightPhase) {
      console.log(`shouldChasePlayer: false (day phase - no chasing)`);
      return false; // No chasing during day phases (morning, afternoon, evening)
    }
    
    // Base chase probability for night phase
    let baseChaseProbability = 0.8;
    
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
    if (flatmateRoom !== playerRoom) {
      console.log(`shouldChasePlayer: true (night phase - different rooms)`);
      return true;
    }
    
    // Apply probability for same room chasing
    const shouldChase = Math.random() < baseChaseProbability;
    console.log(`shouldChasePlayer: ${shouldChase} (night phase - same room, probability: ${baseChaseProbability.toFixed(2)})`);
    return shouldChase;
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
    // Clear any existing timer
    if (this.flatmateMoveTimer) {
      this.flatmateMoveTimer.destroy();
    }

    console.log('Scheduling flatmate move');
    
    // Fixed 10 second timer for testing
    const moveTime = 10000; // 10 seconds
    
    console.log(`Flatmate move scheduled for ${moveTime}ms from now`);
    
    // Use scene's built-in timer system
    this.flatmateMoveTimer = this.scene.time.delayedCall(moveTime, () => {
      console.log('Flatmate move timer triggered!');
      this.moveFlatmateToAnotherRoom();
    });
    
    // Also log the current scene to make sure we're using the right one
    console.log(`Timer created in scene: ${this.scene.scene.key}`);
  }

  private moveFlatmateToAnotherRoom(): void {
    const rooms = ['Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry']; // Exclude 'Your Bedroom'
    const currentRoom = this.stateManager.getFlatmateRoom();
    const availableRooms = rooms.filter(room => room !== currentRoom);
    const nextRoom = MathUtils.randomElement(availableRooms);
    
    console.log(`Flatmate moving from ${currentRoom} to ${nextRoom}`);
    console.log(`Available rooms: ${availableRooms.join(', ')}`);
    console.log(`Current scene: ${this.scene.scene.key}`);
    
    // Find the door that leads to the target room
    const targetDoor = this.findDoorToRoom(nextRoom);
    
    if (targetDoor) {
      // Start moving to the door
      this.isMovingToDoor = true;
      this.targetDoor = targetDoor;
      this.flatmateTargetX = targetDoor.x + targetDoor.width / 2;
      this.flatmateTargetY = targetDoor.y + targetDoor.height / 2;
      console.log(`Flatmate moving to door: ${targetDoor.label} at (${this.flatmateTargetX}, ${this.flatmateTargetY})`);
    } else {
      console.warn(`No door found to ${nextRoom}, teleporting instead`);
      // Fallback to teleport if no door found
      this.teleportToRoom(nextRoom);
    }
  }

  private findDoorToRoom(targetRoom: string): DoorConfig | undefined {
    // Get the flatmate's current room
    const flatmateCurrentRoom = this.stateManager.getFlatmateRoom();
    console.log(`Flatmate is in: ${flatmateCurrentRoom}, trying to move to: ${targetRoom}`);
    
    // Only try to find doors if the flatmate is in the same room as the player
    const currentSceneRoom = this.getSceneRoomName();
    if (flatmateCurrentRoom !== currentSceneRoom) {
      console.log(`Flatmate is in ${flatmateCurrentRoom} but player is in ${currentSceneRoom}, teleporting`);
      return undefined; // This will trigger teleport
    }
    
    // Access doorConfigs directly from the current scene
    const sceneWithDoors = this.scene as any;
    if (!sceneWithDoors.doorConfigs) {
      console.warn('No door configs found in current scene');
      return undefined;
    }

    const doorConfigs = sceneWithDoors.doorConfigs as DoorConfig[];
    console.log(`Found ${doorConfigs.length} doors in current scene:`);
    doorConfigs.forEach(door => {
      console.log(`  - ${door.label} -> ${door.targetRoom}`);
    });
    
    const targetDoor = doorConfigs.find(door => door.targetRoom === targetRoom);
    
    if (!targetDoor) {
      console.warn(`No door found to ${targetRoom} in current scene`);
    } else {
      console.log(`Found door to ${targetRoom}: ${targetDoor.label}`);
    }
    
    return targetDoor;
  }

  private getSceneRoomName(): string {
    const sceneKey = this.scene.scene.key;
    switch (sceneKey) {
      case 'LivingRoomScene': return 'Living Room';
      case 'KitchenScene': return 'Kitchen';
      case 'BathroomScene': return 'Bathroom';
      case 'LaundryScene': return 'Laundry';
      case 'FlatmateBedroomScene': return 'Flatmate Bedroom';
      case 'PlayerBedroomScene': return 'Your Bedroom';
      default: return sceneKey;
    }
  }

  private teleportToRoom(roomName: string): void {
    const fromRoom = this.currentRoom;
    
    console.log(`Teleporting flatmate from ${fromRoom} to ${roomName}`);
    
    // Update state
    this.stateManager.setFlatmateRoom(roomName);
    this.currentRoom = roomName;
    
    // Remove flatmate from current scene since it's moving to a different room
    this.removeFlatmate();
    
    // Notify listeners
    this.onRoomChange?.(fromRoom, roomName);
    
    // Schedule next move
    this.scheduleFlatmateMove();
    
    console.log(`Flatmate teleported to ${roomName}, next move scheduled`);
  }

  private updateFlatmateMovement(delta: number): void {
    if (!this.flatmateSprite) return;

    const deltaSeconds = delta / 1000;
    
    // Add some variation to movement speed for more natural movement
    const baseSpeed = this.isChasingPlayer ? this.chaseSpeed : this.moveSpeed;
    const speedVariation = MathUtils.random(0.8, 1.2); // ±20% variation
    const moveSpeed = baseSpeed * speedVariation;
    
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
        // Reached target, pause briefly before setting new one
        this.flatmateTargetX = undefined;
        this.flatmateTargetY = undefined;
        
        // Schedule a new target after a short pause
        this.scene.time.delayedCall(MathUtils.random(1000, 3000), () => {
          this.setNewFlatmateTarget();
        });
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
    
    // Remove flatmate from current scene since it's moving to a different room
    this.removeFlatmate();
    
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

  private positionFlatmateAtDoor(currentRoom: string, fromRoom: string): void {
    if (!this.flatmateSprite) return;
    
    // Find the door in the current room that leads back to where we came from
    const sceneWithDoors = this.scene as any;
    if (!sceneWithDoors.doorConfigs) return;
    
    const doorConfigs = sceneWithDoors.doorConfigs as DoorConfig[];
    const correspondingDoor = doorConfigs.find(door => 
      door.targetRoom === fromRoom
    );
    
    if (correspondingDoor) {
      // Position flatmate at the door they should spawn at
      this.flatmateSprite.x = correspondingDoor.x + correspondingDoor.width / 2;
      this.flatmateSprite.y = correspondingDoor.y + correspondingDoor.height / 2;
      console.log(`Flatmate positioned at door: ${correspondingDoor.label}`);
    } else {
      // Fallback to center if no matching door found
      this.flatmateSprite.x = this.scene.cameras.main.width / 2;
      this.flatmateSprite.y = this.scene.cameras.main.height / 2;
      console.log('No matching door found, positioning flatmate at center');
    }
  }

  private setNewFlatmateTarget(): void {
    if (!this.flatmateSprite) return;
    
    // Try to find a good target position (avoid too close to current position)
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const randomPosition = MathUtils.randomPositionInRoom(
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        100
      );
      
      // Check if the target is far enough from current position
      const distance = MathUtils.distance(
        this.flatmateSprite.x, this.flatmateSprite.y,
        randomPosition.x, randomPosition.y
      );
      
      // Only accept targets that are at least 50 pixels away
      if (distance > 50) {
        this.flatmateTargetX = randomPosition.x;
        this.flatmateTargetY = randomPosition.y;
        return;
      }
      
      attempts++;
    }
    
    // If we couldn't find a good target, just use the last random position
    const fallbackPosition = MathUtils.randomPositionInRoom(
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      100
    );
    this.flatmateTargetX = fallbackPosition.x;
    this.flatmateTargetY = fallbackPosition.y;
  }

  private updateFlatmateLabel(): void {
    if (this.flatmateSprite && this.flatmateLabel) {
      this.flatmateLabel.setPosition(this.flatmateSprite.x, this.flatmateSprite.y - 32);
    }
  }

  private removeFlatmate(): void {
    console.log('Removing flatmate sprite and label');
    if (this.flatmateSprite) {
      this.flatmateSprite.destroy();
      this.flatmateSprite = undefined;
      console.log('Flatmate sprite destroyed');
    }
    if (this.flatmateLabel) {
      this.flatmateLabel.destroy();
      this.flatmateLabel = undefined;
      console.log('Flatmate label destroyed');
    }
    // Don't destroy the timers - they should run globally
  }

  // Cleanup method for when scene is destroyed
  destroy(): void {
    this.timerManager.cleanup();
    if (this.flatmateMoveTimer) {
      this.flatmateMoveTimer.destroy();
    }
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

  // Debug method to force spawn flatmate
  forceSpawnFlatmate(): void {
    console.log('Force spawning flatmate for debugging');
    if (!this.flatmateSprite) {
      this.createFlatmateSprite();
    } else {
      console.log('Flatmate already exists');
    }
  }

  // Debug method to test movement
  testMoveToAnotherRoom(): void {
    console.log('Testing flatmate movement to another room');
    this.moveFlatmateToAnotherRoom();
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