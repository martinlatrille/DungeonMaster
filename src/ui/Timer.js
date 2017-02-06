import * as PIXI from 'pixi.js'
import {windowWidth, windowHeight} from './../config'

/**
 * Take a number of seconds and return mm:ss
 * @param time the number of seconds
 */
function parseTime(time) {
    const minutes = Math.abs(Math.floor(time / 60) + (time < 0 ? 1 : 0))
    const seconds = Math.abs(Math.floor(time % 60))

    return `${time < 0 ? '-' : ' '}${minutes}:${(seconds < 10 ? '0' : '') + seconds}`
}

export default class Timer extends PIXI.Text {
    constructor(stage, startTime) {
        const options = {
            fontFamily: "'Press Start 2P', Impact",
            fontSize: "16px",
            fill: "white"
        }

        super(parseTime(startTime), options)

        this.zIndex = 10
        stage.addChild(this)

        this.state = {
            startTime: startTime,
            currentTime: startTime
        }

        this.position.set(windowWidth - 110, 20)
    }

    update() {
        console.log()
        this.state.currentTime += 1/60
        this.text = parseTime(this.state.currentTime)
    }
}