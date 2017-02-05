import * as PIXI from 'pixi.js'
import Weapon from './Weapon'

export default class BasicGun extends Weapon {
    constructor(hero) {
        const texture = PIXI.loader.resources.basicGun.texture
        super(texture, hero)
    }
}