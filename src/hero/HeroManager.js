import GenericObjectManager from '../GenericObjectManager'
import Hero from './Hero'

export default class HeroManager extends GenericObjectManager {
    addHero(posX, posY) {
        super.addItem(new Hero(this._game, posX, posY))
    }

    get hero() {
        if (this._children.length) {
            return this._children[0]
        }

        return null
    }
}