import {CINETIC_ABSORPTION, BASIC_PUSH_FORCE, windowHeight, windowWidth} from './config'
import RenderableObject from './RenderableObject'

export const AXIS = ['x', 'y']
export const AXIS_FUNCTIONS = {x: Math.cos, y: Math.sin}
export let COLLISIONABLES = []

function sameSign(movement, relativePosition) {
    return (movement > 0 && relativePosition > 0)
        || (movement < 0 && relativePosition < 0)
}

function areCollisioning(obj1, obj2, axis = null) {
    const areInXHitbox = Math.abs(obj2.position.x - obj1.position.x) < (obj1.size.x + obj2.size.x) / 2
    const areInYHitbox = Math.abs(obj2.position.y - obj1.position.y) < (obj1.size.y + obj2.size.y) / 2

    if (axis === 'x') {
        return areInXHitbox
    }

    if (axis === 'y') {
        return areInYHitbox
    }

    return areInXHitbox && areInYHitbox
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
        const nextObj1 = {
            size: obj1.size,
            position: {
                x: obj1.position.x + obj1.movement.x + obj1.cineticForce.x,
                y: obj1.position.y + obj1.movement.y + obj1.cineticForce.y
            },
        }

        const nextObj2 = {
            size: obj2.size,
            position: {
                x: obj2.position.x + obj2.movement.x + obj2.cineticForce.x,
                y: obj2.position.y + obj2.movement.y + obj2.cineticForce.y
            }
        }

        if (areCollisioning(nextObj1, nextObj2)) {
            const relativePosition1to2 = {
                x: obj2.position.x - obj1.position.x,
                y: obj2.position.y - obj1.position.y
            }

            const relativeAngle1to2 = Math.atan2(relativePosition1to2.y, relativePosition1to2.x)
            const relativeAngle2to1 = Math.atan2(-relativePosition1to2.y, -relativePosition1to2.x)

            // Damage-related
            if (obj2.damage && obj1.takeDamage) {
                const damageDone = obj2.damage(obj1)

                // Cinetic-force exercice
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

            // Physical blocking
            if (obj2.pushable && obj1.pushable) {
                AXIS.forEach(axis => {
                    if (!relativePosition1to2[axis]) {
                        return
                    }

                    const otherAxis = axis === 'x' ? 'y' : 'x'

                    const singleAxisNextObj1 = Object.assign({}, nextObj1)
                    singleAxisNextObj1.position[otherAxis] = obj1.position[otherAxis]

                    const singleAxisNextObj2 = Object.assign({}, nextObj2)
                    singleAxisNextObj2.position[otherAxis] = obj2.position[otherAxis]

                    if (areCollisioning(singleAxisNextObj1, singleAxisNextObj2, otherAxis)) {
                        obj1.movement[axis] = sameSign(obj1.movement[axis], relativePosition1to2[axis]) ? 0 : obj1.movement[axis]
                        obj2.movement[axis] = sameSign(obj2.movement[axis], relativePosition1to2[axis]) ? obj2.movement[axis] : 0
                    }
                })
            }
        }
    }
}

export function doAllCollisions() {
    let toCollision = COLLISIONABLES.slice()

    while (toCollision.length) {
        const obj1 = toCollision[0]

        toCollision = toCollision.filter(item => item !== obj1)
        toCollision.forEach(obj2 => collision(obj1, obj2))
    }
}

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
            x: this.position.x + this.movement.x,
            y: this.position.y + this.movement.y
        }

        this.position.x = nextPosition.x
        this.position.y = nextPosition.y
    }
}