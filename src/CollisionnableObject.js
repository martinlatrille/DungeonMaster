import RenderableObject from './RenderableObject'

export default class CollisionnableObject extends RenderableObject {
    constructor(texture, width, height) {
        super(texture)

        this.size = {
            x: width,
            y: height
        }
    }

    collision(stage) {
        stage.children.forEach(obj => {
            if (obj !== this) {
                const inXHitbox = Math.abs(obj.position.x - this.position.x) < (9 * this.size.x / 10)
                const inYHitbox = Math.abs(obj.position.y - this.position.y) < (9 * this.size.y / 10)

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