import Phaser from 'phaser';
import { getAllRoomNames } from '../data/roomConfig';

export interface GameState {
  currentPhase: 'morning' | 'afternoon' | 'evening' | 'night';
  phaseTime: number;
  messesSpawned: number;
  messesCleaned: number;
  brokenItemsSpawned: number;
  brokenItemsFixed: number;
  playerMood: number;
  cleanliness: number;
  flatmateRage: number;
  playerHealth: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  room: string;
}

export interface PhaseManagerState {
  currentPhase: string;
  phaseTimer: number;
}

export class StateManager {
  private static instance: StateManager;
  private scene: Phaser.Scene;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static getInstance(scene: Phaser.Scene): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager(scene);
    }
    return StateManager.instance;
  }

  // Game State Management
  getGameState(): GameState {
    return this.scene.game.registry.get('gameState') || this.getDefaultGameState();
  }

  setGameState(state: Partial<GameState>): void {
    const currentState = this.getGameState();
    const newState = { ...currentState, ...state };
    this.scene.game.registry.set('gameState', newState);
  }

  updateGameState(updates: Partial<GameState>): void {
    this.setGameState(updates);
  }

  private getDefaultGameState(): GameState {
    return {
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
    };
  }

  // Player Position Management
  getPlayerPosition(): PlayerPosition {
    return {
      x: this.scene.game.registry.get('playerX') || this.scene.cameras.main.width / 2,
      y: this.scene.game.registry.get('playerY') || this.scene.cameras.main.height / 2,
      room: this.getPlayerRoom()
    };
  }

  setPlayerPosition(x: number, y: number): void {
    this.scene.game.registry.set('playerX', x);
    this.scene.game.registry.set('playerY', y);
  }

  setPlayerRoom(room: string): void {
    this.scene.game.registry.set('playerRoom', room);
  }

  getPlayerRoom(): string {
    return this.scene.game.registry.get('playerRoom') || 'Living Room';
  }

  // Flatmate State Management
  getFlatmateRoom(): string {
    return this.scene.registry.get('flatmateRoom') || 'Living Room';
  }

  setFlatmateRoom(room: string): void {
    this.scene.registry.set('flatmateRoom', room);
  }

  // Phase Manager State
  getPhaseManagerState(): PhaseManagerState {
    return this.scene.game.registry.get('phaseManagerState') || {
      currentPhase: 'morning',
      phaseTimer: 0
    };
  }

  setPhaseManagerState(state: PhaseManagerState): void {
    this.scene.game.registry.set('phaseManagerState', state);
  }

  // Timer State Management
  getTimerState(): { remaining: number; running: boolean } | null {
    return this.scene.game.registry.get('timerState');
  }

  setTimerState(state: { remaining: number; running: boolean }): void {
    this.scene.game.registry.set('timerState', state);
  }

  // Global Timer State
  getGlobalTimerState(): any {
    return this.scene.game.registry.get('globalTimerState');
  }

  setGlobalTimerState(state: any): void {
    this.scene.game.registry.set('globalTimerState', state);
  }

  // Room-specific Data Management
  getRoomData(roomName: string, dataType: 'messes' | 'brokenItems'): any[] {
    const key = `${dataType}_${roomName}`;
    return this.scene.game.registry.get(key) || [];
  }

  setRoomData(roomName: string, dataType: 'messes' | 'brokenItems', data: any[]): void {
    const key = `${dataType}_${roomName}`;
    this.scene.game.registry.set(key, data);
  }

  addRoomData(roomName: string, dataType: 'messes' | 'brokenItems', item: any): void {
    const key = `${dataType}_${roomName}`;
    const existingData = this.getRoomData(roomName, dataType);
    existingData.push(item);
    this.setRoomData(roomName, dataType, existingData);
  }

  // Door Transition State
  getFromDoor(): any {
    return this.scene.game.registry.get('fromDoor');
  }

  setFromDoor(doorData: any): void {
    this.scene.game.registry.set('fromDoor', doorData);
  }

  clearFromDoor(): void {
    this.scene.game.registry.remove('fromDoor');
  }

  // Selected Flatmate State
  getSelectedFlatmateId(): string | null {
    return this.scene.game.registry.get('selectedFlatmateId');
  }

  setSelectedFlatmateId(id: string): void {
    this.scene.game.registry.set('selectedFlatmateId', id);
  }

  // Global Notification State
  getGlobalNotification(): string | null {
    return this.scene.game.registry.get('showGlobalNotification');
  }

  setGlobalNotification(notification: string): void {
    this.scene.game.registry.set('showGlobalNotification', notification);
  }

  clearGlobalNotification(): void {
    this.scene.game.registry.remove('showGlobalNotification');
  }

  // Exit State
  getExitingToMenu(): boolean {
    return this.scene.game.registry.get('exitingToMenu') || false;
  }

  setExitingToMenu(exiting: boolean): void {
    this.scene.game.registry.set('exitingToMenu', exiting);
  }

  // Day Summary State
  getDaySummaryStats(): any {
    return this.scene.game.registry.get('daySummaryStats');
  }

  setDaySummaryStats(stats: any): void {
    this.scene.game.registry.set('daySummaryStats', stats);
  }

  // Utility Methods
  clearAllRoomData(): void {
    const rooms = getAllRoomNames();
    rooms.forEach(room => {
      this.scene.game.registry.remove(`messes_${room}`);
      this.scene.game.registry.remove(`brokenItems_${room}`);
    });
  }

  resetGameState(): void {
    // Clear all game-related registry data
    this.scene.game.registry.remove('gameState');
    this.scene.game.registry.remove('phaseManagerState'); // Also clear phase manager state
    this.scene.game.registry.remove('daySummaryStats');
    this.scene.game.registry.remove('globalTimerState');
    this.scene.game.registry.remove('timerState');
    this.scene.game.registry.remove('globalTimer');
    this.scene.game.registry.remove('flatmateRoom');
    this.scene.game.registry.remove('playerX');
    this.scene.game.registry.remove('playerY');
    this.scene.game.registry.remove('fromRoom');
    this.scene.game.registry.remove('showGlobalNotification');
    this.scene.game.registry.remove('exitingToMenu');
    
    // Clear room data
    this.clearAllRoomData();
    
    // Set default values
    this.setFlatmateRoom('Living Room');
    this.setGameState(this.getDefaultGameState());
  }

  // Generic registry access (for backward compatibility)
  get(key: string, defaultValue?: any): any {
    return this.scene.game.registry.get(key) ?? defaultValue;
  }

  set(key: string, value: any): void {
    this.scene.game.registry.set(key, value);
  }

  remove(key: string): void {
    this.scene.game.registry.remove(key);
  }
} 