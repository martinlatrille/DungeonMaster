import * as PIXI from 'pixi.js'
import {windowWidth} from './../config'

export default class ScoreCounter extends PIXI.Text {
    constructor(game) {
        const options = {
            fontFamily: "'Press Start 2P', Impact",
            fontSize: "16px",
            fill: "white"
        }

        super("0", options)

        this.game = game

        this.position.set(windowWidth - 20, 40)
        this.anchor.set(1, 0.5)
        game.addChild(this)
    }

    update() {
        this.text = this.game.score.toString()
    }
}