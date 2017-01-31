import RenderableObject from './RenderableObject'

let COLLISIONNABLES = []

export default class CollisionnableObject extends RenderableObject {
    constructor(texture, width, height) {
        super(texture)

        this.size = {
            x: width,
            y: height
        }

        COLLISIONNABLES.push(this)
    }

    collision() {
        if (this.isDestroyed) {
            COLLISIONNABLES = COLLISIONNABLES.filter(obj => obj !== this)
            return
        }

        COLLISIONNABLES.forEach(obj => {
            if (obj !== this && !obj.isDestroyed) {
                const inXHitbox = Math.abs(obj.position.x - this.position.x) < (this.size.x + obj.size.x) / 2
                const inYHitbox = Math.abs(obj.position.y - this.position.y) < (this.size.y + obj.size.y) / 2

                if (inXHitbox && inYHitbox) {
                    if (obj.damage && this.takeDamage) {
                        obj.damage(this)
                    }

                    if (obj.takeDamage && this.damage) {
                        this.damage(obj)
                    }
                }
            }
        })
    }
}