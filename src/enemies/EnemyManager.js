import GenericObjectManager from '../GenericObjectManager'
import Enemy from './Enemy'

export default class EnemyManager extends GenericObjectManager {
    constructor(game, onDeathCallback) {
        super(game)

        this._defaultItemWidth = 30
        this._defaultItemHeight = 30

        this.onDestroyCallback = onDeathCallback
    }

    addEnemy(
        posX, posY,
        width = this._defaultItemWidth,
        height = this._defaultItemHeight
    ) {
        super.addItem(new Enemy(
            width,
            height,
            posX,
            posY
        ))
    }
}