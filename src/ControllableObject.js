import CollisionnableObject from './CollisionnableObject'
import {windowWidth, windowHeight} from './config.js'

export default class ControllableObject extends CollisionnableObject {
    constructor(texture, width, height) {
        super(texture, width, height)

        this.velocity = {
            x: 1,
            y: 1
        }

        this.movement = {
            x: 0,
            y: 0
        }

        this.keyDown = {
            up: false,
            down: false,
            left: false,
            right: false
        }
    }

    startGoUp() {
        this.movement.y = -this.velocity.y
        this.keyDown.up = true
    }

    stopGoUp() {
        if (this.movement.y === -this.velocity.y) {
            this.movement.y = 0
        }

        this.keyDown.up = false
    }

    startGoDown() {
        this.movement.y = this.velocity.y

        this.keyDown.down = true
    }

    stopGoDown() {
        if (this.movement.y === this.velocity.y) {
            this.movement.y = 0
        }

        this.keyDown.down = false
    }

    startGoLeft() {
        this.movement.x = -this.velocity.x
        this.keyDown.left = true
    }

    stopGoLeft() {
        if (this.movement.x === -this.velocity.x) {
            this.movement.x = 0
        }

        this.keyDown.left = false
    }

    startGoRight() {
        this.movement.x = this.velocity.x
        this.keyDown.right = true
    }

    stopGoRight() {
        if (this.movement.x === this.velocity.x) {
            this.movement.x = 0
        }

        this.keyDown.right = false
    }

    rotateToMousePos(mousePos) {
        const vectorY = mousePos.y - this.position.y
        const vectorX = mousePos.x - this.position.x

        this.rotation = Math.atan2(vectorY, vectorX)
    }

    move() {
        if (this.movement.x === 0) {
            if (this.keyDown.left) {
                this.startGoLeft()
            } else if (this.keyDown.right) {
                this.startGoRight()
            }
        }

        if (this.movement.y === 0) {
            if (this.keyDown.up) {
                this.startGoUp()
            } else if (this.keyDown.down) {
                this.startGoDown()
            }
        }

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