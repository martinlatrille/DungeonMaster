import RenderableObject from "./RenderableObject"
import CollisionableObject from "./CollisionableObject"


export default class GenericObjectManager {
    constructor(game) {
        this._game = game

        this._game.addManager(this)
        this._children = []
    }

    addItem(item) {
        if (item instanceof RenderableObject) {
            this._game.addRenderable(item)
        }

        if (item instanceof CollisionableObject) {
            this._game.addCollisionable(item)
        }

        this._children.push(item)
    }

    move() {
        this._children.forEach(child => {
            if (child.move) {
                child.move(this._game.collisionables)
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
        const destroyedChildren = this._children.filter(child => child.isDestroyed)

        destroyedChildren.forEach(child => {
            if (this.onDestroyCallback) {
                this.onDestroyCallback(child)
            }
        })
        this._children = this._children.filter(child => !child.isDestroyed)
    }
}