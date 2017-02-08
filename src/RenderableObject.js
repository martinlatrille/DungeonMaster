import * as PIXI from 'pixi.js'
import _ from 'lodash'

let RENDERABLES = []

export function updateStage(stage) {
    RENDERABLES.forEach(renderable => {
        if (!renderable.isRendered && !stage.children.includes(renderable)) {
            stage.addChild(renderable)
            renderable.isRendered = true
        }

        if (renderable.isDestroyed && stage.children.includes(renderable)) {
            stage.removeChild(renderable)
        }
    })

    stage.children = _.sortBy(stage.children, ['zIndex', 'position.y'])
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