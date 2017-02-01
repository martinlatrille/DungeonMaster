import {CINETIC_ABSORPTION, BASIC_PUSH_FORCE, windowHeight, windowWidth} from './config'
import RenderableObject from './RenderableObject'

export let COLLISIONABLES = []

function collision(obj1, obj2) {
    if (obj1.isDestroyed) {
        COLLISIONABLES = COLLISIONABLES.filter(obj => obj !== obj1)
        return
    }

    if (obj2.isDestroyed) {
        COLLISIONABLES = COLLISIONABLES.filter(obj => obj !== obj2)
        return
    }

    if (obj2 !== obj1) {
        const inXHitbox = Math.abs(obj2.position.x - obj1.position.x) < (obj1.size.x + obj2.size.x) / 2
        const inYHitbox = Math.abs(obj2.position.y - obj1.position.y) < (obj1.size.y + obj2.size.y) / 2

        if (inXHitbox && inYHitbox) {
            if (obj2.damage && obj1.takeDamage) {
                obj2.damage(obj1)
            }

            if (obj2.takeDamage && obj1.damage) {
                obj1.damage(obj2)
            }

            if (obj2.pushable && obj1.pushable) {
                const relativePosition1to2 = {
                    x: obj2.position.x - obj1.position.x,
                    y: obj2.position.y - obj1.position.y
                }

                const relativePositionUnit = {
                    x: relativePosition1to2.x / Math.abs(relativePosition1to2.x || 1),
                    y: relativePosition1to2.y / Math.abs(relativePosition1to2.y || 1),
                }


                const axisArray = ['x', 'y']

                axisArray.forEach(axis => {
                    if (!relativePositionUnit[axis]) {
                        return
                    }

                    const speedSumOnAxis = Math.abs(obj1.movement[axis]) + Math.abs(obj2.movement[axis])
                    const pushForce = BASIC_PUSH_FORCE + speedSumOnAxis

                    obj1.cineticForce[axis] = (relativePositionUnit[axis] > 0 ? -pushForce : pushForce)
                    obj2.cineticForce[axis] = (relativePositionUnit[axis] > 0 ? pushForce : -pushForce)
                })
            }
        }
    }
}

export function doAllCollisions() {
    let toCollision = COLLISIONABLES.slice()

    while (toCollision.length) {
        const obj1 = toCollision[0]

        toCollision.forEach(obj2 => collision(obj1, obj2))
        toCollision = toCollision.filter(item => item !== obj1)
    }
}

export default class CollisionableObject extends RenderableObject {
    constructor(texture, width, height) {
        super(texture)

        this.size = {
            x: width,
            y: height
        }

        this.cineticForce = {
            x: 0,
            y: 0
        }

        this.pushable = true

        COLLISIONABLES.push(this)
    }

    consumeCinetic() {
        this.cineticForce = {
            x: this.cineticForce.x > 0 ? Math.max(0, this.cineticForce.x - CINETIC_ABSORPTION) : Math.min(0, this.cineticForce.x + CINETIC_ABSORPTION),
            y: this.cineticForce.y > 0 ? Math.max(0, this.cineticForce.y - CINETIC_ABSORPTION) : Math.min(0, this.cineticForce.y + CINETIC_ABSORPTION)
        }
    }

    applyMovement() {
        this.consumeCinetic()

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