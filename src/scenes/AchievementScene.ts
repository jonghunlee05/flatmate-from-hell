import Phaser from 'phaser';

export default class AchievementScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementScene' });
    }

    create() {
        // Initialize achievements UI
        console.log('AchievementScene: Achievements opened');
    }
} 