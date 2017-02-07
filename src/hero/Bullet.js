import * as PIXI from 'pixi.js'
import CollisionnableObject from '../CollisionableObject'
import {windowWidth, windowHeight} from '../config.js'
import Hero from './Hero'


export default class Bullet extends CollisionnableObject {
    constructor(posX, posY, rotation) {
        const canvas = document.createElement('canvas')

        const width = 10
        const height = 3
        const color = 'yellow'

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.rect(0, 0, width, height)
        ctx.fillStyle = color
        ctx.fill()

        super(new PIXI.Texture(new PIXI.BaseTexture(canvas)), width, height)

        this.state = {
            damage: 20
        }

        this.speed = 20
        this.pushable = false
        this.resistOnCollision = false

        this.position.set(posX, posY)
        this.rotation = rotation
    }

    damage(object) {
        if (!(object instanceof Hero)) {
            this.isDestroyed = true
            return object.takeDamage(this.state.damage)
        }

        return 0
    }

    move() {
        this.movement = {
            x: Math.cos(this.rotation) * this.speed,
            y: Math.sin(this.rotation) * this.speed
        }
    }

    applyMovement() {
        this.position.x += this.movement.x
        this.position.y += this.movement.y

        if (
            this.position.x > windowWidth ||
            this.position.x < 0 ||
            this.position.y > windowHeight ||
            this.position.y < 0
        ) {
            this.isDestroyed = true
        }
    }
}
