import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './config.js'

export default class ControllableObject extends PIXI.Sprite {
    constructor(texture) {
        super(texture)

        this.velocity = {
            x: 1,
            y: 1
        }

        this.movement = {
            x: 0,
            y: 0
        }

        this.size = {
            x: 0,
            y: 0
        }

        this.anchor.set(0.5, 0.5)
    }

    startGoUp() {
        this.movement.y = -this.velocity.y
    }

    stopGoUp() {
        if (this.movement.y === -this.velocity.y) {
            this.movement.y = 0
        }
    }

    startGoDown() {
        this.movement.y = this.velocity.y
    }

    stopGoDown() {
        if (this.movement.y === this.velocity.y) {
            this.movement.y = 0
        }
    }

    startGoLeft() {
        this.movement.x = -this.velocity.x
    }

    stopGoLeft() {
        if (this.movement.x === -this.velocity.x) {
            this.movement.x = 0
        }
    }

    startGoRight() {
        this.movement.x = this.velocity.x
    }

    stopGoRight() {
        if (this.movement.x === this.velocity.x) {
            this.movement.x = 0
        }
    }

    rotateToMousePos(mousePos) {
        const vectorY = mousePos.y - this.position.y
        const vectorX = mousePos.x - this.position.x

        this.rotation = Math.atan2(vectorY, vectorX)
    }

    move() {
        const nextPosition = {
            x: this.position.x + this.movement.x,
            y: this.position.y + this.movement.y
        }

        if (nextPosition.x > 0 && nextPosition.x + this.size.x < windowWidth) {
            this.position.x = nextPosition.x
        }

        if (nextPosition.y > 0 && nextPosition.y + this.size.y < windowHeight) {
            this.position.y = nextPosition.y
        }
    }
}