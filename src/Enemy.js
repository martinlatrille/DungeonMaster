import * as PIXI from 'pixi.js'
import {windowWidth} from './config'
import CollisionnableObject from './CollisionnableObject'
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

        this.velocity = {
            x: 7,
            y: 7
        }

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

    move() {
        if (this.state.direction === 'right') {
            if (this.position.x + this.size.x / 2 < windowWidth) {
                this.position.x += this.velocity.x
            } else {
                this.state.direction = 'left'
            }
        } else if (this.state.direction === 'left') {
            if (this.position.x - this.size.x / 2 > 0) {
                this.position.x += -this.velocity.x
            } else {
                this.state.direction = 'right'
            }
        }
    }
}