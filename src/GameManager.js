import * as PIXI from 'pixi.js'
import _ from 'lodash'

import Room from './map/Room'

import {doAllCollisions} from './utils/collisions'

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

        this.state = {
            isOver: false,
            objectManagers: [],
            collisionables: []
        }

        // Create the Room
        this.room = new Room(this, Math.ceil(windowWidth / 100), Math.ceil(windowHeight / 100), 0, 100)

        // Create the Hero
        this.heroManager = new HeroManager(this)
        this.heroManager.addHero(windowWidth / 2, 200)
        attachControls(this.heroManager.hero)

        this.score = 0
        const updateScore = (obj) => {
            if (obj.value) {
                this.score += obj.value
            }
        }

        // Create the Enemy Spawn
        this.enemySpawn = new EnemySpawn(this, windowWidth / 2, windowHeight - 230, updateScore)
        this.addCollisionable(this.enemySpawn)

        this.ui = [
            new HealthBar(this, this.heroManager.hero),
            new Timer(this, -3),
            new ScoreCounter(this)
        ]
    }

    get isOver() { return this.state.isOver }

    get renderables() { return this.children }

    addRenderable(item) { this.addChild(item) }

    get collisionables() { return this.state.collisionables}

    addCollisionable(item) { this.state.collisionables.push(item) }

    get managers() {
        return {
            items: this.state.objectManagers,
            clean: () => this.state.objectManagers.forEach(manager => manager.clean()),
            move: () => this.state.objectManagers.forEach(manager => manager.move()),
            applyMovement: () => this.state.objectManagers.forEach(manager => manager.applyMovement()),
            render: () => this.state.objectManagers.forEach(manager => manager.render()),
        }
    }


    addManager(item) { this.state.objectManagers.push(item) }

    play() {
        this.managers.move()

        if (!this.enemySpawn.isDestroyed) {
            this.enemySpawn.work()
        }

        this.state.collisionables = doAllCollisions(this.state.collisionables)

        this.managers.applyMovement()

        if (this.heroManager.hero.isDestroyed) {
            this.state.isOver = true
        }
    }

    update() {
        this.renderables.forEach(renderable => {
            if (!renderable.isRendered) {
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
        this.managers.render()
        this.enemySpawn.render()
        this.ui.forEach(elt => elt.update())
    }

    cleanup() {
        this.managers.clean()
    }
}