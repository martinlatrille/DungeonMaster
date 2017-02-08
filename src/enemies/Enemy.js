import * as PIXI from 'pixi.js'
import {windowWidth} from '../config'
import CollisionnableObject, {COLLISIONABLES} from '../CollisionableObject'
import HitLabel from '../ui/HitLabel'
import Hero from '../hero/Hero'

export default class Enemy extends CollisionnableObject {
    constructor(width, height, posX, posY) {
        const texture = PIXI.loader.resources.zombieSpritesheet.texture
        texture.frame = new PIXI.Rectangle(0, 0, 50, 58)

        super(
            texture,
            width,
            height
        )

        this.texture = texture

        this.state = {
            direction: 'right',
            damage: 10,
            life: 100,
            children: []
        }

        this.animation = {
            index: 0,
            speed: 0.1,
            ticker: 0,
            xSpriteSize: 50,
            ySpriteSize: 58
        }

        this.speed = 4

        this.sightDistance = 800

        this.position.set(posX, posY)
    }

    get life() { return this.state.life }

    set life(v) { this.state.life = v }

    damage(object) {
        if (object instanceof Hero) {
            return object.takeDamage(this.state.damage)
        }

        return 0
    }

    takeDamage(damage) {
        this.life += -damage

        if (this.life <= 0) {
            console.log('Enemy destroyed!')
            this.isDestroyed = true
        } else {
            this._displayHitLabel()
        }

        return damage
    }

    get hasTarget() { return !!this.target.obj }

    _displayHitLabel() {
        this.addChild(new HitLabel(
            this.mainSprite.position.x,
            this.mainSprite.position.y - this.size.y / 2 - 10
        ))
    }

    see() {
        let target = {
            obj: null,
            distance: null
        }

        COLLISIONABLES.forEach(obj => {
            if (obj instanceof Hero) {
                const xDistance = Math.abs(obj.position.x - this.position.x)
                const yDistance = Math.abs(obj.position.y - this.position.y)
                const distance = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2))

                if (distance < this.sightDistance) {
                    if (!target.obj || distance < target.distance) {
                        target = {obj, distance}
                    }
                }
            }
        })

        this.target = target
    }

    move() {
        this.see()

        this.movement = {
            x: 0,
            y: 0
        }

        if (!this.hasTarget) {
            if (this.state.direction === 'right') {
                if (this.position.x + this.size.x / 2 + this.speed < windowWidth) {
                    this.movement.x = this.speed
                } else {
                    this.state.direction = 'left'
                }
            } else if (this.state.direction === 'left') {
                if (this.position.x - this.size.x / 2 - this.speed > 0) {
                    this.movement.x = -this.speed
                } else {
                    this.state.direction = 'right'
                }
            }
        } else {
            const vectorY = this.target.obj.position.y - this.position.y
            const vectorX = this.target.obj.position.x - this.position.x

            const angle = Math.atan2(vectorY, vectorX)

            this.movement.x = Math.cos(angle) * this.speed
            this.movement.y = Math.sin(angle) * this.speed
            this.angleToTarget = angle
        }
    }

    applyMovement() {
        super.applyMovement()

        if (this.movement.x === 0) {
            this.state.direction = this.state.direction === 'right' ? 'left' : 'right'
        }
    }

    render() {
        super.render()

        const angle = this.angleToTarget
        let ySpritePos = 0
        let xScale = 1

        if (angle > 2) {
            ySpritePos = this.animation.ySpriteSize
        } else if (angle > 0 && angle < 1) {
            ySpritePos = this.animation.ySpriteSize
            xScale = -1
        } else if (angle < -2) {
            ySpritePos = 2 * this.animation.ySpriteSize
        } else if (angle < 0 && angle > -1) {
            ySpritePos = 2 * this.animation.ySpriteSize
            xScale = -1
        } else if (angle < -1 && angle > -2) {
            ySpritePos = 3 * this.animation.ySpriteSize
        }

        let xSpritePos = 0

        if (this.movement.x || this.movement.y) {
            if (this.animation.ticker % (60 * this.animation.speed) === 0) {
                this.animation.index = this.animation.index % 2 + 1
            }

            xSpritePos = this.animation.index * this.animation.xSpriteSize

            this.animation.ticker += 1
        }

        this.texture.frame = new PIXI.Rectangle(
            xSpritePos, ySpritePos,
            this.animation.xSpriteSize, this.animation.ySpriteSize)

        this.mainSprite.scale.x = xScale
    }
}