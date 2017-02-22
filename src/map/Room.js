import * as PIXI from 'pixi.js'
import RenderableObject from './../RenderableObject'
import {TILE_SIZE} from './../config'

import Wall from './Wall'
import CollisionableObject from "../CollisionableObject";

export default class Room extends PIXI.Container {
    constructor(game, width, height, posX, posY) {
        super()

        this.position.set(posX, posY)

        const groundTexture = PIXI.loader.resources.ground.texture

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let newChild = null

                if (i === 0) {
                    if (j === 0) {
                        newChild = new Wall('corner-bottom-right')
                    } else if (j === width - 1) {
                        newChild = new Wall('corner-bottom-left')
                    } else if (j > 0 && j < width - 1) {
                        newChild = new Wall('top')
                    }
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
                            newChild.zIndex = -1
                        }
                    }
                } else if (i === height - 1) {
                    if (j === 0) {
                        newChild = new Wall('corner-top-right')
                    } else if (j === width - 1) {
                        newChild = new Wall('corner-top-left')
                    } else if (j > 0 && j < width - 1) {
                        newChild = new Wall('revert-top')
                    }
                }

                if (newChild) {
                    newChild.position.set(j * TILE_SIZE, i * TILE_SIZE)
                    this.addChild(newChild)

                    if (newChild instanceof CollisionableObject) {
                        game.addCollisionable(newChild)
                    }
                }
            }
        }
    }
}