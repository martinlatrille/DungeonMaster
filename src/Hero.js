import * as PIXI from 'pixi.js'
import ControllableObject from './ControllableObject'
import BulletManager from './BulletManager'


export default class Hero extends ControllableObject {
    constructor(stage, posX, posY, width = 40, height = 45) {
        const texture = PIXI.loader.resources.heroSpritesheet.texture
        const frame = new PIXI.Rectangle(0, 0, 50, 50)
        texture.frame = frame

        super(texture, width, height)

        this.texture = texture

        this.state = {
            life: 100
        }

        this.speed = 7

        this.position.set(posX, posY)

        this.bulletManager = new BulletManager(stage)

        this.animation = {
            index: 0,
            speed: 0.1,
            ticker: 0
        }
    }

    shoot() {
        this.bulletManager.addBullet(this.position.x, this.position.y, this.angleToMouse)
    }

    get life() { return this.state.life }

    set life(v) { this.state.life = v }

    takeDamage(damage) {
        this.life += -damage

        if (this.life <= 0) {
            this.life = 0
            this.isDestroyed = true
            console.log("You're dead :/")
        }

        return damage
    }

    move() {
        super.move()

        const angle = this.angleToMouse
        let ySpritePos = 0

        if (angle < -2 || angle > 2) {
            ySpritePos = 50
        } else if (angle > -1 && angle < 1) {
            ySpritePos = 100
        } else if (angle < -1 && angle > -2) {
            ySpritePos = 150
        }

        let xSpritePos = 0

        if (this.movement.x || this.movement.y) {
            if (this.animation.ticker % (60 * this.animation.speed) === 0) {
                this.animation.index = this.animation.index % 2 + 1
            }

            xSpritePos = this.animation.index * 50

            this.animation.ticker += 1
        }

        this.texture.frame = new PIXI.Rectangle(xSpritePos, ySpritePos, 50, 50)

        this.bulletManager.move()
    }

    applyMovement() {
        super.applyMovement()

        this.bulletManager.applyMovement()
    }
}
