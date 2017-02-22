import RenderableObject from '../../RenderableObject'
import BulletManager from './../BulletManager'

export default class Weapon extends RenderableObject {
    constructor(game, texture, hero) {
        super(texture, 1, false)

        this.position.set(
            (hero.size.x / 2) + 10,
            0
        )

        this.rotation = 0
        // this.mainSprite.anchor.set(0, 0.5)
        this.hero = hero

        this.bulletManager = new BulletManager(game)
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
        const shouldBeOnLeft = this.rotation < -2 || this.rotation > 2
        const shouldBeOnRight = this.rotation > -1 && this.rotation < 1
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