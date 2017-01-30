import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './config.js'


export default class Bullet extends PIXI.Sprite {
    constructor(posX, posY, angle) {
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

        super(new PIXI.Texture(new PIXI.BaseTexture(canvas)))

        this.velocity = {
            x: 30,
            y: 30
        }

        this.state = {
            isRendered: false,
            isDestroyed: false
        }

        this.anchor.set(0.5, 0.5)
        this.position.set(posX, posY)
        this.rotation = angle
    }

    get isDestroyed() {return this.state.isDestroyed}

    damage(object) {
        this.state.isDestroyed = true
        object.state.isDestroyed = true
    }

    move() {
        this.position.x += Math.cos(this.rotation) * this.velocity.x
        this.position.y += Math.sin(this.rotation) * this.velocity.y

        if (
            this.position.x > windowWidth ||
            this.position.x < 0 ||
            this.position.y > windowHeight ||
            this.position.y < 0
        ) {
            this.state.isDestroyed = true
        }
    }

    render(stage) {
        if (!this.state.isRendered) {
            stage.addChild(this)
        }

        if (this.state.isDestroyed) {
            stage.removeChild(this)
        }
    }
}
