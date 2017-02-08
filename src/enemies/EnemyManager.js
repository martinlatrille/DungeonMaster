import GenericManager from '../GenericManager'
import Enemy from './Enemy'

export default class EnemyManager extends GenericManager {
    constructor() {
        super()

        this._defaultItemColor = 'green'
        this._defaultItemWidth = 30
        this._defaultItemHeight = 30
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