import Phaser from 'phaser';
import { FLATMATES } from './FlatmateSelectScene';
import Player from '../entities/Player';
import Flatmate from '../entities/Flatmate';
import Mess from '../entities/Mess';
import BrokenItem from '../entities/BrokenItem';
import Room from '../entities/Room';
import DayUI from '../ui/DayUI';

export interface GameState {
  currentPhase: 'morning' | 'afternoon' | 'evening' | 'night';
  phaseTime: number;
  messesSpawned: number;
  messesCleaned: number;
  brokenItemsSpawned: number;
  brokenItemsFixed: number;
  playerMood: number;      // 🟪 Mood Meter (0-100)
  cleanliness: number;     // 🟩 Cleanliness Bar (0-100)
  flatmateRage: number;    // 🟥 Flatmate Rage (0-100)
  playerHealth: number;    // 🟦 Health Bar (0-100)
}

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private flatmate!: Flatmate;
  private rooms: Room[] = [];
  private messes: Mess[] = [];
  private brokenItems: BrokenItem[] = [];
  private dayUI!: DayUI;
  private gameState: GameState;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private currentRoomIndex: number = 0;
  private phaseTimer: number = 0;
  private phaseDuration: number = 60000; // 60 seconds per phase
  private messSpawnTimer: number = 0;
  private messSpawnInterval: number = 20000; // Spawn mess every 20 seconds
  private maxMesses: number = 15; // Increased to accommodate more messes
  private messesToSpawnThisPhase: number = 0;
  private messesSpawnedThisPhase: number = 0;

  constructor() {
    super({ key: 'GameScene' });
    this.gameState = {
      currentPhase: 'morning',
      phaseTime: 0,
      messesSpawned: 0,
      messesCleaned: 0,
      brokenItemsSpawned: 0,
      brokenItemsFixed: 0,
      playerMood: 100,      // 🟪 Start with full mood
      cleanliness: 100,     // 🟩 Start with clean apartment
      flatmateRage: 0,      // 🟥 Start with calm flatmate
      playerHealth: 100     // 🟦 Start with full health
    };
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Reset game state for new game
    this.resetGameState();

    // Setup input
    this.setupInput();

    // Create rooms
    this.createRooms();

    // Create player
    this.createPlayer();

    // Create flatmate
    this.createFlatmate();

    // Create UI
    this.createUI();

    // Start first phase
    this.startPhase('morning');
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.zKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  private createRooms() {
    const roomWidth = 150;
    const roomHeight = 120;
    const roomSpacing = 30;
    const startX = 50;
    const startY = 150;

    const roomConfigs = [
      { name: 'Bedroom (Player)', color: 0x4a90e2, x: startX, y: startY },
      { name: 'Bedroom (Flatmate)', color: 0x9b59b6, x: startX + roomWidth + roomSpacing, y: startY },
      { name: 'Kitchen', color: 0xf39c12, x: startX + (roomWidth + roomSpacing) * 2, y: startY },
      { name: 'Living Room', color: 0x27ae60, x: startX, y: startY + roomHeight + roomSpacing },
      { name: 'Bathroom', color: 0x3498db, x: startX + roomWidth + roomSpacing, y: startY + roomHeight + roomSpacing },
      { name: 'Laundry', color: 0xe74c3c, x: startX + (roomWidth + roomSpacing) * 2, y: startY + roomHeight + roomSpacing }
    ];

    this.rooms = roomConfigs.map((config, index) => {
      const room = new Room(this, config.x, config.y, roomWidth, roomHeight, config.name, config.color, index);
      this.add.existing(room); // Add room to the scene
      return room;
    });
  }

  private createPlayer() {
    const startRoom = this.rooms[0]; // Bedroom (Player)
    this.player = new Player(this, startRoom.centerX, startRoom.centerY);
    this.add.existing(this.player);
  }

  private createFlatmate() {
    const selectedFlatmateId = this.game.registry.get('selectedFlatmateId') || 'party_bro';
    const flatmateData = FLATMATES.find(f => f.id === selectedFlatmateId) || FLATMATES[0];
    
    // Start flatmate in their bedroom (room 1)
    const startRoom = this.rooms[1]; // Bedroom (Flatmate)
    this.flatmate = new Flatmate(this, startRoom.centerX, startRoom.centerY, flatmateData);
    this.add.existing(this.flatmate);
  }

  private createUI() {
    this.dayUI = new DayUI(this, this.gameState);
  }

  private startPhase(phase: 'morning' | 'afternoon' | 'evening' | 'night') {
    this.gameState.currentPhase = phase;
    this.gameState.phaseTime = 0;
    this.phaseTimer = 0;
    this.messSpawnTimer = 0;
    this.messesSpawnedThisPhase = 0;
    this.dayUI.updatePhase(phase);
    
    // Phase-specific logic
    switch (phase) {
      case 'morning':
        this.messesToSpawnThisPhase = 10; // 10 messes in morning
        break;
      case 'afternoon':
        this.messesToSpawnThisPhase = 6; // 6 messes in afternoon
        this.spawnInitialBrokenItems(3); // 3 broken items in afternoon
        break;
      case 'evening':
        this.messesToSpawnThisPhase = 1;
        this.gameState.flatmateRage += 20;
        break;
      case 'night':
        this.messesToSpawnThisPhase = 0;
        this.triggerNightEvent();
        break;
    }
  }

  private spawnInitialMesses(count: number) {
    for (let i = 0; i < count && this.gameState.messesSpawned < this.maxMesses; i++) {
      this.spawnRandomMess();
    }
  }

  private spawnRandomMess() {
    if (this.gameState.messesSpawned >= this.maxMesses) return;

    // Pick a random room (allowing multiple messes per room)
    const randomRoom = Phaser.Math.RND.pick(this.rooms);
    
    // Generate random position within the room bounds
    const margin = 30; // Keep mess away from room edges
    const x = randomRoom.x + margin + Math.random() * (randomRoom.width - 2 * margin);
    const y = randomRoom.y + margin + Math.random() * (randomRoom.height - 2 * margin);
    
    const mess = new Mess(this, x, y, randomRoom.index);
    this.messes.push(mess);
    this.add.existing(mess);
    this.gameState.messesSpawned++;
  }

  private spawnInitialBrokenItems(count: number) {
    for (let i = 0; i < count; i++) {
      this.spawnRandomBrokenItem();
    }
  }

  private spawnRandomBrokenItem() {
    // Pick a random room
    const randomRoom = Phaser.Math.RND.pick(this.rooms);
    
    // Generate random position within the room bounds
    const margin = 30;
    const x = randomRoom.x + margin + Math.random() * (randomRoom.width - 2 * margin);
    const y = randomRoom.y + margin + Math.random() * (randomRoom.height - 2 * margin);
    
    const brokenItem = new BrokenItem(this, x, y);
    this.brokenItems.push(brokenItem);
    this.add.existing(brokenItem);
    this.gameState.brokenItemsSpawned++;
  }

  private triggerNightEvent() {
    // Party Bro's beer flood disaster
    this.gameState.flatmateRage += 30;
    this.gameState.playerMood -= 15;
    this.gameState.cleanliness -= 20;
    // Health will be decreased by flatmate attacks during night phase
  }

  update(time: number, delta: number) {
    // Update phase timer
    this.phaseTimer += delta;
    this.gameState.phaseTime = this.phaseTimer;

    // Check for phase transition
    if (this.phaseTimer >= this.phaseDuration) {
      this.transitionToNextPhase();
    }

    // Update mess spawn timer - spawn messes gradually throughout the phase
    this.messSpawnTimer += delta;
    if (this.messesSpawnedThisPhase < this.messesToSpawnThisPhase && this.gameState.messesSpawned < this.maxMesses) {
      // Calculate when to spawn the next mess based on phase duration and total messes to spawn
      const timePerMess = this.phaseDuration / this.messesToSpawnThisPhase;
      const nextSpawnTime = (this.messesSpawnedThisPhase + 1) * timePerMess;
      
      if (this.phaseTimer >= nextSpawnTime) {
        this.spawnRandomMess();
        this.messesSpawnedThisPhase++;
      }
    }

    // Update parameter decay
    this.updateParameterDecay(delta);

    // Update entities
    this.player.update(time, delta);
    this.flatmate.update(time, delta);
    this.messes.forEach(mess => mess.update(time, delta));
    this.brokenItems.forEach(item => item.update(time, delta));

    // Handle player input
    this.handlePlayerInput();

    // Handle cleaning and repairing
    this.handleCleaning();
    this.handleRepairing();

    // Handle room transitions
    this.handleRoomTransitions();

    // Check for game over (mental breakdown or physical collapse)
    if (this.gameState.playerMood <= 0 || this.gameState.playerHealth <= 0) {
      this.showGameOver();
      return;
    }

    // Update UI
    this.dayUI.update(this.gameState);
  }

  private handlePlayerInput() {
    const speed = 200;
    let velocityX = 0;
    let velocityY = 0;

    // Arrow keys or WASD
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      velocityX = -speed;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      velocityX = speed;
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      velocityY = speed;
    }

    this.player.setVelocity(velocityX, velocityY);
  }

  private handleCleaning() {
    if (this.spaceKey.isDown) {
      const nearbyMess = this.messes.find(mess => 
        Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          mess.x, mess.y
        ) < 50
      );

      if (nearbyMess && !nearbyMess.isBeingCleaned) {
        nearbyMess.startCleaning();
      }
    } else {
      // Stop cleaning when space is released
      this.messes.forEach(mess => {
        if (mess.isBeingCleaned) {
          mess.stopCleaning();
        }
      });
    }
  }

  private handleRepairing() {
    if (this.spaceKey.isDown) {
      const nearbyBrokenItem = this.brokenItems.find(item => 
        Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          item.x, item.y
        ) < 50
      );

      if (nearbyBrokenItem && !nearbyBrokenItem.isRepairing()) {
        nearbyBrokenItem.startRepair();
      }
    } else {
      // Stop repairing when space is released and reset progress
      this.brokenItems.forEach(item => {
        if (item.isRepairing()) {
          item.stopRepair();
        }
      });
    }
  }

  private handleRoomTransitions() {
    const playerRoom = this.getPlayerRoom();
    if (playerRoom !== this.currentRoomIndex) {
      this.currentRoomIndex = playerRoom;
      this.player.setCurrentRoom(playerRoom);
    }
  }

  private getPlayerRoom(): number {
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (this.player.x >= room.x && this.player.x <= room.x + room.width &&
          this.player.y >= room.y && this.player.y <= room.y + room.height) {
        return i;
      }
    }
    return this.currentRoomIndex;
  }

  private transitionToNextPhase() {
    const phases: ('morning' | 'afternoon' | 'evening' | 'night')[] = ['morning', 'afternoon', 'evening', 'night'];
    const currentIndex = phases.indexOf(this.gameState.currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    
    if (nextIndex === 0) {
      // Day complete, show summary
      this.showDaySummary();
    } else {
      this.startPhase(phases[nextIndex]);
    }
  }

  private showDaySummary() {
    // Store stats in registry for summary scene
    this.game.registry.set('dayStats', {
      messesCleaned: this.gameState.messesCleaned,
      finalMood: this.gameState.playerMood,
      finalCleanliness: this.gameState.cleanliness,
      finalFlatmateRage: this.gameState.flatmateRage,
      finalHealth: this.gameState.playerHealth,
      coinsEarned: this.gameState.messesCleaned * 10
    });
    
    this.scene.start('DaySummaryScene');
  }

  private updateParameterDecay(delta: number) {
    const deltaSeconds = delta / 1000;
    
    // 🟩 Cleanliness mechanics: decreases slowly with messes, increases slowly when clean
    const activeMesses = this.messes.filter(mess => !mess.isCompleted()).length;
    if (activeMesses > 0) {
      // Slower decay rate when messes are present
      const cleanlinessDecayRate = 0.5 + activeMesses * 1.5;
      this.gameState.cleanliness = Math.max(0, this.gameState.cleanliness - cleanlinessDecayRate * deltaSeconds);
    } else {
      // Gradually increase cleanliness when no messes are present
      const cleanlinessRecoveryRate = 0.3;
      this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + cleanlinessRecoveryRate * deltaSeconds);
    }
    
    // 🟪 Mood decays based on cleanliness and flatmate rage - rate increases dramatically as cleanliness decreases
    const cleanlinessFactor = Math.pow((100 - this.gameState.cleanliness) / 100, 2); // Quadratic increase
    const baseMoodDecayRate = 0.1;
    const cleanlinessMoodDecay = cleanlinessFactor * 2.0; // Up to 2.0 additional decay when cleanliness is 0
    const flatmateRageMoodDecay = this.gameState.flatmateRage * 0.002;
    
    const moodDecayRate = baseMoodDecayRate + cleanlinessMoodDecay + flatmateRageMoodDecay;
    this.gameState.playerMood = Math.max(0, this.gameState.playerMood - moodDecayRate * deltaSeconds);
    
    // 🟦 Health only decreases when attacked by flatmate (implemented in night phase)
    // No automatic health decay from other sources
    
    // 🟥 Flatmate rage increases if ignored (no cleaning happening)
    if (activeMesses > 0) {
      this.gameState.flatmateRage = Math.min(100, this.gameState.flatmateRage + 0.5 * deltaSeconds);
    }
  }

  public onMessCleaned() {
    this.gameState.messesCleaned++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 5);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 10);
    this.gameState.playerHealth = Math.min(100, this.gameState.playerHealth + 3);
    this.gameState.flatmateRage = Math.max(0, this.gameState.flatmateRage - 5);
    
    // Remove cleaned mess from array
    this.messes = this.messes.filter(mess => !mess.isCompleted());
  }

  public onItemRepaired() {
    this.gameState.brokenItemsFixed++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 3);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 5);
    this.gameState.playerHealth = Math.min(100, this.gameState.playerHealth + 2);
    this.gameState.flatmateRage = Math.max(0, this.gameState.flatmateRage - 3);
    
    // Remove repaired item from array
    this.brokenItems = this.brokenItems.filter(item => !item.isCompleted());
  }

  private showGameOver() {
    this.scene.start('GameOverScene');
  }

  public getRooms() {
    return this.rooms;
  }

  public getPlayer() {
    return this.player;
  }

  public getFlatmate() {
    return this.flatmate;
  }

  private resetGameState() {
    // Reset all game state to initial values
    this.gameState = {
      currentPhase: 'morning',
      phaseTime: 0,
      messesSpawned: 0,
      messesCleaned: 0,
      brokenItemsSpawned: 0,
      brokenItemsFixed: 0,
      playerMood: 100,      // 🟪 Start with full mood
      cleanliness: 100,     // 🟩 Start with clean apartment
      flatmateRage: 0,      // 🟥 Start with calm flatmate
      playerHealth: 100     // 🟦 Start with full health
    };

    // Reset timers
    this.phaseTimer = 0;
    this.messSpawnTimer = 0;
    this.currentRoomIndex = 0;
    this.messesToSpawnThisPhase = 0;
    this.messesSpawnedThisPhase = 0;

    // Clear any existing messes and broken items
    this.messes.forEach(mess => mess.destroy());
    this.messes = [];
    this.brokenItems.forEach(item => item.destroy());
    this.brokenItems = [];
  }
} 