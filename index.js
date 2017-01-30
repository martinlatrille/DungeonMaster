import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'
import {attachControls} from './src/commands'

import ColoredRectangle from './src/ColoredRectangle'

// Create the renderer and add it to the body
const renderer = new PIXI.autoDetectRenderer(window.width, window.height)
document.body.appendChild(renderer.view)


// Basic aliases
const loader = PIXI.loader

const Sprite = PIXI.Sprite
const TextureCache = PIXI.utils.TextureCache
const Rectangle = PIXI.Rectangle


// Resize the view to fill the entire window
renderer.view.style.position = 'absolute'
renderer.view.style.display = 'block'
renderer.autoResize = true
renderer.resize(windowWidth, windowHeight)

// Create a red rectangle Sprite

const redRectangle = new ColoredRectangle('red', 20, 20, 20, 20)
const greenRectangle = new ColoredRectangle('green', 40, 40, 120, 120, true)
const blueRectangle = new ColoredRectangle('blue', 60, 60, 220, 220, true)

const allObjects = [redRectangle, greenRectangle, blueRectangle]

attachControls(redRectangle)

// Create the stage and add the character
const stage = new PIXI.Container()

allObjects.forEach(obj => {
    stage.addChild(obj)
})

renderer.render(stage)

/**
 * Updates 60times/second
 */
function gameLoop() {
    requestAnimationFrame(gameLoop)

    hotRender()
    play()

    renderer.render(stage)
}

function hotRender() {
    allObjects.forEach(obj => {
        if (obj.render) {
            obj.render(stage)
        }
    })
}

function play() {
    allObjects.forEach(obj => {
        if (obj.move) {
            obj.move()
        }

        if (obj.collision) {
            obj.collision(stage)
        }
    })
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
