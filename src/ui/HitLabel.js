import * as PIXI from 'pixi.js'

export default class HitLabel extends PIXI.Text {
    constructor(posX, posY) {
        const options = {
            fontFamily: "Impact",
            fontSize: "20px",
            fill: "white"
        }

        super("H I T", options)

        this.x = posX
        this.y = posY
    }

    animate() {
        this.alpha += -0.05
        this.position.y -= 0.5

        if (this.alpha <= 0) {
            this.isDestroyed = true
        }
    }
}