import * as PIXI from 'pixi.js'
import CollisionableObject from './../CollisionableObject'
import {TILE_SIZE, PI} from './../config'

const WALL_TYPES = ['front', 'left', 'right', 'top', 'revert-top']

export default class Wall extends CollisionableObject {
    constructor(type) {
        let texture = null
        let rotation = 0
        let height = TILE_SIZE
        let zIndex = 0

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
            default:
                return null
        }

        super(
            texture,
            TILE_SIZE, height
        )

        this.rotation = rotation
        this.zIndex = zIndex
    }

    takeDamage() {}
}