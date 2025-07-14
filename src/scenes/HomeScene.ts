import Phaser from 'phaser';

export default class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create() {
        // Create main menu UI
        const title = this.add.text(640, 200, 'FLATMATE FROM HELL', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Add menu buttons here
        console.log('HomeScene: Main menu loaded');
    }
} 