import * as PIXI from 'pixi.js'
import CollisionableObject from './CollisionableObject'
import Enemy from './Enemy'
import EnemyManager from './EnemyManager'
import HitLabel from './ui/HitLabel'

export default class EnemySpawn extends CollisionableObject {
    constructor(posX, posY, direction = "top") {
        const width = 100
        const height = 30
        const color = "blue"

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.rect(0, 0, width, height)
        ctx.fillStyle = color
        ctx.fill()

        super(
            new PIXI.Texture(new PIXI.BaseTexture(canvas)),
            width,
            height
        )

        this.childAttributes = {
            color: 'green',
            width: 30,
            height: 30
        }

        this.state = {
            life: 1000,
            direction,
            manager: new EnemyManager(),
            spawnSpeed: 2, // in seconds
            spawnDecount: 3 // in seconds
        }

        this.position.set(posX, posY)
    }

    takeDamage(damage) {
        this.state.life += -damage
        console.log(`Spawn life: ${this.state.life}`)

        if (!this.state.life) {
            this.isDestroyed = true
            console.log('YOU DESTROYED THE SPAWN')
        }

        this._displayHitLabel()
    }

    _displayHitLabel() {
        this.addChild(new HitLabel(
            this.mainSprite.position.x,
            this.mainSprite.position.y - this.size.y / 2 - 10
        ))
    }

    spawn() {
        const newChild = new Enemy(
            this.childAttributes.color,
            this.childAttributes.width,
            this.childAttributes.height,
            this.position.x,
            this.position.y + (this.state.direction === 'top' ? -30 : 30)
        )

        newChild.cineticForce.y = (this.state.direction === 'top' ? -1 : 1)
            * Math.floor(Math.random() * 10 + 2)

        newChild.cineticForce.x = Math.floor(Math.random() * 30 - 15)
        newChild.state.direction = newChild.cineticForce.x > 0 ? 'right' : 'left'

        this.state.manager.addItem(newChild)
    }

    spawnMultiple(x) {
        for (let i = 0; i < x; i++) {
            this.spawn()
        }
    }

    work() {
        if (this.state.spawnDecount <= 0) {
            this.spawn()
            this.state.spawnDecount = this.state.spawnSpeed
        } else {
            this.state.spawnDecount += - 1 / 60
        }
    }
}