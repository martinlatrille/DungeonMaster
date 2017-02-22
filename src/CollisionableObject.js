import {CINETIC_ABSORPTION} from './config'
import RenderableObject from './RenderableObject'

export default class CollisionableObject extends RenderableObject {
    constructor(texture, width, height) {
        super(texture)

        this.size = {
            x: width,
            y: height
        }

        this.movement = {
            x: 0,
            y: 0
        }

        this.cineticForce = {
            x: 0,
            y: 0
        }

        this.pushable = true
    }

    consumeCinetic() {
        this.cineticForce = {
            x: this.cineticForce.x > 0 ? Math.max(0, this.cineticForce.x - CINETIC_ABSORPTION) : Math.min(0, this.cineticForce.x + CINETIC_ABSORPTION),
            y: this.cineticForce.y > 0 ? Math.max(0, this.cineticForce.y - CINETIC_ABSORPTION) : Math.min(0, this.cineticForce.y + CINETIC_ABSORPTION)
        }
    }

    applyForces() {
        this.consumeCinetic()
        this.movement.x += this.cineticForce.x
        this.movement.y += this.cineticForce.y
    }

    applyMovement() {
        const nextPosition = {
            x: this.position.x + this.movement.x,
            y: this.position.y + this.movement.y
        }

        this.position.x = nextPosition.x
        this.position.y = nextPosition.y
    }
}