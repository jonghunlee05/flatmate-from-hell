import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load loading screen assets
        this.load.image('loading-bg', 'assets/images/loading-bg.png');
        this.load.image('loading-bar', 'assets/images/loading-bar.png');
    }

    create() {
        // Initialize game systems here
        console.log('BootScene: Game initialized');
        
        // Start the home scene
        this.scene.start('HomeScene');
    }
} 