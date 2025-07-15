import Phaser from 'phaser';

interface DayStats {
  messesCleaned: number;
  finalMood: number;
  finalCleanliness: number;
  finalFlatmateRage: number;
  finalHealth: number;
  coinsEarned: number;
}

export default class DaySummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DaySummaryScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#111');

    // Get day stats from registry
    const dayStats: DayStats = this.game.registry.get('dayStats') || {
      messesCleaned: 0,
      finalMood: 100,
      finalCleanliness: 100,
      finalFlatmateRage: 0,
      finalHealth: 100,
      coinsEarned: 0
    };

    // Title
    this.add.text(width / 2, 80, 'DAY 1 COMPLETE!', {
      fontFamily: 'Courier, monospace',
      fontSize: '36px',
      color: '#39ff14',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 130, 'You survived your first day with your flatmate!', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Stats container
    const statsY = 200;
    const statSpacing = 40;

    // Coins earned
    this.add.text(width / 2, statsY, `🪙 Coins Earned: ${dayStats.coinsEarned}`, {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#FFD700',
      align: 'center'
    }).setOrigin(0.5);

    // Final mood
    this.add.text(width / 2, statsY + statSpacing, `😊 Final Mood: ${dayStats.finalMood}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: dayStats.finalMood > 50 ? '#39ff14' : '#ff4500',
      align: 'center'
    }).setOrigin(0.5);

    // Cleanliness level
    this.add.text(width / 2, statsY + statSpacing * 2, `🟩 Cleanliness: ${dayStats.finalCleanliness}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: dayStats.finalCleanliness > 50 ? '#4CAF50' : '#ff4500',
      align: 'center'
    }).setOrigin(0.5);

    // Flatmate rage level
    this.add.text(width / 2, statsY + statSpacing * 3, `🟥 Flatmate Rage: ${dayStats.finalFlatmateRage}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: dayStats.finalFlatmateRage < 50 ? '#39ff14' : '#ff4500',
      align: 'center'
    }).setOrigin(0.5);

    // Health level
    this.add.text(width / 2, statsY + statSpacing * 4, `🟦 Final Health: ${dayStats.finalHealth}%`, {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: dayStats.finalHealth > 50 ? '#3498db' : '#ff4500',
      align: 'center'
    }).setOrigin(0.5);

    // Messes cleaned
    this.add.text(width / 2, statsY + statSpacing * 5, `🧹 Messes Cleaned: ${dayStats.messesCleaned}`, {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Performance rating
    const performance = this.calculatePerformance(dayStats);
    this.add.text(width / 2, statsY + statSpacing * 6, `Performance: ${performance}`, {
      fontFamily: 'Courier, monospace',
      fontSize: '22px',
      color: this.getPerformanceColor(performance),
      align: 'center'
    }).setOrigin(0.5);

    // Buttons
    const buttonY = height - 120;
    const buttonSpacing = 80;

    // Continue button
    const continueBtn = this.add.text(width / 2 - buttonSpacing, buttonY, 'Continue', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#39ff14',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover', () => {
      continueBtn.setColor('#000000');
    });
    continueBtn.on('pointerout', () => {
      continueBtn.setColor('#ffffff');
    });
    continueBtn.on('pointerdown', () => {
      // For now, go back to home scene
      // In the future, this could start Day 2
      this.scene.start('HomeScene');
    });

    // Main Menu button
    const menuBtn = this.add.text(width / 2 + buttonSpacing, buttonY, 'Main Menu', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#ff4500',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => {
      menuBtn.setColor('#000000');
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setColor('#ffffff');
    });
    menuBtn.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });
  }

  private calculatePerformance(stats: DayStats): string {
    const score = (stats.messesCleaned * 20) + (stats.finalMood * 0.5) + (stats.finalCleanliness * 0.3) + (stats.finalHealth * 0.4) + (100 - stats.finalFlatmateRage * 0.5);
    
    if (score >= 200) return 'EXCELLENT';
    if (score >= 150) return 'GOOD';
    if (score >= 100) return 'AVERAGE';
    if (score >= 50) return 'POOR';
    return 'TERRIBLE';
  }

  private getPerformanceColor(performance: string): string {
    switch (performance) {
      case 'EXCELLENT': return '#39ff14';
      case 'GOOD': return '#4CAF50';
      case 'AVERAGE': return '#FFD700';
      case 'POOR': return '#FF9800';
      case 'TERRIBLE': return '#ff4500';
      default: return '#ffffff';
    }
  }
} 