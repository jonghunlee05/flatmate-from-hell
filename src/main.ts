import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import HomeScene from './scenes/HomeScene';
import FlatmateSelectScene from './scenes/FlatmateSelectScene';
import StoryModeScene from './scenes/StoryModeScene';
import DaySummaryScene from './scenes/DaySummaryScene';
import EndlessModeScene from './scenes/EndlessModeScene';
import StoreScene from './scenes/StoreScene';
import AchievementScene from './scenes/AchievementScene';
import GameOverScene from './scenes/GameOverScene';
import SettingsScene from './scenes/SettingsScene';
import PlayerBedroomScene from './scenes/rooms/PlayerBedroomScene';
import LivingRoomScene from './scenes/rooms/LivingRoomScene';
import FlatmateBedroomScene from './scenes/rooms/FlatmateBedroomScene';
import KitchenScene from './scenes/rooms/KitchenScene';
import BathroomScene from './scenes/rooms/BathroomScene';
import LaundryScene from './scenes/rooms/LaundryScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [
        BootScene,
        HomeScene,
        FlatmateSelectScene,
        StoryModeScene,
        DaySummaryScene,
        EndlessModeScene,
        StoreScene,
        AchievementScene,
        GameOverScene,
        SettingsScene,
        PlayerBedroomScene,
        LivingRoomScene,
        FlatmateBedroomScene,
        KitchenScene,
        BathroomScene,
        LaundryScene
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