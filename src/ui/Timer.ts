import Phaser from 'phaser';

export default class Timer extends Phaser.GameObjects.Container {
  private timerText: Phaser.GameObjects.Text;
  private duration: number;
  private remaining: number;
  private running: boolean = false;
  private lastUpdate: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, duration: number = 60) {
    super(scene, x, y);
    console.log('Timer constructor called with:', { x, y, duration });
    this.duration = duration;
    this.remaining = duration;
    this.timerText = scene.add.text(0, 0, this.formatTime(this.remaining), {
      fontFamily: 'Courier, monospace', fontSize: '28px', color: '#39ff14', backgroundColor: '#000000', padding: { left: 12, right: 12, top: 8, bottom: 8 }
    }).setOrigin(0.5);
    this.add(this.timerText);
    scene.add.existing(this);
    this.setDepth(1000); // Ensure timer is on top
    console.log('Timer created with text:', this.formatTime(this.remaining));
    
    // Add update listener to scene
    scene.events.on('update', this.update, this);
  }

  start() {
    this.running = true;
    this.lastUpdate = performance.now();
  }

  stop() {
    this.running = false;
  }

  reset(duration?: number) {
    this.remaining = duration ?? this.duration;
    this.timerText.setText(this.formatTime(this.remaining));
    this.running = false;
  }

  update(time: number, delta: number) {
    if (!this.running) return;
    this.remaining -= delta / 1000;
    if (this.remaining < 0) this.remaining = 0;
    this.timerText.setText(this.formatTime(this.remaining));
    if (this.remaining <= 0) {
      this.running = false;
      this.emit('complete');
    }
  }

  getRemaining() {
    return this.remaining;
  }

  destroy() {
    // Remove event listener
    this.scene.events.off('update', this.update, this);
    super.destroy();
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
