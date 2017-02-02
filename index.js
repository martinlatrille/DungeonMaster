import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'
import {attachControls} from './src/commands'

import {updateStage} from './src/RenderableObject'
import {doAllCollisions} from './src/CollisionableObject'
import {cleanManagers} from './src/GenericManager'

import HeroManager from './src/HeroManager'
import EnemySpawn from './src/EnemySpawn'

import HealthBar from './src/ui/HealthBar'
import Timer from './src/ui/Timer'

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

// Create the Hero
const heroManager = new HeroManager(stage)
heroManager.addHero(windowWidth / 2, 100)
attachControls(heroManager.hero)

renderer.render(stage)

// Create the EnemyManager
const enemySpawn = new EnemySpawn(windowWidth / 2, windowHeight - 100)

// Create the HealthBar
const uiElements = [
    new HealthBar(stage, heroManager.hero),
    new Timer(stage, -3)
]

function play() {
    heroManager.move()
    enemySpawn.state.manager.move()

    if (!enemySpawn.isDestroyed) {
        enemySpawn.work()
    }

    doAllCollisions()

    heroManager.applyMovement()
    enemySpawn.state.manager.applyMovement()
}

function render() {
    updateStage(stage)
    uiElements.forEach(elt => elt.update())
}

function cleanup() {
    cleanManagers()
}

/**
 * Updates 60times/second
 */
function gameLoop() {
    requestAnimationFrame(gameLoop)

    play()
    render()
    cleanup()

    renderer.render(stage)
}

gameLoop()


// function setupSpritesheet(loader, resources) {
//     let texture = loader.resources.spritesheet.texture
//
//     texture.frame = new Rectangle(0, 0, 180, 247)
//
//     character = new Sprite(texture)
//
//     character.position.set(300, 300)
//     character.scale.set(0.5, 0.5)
//
//     stage.addChild(character)
//     renderer.render(stage)
// }

// loader
//     .add('spritesheet', 'img/spritesheet.png')
//     .load(setupSpritesheet)

// loader.add('character', 'img/character.png').load(function (loader, resources) {
//     character = new PIXI.Sprite(resources.character.texture)
//
//     character.position.set(300, 300)
//     character.scale.set(0.3, 0.3)
//     character.anchor.set(0.5, 0.5)
//
//     stage.addChild(character)
//
//     animate()
// })
