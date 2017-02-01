import CollisionableObject from './CollisionableObject'

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
        this.desiredMovement.y = -1
        this.keyDown.up = true
    }

    stopGoUp() {
        if (this.desiredMovement.y === -1) {
            this.desiredMovement.y = 0
        }

        this.keyDown.up = false
    }

    startGoDown() {
        this.desiredMovement.y = 1

        this.keyDown.down = true
    }

    stopGoDown() {
        if (this.desiredMovement.y === 1) {
            this.desiredMovement.y = 0
        }

        this.keyDown.down = false
    }

    startGoLeft() {
        this.desiredMovement.x = -1
        this.keyDown.left = true
    }

    stopGoLeft() {
        if (this.desiredMovement.x === -1) {
            this.desiredMovement.x = 0
        }

        this.keyDown.left = false
    }

    startGoRight() {
        this.desiredMovement.x = 1
        this.keyDown.right = true
    }

    stopGoRight() {
        if (this.desiredMovement.x === 1) {
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
            x: this.desiredMovement.x * (Math.abs(this.desiredMovement.y) ? this.speed / Math.sqrt(2) : this.speed),
            y: this.desiredMovement.y * (Math.abs(this.desiredMovement.x) ? this.speed / Math.sqrt(2) : this.speed)
        }
    }
}