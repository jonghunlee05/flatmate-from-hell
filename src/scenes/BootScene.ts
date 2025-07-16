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
        
        // Initialize game state in registry
        this.game.registry.set('gameState', {
            currentPhase: 'morning',
            phaseTime: 0,
            messesSpawned: 0,
            messesCleaned: 0,
            brokenItemsSpawned: 0,
            brokenItemsFixed: 0,
            playerMood: 100,
            cleanliness: 100,
            flatmateRage: 0,
            playerHealth: 100
        });
        
        // Initialize player starting position (will be overridden by PlayerBedroomScene)
        this.game.registry.set('playerX', undefined);
        this.game.registry.set('playerY', undefined);
        
        // Initialize flatmate starting room
        this.game.registry.set('flatmateRoom', 'Living Room');

        // Initialize global mess system
        this.game.registry.set('globalMessSystem', {
            lastSpawnTime: 0,
            spawnInterval: 5000,
            rooms: ['Your Bedroom', 'Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry']
        });
        
        // DISABLED: Global mess spawning timer - messes will be spawned by phase system instead
        // this.time.addEvent({
        //     delay: 5000, // Every 5 seconds
        //     loop: true,
        //     callback: () => {
        //         // Select a random room for the mess
        //         const rooms = ['Your Bedroom', 'Flatmate Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Laundry'];
        //         const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        //         
        //         console.log(`Global timer: Spawning mess in ${randomRoom}`);
        //         
        //         // Store the mess data for the target room
        //         const messData = {
        //         x: Math.random() * 600 + 100, // Random position within room bounds
        //         y: Math.random() * 400 + 100,
        //         roomName: randomRoom,
        //         timestamp: Date.now()
        //         };
        //         
        //         // Get existing messes for this room
        //         const roomMessesKey = `messes_${randomRoom}`;
        //         const existingMesses = this.game.registry.get(roomMessesKey) || [];
        //         existingMesses.push(messData);
        //         this.game.registry.set(roomMessesKey, existingMesses);
        //         
        //         // Set global notification flag
        //         this.game.registry.set('showGlobalNotification', randomRoom);
        //         
        //         // Trigger a global event that all scenes can listen to
        //         this.events.emit('globalMessSpawned', randomRoom);
        //     }
        // });
        
        // Start the home scene
        this.scene.start('HomeScene');
    }
} 