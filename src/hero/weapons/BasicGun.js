import * as PIXI from 'pixi.js'
import Weapon from './Weapon'

export default class BasicGun extends Weapon {
    constructor(game, hero) {
        const texture = PIXI.loader.resources.basicGun.texture
        super(game, texture, hero)
    }
}