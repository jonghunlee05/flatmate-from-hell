import Phaser from 'phaser';

export interface ProgressBarConfig {
  width: number;
  height: number;
  offsetY: number;
  color: number;
}

export default abstract class BaseInteractableEntity extends Phaser.GameObjects.Container {
  protected progressBar: Phaser.GameObjects.Rectangle;
  protected progressBarBg: Phaser.GameObjects.Rectangle;
  protected isBeingProcessed: boolean = false;
  protected progress: number = 0;
  protected processSpeed: number = 1; // Progress per second
  protected _isCompleted: boolean = false;
  protected progressConfig: ProgressBarConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, processTime: number, progressConfig: ProgressBarConfig) {
    super(scene, x, y);
    this.progressConfig = progressConfig;
    this.processSpeed = 1 / (processTime / 1000); // Progress per second

    // Create progress bar background as a rectangle in the scene
    this.progressBarBg = scene.add.rectangle(0, 0, progressConfig.width, progressConfig.height, 0x000000, 0.8);
    this.progressBarBg.setVisible(false);
    this.progressBarBg.setDepth(1000); // Ensure it's on top

    // Create progress bar as a rectangle in the scene
    this.progressBar = scene.add.rectangle(0, 0, 0, progressConfig.height, progressConfig.color, 1);
    this.progressBar.setVisible(false);
    this.progressBar.setDepth(1001); // Ensure it's on top of background
    
    // Initial positioning of progress bars
    this.updateProgressBarPosition();
  }

  update(time: number, delta: number): void {
    if (this.isBeingProcessed && !this.isCompleted) {
      this.progress += this.processSpeed * (delta / 1000);
      
      console.log(`DEBUG: Progress update: ${(this.progress * 100).toFixed(1)}% for entity at (${this.x}, ${this.y})`);
      
      if (this.progress >= 1) {
        console.log(`DEBUG: Process complete for entity at (${this.x}, ${this.y})`);
        this.completeProcess();
      } else {
        this.updateProgressBar();
      }
    }
  }

  startProcess(): void {
    if (!this.isCompleted) {
      console.log(`Starting process for entity at (${this.x}, ${this.y})`);
      this.isBeingProcessed = true;
      this.progress = 0;
      
      // Make progress bars visible and position them
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
      this.updateProgressBarPosition();
      this.updateProgressBar();
      
      // Force set progress to 50% to test visibility
      this.progress = 0.5;
      this.updateProgressBar();
      
      // Test if progress bars are in the scene
      console.log(`Progress bars should now be visible above item at (${this.x}, ${this.y})`);
      console.log(`Progress bar background visible: ${this.progressBarBg.visible}, position: (${this.progressBarBg.x}, ${this.progressBarBg.y})`);
      console.log(`Progress bar visible: ${this.progressBar.visible}, position: (${this.progressBar.x}, ${this.progressBar.y})`);
      console.log(`Progress bar depth: ${this.progressBar.depth}, background depth: ${this.progressBarBg.depth}`);
      console.log(`Progress bar in scene: ${this.scene.children.list.includes(this.progressBar)}`);
      console.log(`Progress bar background in scene: ${this.scene.children.list.includes(this.progressBarBg)}`);
    }
  }

  // Test method to force show progress bar
  testShowProgressBar(): void {
    console.log('=== TESTING PROGRESS BAR VISIBILITY ===');
    console.log(`Entity position: (${this.x}, ${this.y})`);
    console.log(`Progress bar background exists: ${!!this.progressBarBg}`);
    console.log(`Progress bar exists: ${!!this.progressBar}`);
    
    if (this.progressBarBg && this.progressBar) {
      this.progressBarBg.setVisible(true);
      this.progressBar.setVisible(true);
      this.updateProgressBarPosition();
      this.progress = 0.5; // Set to 50%
      this.updateProgressBar();
      
      console.log(`Test progress bar shown at 50%`);
      console.log(`Background visible: ${this.progressBarBg.visible}, position: (${this.progressBarBg.x}, ${this.progressBarBg.y})`);
      console.log(`Bar visible: ${this.progressBar.visible}, position: (${this.progressBar.x}, ${this.progressBar.y})`);
    }
  }

  stopProcess(): void {
    console.log(`Stopping process for entity at (${this.x}, ${this.y})`);
    this.isBeingProcessed = false;
    this.progress = 0; // Reset progress when stopped
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
  }

  protected updateProgressBar(): void {
    // Calculate world position for the progress bar
    const worldX = this.x - this.progressConfig.width / 2;
    const worldY = this.y + this.progressConfig.offsetY;
    
    // Update progress bar width and position
    const fillWidth = this.progressConfig.width * this.progress;
    this.progressBar.setSize(fillWidth, this.progressConfig.height);
    this.progressBar.setPosition(worldX, worldY);
    
    // Set border by making the background slightly larger
    this.progressBarBg.setSize(this.progressConfig.width + 4, this.progressConfig.height + 4);
    this.progressBarBg.setPosition(worldX - 2, worldY - 2);
    
    console.log(`Progress: ${(this.progress * 100).toFixed(1)}% at (${worldX}, ${worldY})`);
    console.log(`Progress bar fill width: ${fillWidth}, total width: ${this.progressConfig.width}`);
    console.log(`Progress bar visible: ${this.progressBar.visible}, active: ${this.progressBar.active}`);
  }

  protected updateProgressBarPosition(): void {
    // Calculate world position for the background
    const worldX = this.x - this.progressConfig.width / 2;
    const worldY = this.y + this.progressConfig.offsetY;
    
    // Set position - TEST: Use fixed screen position first
    const testX = 400; // Fixed screen X
    const testY = 300; // Fixed screen Y
    this.progressBarBg.setPosition(testX, testY);
  }

  protected completeProcess(): void {
    this._isCompleted = true;
    this.isBeingProcessed = false;
    this.progressBarBg.setVisible(false);
    this.progressBar.setVisible(false);
    
    // Emit completion event (to be implemented by subclasses)
    this.onProcessComplete();
  }

  isProcessing(): boolean {
    return this.isBeingProcessed;
  }

  isCompleted(): boolean {
    return this._isCompleted;
  }

  // Abstract method to be implemented by subclasses
  protected abstract onProcessComplete(): void;

  destroy(): void {
    // Clean up progress bars
    if (this.progressBarBg) {
      this.progressBarBg.destroy();
    }
    if (this.progressBar) {
      this.progressBar.destroy();
    }
    
    // Call parent destroy
    super.destroy();
  }
} 