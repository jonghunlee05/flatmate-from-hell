import Phaser from 'phaser';
import { GameState } from '../scenes/rooms/BaseRoomScene';

export default class DayUI {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private phaseText: Phaser.GameObjects.Text;
  private moodText: Phaser.GameObjects.Text;
  private cleanlinessText: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  private flatmateRageText: Phaser.GameObjects.Text;
  private messesText: Phaser.GameObjects.Text;
  private miniMapContainer!: Phaser.GameObjects.Container;
  private miniMapRooms: Phaser.GameObjects.Rectangle[] = [];
  private miniMapPlayer!: Phaser.GameObjects.Rectangle;
  private miniMapFlatmate!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // Phase text (top center)
    this.phaseText = scene.add.text(width / 2, 20, 'DAY 1: MORNING', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#39ff14',
      backgroundColor: '#000000',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5);

    // Timer text (below phase) - DISABLED, using separate Timer component instead
    // this.timerText = scene.add.text(width / 2, 60, '60', {
    //   fontFamily: 'Courier, monospace',
    //   fontSize: '20px',
    //   color: '#ffffff',
    //   backgroundColor: '#333333',
    //   padding: { left: 8, right: 8, top: 4, bottom: 4 }
    // }).setOrigin(0.5);

    // Create mini-map in top right
    this.createMiniMap(width, height);

    // Parameters moved to bottom
    const bottomY = height - 80;
    const paramSpacing = 120;

