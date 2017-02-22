import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './src/config.js'

import GameManager from './src/GameManager'
import {keyboard} from "./src/hero/commands";

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
    let scene
    let game

    function play() {
        game.play()
        game.render()
        game.cleanup()

        if (game.isOver) {
            scene.children = scene.children.filter(child => !child.isOver)
            const endScreen = new PIXI.Text("You're dead.", {
                fontFamily: "'Press Start 2P', Impact",
                fontSize: "22px",
                fill: "white"
            })
            endScreen.anchor.set(0.5, 0.5)
            endScreen.position.set(windowWidth / 2, windowHeight / 2 - 20)
            scene.addChild(endScreen)

            const replayText = new PIXI.Text("Press 'Enter' to replay.", {
                fontFamily: "'Press Start 2P', Impact",
                fontSize: "16px",
                fill: "white"
            })
            replayText.anchor.set(0.5, 0.5)
            replayText.position.set(windowWidth / 2, windowHeight / 2 + 20)
            scene.addChild(replayText)

            const score = new PIXI.Text(`Score: ${game.score}`, {
                fontFamily: "'Press Start 2P', Impact",
                fontSize: "14px",
                fill: "white"
            })
            score.anchor.set(0.5, 0.5)
            score.position.set(windowWidth / 2, windowHeight / 2 + 60)
            scene.addChild(score)

            state = end
        }
    }

    function end() {}

    let state = play

    function initGame() {
        game = new GameManager()
        scene = new PIXI.Container()
        scene.addChild(game)
        state = play
    }

    initGame()

    let restartKey = keyboard(13)
    restartKey.press = initGame

    /**
     * Updates 60times/second
     */
    function gameLoop() {
        requestAnimationFrame(gameLoop)

        state()

        renderer.render(scene)
    }

    gameLoop()
}
