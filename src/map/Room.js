import * as PIXI from 'pixi.js'
import RenderableObject from './../RenderableObject'
import {TILE_SIZE} from './../config'

import Wall from './Wall'

export default class Room extends PIXI.Container {
    constructor(width, height, posX, posY) {
        super()

        this.zIndex = 0

        this.position.set(posX, posY)

        const groundTexture = PIXI.loader.resources.ground.texture

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let newChild = null

                if (i === 0 && j > 0 && j < width - 1) {
                    newChild = new Wall('top')
                } else if (i === 1 && j > 0 && j < width - 1) {
                    newChild = new Wall('front')
                } else if (i > 0 && i < height - 1) {
                    if (j === 0) {
                        newChild = new Wall('right')
                    } else if (j === width - 1) {
                        newChild = new Wall('left')
                    } else {
                        if (i === 1) {
                            newChild = new Wall('front')
                        } else {
                            newChild = new RenderableObject(groundTexture)
                        }
                    }
                } else if (i === height - 1 && j > 0 && j < width - 1) {
                    newChild = new Wall('revert-top')
                }

                if (newChild) {
                    newChild.zIndex = 0
                    newChild.position.set(j * TILE_SIZE, i * TILE_SIZE)
                    this.addChild(newChild)
                }
            }
        }

        console.log(this.children.length)
    }
}