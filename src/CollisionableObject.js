import {CINETIC_ABSORPTION, BASIC_PUSH_FORCE, windowHeight, windowWidth} from './config'
import RenderableObject from './RenderableObject'

export const AXIS = ['x', 'y']
export const AXIS_FUNCTIONS = {x: Math.cos, y: Math.sin}
export let COLLISIONABLES = []

function getUnitVector(movement) {
    return {
        x: movement.x / Math.abs(movement.x),
        y: movement.y / Math.abs(movement.y)
    }
}

function sameSign(a, b) {
    return (a > 0 && b > 0) || (a < 0 && b < 0)
}

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
            const relativePosition1to2 = {
                x: obj2.position.x - obj1.position.x,
                y: obj2.position.y - obj1.position.y
            }

            const relativePositionUnit = {
                x: relativePosition1to2.x / Math.abs(relativePosition1to2.x || 1),
                y: relativePosition1to2.y / Math.abs(relativePosition1to2.y || 1),
            }

            const relativeAngle1to2 = Math.atan2(relativePosition1to2.y, relativePosition1to2.x)
            const relativeAngle2to1 = Math.atan2(-relativePosition1to2.y, -relativePosition1to2.x)

            if (obj2.damage && obj1.takeDamage) {
                const damageDone = obj2.damage(obj1)

                if (damageDone && obj1.pushable) {
                    AXIS.forEach(axis => {
                        obj1.cineticForce[axis] = - BASIC_PUSH_FORCE * AXIS_FUNCTIONS[axis](relativeAngle1to2)
                    })
                }
            }

            if (obj2.takeDamage && obj1.damage) {
                const damageDone = obj1.damage(obj2)

                if (damageDone && obj2.pushable) {
                    AXIS.forEach(axis => {
                        obj2.cineticForce[axis] = - BASIC_PUSH_FORCE * AXIS_FUNCTIONS[axis](relativeAngle2to1)
                    })
                }
            }

            if (obj2.pushable && obj1.pushable) {

                AXIS.forEach(axis => {
                    if (!relativePositionUnit[axis]) {
                        return
                    }

                    obj1.movement[axis] = sameSign(obj1.movement[axis], relativePositionUnit[axis]) ? 0 : obj1.movement[axis]
                    obj2.movement[axis] = sameSign(obj2.movement[axis], relativePositionUnit[axis]) ? obj2.movement[axis] : 0
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

        if (nextPosition.x > 0 && nextPosition.x + this.size.x / 2 < windowWidth) {
            this.position.x = nextPosition.x
        }

        if (nextPosition.y > 0 && nextPosition.y + this.size.y / 2 < windowHeight) {
            this.position.y = nextPosition.y
        }
    }
}