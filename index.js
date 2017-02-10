import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'

import GameManager from './src/GameManager'

// Create the renderer and add it to the body
const renderer = new PIXI.autoDetectRenderer(window.width, window.height)
document.body.appendChild(renderer.view)

// Resize the view to fill the entire window
renderer.view.style.position = 'absolute'
renderer.view.style.display = 'block'
renderer.autoResize = true
renderer.resize(windowWidth, windowHeight)

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
    const game = new GameManager()

    /**
     * Updates 60times/second
     */
    function gameLoop() {
        requestAnimationFrame(gameLoop)

        game.play()
        game.render()
        game.cleanup()

        renderer.render(game)
    }

    gameLoop()
}
