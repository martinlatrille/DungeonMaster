import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './config'
import CollisionnableObject, {COLLISIONABLES} from './CollisionableObject'
import HitLabel from './ui/HitLabel'
import Hero from './Hero'

export default class Enemy extends CollisionnableObject {
    constructor(color, width, height, posX, posY) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.rect(0, 0, width, height)
        ctx.fillStyle = color
        ctx.fill()

        super(
            new PIXI.Texture(new PIXI.BaseTexture(canvas)),
            width,
            height
        )

        this.state = {
            direction: 'right',
            damage: 10,
            life: 50,
            children: []
        }

        this.speed = 4
        this.pushable = true

        this.sightDistance = 400

        this.position.set(posX, posY)
    }

    get life() { return this.state.life }

    set life(v) { this.state.life = v }

    damage(object) {
        if (object instanceof Hero) {
            object.takeDamage(this.state.damage)
        }
    }

    takeDamage(damage) {
        this.life += -damage

        if (this.life <= 0) {
            console.log('Enemy destroyed!')
            this.isDestroyed = true
        } else {
            console.log(`Enemy hit! Remaining life: ${this.life}`)

            this.addChild(new HitLabel(
                this.mainSprite.position.x - 17,
                this.mainSprite.position.y - this.size.y / 2 - 30
            ))
        }
    }

    get hasTarget() { return !!this.target.obj }

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

            const directionY = vectorY / Math.abs(vectorY)
            const directionX = vectorX / Math.abs(vectorX)

            this.movement.x = directionX * this.speed
            this.movement.y = directionY * this.speed
        }
    }

    applyMovement() {
        super.applyMovement()

        const nextPosition = {
            x: this.position.x + this.movement.x + this.cineticForce.x,
            y: this.position.y + this.movement.y + this.cineticForce.y
        }

        if (nextPosition.x > 0 && nextPosition.x + this.size.x / 2 <= windowWidth) {
            this.position.x = nextPosition.x
        }

        if (nextPosition.y > 0 && nextPosition.y + this.size.y / 2 <= windowHeight) {
            this.position.y = nextPosition.y
        }
    }
}