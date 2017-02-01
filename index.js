import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'
import {attachControls} from './src/commands'

import {doAllCollisions} from './src/CollisionableObject'

import HeroManager from './src/HeroManager'
import EnemyManager from './src/EnemyManager'

import HealthBar from './src/ui/HealthBar'

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
heroManager.addHero(100, 100)
attachControls(heroManager.hero)

renderer.render(stage)

// Create the EnemyManager
const enemyManager = new EnemyManager(stage)
enemyManager.addEnemy(400, 400)
enemyManager.addEnemy(600, 500)
enemyManager.addEnemy(400, 600)
enemyManager.addEnemy(600, 700)

// Create the HealthBar
const uiElements = [
    new HealthBar(stage, heroManager.hero)
]

function hotRender() {
    heroManager.render()
    enemyManager.render()

    uiElements.forEach(elt => elt.render())
}

function play() {
    heroManager.move()
    enemyManager.move()

    doAllCollisions()

    heroManager.applyMovement()
    enemyManager.applyMovement()
}

/**
 * Updates 60times/second
 */
function gameLoop() {
    requestAnimationFrame(gameLoop)

    hotRender()
    play()

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
