import * as PIXI from 'pixi.js'
import CollisionableObject from './../CollisionableObject'
import {TILE_SIZE, PI} from './../config'

const WALL_TYPES = [
    'front',
    'left', 'right', 'top', 'revert-top',
    'corner-bottom-right', 'corner-bottom-left', 'corner-top-right', 'corner-top-left'
]

export default class Wall extends CollisionableObject {
    constructor(type) {
        let texture = null
        let rotation = 0
        let height = TILE_SIZE
        let zIndex = 0
        let scale = {
            x: 1,
            y: 1
        }

        switch (type) {
            case 'front':
                texture = PIXI.loader.resources.wall.texture
                height = TILE_SIZE / 3
                break
            case 'left':
                texture = PIXI.loader.resources.wallTop.texture
                rotation = PI / 2
                zIndex = 4
                break
            case 'right':
                texture = PIXI.loader.resources.wallTop.texture
                rotation = - PI / 2
                zIndex = 4
                break
            case 'top':
                texture = PIXI.loader.resources.wallTop.texture
                zIndex = 4
                break
            case 'revert-top':
                texture = PIXI.loader.resources.wallTop.texture
                rotation = - PI
                zIndex = 4
                break
            case 'corner-bottom-left':
                texture = PIXI.loader.resources.wallCorner.texture
                break
            case 'corner-bottom-right':
                texture = PIXI.loader.resources.wallCorner.texture
                scale.x = -1
                break
            case 'corner-top-left':
                texture = PIXI.loader.resources.wallCorner.texture
                scale.y = -1
                break
            case 'corner-top-right':
                texture = PIXI.loader.resources.wallCorner.texture
                scale.x = -1
                scale.y = -1
                break
            default:
                return null
        }

        super(
            texture,
            TILE_SIZE, height
        )

        this.rotation = rotation
        this.zIndex = zIndex
        this.scale = scale
    }

    takeDamage() {}
}