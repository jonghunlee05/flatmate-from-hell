import Phaser from 'phaser';

export default class StoryModeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryModeScene' });
    }

    create() {
        // Initialize story mode gameplay
        console.log('StoryModeScene: Story mode started');
    }
} 