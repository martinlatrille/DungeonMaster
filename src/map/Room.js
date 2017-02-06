import * as PIXI from 'pixi.js'
import RenderableObject from './../RenderableObject'
import CollisionnableObject from './../CollisionableObject'
import {TILE_SIZE, PI} from './../config'

export default class Room extends PIXI.Container {
    constructor(width, height, posX, posY) {
        super()

        this.zIndex = 0

        this.position.set(posX, posY)

        const wallTopTexture = PIXI.loader.resources.wallTop.texture
        const wallTexture = PIXI.loader.resources.wall.texture
        const groundTexture = PIXI.loader.resources.ground.texture

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let newChild = null

                if (i === 0 && j > 0 && j < width - 1) {
                    newChild = new CollisionnableObject(wallTopTexture, TILE_SIZE, TILE_SIZE)
                } else if (i === 1 && j > 0 && j < width - 1) {
                    newChild = new CollisionnableObject(wallTexture, TILE_SIZE, TILE_SIZE)
                } else if (i > 0 && i < height - 1) {
                    if (j === 0) {
                        newChild = new CollisionnableObject(wallTopTexture, TILE_SIZE, TILE_SIZE)
                        newChild.rotation = - PI / 2
                    } else if (j === width - 1) {
                        newChild = new CollisionnableObject(wallTopTexture, TILE_SIZE, TILE_SIZE)
                        newChild.rotation = PI / 2
                    } else {
                        if (i === 1) {
                            newChild = new CollisionnableObject(wallTexture, TILE_SIZE, TILE_SIZE)
                        } else {
                            newChild = new RenderableObject(groundTexture)
                        }
                    }
                } else if (i === height - 1 && j > 0 && j < width - 1) {
                    newChild = new CollisionnableObject(wallTopTexture, TILE_SIZE, TILE_SIZE)
                    newChild.rotation = -PI
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