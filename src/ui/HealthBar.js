import * as PIXI from 'pixi.js'

const BLACK = 0x700707
const RED = 0xCC0808

export default class HealthBar {
    constructor(stage, hero) {
        this.hero = hero
        this.container = new PIXI.Container()
        this.container.position.set(5, 5)
        stage.addChild(this.container)

        this.originalWidth = 194

        const background = new PIXI.Graphics()
        background.beginFill(BLACK)
        background.drawRect(0, 0, this.originalWidth + 10, 20)
        background.endFill()
        this.container.addChild(background)

        this.foreground = new PIXI.Graphics()
        this.foreground.beginFill(RED)
        this.foreground.drawRect(5, 5, this.originalWidth, 10)
        this.foreground.endFill()
        this.container.addChild(this.foreground)

        this.container.outer = this.foreground
        this.originalValue = hero.life
        this.currentValue = hero.life
    }

    update() {
        if (this.hero.life !== this.currentValue) {
            this.currentValue = this.hero.life
            const newWidth = this.originalWidth * (this.currentValue / this.originalValue)
            this.foreground.width = newWidth > 0 ? newWidth : 0
        }
    }
}