    // 🟪 Mood text (bottom left)
    this.moodText = scene.add.text(20, bottomY, '🟪 Mood: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#39ff14'
    });

    // 🟩 Cleanliness text (bottom center-left)
    this.cleanlinessText = scene.add.text(20 + paramSpacing, bottomY, '🟩 Clean: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#4CAF50'
    });

    // 🟦 Health text (bottom center)
    this.healthText = scene.add.text(20 + paramSpacing * 2, bottomY, '🟦 Health: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#3498db'
    });

    // 🟥 Flatmate Rage text (bottom center-right)
    this.flatmateRageText = scene.add.text(20 + paramSpacing * 3, bottomY, '🟥 Rage: 0%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ff4500'
    });

    // Messes text (bottom right)
    this.messesText = scene.add.text(width - 20, bottomY, 'Messes: 0/3', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(1, 0);

    // Instructions (bottom center, below parameters)
    scene.add.text(width / 2, height - 20, 'WASD/Arrows to move, SPACE to clean', {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  update(gameState: GameState) {
    this.gameState = gameState;

    // Timer is now handled by separate Timer component
    // const remainingTime = Math.max(0, 60 - Math.floor(gameState.phaseTime / 1000));
    // this.timerText.setText(remainingTime.toString());

    // PARAMETERS FROZEN - Static values for now
    this.moodText.setText('🟪 Mood: 100%');
    this.moodText.setColor('#39ff14');

    this.cleanlinessText.setText('🟩 Clean: 100%');
    this.cleanlinessText.setColor('#4CAF50');

    this.healthText.setText('🟦 Health: 100%');
    this.healthText.setColor('#3498db');

    this.flatmateRageText.setText('🟥 Rage: 0%');
    this.flatmateRageText.setColor('#39ff14');

    // Update messes
    this.messesText.setText(`Messes: ${gameState.messesCleaned}/${gameState.messesSpawned}`);

    // Update mini-map
    this.updateMiniMap();
  }

  updatePhase(phase: 'morning' | 'afternoon' | 'evening' | 'night') {
    const phaseNames = {
      morning: 'MORNING',
      afternoon: 'AFTERNOON',
      evening: 'EVENING',
      night: 'NIGHT'
    };
    
    this.phaseText.setText(`DAY 1: ${phaseNames[phase]}`);
  }

  private createMiniMap(width: number, height: number) {
    // Mini-map container in top right
    this.miniMapContainer = this.scene.add.container(width - 220, 20);
    
    // Mini-map background
    const mapBg = this.scene.add.rectangle(0, 0, 200, 150, 0x000000, 0.7);
    mapBg.setStrokeStyle(2, 0x39ff14);
    this.miniMapContainer.add(mapBg);
    
    // Mini-map title
    const mapTitle = this.scene.add.text(0, -60, 'APARTMENT MAP', {
      fontFamily: 'Courier, monospace',
      fontSize: '12px',
      color: '#39ff14'
    }).setOrigin(0.5);
    this.miniMapContainer.add(mapTitle);
    
    // Create mini-map rooms (scaled down version of the apartment)
    const miniRoomWidth = 25;
    const miniRoomHeight = 20;
    const miniRoomSpacing = 5;
    const miniStartX = -75;
    const miniStartY = -25;
    
    const roomConfigs = [
      { name: 'P', color: 0x4a90e2, x: miniStartX, y: miniStartY },
      { name: 'F', color: 0x9b59b6, x: miniStartX + miniRoomWidth + miniRoomSpacing, y: miniStartY },
      { name: 'K', color: 0xf39c12, x: miniStartX + (miniRoomWidth + miniRoomSpacing) * 2, y: miniStartY },
      { name: 'L', color: 0x27ae60, x: miniStartX, y: miniStartY + miniRoomHeight + miniRoomSpacing },
      { name: 'B', color: 0x3498db, x: miniStartX + miniRoomWidth + miniRoomSpacing, y: miniStartY + miniRoomHeight + miniRoomSpacing },
      { name: 'W', color: 0xe74c3c, x: miniStartX + (miniRoomWidth + miniRoomSpacing) * 2, y: miniStartY + miniRoomHeight + miniRoomSpacing }
    ];
    
    this.miniMapRooms = roomConfigs.map(config => {
      const room = this.scene.add.rectangle(config.x, config.y, miniRoomWidth, miniRoomHeight, config.color, 0.3);
      room.setStrokeStyle(1, config.color);
      
      // Add room label
      const label = this.scene.add.text(config.x, config.y, config.name, {
        fontFamily: 'Courier, monospace',
        fontSize: '8px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.miniMapContainer.add(room);
      this.miniMapContainer.add(label);
      return room;
    });
    
    // Mini-map player indicator
    this.miniMapPlayer = this.scene.add.rectangle(miniStartX, miniStartY, 4, 4, 0x39ff14);
    this.miniMapContainer.add(this.miniMapPlayer);
    
    // Mini-map flatmate indicator
    this.miniMapFlatmate = this.scene.add.rectangle(miniStartX + miniRoomWidth + miniRoomSpacing, miniStartY, 4, 4, 0xff4500);
    this.miniMapContainer.add(this.miniMapFlatmate);
  }

  private updateMiniMap() {
    // Update player position on mini-map
    const gameScene = this.scene as any;
    if (gameScene.getPlayer && gameScene.getRooms) {
      const player = gameScene.getPlayer();
      const rooms = gameScene.getRooms();
      
      // Find which room the player is in
      let playerRoomIndex = 0;
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        if (player.x >= room.x && player.x <= room.x + room.width &&
            player.y >= room.y && player.y <= room.y + room.height) {
          playerRoomIndex = i;
          break;
        }
      }
      
      // Update mini-map player position
      const miniRoomWidth = 25;
      const miniRoomHeight = 20;
      const miniRoomSpacing = 5;
      const miniStartX = -75;
      const miniStartY = -25;
      
      const roomPositions = [
        { x: miniStartX, y: miniStartY },
        { x: miniStartX + miniRoomWidth + miniRoomSpacing, y: miniStartY },
        { x: miniStartX + (miniRoomWidth + miniRoomSpacing) * 2, y: miniStartY },
        { x: miniStartX, y: miniStartY + miniRoomHeight + miniRoomSpacing },
        { x: miniStartX + miniRoomWidth + miniRoomSpacing, y: miniStartY + miniRoomHeight + miniRoomSpacing },
        { x: miniStartX + (miniRoomWidth + miniRoomSpacing) * 2, y: miniStartY + miniRoomHeight + miniRoomSpacing }
      ];
      
      if (roomPositions[playerRoomIndex]) {
        this.miniMapPlayer.setPosition(roomPositions[playerRoomIndex].x, roomPositions[playerRoomIndex].y);
      }
    }
  }

  showPhaseTransition(fromPhase: string, toPhase: string) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create transition overlay
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    
    // Transition text
    const transitionText = this.scene.add.text(width / 2, height / 2, `${fromPhase.toUpperCase()} → ${toPhase.toUpperCase()}`, {
      fontFamily: 'Courier, monospace',
      fontSize: '32px',
      color: '#39ff14'
    }).setOrigin(0.5);

    // Fade out after 2 seconds
    this.scene.tweens.add({
      targets: [overlay, transitionText],
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        overlay.destroy();
        transitionText.destroy();
      }
    });
  }
} 