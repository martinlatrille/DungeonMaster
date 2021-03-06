import GenericManager from '../GenericObjectManager'
import Bullet from './Bullet'

export default class BulletManager extends GenericManager {
    addBullet(posX, posY, rotation) {
        super.addItem(new Bullet(posX, posY, rotation))
    }
}