import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import HomeScene from './scenes/HomeScene';
import StoryModeScene from './scenes/StoryModeScene';
import EndlessModeScene from './scenes/EndlessModeScene';
import StoreScene from './scenes/StoreScene';
import AchievementScene from './scenes/AchievementScene';
import GameOverScene from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [
        BootScene,
        HomeScene,
        StoryModeScene,
        EndlessModeScene,
        StoreScene,
        AchievementScene,
        GameOverScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config); 