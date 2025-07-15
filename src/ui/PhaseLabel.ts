import Phaser from 'phaser';

export default class PhaseLabel extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, phase: string) {
    super(scene, x, y, phase, {
      fontFamily: 'Courier, monospace',
      fontSize: '28px',
      color: '#39FF14',
      align: 'center',
    });
    this.setOrigin(0.5);
    scene.add.existing(this);
  }

  setPhase(phase: string) {
    this.setText(phase);
  }
}
