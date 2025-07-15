import Phaser from 'phaser';
import { FLATMATES } from './FlatmateSelectScene';
import MoodBar from '../ui/MoodBar';
import Timer from '../ui/Timer';
import PhaseLabel from '../ui/PhaseLabel';
import MorningPhase from './phases/MorningPhase';
import AfternoonPhase from './phases/AfternoonPhase';
import EveningPhase from './phases/EveningPhase';
import NightPhase from './phases/NightPhase';

export default class StoryModeScene extends Phaser.Scene {
  private flatmateName: string = '';
  private moodBar!: MoodBar;
  private timer!: Timer;
  private phaseLabel!: PhaseLabel;
  private morningPhase!: MorningPhase;
  private afternoonPhase!: AfternoonPhase;
  private eveningPhase!: EveningPhase;
  private nightPhase!: NightPhase;
  private currentPhase: 'morning' | 'afternoon' | 'evening' | 'night' | 'summary' | 'gameover' = 'morning';
  private summaryText?: Phaser.GameObjects.Text;
  private continueBtn?: Phaser.GameObjects.Text;
  private restartBtn?: Phaser.GameObjects.Text;
  private performanceStats: {
    coinsEarned: number;
    finalMood: number;
    chaosLevel: number;
    messesCleaned: number;
    itemsFixed: number;
    eventsBanished: number;
  } = {
    coinsEarned: 0,
    finalMood: 100,
    chaosLevel: 0,
    messesCleaned: 0,
    itemsFixed: 0,
    eventsBanished: 0
  };

