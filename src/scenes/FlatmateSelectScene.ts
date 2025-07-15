import Phaser from 'phaser';

export const FLATMATES = [
  {
    id: 'party_bro',
    name: 'Party Bro',
    quote: 'Sleeveless legend of beer',
    difficulty: 'Easy',
  },
  {
    id: 'witchcore_girl',
    name: 'Witchcore Girl',
    quote: 'Summons things from beyond',
    difficulty: 'Medium',
  },
  {
    id: 'startup_guy',
    name: 'Startup Guy',
    quote: 'Obsessed with disrupting dishwashing',
    difficulty: 'Hard',
  },
];

export const gameData = { selectedFlatmateId: null as string | null };

export default class FlatmateSelectScene extends Phaser.Scene {
  private currentIndex = 0;
  private nameText!: Phaser.GameObjects.Text;
  private quoteText!: Phaser.GameObjects.Text;
  private diffText!: Phaser.GameObjects.Text;
  private portraitRect!: Phaser.GameObjects.Rectangle;
  private portraitLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'FlatmateSelectScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#111');

    // Title
    this.add.text(width / 2, 60, 'CHOOSE YOUR FLATMATE', {
      fontFamily: 'Courier, monospace',
      fontSize: '32px',
      color: '#fff',
    }).setOrigin(0.5);

    // Back to Menu button
    const backBtn = this.add.text(20, 20, '← BACK TO MENU', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#39FF14',
      backgroundColor: '#222',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#fff'));
    backBtn.on('pointerout', () => backBtn.setColor('#39FF14'));
    backBtn.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });

    // Left arrow
    const leftArrow = this.add.text(width / 2 - 220, height / 2, '<', {
      fontFamily: 'Courier, monospace', fontSize: '48px', color: '#fff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => this.showFlatmate(this.currentIndex - 1));

    // Right arrow
    const rightArrow = this.add.text(width / 2 + 220, height / 2, '>', {
      fontFamily: 'Courier, monospace', fontSize: '48px', color: '#fff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => this.showFlatmate(this.currentIndex + 1));

    // Portrait placeholder
    this.portraitRect = this.add.rectangle(width / 2, height / 2, 180, 220, 0xffffff, 0.04).setStrokeStyle(2, 0x39FF14).setOrigin(0.5);
    this.portraitLabel = this.add.text(width / 2, height / 2, '[ Portrait ]', {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: '#888'
    }).setOrigin(0.5);

    // Flatmate name
    this.nameText = this.add.text(width / 2, height / 2 - 140, '', {
      fontFamily: 'Courier, monospace', fontSize: '28px', color: '#fff'
    }).setOrigin(0.5);
    // Quote
    this.quoteText = this.add.text(width / 2, height / 2 + 140, '', {
      fontFamily: 'Courier, monospace', fontSize: '20px', color: '#fff'
    }).setOrigin(0.5);
    // Difficulty tag
    this.diffText = this.add.text(width / 2, height / 2 + 180, '', {
      fontFamily: 'Courier, monospace', fontSize: '18px', color: '#39FF14', backgroundColor: '#222', padding: { left: 10, right: 10, top: 2, bottom: 2 }
    }).setOrigin(0.5);

    // Select button
    const selectBtnRect = this.add.graphics();
    const btnW = 260, btnH = 54, btnR = 16;
    selectBtnRect.lineStyle(4, 0x39FF14, 1);
    selectBtnRect.fillStyle(0x111111, 1);
    selectBtnRect.strokeRoundedRect(width / 2 - btnW / 2, height - 120, btnW, btnH, btnR);
    selectBtnRect.fillRoundedRect(width / 2 - btnW / 2, height - 120, btnW, btnH, btnR);
    const selectBtn = this.add.text(width / 2, height - 120 + btnH / 2, 'SELECT THIS FLATMATE', {
      fontFamily: 'Courier, monospace', fontSize: '22px', color: '#39FF14', align: 'center', fixedWidth: btnW
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    selectBtn.on('pointerover', () => selectBtn.setColor('#fff'));
    selectBtn.on('pointerout', () => selectBtn.setColor('#39FF14'));
    selectBtn.on('pointerdown', () => {
      this.game.registry.set('selectedFlatmateId', FLATMATES[this.currentIndex].id);
      console.log('Selected flatmate (registry):', FLATMATES[this.currentIndex].id);
      this.scene.start('PlayerBedroomScene');
    });

    this.showFlatmate(0);
  }

  showFlatmate(idx: number) {
    this.currentIndex = (idx + FLATMATES.length) % FLATMATES.length;
    const f = FLATMATES[this.currentIndex];
    this.nameText.setText(f.name);
    this.quoteText.setText('"' + f.quote + '"');
    this.diffText.setText(f.difficulty);
    this.portraitLabel.setText('[ Portrait ]');
  }
} 