import Phaser from 'phaser';

export default class EndlessModeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndlessModeScene' });
    }

    create() {
        // Initialize endless mode gameplay
        console.log('EndlessModeScene: Endless mode started');
    }
} 