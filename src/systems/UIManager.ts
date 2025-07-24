import Phaser from 'phaser';
import Timer from '../ui/Timer';
import { GameState } from './GameStateManager';
import { PhaseType } from './PhaseManager';
import { getAllRoomNames } from '../data/roomConfig';

export default class UIManager {
  private scene: Phaser.Scene;
  private timer!: Timer;
  private phaseLabel!: Phaser.GameObjects.Text;
  private parameterBars: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private parameterLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private messNotification!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Rectangle;
  private pauseMenu?: Phaser.GameObjects.Container;
  private paused: boolean = false;
  private onPauseToggle?: (isPaused: boolean) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    // Check if scene is available
    if (!this.scene) {
      console.error('UIManager: Scene not available for UI creation');
      return;
    }

    console.log('UIManager: Creating UI components...');
    
    this.createTimer();
    this.createPhaseLabel();
    this.createParameterBars();
    this.createMessNotification();
    this.createPauseButton();
    this.createMinimap();
    
    console.log('UIManager: UI creation completed');
  }

  private createTimer(): void {
    // Check if scene and cameras are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.error('UIManager: Scene or cameras not available for creating timer');
      return;
    }

    const width = this.scene.cameras.main.width || 1280; // Fallback width
    
    // Get timer state from registry
    const timerState = this.scene.game.registry.get('timerState');
    
    // Create timer
    this.timer = new Timer(this.scene, width / 2, 50, 60);
    
    // Restore timer state if it exists and is valid
    if (timerState && timerState.remaining > 0) {
      console.log(`Restoring timer state: ${timerState.remaining}s remaining, running: ${timerState.running}`);
      this.timer.reset(timerState.remaining);
      if (timerState.running) {
        this.timer.start();
      }
    } else {
      // Start new timer only if no valid state exists
      console.log('Starting new timer - no valid state found');
      this.timer.start();
    }
    
    // Store timer state in registry
    this.scene.game.registry.set('timerState', {
      remaining: this.timer.getRemaining(),
      running: this.timer.isRunning()
    });
  }

  private createPhaseLabel(): void {
    // Check if scene and cameras are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.error('UIManager: Scene or cameras not available for creating phase label');
      return;
    }

    const width = this.scene.cameras.main.width || 1280; // Fallback width
    this.phaseLabel = this.scene.add.text(width / 2, 80, 'DAY 1: MORNING', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#39ff14'
    }).setOrigin(0.5);
  }

  private createParameterBars(): void {
    // Check if scene and cameras are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.error('UIManager: Scene or cameras not available for creating parameter bars');
      return;
    }

    const width = this.scene.cameras.main.width || 1280; // Fallback width
    const barWidth = 200;
    const barHeight = 20;
    const spacing = 30;
    const startY = 120;

    // Mood bar
    this.createParameterBar(width / 2 - barWidth / 2, startY, barWidth, barHeight, 'Mood', 100, '#39ff14');
    
    // Cleanliness bar
    this.createParameterBar(width / 2 - barWidth / 2, startY + spacing, barWidth, barHeight, 'Cleanliness', 100, '#4CAF50');
    
    // Health bar
    this.createParameterBar(width / 2 - barWidth / 2, startY + spacing * 2, barWidth, barHeight, 'Health', 100, '#3498db');
    
    // Flatmate Rage bar
    this.createParameterBar(width / 2 - barWidth / 2, startY + spacing * 3, barWidth, barHeight, 'Flatmate Rage', 0, '#ff4500');
  }

  private createParameterBar(x: number, y: number, width: number, height: number, label: string, value: number, color: string): void {
    const barBg = this.scene.add.rectangle(x, y, width, height, 0x222222, 1).setOrigin(0, 0.5);
    const barFill = this.scene.add.rectangle(x, y, width * (value / 100), height, parseInt(color.replace('#', '0x')), 1).setOrigin(0, 0.5);
    const barLabel = this.scene.add.text(x - 10, y, label, {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#fff'
    }).setOrigin(1, 0.5);
    const valueText = this.scene.add.text(x + width + 10, y, `${value}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#fff'
    }).setOrigin(0, 0.5);

    this.parameterBars.set(label, barFill);
    this.parameterLabels.set(label, valueText);
  }

  private createMessNotification(): void {
    // Check if scene and cameras are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.warn('UIManager: Scene or cameras not available for creating notification');
      return;
    }

    try {
      const width = this.scene.cameras.main.width || 1280; // Fallback width
      const height = this.scene.cameras.main.height || 720; // Fallback height
      
      // Destroy existing notification if it exists
      if (this.messNotification && this.messNotification.active) {
        this.messNotification.destroy();
      }
      
      this.messNotification = this.scene.add.text(width / 2, height / 2 - 100, '', {
        fontFamily: 'Courier, monospace',
        fontSize: '20px',
        color: '#39ff14',
        backgroundColor: '#000000',
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
      }).setOrigin(0.5).setVisible(false);
      
      console.log('UIManager: MessNotification created successfully');
    } catch (error) {
      console.warn('UIManager: Error creating mess notification:', error);
    }
  }

  private createPauseButton(): void {
    // Don't recreate if already exists
    if (this.pauseButton && this.pauseButton.active) {
      return;
    }
    
    // Destroy existing pause button if it exists
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }
    
    // Create a simple rectangle as the pause button background
    const pauseBg = this.scene.add.rectangle(30, 30, 40, 40, 0x333333, 1);
    pauseBg.setStrokeStyle(2, 0xffffff);
    
    const pauseIcon = this.scene.add.text(30, 30, '⏸️', {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Make the background interactive instead of the text
    this.pauseButton = pauseBg;
    this.pauseButton.setInteractive({ 
      useHandCursor: true
    });

    this.pauseButton.on('pointerdown', () => {
      console.log('Pause button clicked');
      this.togglePause();
    });
  }

  private createMinimap(): void {
    // Check if scene and cameras are available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.error('UIManager: Scene or cameras not available for creating minimap');
      return;
    }

    const width = this.scene.cameras.main.width || 1280; // Fallback width
    const minimapSize = 150;
    const minimapX = width - minimapSize - 20;
    const minimapY = 20;

    // Minimap background
    this.scene.add.rectangle(minimapX, minimapY, minimapSize, minimapSize, 0x000000, 0.8)
      .setStrokeStyle(2, 0x39ff14);

    // Room indicators
    const rooms = getAllRoomNames();
    const roomSize = 15;
    const spacing = 20;
    let currentX = minimapX + 20;
    let currentY = minimapY + 20;

    rooms.forEach((room, index) => {
      const roomColor = room === this.scene.registry.get('flatmateRoom') ? 0x9b59b6 : 0x666666;
      this.scene.add.rectangle(currentX, currentY, roomSize, roomSize, roomColor, 1);
      
      this.scene.add.text(currentX, currentY + roomSize + 5, room.split(' ')[0], {
        fontFamily: 'Courier, monospace',
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);

      if ((index + 1) % 3 === 0) {
        currentX = minimapX + 20;
        currentY += spacing + 20;
      } else {
        currentX += spacing + 20;
      }
    });
  }

  update(time: number, delta: number): void {
    if (this.timer) {
      this.timer.update(time, delta);
      
      // Update timer state in registry
      this.scene.game.registry.set('timerState', {
        remaining: this.timer.getRemaining(),
        running: this.timer.isRunning()
      });
    }
  }

  syncTimerWithPhaseManager(remainingTime: number): void {
    if (this.timer) {
      this.timer.syncWithPhaseManager(remainingTime);
    }
  }

  updateGameState(state: GameState): void {
    this.updateParameterBar('Mood', state.playerMood, '#39ff14');
    this.updateParameterBar('Cleanliness', state.cleanliness, '#4CAF50');
    this.updateParameterBar('Health', state.playerHealth, '#3498db');
    this.updateParameterBar('Flatmate Rage', state.flatmateRage, '#ff4500');
  }

  updatePhase(phase: PhaseType): void {
    const phaseNames: Record<PhaseType, string> = {
      morning: 'MORNING',
      afternoon: 'AFTERNOON',
      evening: 'EVENING',
      night: 'NIGHT',
      complete: 'COMPLETE'
    };
    this.phaseLabel.setText(`DAY 1: ${phaseNames[phase]}`);
    
    // Clear timer state when day is complete
    if (phase === 'complete') {
      console.log('Day complete - clearing timer state');
      this.scene.game.registry.remove('timerState');
    }
    
    // Don't reset timer here - let PhaseManager handle the timing
    // Timer will be synced by BaseRoomScene's update loop
  }

  private updateParameterBar(label: string, value: number, color: string): void {
    const bar = this.parameterBars.get(label);
    const valueText = this.parameterLabels.get(label);
    
    if (bar && valueText) {
      const width = bar.width;
      bar.width = width * (value / 100);
      bar.setFillStyle(parseInt(color.replace('#', '0x')));
      valueText.setText(`${Math.round(value)}%`);
    }
  }

  showNotification(message: string, duration: number = 2000): void {
    // Check if scene is available
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      console.warn('UIManager: Scene not ready for notification, skipping');
      return;
    }

    // Check if messNotification exists and is valid
    if (!this.messNotification || !this.messNotification.active) {
      console.warn('MessNotification not available, creating it now');
      this.createMessNotification();
      
      // Check if creation was successful
      if (!this.messNotification || !this.messNotification.active) {
        console.warn('UIManager: Failed to create mess notification, skipping notification');
        return;
      }
    }
    
    try {
      this.messNotification.setText(message);
      this.messNotification.setVisible(true);
      
      this.scene.time.delayedCall(duration, () => {
        if (this.messNotification && this.messNotification.active) {
          this.messNotification.setVisible(false);
        }
      });
    } catch (error) {
      console.warn('UIManager: Error showing notification:', error);
    }
  }

  private togglePause(): void {
    console.log('togglePause called, current paused state:', this.paused);
    this.paused = !this.paused;
    
    if (this.paused) {
      console.log('Creating pause menu');
      this.createPauseMenu();
    } else {
      console.log('Destroying pause menu');
      this.destroyPauseMenu();
    }
    
    this.onPauseToggle?.(this.paused);
  }

  private createPauseMenu(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    const menuBg = this.scene.add.rectangle(width / 2, height / 2, 300, 200, 0x333333, 0.9)
      .setStrokeStyle(2, 0x39ff14);
    
    const title = this.scene.add.text(width / 2, height / 2 - 60, 'GAME PAUSED', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#39ff14'
    }).setOrigin(0.5);
    
    // Create simple interactive rectangles for buttons
    const resumeBtn = this.scene.add.rectangle(width / 2, height / 2 - 10, 120, 40, 0x000000, 1);
    resumeBtn.setStrokeStyle(2, 0x39ff14);
    resumeBtn.setInteractive({ useHandCursor: true });
    
    const resumeText = this.scene.add.text(width / 2, height / 2 - 10, 'RESUME', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const exitBtn = this.scene.add.rectangle(width / 2, height / 2 + 40, 140, 40, 0x000000, 1);
    exitBtn.setStrokeStyle(2, 0xff4500);
    exitBtn.setInteractive({ useHandCursor: true });
    
    const exitText = this.scene.add.text(width / 2, height / 2 + 40, 'EXIT TO MENU', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Add visual feedback for hover
    resumeBtn.on('pointerover', () => {
      resumeBtn.setFillStyle(0x39ff14, 0.3);
    });
    resumeBtn.on('pointerout', () => {
      resumeBtn.setFillStyle(0x000000, 1);
    });
    
    exitBtn.on('pointerover', () => {
      exitBtn.setFillStyle(0xff4500, 0.3);
    });
    exitBtn.on('pointerout', () => {
      exitBtn.setFillStyle(0x000000, 1);
    });
    
    // Add click handlers
    resumeBtn.on('pointerdown', () => {
      console.log('Resume button clicked');
      this.togglePause();
    });
    
    exitBtn.on('pointerdown', () => {
      console.log('Exit button clicked');
      this.scene.scene.start('HomeScene');
    });
    
    // Add additional debugging
    resumeBtn.on('pointerover', () => {
      console.log('Resume button hover');
    });
    
    exitBtn.on('pointerover', () => {
      console.log('Exit button hover');
    });
    
    this.pauseMenu = this.scene.add.container(0, 0, [overlay, menuBg, title, resumeBtn, resumeText, exitBtn, exitText]);
    
    // Ensure the pause menu is on top
    this.pauseMenu.setDepth(10000);
    
    console.log('Pause menu created with buttons:', {
      resumeBtn: resumeBtn.active,
      exitBtn: exitBtn.active,
      menuContainer: this.pauseMenu.active
    });
  }

  private destroyPauseMenu(): void {
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = undefined;
    }
  }

  setPauseToggleCallback(callback: (isPaused: boolean) => void): void {
    this.onPauseToggle = callback;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getTimer(): Timer {
    return this.timer;
  }

  fastForward(seconds: number): void {
    if (this.timer) {
      console.log(`ADMIN: Fast-forwarding timer by ${seconds} seconds`);
      this.timer.fastForward(seconds);
      
      // Show notification
      this.showNotification(`ADMIN: Fast-forwarded ${seconds}s`, 2000);
    }
  }

  destroy(): void {
    // Clean up pause button
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }
    
    // Clean up pause menu
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
    }
    
    // Clean up timer
    if (this.timer) {
      this.timer.destroy();
    }
  }
} 