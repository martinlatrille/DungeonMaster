import {windowWidth} from './config.js'
import ControllableObject from './ControllableObject'
import Bullet from './Bullet'


export default class ColoredRectangle extends ControllableObject {
    constructor(color, width, height, posX, posY, isABot = false) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.rect(0, 0, width, height)
        ctx.fillStyle = color
        ctx.fill()

        super(new PIXI.Texture(new PIXI.BaseTexture(canvas)))

        this.state = {
            direction: 'right',
            bullets: [],
            isABot,
            isRendered: false,
            isDestroyed: false
        }

        this.size = {
            x: width,
            y: height
        }

        this.velocity = {
            x: 7,
            y: 7
        }

        this.position.set(posX, posY)

        if (isABot) {
            this.move = this.autoMove
        }
    }

    shoot() {
        this.state.bullets.push(new Bullet(this.position.x, this.position.y, this.rotation))
    }

    render(stage) {
        if (!this.state.isRendered) {
            stage.addChild(this)
        }

        if (this.state.isDestroyed) {
            stage.removeChild(this)
        }

        this.state.bullets.forEach(bullet => {
            bullet.render(stage)
        })

        this.state.bullets.filter(bullet => bullet && !bullet.isDestroyed)
    }

    collision(stage) {
        stage.children.forEach(obj => {
            if (obj.damage) {
                const inXHitbox = Math.abs(obj.position.x - this.position.x) < (9 * this.size.x / 10)
                const inYHitbox = Math.abs(obj.position.y - this.position.y) < (9 * this.size.y / 10)

                if (inXHitbox && inYHitbox) {
                    console.log('hit!')
                    obj.damage(this)
                }
            }
        })
    }

    move() {
        super.move()

        this.state.bullets.forEach(bullet => bullet.move())
    }

    autoMove() {
        if (this.state.direction === 'right') {
            if (this.position.x + this.size.x < windowWidth) {
                this.position.x += this.velocity.x
            } else {
                this.state.direction = 'left'
            }
        } else if (this.state.direction === 'left') {
            if (this.position.x > 0) {
                this.position.x += -this.velocity.x
            } else {
                this.state.direction = 'right'
            }
        }
    }
}
