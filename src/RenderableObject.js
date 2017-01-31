import * as PIXI from 'pixi.js'

export default class RenderableObject extends PIXI.Sprite {
    constructor(texture) {
        super(texture)

        this._renderState = {
            isRendered: false,
            isDestroyed: false
        }

        this.anchor.set(0.5, 0.5)
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
}