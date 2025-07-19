import Phaser from 'phaser';
import FlatmateManager from '../flatmates/FlatmateManager';
import Projectile from '../entities/Projectile';

export interface FlatmatePosition {
  room: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export default class FlatmateSystem {
  private scene: Phaser.Scene;
  private sceneManager: Phaser.Scenes.SceneManager;
  private flatmateSprite?: Phaser.GameObjects.Arc;
  private flatmateLabel?: Phaser.GameObjects.Text;
  private flatmateTimer?: Phaser.Time.TimerEvent;
  private currentRoom: string = '';
  private moveSpeed: number = 50; // pixels per second
  private flatmateTargetX?: number;
  private flatmateTargetY?: number;
  private onRoomChange?: (fromRoom: string, toRoom: string) => void;
  
  // Night phase properties
  private projectiles: Projectile[] = [];
  private throwTimer?: Phaser.Time.TimerEvent;
  private isNightPhase: boolean = false;
  private player?: any; // Reference to player for collision detection

  constructor(scene: Phaser.Scene, sceneManager: Phaser.Scenes.SceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.currentRoom = this.scene.registry.get('flatmateRoom') || 'Living Room';
    
    // Ensure flatmate doesn't start in player's bedroom
    if (this.currentRoom === 'Your Bedroom') {
      this.currentRoom = 'Living Room';
      this.scene.registry.set('flatmateRoom', 'Living Room');
    }
    
    // Start the movement timer immediately
    this.scheduleFlatmateMove();
  }

  update(delta: number): void {
    if (this.flatmateSprite && this.flatmateLabel) {
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
    const padding = 100;
    const x = Phaser.Math.Between(padding, this.scene.cameras.main.width - padding);
    const y = Phaser.Math.Between(padding, this.scene.cameras.main.height - padding);
    
    this.flatmateSprite = this.scene.add.circle(x, y, 22, 0x9b59b6, 1);
    this.flatmateLabel = this.scene.add.text(x, y - 32, 'FLATMATE', {
      fontFamily: 'Courier, monospace', 
      fontSize: '13px', 
      color: '#fff', 
      backgroundColor: '#000', 
      padding: { left: 4, right: 4, top: 2, bottom: 2 }
    }).setOrigin(0.5);
    
    // Set initial target
    this.setNewFlatmateTarget();
  }

  private scheduleFlatmateMove(): void {
    if (this.flatmateTimer) {
      this.flatmateTimer.destroy();
    }

    const delay = Phaser.Math.Between(5000, 15000); // 5-15 seconds
    console.log(`Scheduling flatmate move in ${delay}ms`);
    
    this.flatmateTimer = this.scene.time.addEvent({
      delay: delay,
      loop: false,
      callback: () => {
        console.log('Flatmate move timer triggered!');
        this.moveFlatmateToAnotherRoom();
      }
    });
  }

  private moveFlatmateToAnotherRoom(): void {
    const rooms = ['Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry']; // Exclude 'Your Bedroom'
    const currentRoom = this.scene.registry.get('flatmateRoom') || 'Living Room';
    const availableRooms = rooms.filter(room => room !== currentRoom);
    const nextRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    
    console.log(`Flatmate moving from ${currentRoom} to ${nextRoom}`);
    console.log(`Available rooms: ${availableRooms.join(', ')}`);
    
    // Update registry
    this.scene.registry.set('flatmateRoom', nextRoom);
    
    // Notify listeners
    this.onRoomChange?.(currentRoom, nextRoom);
    
    // Schedule next move
    this.scheduleFlatmateMove();
  }

  private updateFlatmateMovement(delta: number): void {
    if (!this.flatmateSprite) return;

    const deltaSeconds = delta / 1000;
    const moveSpeed = 30; // Slower movement
    
    // Simple random movement within room boundaries
    if (!this.flatmateTargetX || !this.flatmateTargetY) {
      this.setNewFlatmateTarget();
    }
    
    if (this.flatmateTargetX && this.flatmateTargetY) {
      const distance = Phaser.Math.Distance.Between(
        this.flatmateSprite.x, this.flatmateSprite.y,
        this.flatmateTargetX, this.flatmateTargetY
      );

      if (distance > 10) {
        // Move towards target
        const angle = Phaser.Math.Angle.Between(
          this.flatmateSprite.x, this.flatmateSprite.y,
          this.flatmateTargetX, this.flatmateTargetY
        );
        
        const velocityX = Math.cos(angle) * moveSpeed * deltaSeconds;
        const velocityY = Math.sin(angle) * moveSpeed * deltaSeconds;
        
        // Update position with boundary checking
        const newX = this.flatmateSprite.x + velocityX;
        const newY = this.flatmateSprite.y + velocityY;
        
        // Constrain to room boundaries
        const padding = 50;
        this.flatmateSprite.x = Phaser.Math.Clamp(newX, padding, this.scene.cameras.main.width - padding);
        this.flatmateSprite.y = Phaser.Math.Clamp(newY, padding, this.scene.cameras.main.height - padding);
      } else {
        // Reached target, set new one
        this.setNewFlatmateTarget();
      }
    }
  }

  private setNewFlatmateTarget(): void {
    if (!this.flatmateSprite) return;
    
    // Set target within room boundaries (with padding)
    const padding = 100;
    this.flatmateTargetX = Phaser.Math.Between(
      padding, 
      this.scene.cameras.main.width - padding
    );
    this.flatmateTargetY = Phaser.Math.Between(
      padding, 
      this.scene.cameras.main.height - padding
    );
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
    // Don't destroy the timer - it should run globally
  }

  getCurrentRoom(): string {
    return this.scene.registry.get('flatmateRoom') || 'Living Room';
  }

  isInRoom(roomName: string): boolean {
    return this.getCurrentRoom() === roomName;
  }

  setRoomChangeCallback(callback: (fromRoom: string, toRoom: string) => void): void {
    this.onRoomChange = callback;
  }

  reset(): void {
    this.removeFlatmate();
    this.scene.registry.set('flatmateRoom', 'Living Room');
    this.currentRoom = 'Living Room';
  }

  // Night phase methods
  setNightPhase(isNight: boolean): void {
    this.isNightPhase = isNight;
    if (isNight) {
      console.log('Night phase activated - flatmate becomes aggressive!');
      this.startNightPhase();
    } else {
      console.log('Night phase deactivated - flatmate returns to normal');
      this.stopNightPhase();
    }
  }

  private startNightPhase(): void {
    // Start throwing projectiles at regular intervals
    this.throwTimer = this.scene.time.addEvent({
      delay: 2000, // Throw every 2 seconds
      loop: true,
      callback: () => {
        this.throwProjectile();
      }
    });
  }

  private stopNightPhase(): void {
    // Stop throwing projectiles
    if (this.throwTimer) {
      this.throwTimer.destroy();
      this.throwTimer = undefined;
    }
    
    // Clear existing projectiles
    this.projectiles.forEach(projectile => projectile.destroy());
    this.projectiles = [];
  }

  private throwProjectile(): void {
    if (!this.flatmateSprite || !this.player) return;
    
    // Only throw if player is in the same room and within range
    const distance = Phaser.Math.Distance.Between(
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
    console.log('Player hit by flatmate projectile!');
    
    // Get GameStateManager and decrease health
    const gameStateManager = (this.scene as any).gameStateManager;
    if (gameStateManager) {
      gameStateManager.onPlayerHit();
    }
    
    // Show hit notification
    const uiManager = (this.scene as any).uiManager;
    if (uiManager) {
      uiManager.showNotification('💥 Hit by flatmate! -15 Health', 2000);
    }
    
    // Destroy the projectile
    projectile.destroy();
  }
} 