import GenericManager from './../../GenericManager'

export default class WeaponManager extends GenericManager {
    addItem(item) {
        super.addItem(item)
        this.equippedWeapon = item

        item.hero.addChild(item)
    }
}