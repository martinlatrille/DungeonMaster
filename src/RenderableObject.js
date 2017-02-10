import * as PIXI from 'pixi.js'

export let RENDERABLES = []

export default class RenderableObject extends PIXI.Container {
    constructor(texture, zIndex = 1, addToStage = true) {
        super()

        this.mainSprite = new PIXI.Sprite(texture)

        this.zIndex = zIndex

        this.addChild(this.mainSprite)

        this._renderState = {
            isRendered: false,
            isDestroyed: false
        }

        this.mainSprite.anchor.set(0.5, 0.5)

        if (addToStage) {
            RENDERABLES.push(this)
        }
    }

    get isRendered() {
        return this._renderState.isRendered
    }

    set isRendered(value) {
        this._renderState.isRendered = value
    }

    get isDestroyed() {
        return this._renderState.isDestroyed
    }

    set isDestroyed(value) {
        this._renderState.isDestroyed = value
    }

    render() {
        this.children.forEach(child => {
            if (child.animate) {
                child.animate()
            }
        })

        this.children = this.children.filter(child => !child.isDestroyed)
    }
}