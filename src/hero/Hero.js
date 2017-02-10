import * as PIXI from 'pixi.js'
import ControllableObject from './ControllableObject'
import BasicGun from './weapons/BasicGun'
import WeaponManager from './weapons/WeaponManager'

function generateTextureStore(texture, frameWidth, frameHeight) {
    return {
        toBottom: [
            new PIXI.Texture(texture, new PIXI.Rectangle(0, 0, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(frameWidth, 0, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(2 * frameWidth, 0, frameWidth, frameHeight))
        ],
        toBottomSide: [
            new PIXI.Texture(texture, new PIXI.Rectangle(0, frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(frameWidth, frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(2 * frameWidth, frameHeight, frameWidth, frameHeight)),
        ],
        toTopSide: [
            new PIXI.Texture(texture, new PIXI.Rectangle(0, 2 * frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(frameWidth, 2 * frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(2 * frameWidth, 2 *frameHeight, frameWidth, frameHeight)),
        ],
        toTop: [
            new PIXI.Texture(texture, new PIXI.Rectangle(0, 3 * frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(frameWidth,  3 * frameHeight, frameWidth, frameHeight)),
            new PIXI.Texture(texture, new PIXI.Rectangle(2 * frameWidth, 3 * frameHeight, frameWidth, frameHeight)),
        ],
    }
}

let HERO_TEXTURE_STORE = null

export default class Hero extends ControllableObject {
    constructor(posX, posY, width = 40, height = 45) {
        if (!HERO_TEXTURE_STORE) {
            HERO_TEXTURE_STORE = generateTextureStore(PIXI.loader.resources.heroSpritesheet.texture.baseTexture, 50, 58)
        }

        super(
            HERO_TEXTURE_STORE['toBottom'][0],
            width,
            height
        )

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
        super.render()

        const angle = this.angleToMouse
        let direction = 'toBottom'
        let ySpritePos = 0
        let xScale = 1

        if (angle > 2) {
            direction = 'toBottomSide'
        } else if (angle >= 0 && angle < 1) {
            direction = 'toBottomSide'
            xScale = -1
        } else if (angle < -2) {
            direction = 'toTopSide'
        } else if (angle < 0 && angle > -1) {
            direction = 'toTopSide'
            xScale = -1
        } else if (angle < -1 && angle > -2) {
            direction = 'toTop'
        }

        if (this.movement.x || this.movement.y) {
            if (this.animation.ticker % (60 * this.animation.speed) === 0) {
                this.animation.index = this.animation.index % 2 + 1
            }


            this.animation.ticker += 1
        } else {
            this.animation.index = 0
        }

        this.mainSprite.texture = HERO_TEXTURE_STORE[direction][this.animation.index]

        this.mainSprite.scale.x = xScale
    }
}
