import * as PIXI from 'pixi.js'
import ControllableObject from './ControllableObject'
import BasicGun from './weapons/BasicGun'
import WeaponManager from './weapons/WeaponManager'


export default class Hero extends ControllableObject {
    constructor(posX, posY, width = 40, height = 45) {
        const texture = PIXI.loader.resources.heroSpritesheet.texture
        texture.frame = new PIXI.Rectangle(0, 0, 50, 58)

        super(texture, width, height)

        this.texture = texture

        this.state = {
            life: 100
        }

        this.speed = 7

        this.position.set(posX, posY)

        this.weaponManager = new WeaponManager()
        this.weaponManager.addItem(new BasicGun(this))

        this.animation = {
            index: 0,
            speed: 0.1,
            ticker: 0,
            xSpriteSize: 50,
            ySpriteSize: 58
        }

        this.zIndex = 1
    }

    shoot() {
        this.weaponManager.equippedWeapon.shoot()
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

        this.weaponManager.equippedWeapon.rotation = this.angleToMouse
    }

    render() {
        const angle = this.angleToMouse
        let ySpritePos = 0

        if (angle > 2) {
            ySpritePos = this.animation.ySpriteSize
        } else if (angle > 0 && angle < 1) {
            ySpritePos = 2 * this.animation.ySpriteSize
        } else if (angle < -2) {
            ySpritePos = 3 * this.animation.ySpriteSize
        } else if (angle < 0 && angle > -1) {
            ySpritePos = 4 * this.animation.ySpriteSize
        } else if (angle < -1 && angle > -2) {
            ySpritePos = 5 * this.animation.ySpriteSize
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
    }
}
