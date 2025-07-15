import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';

interface FlatmateData {
  id: string;
  name: string;
  quote: string;
  difficulty: string;
}

export default class Flatmate extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Graphics;
  private flatmateData: FlatmateData;
  private currentRoom: number = 2; // Start in living room
  private targetX: number = 0;
  private targetY: number = 0;
  private moveTimer: number = 0;
  private moveInterval: number = 3000; // Change direction every 3 seconds
  private speed: number = GAME_CONFIG.FLATMATE_SPEED;
  private rooms: any[] = [];
  private player: any = null;
  private isNightMode: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, data: FlatmateData) {
    super(scene, x, y);
    this.flatmateData = data;

    // Create flatmate sprite (red square placeholder)
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(COLORS.FLATMATE, 1);
    this.sprite.fillRect(-14, -14, 28, 28);
    this.sprite.lineStyle(2, 0xcc0000);
    this.sprite.strokeRect(-14, -14, 28, 28);
    
    this.add(this.sprite);

    // Get rooms reference
    this.rooms = (scene as any).getRooms?.() || [];
  }

  update(time: number, delta: number) {
    this.moveTimer += delta;

    if (this.isNightMode && this.player) {
      this.chasePlayer(delta);
    } else {
      // Normal roaming behavior
      if (this.moveTimer >= this.moveInterval) {
        this.setNewTarget();
        this.moveTimer = 0;
      }
      this.moveTowardsTarget(delta);
    }

    // Keep flatmate within current room bounds
    this.keepInRoom();
  }

  private chasePlayer(delta: number) {
    if (!this.player) return;

    const deltaTime = delta / 1000;
    const directionX = this.player.x - this.x;
    const directionY = this.player.y - this.y;
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);

    if (distance > 5) {
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;
      
      this.x += normalizedX * this.speed * deltaTime;
      this.y += normalizedY * this.speed * deltaTime;
    }

    // Check if caught player
    if (distance < 30) {
      this.onPlayerCaught();
    }
  }

  private moveTowardsTarget(delta: number) {
    const deltaTime = delta / 1000;
    const directionX = this.targetX - this.x;
    const directionY = this.targetY - this.y;
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);

    if (distance > 5) {
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;
      
      this.x += normalizedX * this.speed * deltaTime;
      this.y += normalizedY * this.speed * deltaTime;
    }
  }

  private onPlayerCaught() {
    // Notify game scene that player was caught
    const gameScene = this.scene as any;
    if (gameScene.onPlayerCaught) {
      gameScene.onPlayerCaught();
    }
  }

  private setNewTarget() {
    if (this.rooms.length === 0) return;

    const currentRoom = this.rooms[this.currentRoom];
    if (!currentRoom) return;

    // Set random target within current room
    this.targetX = Phaser.Math.Between(
      currentRoom.x + 20,
      currentRoom.x + currentRoom.width - 20
    );
    this.targetY = Phaser.Math.Between(
      currentRoom.y + 20,
      currentRoom.y + currentRoom.height - 20
    );
  }

  private keepInRoom() {
    if (this.rooms.length === 0) return;

    const currentRoom = this.rooms[this.currentRoom];
    if (!currentRoom) return;

    this.x = Phaser.Math.Clamp(
      this.x,
      currentRoom.x + 14,
      currentRoom.x + currentRoom.width - 14
    );
    this.y = Phaser.Math.Clamp(
      this.y,
      currentRoom.y + 14,
      currentRoom.y + currentRoom.height - 14
    );
  }

  public moveToRoom(roomIndex: number) {
    if (roomIndex >= 0 && roomIndex < this.rooms.length) {
      this.currentRoom = roomIndex;
      const room = this.rooms[roomIndex];
      this.x = room.centerX;
      this.y = room.centerY;
      this.setNewTarget();
    }
  }

  public getCurrentRoom(): number {
    return this.currentRoom;
  }

  public setPlayer(player: any) {
    this.player = player;
  }

  public setNightMode(isNight: boolean) {
    this.isNightMode = isNight;
  }

  public getData(): FlatmateData {
    return this.flatmateData;
  }

  public triggerSpecialEvent() {
    // Party Bro's beer flood disaster
    if (this.flatmateData.id === 'party_bro') {
      // Move to bathroom (if we had one) and trigger chaos
      console.log('Party Bro triggered beer flood disaster!');
    }
  }
} 