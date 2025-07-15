import Phaser from 'phaser';
import Player from '../../entities/Player';
import Mess from '../../entities/Mess';
import { GameState } from '../GameScene';

export interface DoorConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  targetScene: string;
  targetRoom: string;
  label: string;
}

export default abstract class BaseRoomScene extends Phaser.Scene {
  protected player!: Player;
  protected messes: Mess[] = [];
  protected doors: Phaser.GameObjects.Rectangle[] = [];
  protected doorConfigs: DoorConfig[] = [];
  protected gameState: GameState;
  protected doorPrompt!: Phaser.GameObjects.Text;
  protected isNearDoor: boolean = false;
  protected messNotification!: Phaser.GameObjects.Text;
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  protected spaceKey!: Phaser.Input.Keyboard.Key;
  protected eKey!: Phaser.Input.Keyboard.Key;
  protected roomName: string;
  protected roomColor: number;
  protected flatmateSprite?: Phaser.GameObjects.Arc;
  protected flatmateLabel?: Phaser.GameObjects.Text;
  protected flatmateCurrentRoom: string = '';
  protected flatmateTimer?: Phaser.Time.TimerEvent;
  protected flatmateTargetX: number = 0;
  protected flatmateTargetY: number = 0;
  protected flatmateMoveSpeed: number = 50; // pixels per second
  protected pauseButton!: Phaser.GameObjects.Text;
  protected pauseMenu?: Phaser.GameObjects.Container;
  protected isPaused: boolean = false;

  constructor(key: string, roomName: string, roomColor: number) {
    super({ key });
    this.roomName = roomName;
    this.roomColor = roomColor;
    
    // Initialize with default game state - will be updated in create()
    this.gameState = {
      currentPhase: 'morning',
      phaseTime: 0,
      messesSpawned: 0,
      messesCleaned: 0,
      brokenItemsSpawned: 0,
      brokenItemsFixed: 0,
      playerMood: 100,
      cleanliness: 100,
      flatmateRage: 0,
      playerHealth: 100
    };
  }

  // --- GLOBAL MESS SPAWNING AND NOTIFICATION SYSTEM ---
  static allRoomScenes: BaseRoomScene[] = [];
  static globalMessTimer: number = 0;
  static lastGlobalSpawnTime: number = 0;

  static spawnMessInRandomRoom(sceneManager: Phaser.Scenes.SceneManager) {
    const rooms = ['Your Bedroom', 'Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry'];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    
    console.log(`Global system: Spawning mess in ${randomRoom}`);
    
    // Store the mess data for the target room
    const messData = {
      x: Math.random() * 600 + 100,
      y: Math.random() * 400 + 100,
      roomName: randomRoom,
      timestamp: Date.now()
    };
    
    // Get existing messes for this room
    const roomMessesKey = `messes_${randomRoom}`;
    const existingMesses = sceneManager.game.registry.get(roomMessesKey) || [];
    existingMesses.push(messData);
    sceneManager.game.registry.set(roomMessesKey, existingMesses);
    
    // Show global notification
    BaseRoomScene.showGlobalMessNotification(randomRoom);
  }

  static showGlobalMessNotification(roomName: string) {
    // Clean up invalid scenes first
    BaseRoomScene.allRoomScenes = BaseRoomScene.allRoomScenes.filter(scene => 
      scene && scene.scene && scene.scene.isActive()
    );
    
    // Show the notification in all active room scenes
    BaseRoomScene.allRoomScenes.forEach(scene => {
      try {
        if (scene && scene.messNotification && scene.messNotification.active) {
          scene.messNotification.setText(`Mess made at ${roomName}`);
          scene.messNotification.setVisible(true);
          if (scene.time) {
            scene.time.delayedCall(2000, () => {
              if (scene.messNotification && scene.messNotification.active) {
                scene.messNotification.setVisible(false);
              }
            });
          }
        }
      } catch (error) {
        console.warn('Could not show mess notification in scene:', error);
      }
    });
  }

  // Register/deregister scenes
  create() {
    BaseRoomScene.allRoomScenes.push(this);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Get game state from registry or use default
    const storedGameState = this.game.registry.get('gameState');
    if (storedGameState) {
      this.gameState = storedGameState;
    }

    // Setup input
    this.setupInput();

    // Create room background
    this.createRoomBackground();

    // Create doors
    this.createDoors();

    // Create player
    this.createPlayer();

    // Create UI
    this.createUI();

    // Spawn initial messes only if this room doesn't have any yet
    this.spawnInitialMesses();
    this.spawnFlatmateIfNeeded();
  }

