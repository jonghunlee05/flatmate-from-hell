import Phaser from 'phaser';

export default class StoreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoreScene' });
    }

    create() {
        // Initialize store UI
        console.log('StoreScene: Store opened');
    }
} 