  constructor() {
    super({ key: 'StoryModeScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#111');

    // Get flatmate from registry
    const selectedFlatmateId = this.game.registry.get('selectedFlatmateId');
    const flatmate = FLATMATES.find(f => f.id === selectedFlatmateId);
    this.flatmateName = flatmate ? flatmate.name : 'None';

    // Flatmate name (top-left)
    this.add.text(32, 18, `Flatmate: ${this.flatmateName}`, {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: '#39FF14', align: 'left'
    }).setOrigin(0, 0.5);

    // Mood bar (top center)
    this.moodBar = new MoodBar(this, width / 2 - 160, 24, 320, 28);
    this.moodBar.setMood(100);

    // Timer (top center, below mood bar)
    this.timer = new Timer(this, width / 2, 64, 60);
    this.timer.start();

    // Phase label
    this.phaseLabel = new PhaseLabel(this, width / 2, 110, 'DAY 1: MORNING');

    // Initialize first phase
    this.morningPhase = new MorningPhase({ scene: this, moodBar: this.moodBar, timer: this.timer });
    this.currentPhase = 'morning';
  }

  update(time: number, delta: number) {
    if (this.currentPhase === 'gameover') return;

    this.timer.update(time, delta);

    switch (this.currentPhase) {
      case 'morning':
        this.morningPhase.update(time, delta);
        if (this.morningPhase.isComplete()) {
          this.transitionToAfternoon();
        }
        break;
      case 'afternoon':
        this.afternoonPhase.update(time, delta);
        if (this.afternoonPhase.isComplete()) {
          this.transitionToEvening();
        }
        break;
      case 'evening':
        this.eveningPhase.update(time, delta);
        if (this.eveningPhase.isComplete()) {
          this.transitionToNight();
        }
        break;
      case 'night':
        this.nightPhase.update(time, delta);
        if (this.nightPhase.isComplete()) {
          this.showEndOfDaySummary();
        }
        break;
    }

    if (this.moodBar.getMood() <= 0) {
      this.showGameOver();
    }
  }

  private transitionToAfternoon() {
    this.currentPhase = 'afternoon';
    this.performanceStats.messesCleaned += 5; // Estimate based on phase completion
    this.performanceStats.coinsEarned += 10;
    
    // Reset timer and update phase label
    this.timer.reset(60);
    this.timer.start();
    this.phaseLabel.setPhase('DAY 1: AFTERNOON');
    
    // Initialize afternoon phase
    this.afternoonPhase = new AfternoonPhase({ scene: this, moodBar: this.moodBar, timer: this.timer });
  }

  private transitionToEvening() {
    this.currentPhase = 'evening';
    this.performanceStats.itemsFixed += 3; // Estimate based on phase completion
    this.performanceStats.coinsEarned += 15;
    
    // Reset timer and update phase label
    this.timer.reset(60);
    this.timer.start();
    this.phaseLabel.setPhase('DAY 1: EVENING');
    
    // Initialize evening phase
    this.eveningPhase = new EveningPhase({ scene: this, moodBar: this.moodBar, timer: this.timer });
  }

  private transitionToNight() {
    this.currentPhase = 'night';
    this.performanceStats.chaosLevel = this.eveningPhase.getRageLevel();
    this.performanceStats.coinsEarned += 20;
    
    // Reset timer and update phase label
    this.timer.reset(60);
    this.timer.start();
    this.phaseLabel.setPhase('DAY 1: NIGHT');
    
    // Initialize night phase
    this.nightPhase = new NightPhase({ scene: this, moodBar: this.moodBar, timer: this.timer });
  }

  private showEndOfDaySummary() {
    this.currentPhase = 'summary';
    this.performanceStats.finalMood = this.moodBar.getMood();
    this.performanceStats.eventsBanished += 2; // Estimate based on phase completion
    this.performanceStats.coinsEarned += 25;
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Clear existing UI elements
    this.timer.stop();
    
    // Main title
    this.add.text(width / 2, height / 2 - 120, 'You Survived Day 1!', {
      fontFamily: 'Courier, monospace', fontSize: '36px', color: '#39FF14', align: 'center'
    }).setOrigin(0.5);
    
    // Performance summary
    const summaryY = height / 2 - 60;
    this.add.text(width / 2, summaryY, 'Performance Summary:', {
      fontFamily: 'Courier, monospace', fontSize: '24px', color: '#fff', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 30, `Coins Earned: ${this.performanceStats.coinsEarned}`, {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: '#FFD700', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 55, `Final Mood: ${this.performanceStats.finalMood}%`, {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: this.performanceStats.finalMood > 50 ? '#39FF14' : '#FF4500', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 80, `Chaos Level: ${this.performanceStats.chaosLevel}%`, {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: this.performanceStats.chaosLevel < 50 ? '#39FF14' : '#FF4500', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 105, `Messes Cleaned: ${this.performanceStats.messesCleaned}`, {
      fontFamily: 'Courier, monospace', fontSize: '18px', color: '#fff', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 130, `Items Fixed: ${this.performanceStats.itemsFixed}`, {
      fontFamily: 'Courier, monospace', fontSize: '18px', color: '#fff', align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, summaryY + 155, `Events Banished: ${this.performanceStats.eventsBanished}`, {
      fontFamily: 'Courier, monospace', fontSize: '18px', color: '#fff', align: 'center'
    }).setOrigin(0.5);
    
    // Continue button
    this.continueBtn = this.add.text(width / 2, height / 2 + 80, 'Continue', {
      fontFamily: 'Courier, monospace', fontSize: '24px', color: '#fff', backgroundColor: '#39FF14', padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('HomeScene'));
    
    // Exit button
    this.add.text(width / 2, height / 2 + 130, 'Exit', {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: '#FF4500', backgroundColor: '#222', padding: { left: 12, right: 12, top: 4, bottom: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('HomeScene'));
  }

  private showGameOver() {
    this.currentPhase = 'gameover';
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'GAME OVER', {
      fontFamily: 'Courier, monospace', fontSize: '40px', color: '#FF4500', align: 'center'
    }).setOrigin(0.5);
    this.restartBtn = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 80, 'Restart', {
      fontFamily: 'Courier, monospace', fontSize: '24px', color: '#39FF14', backgroundColor: '#222', padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.restart());
  }
} 