import Phaser from 'phaser';
import { COLORS, GAME_CONFIG } from '../data/constants';
import { PhaseManager } from '../entities/PhaseManager';

export interface GameParameters {
  mood: number;
  cleanliness: number;
  health: number;
  flatmateRage: number;
}

export default class HUD {
  private scene: Phaser.Scene;
  private phaseManager: PhaseManager;
  private parameters: GameParameters;
  
  private phaseText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private moodText: Phaser.GameObjects.Text;
  private cleanlinessText: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  private rageText: Phaser.GameObjects.Text;
  private instructionsText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, phaseManager: PhaseManager, parameters: GameParameters) {
    this.scene = scene;
    this.phaseManager = phaseManager;
    this.parameters = parameters;

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

    // Timer text (below phase)
    this.timerText = scene.add.text(width / 2, 60, '60', {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Parameters (top row)
    const paramY = 100;
    const paramSpacing = width / 4;

    // 🟪 Mood
    this.moodText = scene.add.text(paramSpacing * 0.5, paramY, '🟪 Mood: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: COLORS.MOOD_GOOD
    }).setOrigin(0.5);

    // 🟩 Cleanliness
    this.cleanlinessText = scene.add.text(paramSpacing * 1.5, paramY, '🟩 Clean: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: COLORS.CLEANLINESS_GOOD
    }).setOrigin(0.5);

    // 🟦 Health
    this.healthText = scene.add.text(paramSpacing * 2.5, paramY, '🟦 Health: 100%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: COLORS.HEALTH_GOOD
    }).setOrigin(0.5);

    // 🟥 Flatmate Rage
    this.rageText = scene.add.text(paramSpacing * 3.5, paramY, '🟥 Rage: 0%', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: COLORS.RAGE_GOOD
    }).setOrigin(0.5);

    // Instructions (bottom)
    this.instructionsText = scene.add.text(width / 2, height - 20, 'WASD/Arrows to move, SPACE to clean, Z to repair', {
      fontFamily: 'Courier, monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  update() {
    // Update phase and timer
    this.phaseText.setText(`DAY 1: ${this.phaseManager.getPhaseDisplayName()}`);
    const remainingTime = Math.max(0, Math.floor(this.phaseManager.getRemainingTime() / 1000));
    this.timerText.setText(remainingTime.toString());

    // Update parameters
    this.moodText.setText(`🟪 Mood: ${Math.round(this.parameters.mood)}%`);
    this.moodText.setColor(this.parameters.mood > 50 ? COLORS.MOOD_GOOD : COLORS.MOOD_BAD);

    this.cleanlinessText.setText(`🟩 Clean: ${Math.round(this.parameters.cleanliness)}%`);
    this.cleanlinessText.setColor(this.parameters.cleanliness > 50 ? COLORS.CLEANLINESS_GOOD : COLORS.CLEANLINESS_BAD);

    this.healthText.setText(`🟦 Health: ${Math.round(this.parameters.health)}%`);
    this.healthText.setColor(this.parameters.health > 50 ? COLORS.HEALTH_GOOD : COLORS.HEALTH_BAD);

    this.rageText.setText(`🟥 Rage: ${Math.round(this.parameters.flatmateRage)}%`);
    this.rageText.setColor(this.parameters.flatmateRage < 50 ? COLORS.RAGE_GOOD : COLORS.RAGE_BAD);

    // Update instructions based on phase
    if (this.phaseManager.isNightPhase()) {
      this.instructionsText.setText('NIGHT PHASE: Avoid the flatmate! WASD/Arrows to move');
      this.instructionsText.setColor('#ff4500');
    } else {
      this.instructionsText.setText('WASD/Arrows to move, SPACE to clean, Z to repair');
      this.instructionsText.setColor('#888888');
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

  showDayComplete() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create completion overlay
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    
    // Completion text
    const completeText = this.scene.add.text(width / 2, height / 2, 'DAY 1 COMPLETE!', {
      fontFamily: 'Courier, monospace',
      fontSize: '48px',
      color: '#39ff14'
    }).setOrigin(0.5);

    // Subtitle
    const subtitleText = this.scene.add.text(width / 2, height / 2 + 60, 'You survived your first day!', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Keep overlay visible
    this.scene.time.delayedCall(3000, () => {
      this.scene.scene.start('DaySummaryScene');
    });
  }
} 