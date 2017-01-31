export default class GenericManager {
    constructor(stage) {
        this._stage = stage
        this._children = []
    }

    addItem(item) {
        this._children.push(item)
    }

    move() {
        this._children.forEach(child => child.move())
    }

    collision() {
        this._children.forEach(child => child.collision(this._stage))
    }

    render() {
        this._children.forEach(child => {
            if (!child.isRendered && !this._stage.children.includes(child)) {
                this._stage.addChild(child)
                child.isRendered = true
            }

            if (child.isDestroyed && this._stage.children.includes(child)) {
                this._stage.removeChild(child)
            }

            if (child.render) {
                child.render()
            }
        })

        this._children = this._children.filter(child => !child.isDestroyed)
    }
}