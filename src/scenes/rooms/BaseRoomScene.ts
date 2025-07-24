import Phaser from 'phaser';
import Player from '../../entities/Player';
import PhaseManager from '../../systems/PhaseManager';
import GameStateManager from '../../systems/GameStateManager';
import FlatmateSystem from '../../systems/FlatmateSystem';
import UIManager from '../../systems/UIManager';
import MessItemManager from '../../systems/MessItemManager';
import GlobalSpawnManager from '../../systems/GlobalSpawnManager';
import { COLORS, GAME_CONFIG } from '../../data/constants';
import itemsData from '../../data/items.json';
import Mess from '../../entities/Mess';
import BrokenItem from '../../entities/BrokenItem';
import { getRoomName } from '../../data/roomConfig';
import { MathUtils } from '../../utils/MathUtils';
import { StateManager } from '../../systems/StateManager';

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
  // Core systems
  protected phaseManager!: PhaseManager;
  protected gameStateManager!: GameStateManager;
  protected flatmateSystem!: FlatmateSystem;
  protected uiManager!: UIManager;
  protected messItemManager!: MessItemManager;
  protected globalSpawnManager!: GlobalSpawnManager;
  
  // Room-specific components
  protected player!: Player;
  protected doors: Phaser.GameObjects.Rectangle[] = [];
  protected doorConfigs: DoorConfig[] = [];
  protected doorPrompt!: Phaser.GameObjects.Text;
  protected isNearDoor: boolean = false;
  protected isSpaceHeld: boolean = false; // Track if space is being held
  
  // Input handling
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  protected spaceKey!: Phaser.Input.Keyboard.Key;
  protected eKey!: Phaser.Input.Keyboard.Key;
  
  // Room properties
  protected roomName: string;
  protected roomColor: number;

  constructor(key: string, roomName: string, roomColor: number) {
    super({ key });
    this.roomName = roomName;
    this.roomColor = roomColor;
  }

  create() {
    // Initialize all managers
    this.initializeManagers();
    
    // Setup room
    this.createRoomBackground();
    this.createDoors();
    this.createPlayer();
    
    // Setup input
    this.setupInput();

    // Create UI
    this.uiManager.create();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load existing items for this room (important for room transitions)
    this.messItemManager.loadItemsForCurrentRoom();
    
    // Spawn flatmate if needed
    this.flatmateSystem.spawnFlatmateIfNeeded(this.roomName);
    
    // Debug: Force spawn flatmate for testing
    if (this.roomName === 'Living Room') {
      console.log('Forcing flatmate spawn in Living Room for testing');
      this.flatmateSystem.forceSpawnFlatmate();
    }
    
    // Set player reference for flatmate system (for night phase)
    this.flatmateSystem.setPlayerReference(this.player);
    
    // Check if night phase is already active and initialize accordingly
    if (FlatmateSystem.isNightPhaseActive()) {
      this.flatmateSystem.setNightPhase(true);
    }
    
    // Initialize timer with current phase time
    this.uiManager.syncTimerWithPhaseManager(this.phaseManager.getRemainingTime());
    
    // Update UI with the current phase (important for room transitions)
    this.uiManager.updatePhase(this.phaseManager.getCurrentPhase());
  }

  private initializeManagers(): void {
    // Initialize Phase Manager
    this.phaseManager = new PhaseManager(this, this.scene.manager);
    this.phaseManager.loadState(); // Load saved state
    this.phaseManager.setPhaseTransitionCallback((event) => {
      this.onPhaseTransition(event);
    });

    // Initialize Game State Manager
    this.gameStateManager = new GameStateManager(this);
    this.gameStateManager.setStateChangeCallback((state) => {
      this.uiManager.updateGameState(state);
    });
    
    // Sync GameStateManager's current phase with PhaseManager's loaded state
    const currentPhase = this.phaseManager.getCurrentPhase();
    this.gameStateManager.setCurrentPhase(currentPhase as 'morning' | 'afternoon' | 'evening' | 'night');
    
    // Save the synced state to registry to ensure consistency
    this.gameStateManager.saveStateToRegistry();

    // Initialize Flatmate System (singleton)
    this.flatmateSystem = FlatmateSystem.getInstance(this, this.scene.manager);
    console.log('FlatmateSystem initialized in BaseRoomScene');
    this.flatmateSystem.setRoomChangeCallback((fromRoom, toRoom) => {
      // console.log(`Flatmate moved from ${fromRoom} to ${toRoom}`);
    });

    // Initialize UI Manager
    this.uiManager = new UIManager(this);
    this.uiManager.setPauseToggleCallback((isPaused) => {
      this.onPauseToggle(isPaused);
    });

    // Initialize Global Spawn Manager (singleton)
    this.globalSpawnManager = GlobalSpawnManager.getInstance();
    this.globalSpawnManager.initialize(this.scene.manager);
    
    // Set initial spawn config from current phase
    const initialConfig = this.phaseManager.getCurrentSpawnConfig();
    // console.log('Setting initial GlobalSpawnManager config:', initialConfig);
    this.globalSpawnManager.updateSpawnConfig(initialConfig);
    
    // Initialize Mess/Item Manager (now only handles local items)
    const spawnConfig = this.phaseManager.getCurrentSpawnConfig();
    this.messItemManager = new MessItemManager(this, spawnConfig);
    this.messItemManager.setMessCleanedCallback(() => {
      this.gameStateManager.onMessCleaned();
    });
    this.messItemManager.setItemRepairedCallback(() => {
      this.gameStateManager.onItemRepaired();
    });
  }

  // Removed getSpawnConfig() method - now handled by PhaseManager and individual phase files

  private setupEventListeners(): void {
    // Listen for notifications from mess/item manager
    this.events.on('showNotification', (message: string) => {
      this.uiManager.showNotification(message);
    });

    // Listen for phase transitions
    this.events.on('phaseTransition', (event: any) => {
      this.onPhaseTransition(event);
    });
    
    // Timer completion is now handled by PhaseManager's internal timer
    // No need for separate timer events
    
    // Listen for mess and item completion events
    this.events.on('messCleaned', (mess: any) => {
      // console.log('Mess cleaned!');
      this.gameStateManager.onMessCleaned();
    });
    
    this.events.on('itemRepaired', (item: any) => {
      // console.log('Item repaired!');
      this.gameStateManager.onItemRepaired();
    });
    
    // Listen for global notifications
    this.game.events.on('showNotification', (message: string) => {
      this.uiManager.showNotification(message);
    });

    // Listen for player hit events from flatmate projectiles
    this.events.on('playerHit', (data: { damage: number; newHealth: number }) => {
      this.uiManager.showNotification(`💥 Hit by flatmate! -${data.damage} Health`, 2000);
      
      // Update game state manager
      this.gameStateManager.onPlayerHit();
    });
  }

  private onPhaseTransition(event: any): void {
    // Update UI
    this.uiManager.updatePhase(event.toPhase);
    
    // Update GameStateManager's current phase to match PhaseManager
    this.gameStateManager.setCurrentPhase(event.toPhase as 'morning' | 'afternoon' | 'evening' | 'night');
    
    // Update spawn config for new phase from PhaseManager
    const newConfig = this.phaseManager.getCurrentSpawnConfig();
    // console.log(`New phase spawn config:`, newConfig);
    this.globalSpawnManager.updateSpawnConfig(newConfig);
    this.messItemManager.updateSpawnConfig(newConfig);
    
    // Reset timer for new phase
    this.uiManager.syncTimerWithPhaseManager(this.phaseManager.getRemainingTime());
    
    // Special notification for evening phase
    if (event.toPhase === 'evening') {
      // Get the selected flatmate and their event
      const selectedFlatmate = this.getSelectedFlatmate();
      if (selectedFlatmate) {
        const event = this.getRandomEveningEvent(selectedFlatmate);
        this.uiManager.showNotification(`🌙 EVENING CHAOS! ${selectedFlatmate.name} has ${event}! 🌙`, 3000);
      } else {
        this.uiManager.showNotification('🌙 EVENING CHAOS EVENT! 🌙', 3000);
      }
    }

    // Activate night phase behavior
    if (event.toPhase === 'night') {
      this.uiManager.showNotification('🌃 NIGHT PHASE: Flatmate becomes aggressive! 🌃', 3000);
      this.flatmateSystem.setNightPhase(true);
    } else if (event.fromPhase === 'night') {
      // Deactivate night phase when leaving night
      this.flatmateSystem.setNightPhase(false);
    }
    
    // Handle day completion - only clear items when day ends
    if (event.toPhase === 'complete') {
      // console.log('Day complete - clearing all items and resetting phase manager');
      GlobalSpawnManager.clearGlobalRegistry();
      this.messItemManager.reset();
      this.phaseManager.reset(); // Reset PhaseManager for new day
      this.phaseManager.saveState(); // Save the reset state
      this.showDaySummary();
    }
  }

  private onPauseToggle(isPaused: boolean): void {
    // console.log('Scene pause toggle:', isPaused);
    // Don't pause the scene, just let the UI manager handle the pause state
    // This ensures input still works for the pause menu
  }

  update(time: number, delta: number) {
    // Clamp delta to prevent huge jumps
    const clampedDelta = Math.min(delta, 50); // Max 50ms delta

    // Always update UI manager (for pause menu input)
    this.uiManager.update(time, clampedDelta);

    // Only update game logic if not paused
    if (this.uiManager.isPaused()) return;

    // Update all managers
    this.phaseManager.update(time, clampedDelta);
    this.gameStateManager.update(clampedDelta);
    this.flatmateSystem.update(clampedDelta);
    this.globalSpawnManager.update(clampedDelta); // Global spawning
    // this.messItemManager.update(clampedDelta); // Disable local spawning

    // Update projectiles during night phase
    this.flatmateSystem.updateProjectiles(time, clampedDelta);

    // Sync timer with PhaseManager
    this.uiManager.syncTimerWithPhaseManager(this.phaseManager.getRemainingTime());

    // Save PhaseManager state periodically
    if (time % 1000 < clampedDelta) { // Save every second
      this.phaseManager.saveState();
    }

    // Update player
    this.player.update(time, clampedDelta);

    // Update messes and broken items
    this.updateItems(time, clampedDelta);

    // Handle input
    this.handlePlayerInput();
    this.handleDoorInteractions();
    this.handleItemInteractions();
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    
    // Add event listeners for space key
    this.spaceKey.on('down', () => {
      // console.log('DEBUG: Space key pressed down');
      this.isSpaceHeld = true;
    });
    
    this.spaceKey.on('up', () => {
      // console.log('DEBUG: Space key released');
      this.isSpaceHeld = false;
    });

    // Test key for manual spawning
    const testKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    testKey.on('down', () => {
      // console.log('T key pressed - testing manual spawn');
      this.globalSpawnManager.forceSpawnTest();
    });

    // Test key for progress bar testing
    const progressTestKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    progressTestKey.on('down', () => {
      // console.log('P key pressed - testing progress bar');
      this.testProgressBarOnNearestItem();
      this.testSimpleProgressBar();
    });

    // Test key for spawning items in current room
    const spawnTestKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    spawnTestKey.on('down', () => {
      // console.log('I key pressed - spawning test items in current room');
      this.spawnTestItemsInCurrentRoom();
    });

    // Test key for testing progress bar on items
    const itemProgressTestKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    itemProgressTestKey.on('down', () => {
      // console.log('O key pressed - testing progress bar on nearest item');
      this.testProgressBarOnNearestItem();
    });

    // Test key for creating mess right next to player
    const createMessKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    createMessKey.on('down', () => {
      // console.log('K key pressed - creating mess right next to player');
      this.createTestMessNextToPlayer();
    });

    // Admin key for skipping phases
    const adminSkipKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    adminSkipKey.on('down', () => {
      console.log('L key pressed - ADMIN: Skipping to next phase');
      this.skipToNextPhase();
    });

    // Test key for flatmate movement
    const flatmateTestKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    flatmateTestKey.on('down', () => {
      console.log('F key pressed - Testing flatmate movement');
      this.flatmateSystem.forceSpawnFlatmate();
      this.flatmateSystem.testMoveToAnotherRoom();
    });

    // Admin key for fast-forwarding 10 seconds
    const fastForwardKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    fastForwardKey.on('down', () => {
      console.log('J key pressed - ADMIN: Fast-forwarding 10 seconds');
      this.fastForward10Seconds();
    });
  }

  private createRoomBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create room background
    this.add.rectangle(width / 2, height / 2, width, height, this.roomColor, 0.3);
    
    // Add room name
    this.add.text(width / 2, 20, this.roomName, {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  protected createDoors(): void {
    // This should be implemented by each room scene
    // Each room defines its own door configurations
  }

  private createPlayer(): void {
    let playerX: number;
    let playerY: number;
    
    // Get state manager
    const stateManager = StateManager.getInstance(this);
    
    // Check if we have door transition information
    const fromDoor = stateManager.getFromDoor();
    
    if (fromDoor) {
      // We came from another room, find the door in this room that leads back to where we came from
      const correspondingDoor = this.doorConfigs.find(door => 
        door.targetScene === fromDoor.targetScene && door.targetRoom === fromDoor.targetRoom
      );
      
      if (correspondingDoor) {
        // Position player at the door they should spawn at
        playerX = correspondingDoor.x + correspondingDoor.width / 2;
        playerY = correspondingDoor.y + correspondingDoor.height / 2;
        // console.log(`Player spawning at door: ${playerX}, ${playerY} for door to ${correspondingDoor.targetRoom}`);
      } else {
        // Fallback to center if no matching door found
        playerX = this.cameras.main.width / 2;
        playerY = this.cameras.main.height / 2;
        // console.log('No matching door found, spawning at center');
      }
      
      // Clear the fromDoor data after using it
      stateManager.clearFromDoor();
    } else {
      // No door transition, use saved position or default to center
      const playerPosition = stateManager.getPlayerPosition();
      playerX = playerPosition.x;
      playerY = playerPosition.y;
    }
    
    this.player = new Player(this, playerX, playerY);
    
    // Ensure player starts with zero velocity
    this.player.resetVelocity();
  }

  private handlePlayerInput(): void {
    // Handle player movement using consistent speed from constants
    const speed = GAME_CONFIG.PLAYER_SPEED;
    let velocityX = 0;
    let velocityY = 0;

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

  private handleDoorInteractions(): void {
    // Check if player is near any door
    this.isNearDoor = false;
    let nearestDoor: DoorConfig | null = null;
    
    for (let i = 0; i < this.doorConfigs.length; i++) {
      const door = this.doorConfigs[i];
      const distance = MathUtils.distance(
        this.player.x, this.player.y,
        door.x + door.width / 2, door.y + door.height / 2
      );

      if (distance < 50) {
        this.isNearDoor = true;
        nearestDoor = door;
        break;
      }
    }
    
    // Show/hide door prompt
    if (this.isNearDoor && nearestDoor) {
      if (!this.doorPrompt) {
        this.doorPrompt = this.add.text(0, 0, `Press E to enter ${nearestDoor.label}`, {
          fontFamily: 'Courier, monospace',
          fontSize: '16px',
          color: '#39ff14',
          backgroundColor: '#000000',
          padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(0.5);
      }
      this.doorPrompt.setPosition(this.player.x, this.player.y - 60);
      this.doorPrompt.setVisible(true);

      // Handle door interaction
      if (this.eKey.isDown) {
        this.transitionToRoom(nearestDoor.targetScene, nearestDoor.targetRoom);
      }
    } else if (this.doorPrompt) {
        this.doorPrompt.setVisible(false);
    }
  }

  private handleItemInteractions(): void {
    // Check for mess interactions
    const messes = this.messItemManager.getMesses();
    let nearMess = false;
    let nearBrokenItem = false;

    // Check if player is near any mess
    for (const mess of messes) {
      const distance = MathUtils.distance(
        this.player.x, this.player.y,
        mess.x, mess.y
      );

      if (distance < 50) {
        nearMess = true;
        
        // Show interaction prompt
        if (!this.doorPrompt || this.doorPrompt.text !== 'Press SPACE to clean mess') {
          if (this.doorPrompt) {
            this.doorPrompt.destroy();
          }
          this.doorPrompt = this.add.text(0, 0, 'Press SPACE to clean mess', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#39ff14',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
          }).setOrigin(0.5);
        }
        this.doorPrompt.setPosition(this.player.x, this.player.y - 60);
        this.doorPrompt.setVisible(true);

        // Handle space bar interaction
        if (this.isSpaceHeld) {
          if (!mess.isBeingCleaned) {
            mess.startCleaning();
      }
    } else {
          // Stop cleaning if space is released
          if (mess.isBeingCleaned) {
            mess.stopCleaning();
          }
        }
        break;
      }
    }

    // Check for broken item interactions
    const brokenItems = this.messItemManager.getBrokenItems();
    for (const item of brokenItems) {
      const distance = MathUtils.distance(
        this.player.x, this.player.y,
        item.x, item.y
      );

      if (distance < 50) {
        nearBrokenItem = true;
        
        // Show interaction prompt
        if (!this.doorPrompt || this.doorPrompt.text !== 'Press SPACE to repair item') {
          if (this.doorPrompt) {
            this.doorPrompt.destroy();
          }
          this.doorPrompt = this.add.text(0, 0, 'Press SPACE to repair item', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#39ff14',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
          }).setOrigin(0.5);
        }
        this.doorPrompt.setPosition(this.player.x, this.player.y - 60);
        this.doorPrompt.setVisible(true);

        // Handle space bar interaction
        if (this.spaceKey.isDown) {
          if (!item.getIsRepairing()) {
            item.startRepair();
          }
      } else {
          // Stop repairing if space is released
          if (item.getIsRepairing()) {
            item.stopRepair();
          }
        }
        break;
      }
    }

    // Stop any ongoing interactions if player is not near the item anymore
    if (!nearMess) {
      messes.forEach(mess => {
        if (mess.isBeingCleaned) {
          mess.stopCleaning();
        }
      });
    }

    if (!nearBrokenItem) {
      brokenItems.forEach(item => {
        if (item.getIsRepairing()) {
          item.stopRepair();
        }
      });
    }

    // Hide prompt if not near any interactive items
    if (!nearMess && !nearBrokenItem && this.doorPrompt && 
        (this.doorPrompt.text === 'Press SPACE to clean mess' || 
         this.doorPrompt.text === 'Press SPACE to repair item')) {
      this.doorPrompt.setVisible(false);
    }
  }

  private updateItems(time: number, delta: number): void {
    // Update all messes
    const messes = this.messItemManager.getMesses();
    for (const mess of messes) {
      mess.update(time, delta);
    }

    // Update all broken items
    const brokenItems = this.messItemManager.getBrokenItems();
    for (const item of brokenItems) {
      item.update(time, delta);
    }
  }

  protected transitionToRoom(targetScene: string, targetRoom: string): void {
    // Find the door we're transitioning from to position player correctly
    const fromDoor = this.doorConfigs.find(door => door.targetScene === targetScene);
    
    if (fromDoor) {
      // Store the door we came from so the target room can position us correctly
      this.game.registry.set('fromDoor', {
        x: fromDoor.x + fromDoor.width / 2,
        y: fromDoor.y + fromDoor.height / 2,
        targetScene: this.scene.key,
        targetRoom: this.roomName
      });
    }
    
    // Save current room state
    this.saveRoomState();
    
    // Save PhaseManager state before transitioning
    this.phaseManager.saveState();
    
    // Transition to new room
    this.scene.start(targetScene);
  }

  private saveRoomState(): void {
    // Get state manager
    const stateManager = StateManager.getInstance(this);
    
    // Save player position
    stateManager.setPlayerPosition(this.player.x, this.player.y);
    
    // Save game state
    const gameState = this.gameStateManager.getState();
    stateManager.setGameState(gameState);
    
    // Save timer state
    if (this.uiManager.getTimer()) {
      stateManager.setTimerState({
        remaining: this.uiManager.getTimer().getRemaining(),
        running: this.uiManager.getTimer().isRunning()
      });
    }
  }

  private showDaySummary(): void {
    const state = this.gameStateManager.getState();
    this.scene.start('DaySummaryScene', { 
      messesCleaned: state.messesCleaned,
      itemsFixed: state.brokenItemsFixed,
      finalMood: state.playerMood,
      finalCleanliness: state.cleanliness,
      finalHealth: state.playerHealth,
      finalRage: state.flatmateRage
    });
  }

  private testProgressBarOnNearestItem(): void {
    const messes = this.messItemManager.getMesses();
    const brokenItems = this.messItemManager.getBrokenItems();
    
    // console.log(`Testing progress bar - Found ${messes.length} messes and ${brokenItems.length} broken items`);
    
    // Test on nearest mess
    for (const mess of messes) {
      const distance = MathUtils.distance(
        this.player.x, this.player.y,
        mess.x, mess.y
      );
      
      if (distance < 100) {
        // console.log(`Testing progress bar on mess at (${mess.x}, ${mess.y})`);
        (mess as any).testShowProgressBar();
        return;
      }
    }
    
    // Test on nearest broken item
    for (const item of brokenItems) {
      const distance = MathUtils.distance(
        this.player.x, this.player.y,
        item.x, item.y
      );
      
      if (distance < 100) {
        // console.log(`Testing progress bar on broken item at (${item.x}, ${item.y})`);
        (item as any).testShowProgressBar();
        return;
      }
    }
    
    // console.log('No items found within 100 pixels to test progress bar');
  }

  private testSimpleProgressBar(): void {
    // console.log('Creating simple test progress bar');
    
    // Create background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.8);
    bg.fillRect(this.player.x - 50, this.player.y - 60, 100, 10);
    bg.setDepth(1000);
    
    // Create progress bar
    const bar = this.add.graphics();
    bar.fillStyle(0x39ff14, 1);
    bar.fillRect(this.player.x - 50, this.player.y - 60, 0, 10);
    bar.setDepth(1001);
    
    // Animate progress
    this.tweens.add({
      targets: {},
      duration: 2000,
      onUpdate: (tween: any) => {
        const progress = tween.progress;
        bar.clear();
        bar.fillStyle(0x39ff14, 1);
        bar.fillRect(this.player.x - 50, this.player.y - 60, 100 * progress, 10);
      },
      onComplete: () => {
        // console.log('Test progress bar animation complete');
        // Clean up after 1 second
        this.time.delayedCall(1000, () => {
          bg.destroy();
          bar.destroy();
        });
      }
    });
  }

  private spawnTestItemsInCurrentRoom(): void {
    // console.log('Spawning test items in current room...');
    
    // Force spawn a mess and broken item near the player
    const GlobalSpawnManager = require('../../systems/GlobalSpawnManager').default;
    
    // Spawn a mess
    const messId = `test_mess_${Date.now()}`;
    const testMess = {
      id: messId,
      roomName: this.roomName,
      x: this.player.x + 50,
      y: this.player.y + 50,
      roomIndex: 0
    };
    GlobalSpawnManager.globalMesses.push(testMess);
    
    // Spawn a broken item
    const itemId = `test_item_${Date.now()}`;
    const testItem = {
      id: itemId,
      roomName: this.roomName,
      x: this.player.x - 50,
      y: this.player.y - 50,
      furnitureData: {
        id: 'test_furniture',
        name: 'Test Furniture',
        x: this.player.x - 50,
        y: this.player.y - 50,
        width: 30,
        height: 30,
        color: '#ff0000'
      },
      roomIndex: 0
    };
    GlobalSpawnManager.globalBrokenItems.push(testItem);
    
    // Reload items for current room
    this.messItemManager.loadItemsForCurrentRoom();
    
    // console.log(`Spawned test mess at (${testMess.x}, ${testMess.y})`);
    // console.log(`Spawned test broken item at (${testItem.x}, ${testItem.y})`);
    // console.log('Test item spawning complete.');
  }

  private createTestMessNextToPlayer(): void {
    // console.log('Creating test mess right next to player...');
    const GlobalSpawnManager = require('../../systems/GlobalSpawnManager').default;

    // Try to find a position near the player that doesn't overlap with furniture
    let testX: number, testY: number;
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
      // Position near player with some randomness
      testX = this.player.x + MathUtils.random(-30, 30);
      testY = this.player.y + MathUtils.random(-30, 30);
      attempts++;
    } while (this.isPositionOverlappingFurniture(testX, testY) && attempts < maxAttempts);

    const messId = `test_mess_${Date.now()}`;
    const testMess = {
      id: messId,
      roomName: this.roomName,
      x: testX,
      y: testY,
      roomIndex: 0
    };
    GlobalSpawnManager.globalMesses.push(testMess);

    this.messItemManager.loadItemsForCurrentRoom();
    // console.log(`Spawned test mess at (${testMess.x}, ${testMess.y})`);
    // console.log('Test mess spawning complete.');
  }

  private isPositionOverlappingFurniture(x: number, y: number): boolean {
    const itemsData = require('../../data/items.json');
    const roomFurniture = itemsData.furniture[this.roomName as keyof typeof itemsData.furniture];
    
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

  private skipToNextPhase(): void {
    // Show admin notification
    this.uiManager.showNotification('ADMIN: Phase skipped!', 3000);
    
    // Force phase transition
    this.phaseManager.forceNextPhase();
    
    // Immediately save the phase state to prevent it from resetting on room change
    this.phaseManager.saveState();
  }

  private fastForward10Seconds(): void {
    console.log('ADMIN: Fast-forwarding 10 seconds...');
    
    // Fast-forward the phase manager
    this.phaseManager.fastForward(10);
    
    // Fast-forward the UI timer
    this.uiManager.fastForward(10);
    
    // Sync the UI timer with the phase manager
    this.uiManager.syncTimerWithPhaseManager(this.phaseManager.getRemainingTime());
    
    // Immediately save the phase state to prevent it from resetting on room change
    this.phaseManager.saveState();
  }

  private getSelectedFlatmate(): any {
    // Get the selected flatmate from the registry
    const selectedFlatmateId = this.game.registry.get('selectedFlatmateId');
    if (!selectedFlatmateId) return null;
    
    // Import flatmate data
    const flatmateData = require('../../data/flatmates.json');
    return flatmateData.flatmates.find((f: any) => f.id === selectedFlatmateId);
  }

  private getRandomEveningEvent(flatmate: any): string {
    if (!flatmate || !flatmate.eveningEvents) return 'caused chaos';
    const randomIndex = Math.floor(Math.random() * flatmate.eveningEvents.length);
    return flatmate.eveningEvents[randomIndex];
  }

  shutdown() {
    // Clean up event listeners
    this.events.off('showNotification');
    this.events.off('phaseTransition');
    this.game.events.off('showNotification');
    
    // Clean up UI manager
    this.uiManager.destroy();
    
    // Clean up flatmate system
    this.flatmateSystem.destroy();
    
    // Reset managers
    this.phaseManager.reset();
    this.gameStateManager.reset();
    this.flatmateSystem.reset();
    this.messItemManager.reset();
  }
} 