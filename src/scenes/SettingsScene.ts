import Phaser from 'phaser';

const COLORS = {
    background: '#111',
    buttonFill: '#111',
    buttonOutline: 0x39FF14, // lime green
    buttonText: '#fff',
    buttonGlow: 0xFF4500, // reddish-orange
    buttonHoverText: '#FF4500',
    border: 0x39FF14,
    accent: '#FF4500',
};

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Border box
        this.add.rectangle(centerX, height / 2, width - 40, height - 40)
            .setStrokeStyle(3, COLORS.border)
            .setOrigin(0.5);

        // Title
        this.add.text(centerX, 100, 'SETTINGS', {
            fontFamily: 'Courier, monospace',
            fontSize: '38px',
            color: COLORS.buttonText,
            align: 'center',
        }).setOrigin(0.5);

        // Back to Menu button (styled)
        const buttonWidth = 220;
        const buttonHeight = 50;
        const buttonRadius = 14;
        const x = centerX - buttonWidth / 2;
        const y = height - 120;
        const graphics = this.add.graphics();
        graphics.lineStyle(3, COLORS.buttonOutline, 1);
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
        graphics.strokeRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
        graphics.fillRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
        graphics.setDepth(1);

        const btn = this.add.text(centerX, y + buttonHeight / 2, '< Back to Menu', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: COLORS.buttonText,
            align: 'center',
            fixedWidth: buttonWidth,
            fixedHeight: buttonHeight,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.setDepth(2);
        btn.on('pointerover', () => {
            graphics.clear();
            graphics.lineStyle(4, COLORS.buttonGlow, 1);
            graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
            graphics.strokeRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
            graphics.fillRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
            btn.setColor(COLORS.buttonHoverText);
            btn.setShadow(0, 0, COLORS.accent, 12, true, true);
        });
        btn.on('pointerout', () => {
            graphics.clear();
            graphics.lineStyle(3, COLORS.buttonOutline, 1);
            graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
            graphics.strokeRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
            graphics.fillRoundedRect(x, y, buttonWidth, buttonHeight, buttonRadius);
            btn.setColor(COLORS.buttonText);
            btn.setShadow(0, 0, '#000', 0, false, false);
        });
        btn.on('pointerdown', () => {
            this.scene.start('HomeScene');
        });
    }
} 