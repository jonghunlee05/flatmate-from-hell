import Phaser from 'phaser';

const COLORS = {
    background: '#111',
    buttonFill: '#FF4500', // reddish-orange
    buttonOutline: 0xFF4500, // reddish-orange
    buttonText: '#fff',
    buttonHoverOutline: 0x39FF14, // lime green
    buttonHoverText: '#fff',
    border: 0x39FF14,
    topBar: 0x39FF14,
    accent: '#FF4500',
    dailyObjective: '#39FF14',
};

export default class HomeScene extends Phaser.Scene {
    private buttonContainers: Phaser.GameObjects.Container[] = [];
    private idleBoxContainer: Phaser.GameObjects.Container | null = null;
    private idleBoxBaseY: number = 0;
    private centerX = 0;
    private buttonWidth = 220;
    private buttonHeight = 54;
    private buttonRadius = 16;
    private gridGapX = 60;
    private gridGapY = 32;
    private gridCenterY = 350;
    private gridLeftX = 0;
    private gridRightX = 0;

    constructor() {
        super({ key: 'HomeScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.centerX = width / 2;
        this.gridLeftX = this.centerX - this.buttonWidth / 2 - this.gridGapX / 2;
        this.gridRightX = this.centerX + this.buttonWidth / 2 + this.gridGapX / 2;
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Border box
        const borderPadding = 32;
        const boxLeft = borderPadding;
        const boxRight = width - borderPadding;
        const boxTop = borderPadding;
        const boxBottom = height - borderPadding;
        this.add.rectangle(this.centerX, height / 2, width - 2 * borderPadding, height - 2 * borderPadding)
            .setStrokeStyle(3, COLORS.border)
            .setOrigin(0.5);

        // Top bar (inside the box)
        const topBarY = boxTop + 36;
        this.add.line(0, 0, boxLeft + 20, topBarY, boxRight - 20, topBarY, COLORS.topBar).setOrigin(0, 0).setLineWidth(2);
        // Coins (inside box, left)
        this.add.text(boxLeft + 24, boxTop + 10, '🪙 1234', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: COLORS.buttonText
        });
        // Settings (inside box, right)
        const settingsBtn = this.add.text(boxRight - 160, boxTop + 10, '⚙️ Settings', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: COLORS.buttonText
        }).setInteractive({ useHandCursor: true });
        settingsBtn.on('pointerover', () => {
            settingsBtn.setColor(COLORS.accent);
        });
        settingsBtn.on('pointerout', () => {
            settingsBtn.setColor(COLORS.buttonText);
        });
        settingsBtn.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });

        // Center character image placeholder
        const charBoxY = boxTop + 120;
        this.add.rectangle(this.centerX, charBoxY, 180, 180, 0xffffff, 0.04).setStrokeStyle(2, COLORS.border).setOrigin(0.5);
        this.add.text(this.centerX, charBoxY, '[ Character Image ]', {
            fontFamily: 'Courier, monospace', fontSize: '20px', color: '#888'
        }).setOrigin(0.5);

        // 2x2 grid of buttons
        const buttonGrid = [
            { label: '[ STORY MODE ]', scene: 'FlatmateSelectScene', x: this.gridLeftX, y: this.gridCenterY },
            { label: '[ ENDLESS MODE ]', scene: 'EndlessModeScene', x: this.gridRightX, y: this.gridCenterY },
            { label: '[ STORE ]', scene: 'StoreScene', x: this.gridLeftX, y: this.gridCenterY + this.buttonHeight + this.gridGapY },
            { label: '[ ACHIEVEMENTS ]', scene: 'AchievementScene', x: this.gridRightX, y: this.gridCenterY + this.buttonHeight + this.gridGapY },
        ];
        this.buttonContainers = [];
        buttonGrid.forEach(({ label, scene, x, y }, i) => {
            // Button background
            const graphics = this.add.graphics();
            graphics.lineStyle(3, COLORS.buttonOutline, 1);
            graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
            graphics.strokeRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
            graphics.fillRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
            // Button text
            const btn = this.add.text(this.buttonWidth / 2, this.buttonHeight / 2, label, {
                fontFamily: 'Courier, monospace',
                fontSize: '22px',
                color: COLORS.buttonText,
                align: 'center',
                fixedWidth: this.buttonWidth,
                fixedHeight: this.buttonHeight,
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            // Container for button
            const container = this.add.container(x, y, [graphics, btn]);
            container.setSize(this.buttonWidth, this.buttonHeight);
            container.setDepth(2);
            this.buttonContainers.push(container);
            // Hover/click effects
            btn.on('pointerover', () => {
                graphics.clear();
                graphics.lineStyle(4, COLORS.buttonHoverOutline, 1);
                graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
                graphics.strokeRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
                graphics.fillRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
                btn.setColor(COLORS.buttonHoverText);
            });
            btn.on('pointerout', () => {
                graphics.clear();
                graphics.lineStyle(3, COLORS.buttonOutline, 1);
                graphics.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.buttonFill).color, 1);
                graphics.strokeRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
                graphics.fillRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, this.buttonRadius);
                btn.setColor(COLORS.buttonText);
            });
            btn.on('pointerdown', () => {
                this.scene.start(scene);
            });
        });
    }
} 