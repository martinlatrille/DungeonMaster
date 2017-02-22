import * as PIXI from 'pixi.js'
import CollisionableObject from '../CollisionableObject'
import RenderableObject from '../RenderableObject'
import Enemy from './Enemy'
import EnemyManager from './EnemyManager'
import HitLabel from '../ui/HitLabel'

export default class EnemySpawn extends CollisionableObject {
    constructor(game, posX, posY, onDeathCallback, direction = "top") {
        const width = 120
        const height = 40

        const texture = PIXI.loader.resources.enemySpawnShadow.texture

        super(
            texture,
            width,
            height
        )

        this.portal = new RenderableObject(PIXI.loader.resources.enemySpawn.texture)
        this.portal.position.set(posX, posY)

        this.frame = new RenderableObject(PIXI.loader.resources.enemySpawnFrame.texture)
        this.frame.position.set(posX, posY)

        // this.addChild(this.portal)
        // this.addChild(this.frame)

        game.addRenderable(this.portal)
        game.addRenderable(this)
        game.addRenderable(this.frame)

        this.childAttributes = {
            width: 30,
            height: 30
        }

        this.state = {
            life: 1000,
            direction,
            manager: new EnemyManager(game, onDeathCallback),
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
            this.mainSprite.position.y - this.size.y / 2 - 55
        ))
    }

    spawn() {
        const newChild = new Enemy(
            this.childAttributes.width,
            this.childAttributes.height,
            this.position.x,
            this.position.y + (this.state.direction === 'top' ? -30 : 30)
        )

        newChild.cineticForce.y = (this.state.direction === 'top' ? -1 : 1)
            * Math.floor(Math.random() * 10 + 5)

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

    animate() {
        this.portal.rotation += 0.01
    }
}