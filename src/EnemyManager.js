import GenericManager from './GenericManager'
import Enemy from './Enemy'

export default class EnemyManager extends GenericManager{
    constructor(stage) {
        super(stage)

        this._spawns = []

        this._defaultItemColor = 'green'
        this._defaultItemWidth = 30
        this._defaultItemHeight = 30
    }

    addEnemy(
        posX, posY,
        color = this._defaultItemColor,
        width = this._defaultItemWidth,
        height = this._defaultItemHeight
    ) {
        super.addItem(new Enemy(
            color,
            width,
            height,
            posX,
            posY
        ))
    }
}