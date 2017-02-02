let MANAGERS = []

export function cleanManagers() {
    MANAGERS.forEach(manager => manager.clean())
}

export default class GenericManager {
    constructor() {
        this._children = []
        MANAGERS.push(this)
    }

    addItem(item) {
        this._children.push(item)
    }

    move() {
        this._children.forEach(child => child.move())
    }

    applyMovement() {
        this._children.forEach(child => child.applyMovement())
    }

    clean() {
        this._children = this._children.filter(child => !child.isDestroyed)
    }
}