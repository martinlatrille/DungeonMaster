import RenderableObject from '../../RenderableObject'
import BulletManager from './../BulletManager'

export default class Weapon extends RenderableObject {
    constructor(texture, hero) {
        super(texture, false)

        this.position.set(
            (hero.size.x / 2) + 10,
            0
        )

        this.rotation = 0
        // this.mainSprite.anchor.set(0, 0.5)
        this.hero = hero

        this.bulletManager = new BulletManager()
        this.mainSprite.anchor.set(0, 0.5)
    }

    shoot() {
        this.bulletManager.addBullet(
            this.hero.position.x + this.position.x,
            this.hero.position.y + this.position.y,
            this.rotation
        )
    }

    render() {
        const shouldBeOnLeft = this.rotation < -1.8 || this.rotation > 1.8
        const shouldBeOnRight = this.rotation > -1.2 && this.rotation < 1.2
        const isOnLeft = this.position.x < 0

        const goToLeft = shouldBeOnLeft && !isOnLeft
        const goToRight = shouldBeOnRight && isOnLeft

        const switchSide = goToLeft || goToRight

        if (switchSide) {
            this.position.x = - this.position.x
            this.mainSprite.scale.y = - this.mainSprite.scale.y
        }
    }
}