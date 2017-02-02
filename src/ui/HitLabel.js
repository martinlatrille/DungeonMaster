import * as PIXI from 'pixi.js'

export default class HitLabel extends PIXI.Text {
    constructor(posX, posY) {
        const options = {
            fontFamily: "'Press Start 2P', Impact",
            fontSize: "16px",
            fill: "white"
        }

        super("HIT", options)

        this.x = posX
        this.y = posY

        this.anchor.set(0.5, 0.5)
    }

    animate() {
        this.alpha += -0.05
        this.position.y -= 0.5

        if (this.alpha <= 0) {
            this.isDestroyed = true
        }
    }
}