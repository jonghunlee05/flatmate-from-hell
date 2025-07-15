import Phaser from 'phaser';

export default class Timer extends Phaser.GameObjects.Container {
  private timerText: Phaser.GameObjects.Text;
  private duration: number;
  private remaining: number;
  private running: boolean = false;
  private lastUpdate: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, duration: number = 60) {
    super(scene, x, y);
    this.duration = duration;
    this.remaining = duration;
    this.timerText = scene.add.text(0, 0, `Time: ${Math.ceil(this.remaining)}`, {
      fontFamily: 'Courier, monospace', fontSize: '22px', color: '#fff'
    }).setOrigin(0.5);
    this.add(this.timerText);
    scene.add.existing(this);
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
    this.timerText.setText(`Time: ${Math.ceil(this.remaining)}`);
    this.running = false;
  }

  update(time: number, delta: number) {
    if (!this.running) return;
    this.remaining -= delta / 1000;
    if (this.remaining < 0) this.remaining = 0;
    this.timerText.setText(`Time: ${Math.ceil(this.remaining)}`);
    if (this.remaining <= 0) {
      this.running = false;
      this.emit('complete');
    }
  }

  getRemaining() {
    return this.remaining;
  }
}
