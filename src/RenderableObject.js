import * as PIXI from 'pixi.js'

let RENDERABLES = []

export function updateStage(stage) {
    RENDERABLES.forEach(renderable => {
        let needSort = false

        if (!renderable.isRendered && !stage.children.includes(renderable)) {
            stage.addChild(renderable)
            renderable.isRendered = true
            needSort = true
        }

        if (renderable.isDestroyed && stage.children.includes(renderable)) {
            stage.removeChild(renderable)
            needSort = true
        }

        if (needSort) {
            stage.children = stage.children.sort(child => child.position.y).sort(child => child.zIndex)
        }
    })
}

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