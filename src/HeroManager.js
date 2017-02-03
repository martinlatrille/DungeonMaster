import GenericManager from './GenericManager'
import Hero from './Hero'

export default class HeroManager extends GenericManager {
    addHero(posX, posY) {
        super.addItem(new Hero(this._stage, posX, posY))
    }

    get hero() {
        if (this._children.length) {
            return this._children[0]
        }

        return null
    }
}