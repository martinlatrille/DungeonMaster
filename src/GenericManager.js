export const allManagers = {
    items: [],
    clean: () => allManagers.items.forEach(manager => manager.clean()),
    move: () => allManagers.items.forEach(manager => manager.move()),
    applyMovement: () => allManagers.items.forEach(manager => manager.applyMovement()),
    render: () => allManagers.items.forEach(manager => manager.render()),
}

export default class GenericManager {
    constructor() {
        this._children = []
        allManagers.items.push(this)
    }

    addItem(item) {
        this._children.push(item)
    }

    move() {
        this._children.forEach(child => {
            if (child.move) {
                child.move()
            }

            if (child.applyForces) {
                child.applyForces()
            }
        })
    }

    applyMovement() {
        this._children.forEach(child => {
            if (child.applyMovement) {
                child.applyMovement()
            }
        })
    }

    render() {
        this._children.forEach(child => {
            if (child.render) {
                child.render()
            }
        })
    }

    clean() {
        this._children = this._children.filter(child => !child.isDestroyed)
    }
}