import * as PIXI from 'pixi.js'
import _ from 'lodash'

import Room from './map/Room'

import {doAllCollisions} from './CollisionableObject'
import {allManagers} from './GenericManager'
import {RENDERABLES} from './RenderableObject'

import HeroManager from './hero/HeroManager'
import {attachControls} from './hero/commands'

import EnemySpawn from './enemies/EnemySpawn'

import HealthBar from './ui/HealthBar'
import Timer from './ui/Timer'
import ScoreCounter from './ui/ScoreCounter'

import {windowWidth, windowHeight} from './config'

export default class GameManager extends PIXI.Container {
    constructor() {
        super()

        // Create the Room
        this.room = new Room(Math.ceil(windowWidth / 100), Math.ceil(windowHeight / 100), 0, 100)
        this.addChild(this.room)

        // Create the Hero
        this.heroManager = new HeroManager()
        this.heroManager.addHero(windowWidth / 2, 200)
        attachControls(this.heroManager.hero)

        this.score = 0
        const updateScore = (obj) => {
            if (obj.value) {
                this.score += obj.value
            }
        }

        // Create the Enemy Spawn
        this.enemySpawn = new EnemySpawn(windowWidth / 2, windowHeight - 230, updateScore)
        this.addChild(this.enemySpawn)

        this.ui = [
            new HealthBar(this, this.heroManager.hero),
            new Timer(this, -3),
            new ScoreCounter(this)
        ]

        this.state = {
            isOver: false
        }

        // this.managers = []
        // this.renderables = []
        // this.collisionables = []
    }

    get isOver() { return this.state.isOver }

    play() {
        allManagers.move()

        if (!this.enemySpawn.isDestroyed) {
            this.enemySpawn.work()
        }

        doAllCollisions()

        allManagers.applyMovement()

        if (this.heroManager.hero.isDestroyed) {
            this.state.isOver = true
        }
    }

    update() {
        RENDERABLES.forEach(renderable => {
            if (!renderable.isRendered && !this.children.includes(renderable)) {
                this.addChild(renderable)
                renderable.isRendered = true
            }

            if (renderable.isDestroyed && this.children.includes(renderable)) {
                this.removeChild(renderable)
            }
        })

        this.children = _.sortBy(this.children, ['zIndex', 'position.y'])
    }

    animate() {
        this.enemySpawn.animate()
    }

    render() {
        this.update()
        this.animate()
        allManagers.render()
        this.enemySpawn.render()
        this.ui.forEach(elt => elt.update())
    }

    cleanup() {
        allManagers.clean()
    }
}