import Phaser from 'phaser';

export default class AchievementScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementScene' });
    }

    create() {
        // Back to Menu button
        const btn = this.add.text(30, 30, '< Back to Menu', {
            fontFamily: 'Courier, monospace',
            fontSize: '22px',
            color: '#222',
            backgroundColor: 'rgba(255,255,255,0.0)',
            padding: { left: 10, right: 10, top: 4, bottom: 4 }
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor('#b8860b'));
        btn.on('pointerout', () => btn.setColor('#222'));
        btn.on('pointerdown', () => {
            this.scene.start('HomeScene');
        });

        // Initialize achievements UI
        console.log('AchievementScene: Achievements opened');
    }
} 