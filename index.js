'use strict'
import * as PIXI from 'pixi.js'

PIXI.utils.sayHello("webGL")

const renderer = new PIXI.autoDetectRenderer(window.width, window.height)

document.body.appendChild(renderer.view)

const stage = new PIXI.Container()

const character = null

// PIXI.loader.add('character',)
