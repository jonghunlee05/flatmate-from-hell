import Phaser from 'phaser';

export class MathUtils {
  /**
   * Calculate distance between two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Phaser.Math.Distance.Between(x1, y1, x2, y2);
  }

  /**
   * Calculate angle between two points
   */
  static angle(x1: number, y1: number, x2: number, y2: number): number {
    return Phaser.Math.Angle.Between(x1, y1, x2, y2);
  }

  /**
   * Calculate velocity components from angle and speed
   */
  static velocityFromAngle(angle: number, speed: number, deltaSeconds: number): { x: number; y: number } {
    return {
      x: Math.cos(angle) * speed * deltaSeconds,
      y: Math.sin(angle) * speed * deltaSeconds
    };
  }

  /**
   * Clamp position within room boundaries
   */
  static clampToRoomBounds(x: number, y: number, width: number, height: number, padding: number = 50): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(x, padding, width - padding),
      y: Phaser.Math.Clamp(y, padding, height - padding)
    };
  }

  /**
   * Generate random position within room bounds
   */
  static randomPositionInRoom(width: number, height: number, padding: number = 100): { x: number; y: number } {
    return {
      x: Phaser.Math.Between(padding, width - padding),
      y: Phaser.Math.Between(padding, height - padding)
    };
  }

  /**
   * Check if position is within room bounds
   */
  static isInRoomBounds(x: number, y: number, width: number, height: number, padding: number = 0): boolean {
    return x >= padding && x <= width - padding && y >= padding && y <= height - padding;
  }

  /**
   * Calculate distance between two game objects
   */
  static distanceBetweenObjects(obj1: { x: number; y: number }, obj2: { x: number; y: number }): number {
    return this.distance(obj1.x, obj1.y, obj2.x, obj2.y);
  }

  /**
   * Check if two rectangles overlap
   */
  static rectanglesOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  /**
   * Get random value between min and max
   */
  static random(min: number, max: number): number {
    return Phaser.Math.Between(min, max);
  }

  /**
   * Get random element from array
   */
  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Linear interpolation between two values
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Convert degrees to radians
   */
  static degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Convert radians to degrees
   */
  static radToDeg(radians: number): number {
    return radians * 180 / Math.PI;
  }
} 