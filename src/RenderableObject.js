import * as PIXI from 'pixi.js'

export default class RenderableObject extends PIXI.Container {
    constructor(texture) {
        super()

        this.mainSprite = new PIXI.Sprite(texture)

        this.addChild(this.mainSprite)

        this._renderState = {
            isRendered: false,
            isDestroyed: false
        }

        this.mainSprite.anchor.set(0.5, 0.5)
    }

    // get position() {
    //     const self = this
    //
    //     return {
    //         get x() { return self.mainSprite.position.x },
    //         set x(v) { self.mainSprite.position.x = v },
    //
    //         get y() { return self.mainSprite.position.y },
    //         set y(v) { self.mainSprite.position.y = v },
    //
    //         set: (x, y) => { self.mainSprite.position.set(x, y) }
    //     }
    // }
    //
    // set position(pos) { this.mainSprite.position = pos }
    //
    // get anchor() {
    //     const self = this
    //
    //     return {
    //         get x() { return self.mainSprite.anchor.x },
    //         set x(v) { self.mainSprite.anchor.x = v },
    //
    //         get y() { return self.mainSprite.anchor.y },
    //         set y(v) { self.mainSprite.anchor.y = v },
    //
    //         set: (x, y) => { self.mainSprite.anchor.set(x, y) }
    //     }
    // }
    //
    // set anchor(pos) { this.mainSprite.anchor = pos }

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