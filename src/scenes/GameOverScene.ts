import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#1a0000'); // Dark red background

    // Game Over title
    this.add.text(width / 2, height / 2 - 100, 'MENTAL BREAKDOWN', {
      fontFamily: 'Courier, monospace',
      fontSize: '48px',
      color: '#ff4500',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 40, 'Your mood reached zero!', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ff6666',
      align: 'center'
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, height / 2 + 20, 'The chaos and filth became too much to handle.', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50, 'You had a complete mental breakdown.', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Buttons
    const buttonY = height - 120;
    const buttonSpacing = 100;

    // Try Again button
    const tryAgainBtn = this.add.text(width / 2 - buttonSpacing, buttonY, 'Try Again', {
      fontFamily: 'Courier, monospace',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#39ff14',
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    tryAgainBtn.on('pointerover', () => {
      tryAgainBtn.setColor('#000000');
    });
    tryAgainBtn.on('pointerout', () => {
      tryAgainBtn.setColor('#ffffff');
    });
    tryAgainBtn.on('pointerdown', () => {
      // Clear any stored game state and restart the game from flatmate selection
      this.game.registry.remove('dayStats');
      this.scene.start('FlatmateSelectScene');
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

    // Add some dramatic effect
    this.add.text(width / 2, height - 40, '💥 GAME OVER 💥', {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: '#ff4500',
      align: 'center'
    }).setOrigin(0.5);
  }
} 