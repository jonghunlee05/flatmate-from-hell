import furnitureData from '../data/items.json';
import { FurnitureData } from '../entities/BrokenItem';

interface FurnitureDataStructure {
  [roomName: string]: FurnitureData[];
}

export default class FurnitureManager {
  private static furnitureData: FurnitureDataStructure = furnitureData.furniture;

  static getFurnitureForRoom(roomName: string): FurnitureData[] {
    return this.furnitureData[roomName] || [];
  }

  static getRandomFurniture(roomName: string): FurnitureData | null {
    const furniture = this.getFurnitureForRoom(roomName);
    if (furniture.length === 0) return null;
    
    return furniture[Math.floor(Math.random() * furniture.length)];
  }

  static getAllFurniture(): FurnitureDataStructure {
    return this.furnitureData;
  }

  static getFurnitureById(roomName: string, furnitureId: string): FurnitureData | null {
    const furniture = this.getFurnitureForRoom(roomName);
    return furniture.find(f => f.id === furnitureId) || null;
  }
} 