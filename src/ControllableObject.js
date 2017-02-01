import CollisionableObject from './CollisionableObject'
import {windowWidth, windowHeight} from './config.js'

export default class ControllableObject extends CollisionableObject {
    constructor(texture, width, height) {
        super(texture, width, height)

        this.speed = 1

        this.movement = {
            x: 0,
            y: 0
        }

        this.desiredMovement = {
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
        this.desiredMovement.y = -this.speed
        this.keyDown.up = true
    }

    stopGoUp() {
        if (this.desiredMovement.y === -this.speed) {
            this.desiredMovement.y = 0
        }

        this.keyDown.up = false
    }

    startGoDown() {
        this.desiredMovement.y = this.speed

        this.keyDown.down = true
    }

    stopGoDown() {
        if (this.desiredMovement.y === this.speed) {
            this.desiredMovement.y = 0
        }

        this.keyDown.down = false
    }

    startGoLeft() {
        this.desiredMovement.x = -this.speed
        this.keyDown.left = true
    }

    stopGoLeft() {
        if (this.desiredMovement.x === -this.speed) {
            this.desiredMovement.x = 0
        }

        this.keyDown.left = false
    }

    startGoRight() {
        this.desiredMovement.x = this.speed
        this.keyDown.right = true
    }

    stopGoRight() {
        if (this.desiredMovement.x === this.speed) {
            this.desiredMovement.x = 0
        }

        this.keyDown.right = false
    }

    rotateToMousePos(mousePos) {
        const vectorY = mousePos.y - this.position.y
        const vectorX = mousePos.x - this.position.x

        this.rotation = Math.atan2(vectorY, vectorX)
    }

    move() {
        if (this.desiredMovement.x === 0) {
            if (this.keyDown.left) {
                this.startGoLeft()
            } else if (this.keyDown.right) {
                this.startGoRight()
            }
        }

        if (this.desiredMovement.y === 0) {
            if (this.keyDown.up) {
                this.startGoUp()
            } else if (this.keyDown.down) {
                this.startGoDown()
            }
        }

        this.movement = {
            x: this.desiredMovement.x,
            y: this.desiredMovement.y
        }
    }

    applyMovement() {
        super.applyMovement()

        const nextPosition = {
            x: this.position.x + this.movement.x + this.cineticForce.x,
            y: this.position.y + this.movement.y + this.cineticForce.y
        }

        if (nextPosition.x > 0 && nextPosition.x + this.size.x < windowWidth) {
            this.position.x = nextPosition.x
        }

        if (nextPosition.y > 0 && nextPosition.y + this.size.y < windowHeight) {
            this.position.y = nextPosition.y
        }
    }
}