import * as PIXI from 'pixi.js'
import ControllableObject from './ControllableObject'
import BulletManager from './BulletManager'


export default class Hero extends ControllableObject {
    constructor(stage, posX, posY, color = "red", width = 20, height = 20) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.rect(0, 0, width, height)
        ctx.fillStyle = color
        ctx.fill()

        super(new PIXI.Texture(new PIXI.BaseTexture(canvas)), width, height)

        this.state = {
            life: 100
        }

        this.velocity = {
            x: 7,
            y: 7
        }

        this.position.set(posX, posY)

        this.bulletManager = new BulletManager(stage)
    }

    shoot() {
        this.bulletManager.addBullet(this.position.x, this.position.y, this.rotation)
    }

    get life() { return this.state.life }

    set life(v) { this.state.life = v }

    takeDamage(damage) {
        this.life += -damage

        console.log(`Remaining life: ${this.life}`)

        if (this.life <= 0) {
            console.log('Dead!')
            this.isDestroyed = true
        }
    }

    render() {
        this.bulletManager.render()
    }

    move() {
        super.move()

        this.bulletManager.move()
    }
}
