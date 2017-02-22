import GenericObjectManager from '../../GenericObjectManager'

export default class WeaponManager extends GenericObjectManager {
    addItem(item) {
        super.addItem(item)
        this.equippedWeapon = item

        item.hero.addChild(item)
    }
}