  shutdown() {
    // Remove from global list
    const idx = BaseRoomScene.allRoomScenes.indexOf(this);
    if (idx !== -1) BaseRoomScene.allRoomScenes.splice(idx, 1);
    
    // Clean up any timers
    if (this.flatmateTimer) {
      this.flatmateTimer.remove(false);
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createRoomBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Room background
    this.add.rectangle(width / 2, height / 2, width - 100, height - 100, this.roomColor, 0.3);
    
    // Room border
    this.add.rectangle(width / 2, height / 2, width - 100, height - 100, this.roomColor, 0)
      .setStrokeStyle(3, this.roomColor);
    
    // Room name
    this.add.text(width / 2, 50, this.roomName, {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5);
  }

  protected createDoors() {
    this.doorConfigs.forEach(config => {
      // Door background
      const door = this.add.rectangle(config.x, config.y, config.width, config.height, 0x8B4513, 0.9);
      door.setStrokeStyle(3, 0x654321);
      door.setInteractive({ useHandCursor: true });
      
      // Door handle (small circle)
      this.add.circle(config.x + config.width / 2 - 5, config.y, 3, 0xFFD700);
      
      // Door label
      const label = this.add.text(config.x, config.y + config.height / 2 + 15, config.label, {
        fontFamily: 'Courier, monospace',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { left: 4, right: 4, top: 2, bottom: 2 }
      }).setOrigin(0.5);
      
      // Hover effects
      door.on('pointerover', () => {
        door.setFillStyle(0xA0522D, 0.9);
        label.setColor('#39ff14');
      });
      
      door.on('pointerout', () => {
        door.setFillStyle(0x8B4513, 0.9);
        label.setColor('#ffffff');
      });
      
      door.on('pointerdown', () => {
        this.transitionToRoom(config.targetScene, config.targetRoom, config);
      });
      
      this.doors.push(door);
    });
  }

  private createPlayer() {
    // Get player position from registry or use default
    let playerX = this.game.registry.get('playerX');
    let playerY = this.game.registry.get('playerY');
    const fromRoom = this.game.registry.get('fromRoom');
    // If coming from another room, spawn at the door that leads back to that room
    if (fromRoom) {
      const backDoor = this.doorConfigs.find(d => d.targetRoom === fromRoom);
      if (backDoor) {
        playerX = backDoor.x;
        playerY = backDoor.y;
      }
      // Clear fromRoom after use
      this.game.registry.set('fromRoom', undefined);
    }
    // If no position is set (first time starting), use center of room
    if (playerX === undefined || playerY === undefined) {
      playerX = this.cameras.main.width / 2;
      playerY = this.cameras.main.height / 2;
    }
    
    this.player = new Player(this, playerX, playerY);
    this.add.existing(this.player);
  }

  private createUI() {
    const width = this.cameras.main.width;
    
    // Phase and timer
    this.add.text(width / 2, 20, 'DAY 1: MORNING', {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: '#39ff14',
      backgroundColor: '#000000',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Pause button (top-left)
    this.pauseButton = this.add.text(20, 20, '⏸️ PAUSE', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    
    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setColor('#39ff14');
    });
    
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setColor('#ffffff');
    });
    
    this.pauseButton.on('pointerdown', () => {
      this.togglePause();
    });

    // Parameter bars (top-right)
    this.createParameterBars();
    
    // Minimap (top-right, above parameter bars)
    this.createMinimap();
    
    // Door interaction prompt (hidden by default)
    this.doorPrompt = this.add.text(width / 2, this.cameras.main.height - 60, '', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#39ff14',
      backgroundColor: '#000000',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5).setVisible(false);
    
    // Mess notification (hidden by default)
    this.messNotification = this.add.text(20, this.cameras.main.height - 60, '', {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0, 0.5).setVisible(false);
    
    // Instructions
    this.add.text(width / 2, this.cameras.main.height - 20, 'WASD/Arrows to move, SPACE to clean, E for doors', {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private createParameterBars() {
    const width = this.cameras.main.width;
    const barWidth = 150;
    const barHeight = 20;
    const startX = width - barWidth - 20;
    const startY = 240; // Moved down to make room for minimap
    const spacing = 25;

    // Mood bar (frozen at 100%)
    this.createParameterBar(startX, startY, barWidth, barHeight, '🟪 Mood', 100, '#39ff14');
    // Cleanliness bar (frozen at 100%)
    this.createParameterBar(startX, startY + spacing, barWidth, barHeight, '🟩 Clean', 100, '#4CAF50');
    // Health bar (frozen at 100%)
    this.createParameterBar(startX, startY + spacing * 2, barWidth, barHeight, '🟦 Health', 100, '#3498db');
    // Flatmate Rage bar (frozen at 0%)
    this.createParameterBar(startX, startY + spacing * 3, barWidth, barHeight, '🟥 Rage', 0, '#ff4500');
  }

  private createParameterBar(x: number, y: number, width: number, height: number, label: string, value: number, color: string) {
    // Background
    this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x333333);
    
    // Fill bar
    const fillWidth = (value / 100) * width;
    this.add.rectangle(x + fillWidth / 2, y + height / 2, fillWidth, height, Phaser.Display.Color.ValueToColor(color).color);
    
    // Border
    this.add.rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 0)
      .setStrokeStyle(1, 0xffffff);
    
    // Label
    this.add.text(x - 5, y + height / 2, label, {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(1, 0.5);
    
    // Value
    this.add.text(x + width + 5, y + height / 2, `${Math.round(value)}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
  }

  private createMinimap() {
    const width = this.cameras.main.width;
    const minimapSize = 200;
    const minimapX = width - minimapSize - 20;
    const minimapY = 20;
    
    // Minimap background
    this.add.rectangle(minimapX + minimapSize / 2, minimapY + minimapSize / 2, minimapSize, minimapSize, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffffff);
    
    // Room layout (scaled down)
    const roomSize = 30;
    const spacing = 5;
    
    // Your Bedroom (top-left)
    const yourBedroomColor = this.roomName === 'Your Bedroom' ? 0x39ff14 : 0x4a90e2;
    this.add.rectangle(minimapX + roomSize / 2 + spacing, minimapY + roomSize / 2 + spacing, roomSize, roomSize, yourBedroomColor, 0.6);
    this.add.text(minimapX + roomSize / 2 + spacing, minimapY + roomSize / 2 + spacing, 'YB', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Flatmate Bedroom (top-right)
    const flatmateBedroomColor = this.roomName === 'Flatmate Bedroom' ? 0x39ff14 : 0x9b59b6;
    this.add.rectangle(minimapX + roomSize * 2 + spacing * 3, minimapY + roomSize / 2 + spacing, roomSize, roomSize, flatmateBedroomColor, 0.6);
    this.add.text(minimapX + roomSize * 2 + spacing * 3, minimapY + roomSize / 2 + spacing, 'FB', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Living Room (middle)
    const livingRoomColor = this.roomName === 'Living Room' ? 0x39ff14 : 0x27ae60;
    this.add.rectangle(minimapX + roomSize * 1.5 + spacing * 2, minimapY + roomSize * 1.5 + spacing * 2, roomSize * 2, roomSize, livingRoomColor, 0.6);
    this.add.text(minimapX + roomSize * 1.5 + spacing * 2, minimapY + roomSize * 1.5 + spacing * 2, 'LR', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Kitchen (bottom-left)
    const kitchenColor = this.roomName === 'Kitchen' ? 0x39ff14 : 0xf39c12;
    this.add.rectangle(minimapX + roomSize / 2 + spacing, minimapY + roomSize * 2.5 + spacing * 3, roomSize, roomSize, kitchenColor, 0.6);
    this.add.text(minimapX + roomSize / 2 + spacing, minimapY + roomSize * 2.5 + spacing * 3, 'K', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Bathroom (bottom-middle)
    const bathroomColor = this.roomName === 'Bathroom' ? 0x39ff14 : 0x3498db;
    this.add.rectangle(minimapX + roomSize * 1.5 + spacing * 2, minimapY + roomSize * 2.5 + spacing * 3, roomSize, roomSize, bathroomColor, 0.6);
    this.add.text(minimapX + roomSize * 1.5 + spacing * 2, minimapY + roomSize * 2.5 + spacing * 3, 'B', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Laundry (bottom-right)
    const laundryColor = this.roomName === 'Laundry' ? 0x39ff14 : 0x95a5a6;
    this.add.rectangle(minimapX + roomSize * 2.5 + spacing * 3, minimapY + roomSize * 2.5 + spacing * 3, roomSize, roomSize, laundryColor, 0.6);
    this.add.text(minimapX + roomSize * 2.5 + spacing * 3, minimapY + roomSize * 2.5 + spacing * 3, 'L', {
      fontFamily: 'Courier, monospace',
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Player indicator (green dot) - positioned based on current room
    this.addPlayerIndicator(minimapX, minimapY, roomSize, spacing);
    
    // Flatmate indicator (purple dot) - positioned based on flatmate's room
    this.addFlatmateIndicator(minimapX, minimapY, roomSize, spacing);
    
    // Minimap title
    this.add.text(minimapX + minimapSize / 2, minimapY - 10, 'APARTMENT MAP', {
      fontFamily: 'Courier, monospace',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 4, right: 4, top: 2, bottom: 2 }
    }).setOrigin(0.5);
  }

  private addPlayerIndicator(minimapX: number, minimapY: number, roomSize: number, spacing: number) {
    const minimapSize = 200;
    // Player position based on current room
    let playerX = minimapX + minimapSize / 2;
    let playerY = minimapY + minimapSize / 2;
    
    switch (this.roomName) {
      case 'Your Bedroom':
        playerX = minimapX + roomSize / 2 + spacing;
        playerY = minimapY + roomSize / 2 + spacing;
        break;
      case 'Flatmate Bedroom':
        playerX = minimapX + roomSize * 2 + spacing * 3;
        playerY = minimapY + roomSize / 2 + spacing;
        break;
      case 'Living Room':
        playerX = minimapX + roomSize * 1.5 + spacing * 2;
        playerY = minimapY + roomSize * 1.5 + spacing * 2;
        break;
      case 'Kitchen':
        playerX = minimapX + roomSize / 2 + spacing;
        playerY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
      case 'Bathroom':
        playerX = minimapX + roomSize * 1.5 + spacing * 2;
        playerY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
      case 'Laundry':
        playerX = minimapX + roomSize * 2.5 + spacing * 3;
        playerY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
    }
    
    this.add.circle(playerX, playerY, 3, 0x39ff14);
  }

  private addFlatmateIndicator(minimapX: number, minimapY: number, roomSize: number, spacing: number) {
    const minimapSize = 200;
    const flatmateRoom = this.game.registry.get('flatmateRoom') || 'Living Room';
    let flatmateX = minimapX + minimapSize / 2;
    let flatmateY = minimapY + minimapSize / 2;
    
    switch (flatmateRoom) {
      case 'Your Bedroom':
        flatmateX = minimapX + roomSize / 2 + spacing;
        flatmateY = minimapY + roomSize / 2 + spacing;
        break;
      case 'Flatmate Bedroom':
        flatmateX = minimapX + roomSize * 2 + spacing * 3;
        flatmateY = minimapY + roomSize / 2 + spacing;
        break;
      case 'Living Room':
        flatmateX = minimapX + roomSize * 1.5 + spacing * 2;
        flatmateY = minimapY + roomSize * 1.5 + spacing * 2;
        break;
      case 'Kitchen':
        flatmateX = minimapX + roomSize / 2 + spacing;
        flatmateY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
      case 'Bathroom':
        flatmateX = minimapX + roomSize * 1.5 + spacing * 2;
        flatmateY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
      case 'Laundry':
        flatmateX = minimapX + roomSize * 2.5 + spacing * 3;
        flatmateY = minimapY + roomSize * 2.5 + spacing * 3;
        break;
    }
    
    this.add.circle(flatmateX, flatmateY, 3, 0x9b59b6);
  }

  protected spawnInitialMesses() {
    // Load existing messes from registry for this room
    const roomMessesKey = `messes_${this.roomName}`;
    const existingMesses = this.game.registry.get(roomMessesKey) || [];
    

    
    // Restore existing messes from registry
    existingMesses.forEach((messData: any) => {
      const mess = new Mess(this, messData.x, messData.y, 0);
      this.messes.push(mess);
      this.add.existing(mess);
      this.gameState.messesSpawned++;
    });
  }

  protected spawnRandomMess(globalSpawn = false) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const margin = 100;
    
    const x = margin + Math.random() * (width - 2 * margin);
    const y = margin + Math.random() * (height - 2 * margin);
    
    const mess = new Mess(this, x, y, 0); // roomIndex 0 for now
    this.messes.push(mess);
    this.add.existing(mess);
    this.gameState.messesSpawned++;
    
    // Show global notification if this was a global spawn
    if (globalSpawn) {
      BaseRoomScene.showGlobalMessNotification(this.roomName);
    }
  }

  protected transitionToRoom(targetScene: string, targetRoom: string, fromDoor?: DoorConfig) {
    // Store the room we're coming from
    this.game.registry.set('fromRoom', this.roomName);
    // Store which door we used (for fallback)
    if (fromDoor) {
      this.game.registry.set('lastDoorX', fromDoor.x);
      this.game.registry.set('lastDoorY', fromDoor.y);
    }
    
    // Save current mess positions for this room
    this.saveMessesForRoom();
    
    // Store game state
    this.game.registry.set('gameState', this.gameState);
    // Transition to new scene
    this.scene.start(targetScene);
  }

  private saveMessesForRoom() {
    const roomMessesKey = `messes_${this.roomName}`;
    const messData = this.messes
      .filter(mess => !mess.isCompleted()) // Only save non-completed messes
      .map(mess => ({
        x: mess.x,
        y: mess.y,
        roomName: this.roomName,
        timestamp: Date.now()
      }));
    
    this.game.registry.set(roomMessesKey, messData);
  }

  update(time: number, delta: number) {
    // If game is paused, don't update game logic
    if (this.isPaused) {
      return;
    }

    // Update game state time
    this.gameState.phaseTime += delta;

    // Handle player input
    this.handlePlayerInput();

    // Handle cleaning
    this.handleCleaning();

    // Handle door interactions
    this.handleDoorInteractions();

    // Update entities
    this.player.update(time, delta);
    this.messes.forEach(mess => mess.update(time, delta));

    // Update parameter decay
    this.updateParameterDecay(delta);

    // Update flatmate movement and label position
    if (this.flatmateSprite && this.flatmateLabel) {
      // Move flatmate towards target
      this.updateFlatmateMovement(delta);
      
      // Keep label above flatmate
      this.flatmateLabel.setPosition(this.flatmateSprite.x, this.flatmateSprite.y - 32);
    }

    // Check for global notifications
    const notificationRoom = this.game.registry.get('showGlobalNotification');
    if (notificationRoom) {
      this.game.registry.set('showGlobalNotification', null);
      BaseRoomScene.showGlobalMessNotification(notificationRoom);
    }
    
    // Global mess timer - run in the currently active room scene
    if (this.scene.isActive()) {
      BaseRoomScene.globalMessTimer += delta;
      if (BaseRoomScene.globalMessTimer > 5000) { // Every 5 seconds
        BaseRoomScene.globalMessTimer = 0;
        BaseRoomScene.spawnMessInRandomRoom(this.scene.manager);
      }
    }
    
    // Check for new messes in registry for this room
    const roomMessesKey = `messes_${this.roomName}`;
    const registryMesses = this.game.registry.get(roomMessesKey) || [];
    const currentMessCount = this.messes.length;
    
    // Debug: Log the check
    if (registryMesses.length > currentMessCount) {
      console.log(`${this.roomName}: Found ${registryMesses.length - currentMessCount} new messes in registry`);
    }
    
    // If there are more messes in registry than currently spawned, spawn the new ones
    if (registryMesses.length > currentMessCount) {
      const newMesses = registryMesses.slice(currentMessCount);
      newMesses.forEach((messData: any) => {
        console.log(`Spawning mess in ${this.roomName} at (${messData.x}, ${messData.y})`);
        const mess = new Mess(this, messData.x, messData.y, 0);
        this.messes.push(mess);
        this.add.existing(mess);
        this.gameState.messesSpawned++;
      });
    }
    

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

  private handleDoorInteractions() {
    let nearestDoor: DoorConfig | null = null;
    let nearestDistance = Infinity;
    
    // Check if player is near any door
    for (const config of this.doorConfigs) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        config.x, config.y
      );
      
      if (distance < 80 && distance < nearestDistance) {
        nearestDoor = config;
        nearestDistance = distance;
      }
    }
    
    // Show/hide door prompt
    if (nearestDoor !== null && nearestDistance < 80) {
      if (!this.isNearDoor) {
        this.isNearDoor = true;
        this.doorPrompt.setText(`Press E to move to ${nearestDoor.targetRoom}`);
        this.doorPrompt.setVisible(true);
      }
      
      // Handle E key press
      if (this.eKey.isDown) {
        this.transitionToRoom(nearestDoor.targetScene, nearestDoor.targetRoom, nearestDoor);
      }
    } else {
      if (this.isNearDoor) {
        this.isNearDoor = false;
        this.doorPrompt.setVisible(false);
      }
    }
  }

  private updateParameterDecay(delta: number) {
    const deltaSeconds = delta / 1000;
    
    // Cleanliness decreases when messes are present
    const activeMesses = this.messes.filter(mess => !mess.isCompleted()).length;
    if (activeMesses > 0) {
      const cleanlinessDecayRate = 0.5 + activeMesses * 1.5;
      this.gameState.cleanliness = Math.max(0, this.gameState.cleanliness - cleanlinessDecayRate * deltaSeconds);
    } else {
      // Gradually increase cleanliness when no messes are present
      const cleanlinessRecoveryRate = 0.3;
      this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + cleanlinessRecoveryRate * deltaSeconds);
    }
    
    // Mood decays based on cleanliness
    const cleanlinessFactor = Math.pow((100 - this.gameState.cleanliness) / 100, 2);
    const baseMoodDecayRate = 0.1;
    const cleanlinessMoodDecay = cleanlinessFactor * 2.0;
    const moodDecayRate = baseMoodDecayRate + cleanlinessMoodDecay;
    this.gameState.playerMood = Math.max(0, this.gameState.playerMood - moodDecayRate * deltaSeconds);
  }

  public onMessCleaned() {
    this.gameState.messesCleaned++;
    this.gameState.playerMood = Math.min(100, this.gameState.playerMood + 5);
    this.gameState.cleanliness = Math.min(100, this.gameState.cleanliness + 10);
    
    // Remove cleaned mess from array
    this.messes = this.messes.filter(mess => !mess.isCompleted());
  }

  private showMessNotification() {
    // Set the notification text
    this.messNotification.setText(`Mess made at ${this.roomName}`);
    this.messNotification.setVisible(true);
    
    // Hide the notification after 2 seconds
    this.time.delayedCall(2000, () => {
      this.messNotification.setVisible(false);
    });
  }

  private togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame() {
    this.isPaused = true;
    this.createPauseMenu();
    
    // Don't pause the scene - just set the flag
    // This allows input to still work
  }

  private resumeGame() {
    this.isPaused = false;
    this.destroyPauseMenu();
  }

  private createPauseMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    // Menu background
    const menuBg = this.add.rectangle(width / 2, height / 2, 300, 200, 0x333333, 0.9)
      .setStrokeStyle(2, 0x39ff14);
    
    // Menu title
    const title = this.add.text(width / 2, height / 2 - 60, 'GAME PAUSED', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#39ff14'
    }).setOrigin(0.5);
    
    // Cancel button
    const cancelButton = this.add.text(width / 2, height / 2 - 10, 'CANCEL', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 20, right: 20, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    cancelButton.on('pointerover', () => {
      cancelButton.setColor('#39ff14');
    });
    
    cancelButton.on('pointerout', () => {
      cancelButton.setColor('#ffffff');
    });
    
    cancelButton.on('pointerdown', () => {
      this.resumeGame();
    });
    
    // Exit button
    const exitButton = this.add.text(width / 2, height / 2 + 40, 'EXIT TO MENU', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 20, right: 20, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    exitButton.on('pointerover', () => {
      exitButton.setColor('#ff4500');
    });
    
    exitButton.on('pointerout', () => {
      exitButton.setColor('#ffffff');
    });
    
    exitButton.on('pointerdown', () => {
      this.exitToMenu();
    });
    
    // Create container for all pause menu elements
    this.pauseMenu = this.add.container(0, 0, [overlay, menuBg, title, cancelButton, exitButton]);
    this.pauseMenu.setDepth(1000); // Ensure it's on top
  }

  private destroyPauseMenu() {
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = undefined;
    }
  }

  private exitToMenu() {
    // Save current game state
    this.saveMessesForRoom();
    this.game.registry.set('gameState', this.gameState);
    
    // Return to home scene
    this.scene.start('HomeScene');
  }

  private spawnFlatmateIfNeeded() {
    const flatmateRoom = this.game.registry.get('flatmateRoom') || 'Living Room';
    
    // Only spawn flatmate if this is the flatmate's current room
    if (this.roomName !== flatmateRoom) {
      // Remove flatmate if present in wrong room
      if (this.flatmateSprite) {
        this.flatmateSprite.destroy();
        this.flatmateSprite = undefined;
      }
      if (this.flatmateLabel) {
        this.flatmateLabel.destroy();
        this.flatmateLabel = undefined;
      }
      return;
    }
    
    // Spawn flatmate if not already present
    if (!this.flatmateSprite) {
      // Place flatmate at a random position in this room
      const x = Phaser.Math.Between(200, this.cameras.main.width - 200);
      const y = Phaser.Math.Between(200, this.cameras.main.height - 200);
      this.flatmateSprite = this.add.circle(x, y, 22, 0x9b59b6, 1);
      this.flatmateLabel = this.add.text(x, y - 32, 'FLATMATE', {
        fontFamily: 'Courier, monospace', fontSize: '13px', color: '#fff', backgroundColor: '#000', padding: { left: 4, right: 4, top: 2, bottom: 2 }
      }).setOrigin(0.5);
      this.flatmateCurrentRoom = this.roomName;
      
      // Set initial movement target
      this.setNewFlatmateTarget();
      
      // Schedule room change and movement updates
      this.scheduleFlatmateMove();
    }
  }

  private scheduleFlatmateMove() {
    if (this.flatmateTimer) this.flatmateTimer.remove(false);
    this.flatmateTimer = this.time.addEvent({
      delay: Phaser.Math.Between(4000, 7000),
      callback: () => {
        this.moveFlatmateToAnotherRoom();
      }
    });
  }

  private setNewFlatmateTarget() {
    if (!this.flatmateSprite) return;
    
    // Set a new random target within the room bounds
    const margin = 100;
    this.flatmateTargetX = Phaser.Math.Between(margin, this.cameras.main.width - margin);
    this.flatmateTargetY = Phaser.Math.Between(margin, this.cameras.main.height - margin);
  }

  private updateFlatmateMovement(delta: number) {
    if (!this.flatmateSprite) return;
    
    const deltaSeconds = delta / 1000;
    const currentX = this.flatmateSprite.x;
    const currentY = this.flatmateSprite.y;
    
    // Calculate distance to target
    const distanceToTarget = Phaser.Math.Distance.Between(currentX, currentY, this.flatmateTargetX, this.flatmateTargetY);
    
    // If close to target, set new target
    if (distanceToTarget < 20) {
      this.setNewFlatmateTarget();
      return;
    }
    
    // Move towards target
    const directionX = (this.flatmateTargetX - currentX) / distanceToTarget;
    const directionY = (this.flatmateTargetY - currentY) / distanceToTarget;
    
    const newX = currentX + directionX * this.flatmateMoveSpeed * deltaSeconds;
    const newY = currentY + directionY * this.flatmateMoveSpeed * deltaSeconds;
    
    // Keep flatmate within room bounds
    const margin = 50;
    const clampedX = Phaser.Math.Clamp(newX, margin, this.cameras.main.width - margin);
    const clampedY = Phaser.Math.Clamp(newY, margin, this.cameras.main.height - margin);
    
    this.flatmateSprite.setPosition(clampedX, clampedY);
  }

  private moveFlatmateToAnotherRoom() {
    // List of all rooms except player's current room
    const allRooms = [
      'Living Room',
      'Flatmate Bedroom',
      'Kitchen',
      'Bathroom',
      'Laundry'
    ];
    const otherRooms = allRooms.filter(r => r !== this.roomName);
    const nextRoom = Phaser.Utils.Array.GetRandom(otherRooms);
    // Remove flatmate from this room
    if (this.flatmateSprite) this.flatmateSprite.destroy();
    if (this.flatmateLabel) this.flatmateLabel.destroy();
    // Tell the registry where the flatmate is going
    this.game.registry.set('flatmateRoom', nextRoom);
    // Flatmate will be spawned in the next room's create()
  }
} 