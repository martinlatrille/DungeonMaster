import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'
import {attachControls} from './src/hero/commands'

import {updateStage} from './src/RenderableObject'
import {doAllCollisions} from './src/CollisionableObject'
import {allManagers} from './src/GenericManager'

import HeroManager from './src/hero/HeroManager'
import EnemySpawn from './src/enemies/EnemySpawn'

import HealthBar from './src/ui/HealthBar'
import Timer from './src/ui/Timer'

import Room from './src/map/Room'

// Create the renderer and add it to the body
const renderer = new PIXI.autoDetectRenderer(window.width, window.height)
document.body.appendChild(renderer.view)

// Resize the view to fill the entire window
renderer.view.style.position = 'absolute'
renderer.view.style.display = 'block'
renderer.autoResize = true
renderer.resize(windowWidth, windowHeight)

// Create the stage
const stage = new PIXI.Container()

// Load the Hero spritesheet
PIXI.loader
    .add('basicGun', 'assets/img/gun-1.png')
    .add('heroSpritesheet', 'assets/img/hero-spritesheet.png')
    .add('zombieSpritesheet', 'assets/img/zombie-spritesheet.png')
    .add('ground', 'assets/img/ground.png')
    .add('wall', 'assets/img/wall.png')
    .add('wallTop', 'assets/img/wall-top.png')
    .add('wallCorner', 'assets/img/wall-corner.png')
    .add('enemySpawn', 'assets/img/portal.png')
    .add('enemySpawnFrame', 'assets/img/portal-frame.png')
    .add('enemySpawnShadow', 'assets/img/portal-shadow.png')
    .load(setup)

function setup() {
    // Create the Room
    const room = new Room(Math.ceil(windowWidth / 100), Math.ceil(windowHeight / 100), 0, 100)
    stage.addChild(room)

    // Create the Heroa
    const heroManager = new HeroManager()
    heroManager.addHero(windowWidth / 2, 200)
    attachControls(heroManager.hero)

    renderer.render(stage)

    // Create the EnemyManager
    const enemySpawn = new EnemySpawn(windowWidth / 2, windowHeight - 230)
    stage.addChild(enemySpawn)

    // Create the HealthBar
    const uiElements = [
        new HealthBar(stage, heroManager.hero),
        new Timer(stage, -3)
    ]

    function play() {
        allManagers.move()

        if (!enemySpawn.isDestroyed) {
            enemySpawn.work()
        }

        doAllCollisions()

        allManagers.applyMovement()
    }

    function render() {
        updateStage(stage)
        allManagers.render()
        enemySpawn.render()
        uiElements.forEach(elt => elt.update())
    }

    function cleanup() {
        allManagers.clean()
    }

    /**
     * Updates 60times/second
     */
    function gameLoop() {
        requestAnimationFrame(gameLoop)

        play()
        render()
        cleanup()

        enemySpawn.animate()

        renderer.render(stage)
    }

    gameLoop()
}
