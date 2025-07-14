import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        // Initialize game over screen
        console.log('GameOverScene: Game over screen loaded');
    }
} 