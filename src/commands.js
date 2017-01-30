export function keyboard(keyCode, repeat = false) {
  let key = {}
  key.code = keyCode
  key.isDown = false
  key.isUp = true
  key.press = undefined
  key.release = undefined

  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if ((key.isUp || repeat) && key.press) {
          key.press()
      }

      key.isDown = true
      key.isUp = false
    }
    event.preventDefault()
  }

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if ((key.isDown || repeat) && key.release) {
          key.release()
      }

      key.isDown = false
      key.isUp = true
    }
    event.preventDefault()
  }

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  )

  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  )

  return key
}

function attachMouse(controllableObject) {
    document.onmousemove = function (e) {
        const mousePos = {
            x: e.pageX,
            y: e.pageY
        }

        controllableObject.rotateToMousePos(mousePos)
    }

    document.onclick = function (e) {
        const button = e.buttons || e.which || e.button

        if (button === 1) {
            controllableObject.shoot()
        }
    }
}

export function attachControls(controllableObject) {
    let goUpKey = keyboard(87)
    goUpKey.press = () => controllableObject.startGoUp()
    goUpKey.release = () => controllableObject.stopGoUp()

    let goDownKey = keyboard(83)
    goDownKey.press = () => controllableObject.startGoDown()
    goDownKey.release = () => controllableObject.stopGoDown()

    let goLeftKey = keyboard(65)
    goLeftKey.press = () => controllableObject.startGoLeft()
    goLeftKey.release = () => controllableObject.stopGoLeft()

    let goRightKey = keyboard(68)
    goRightKey.press = () => controllableObject.startGoRight()
    goRightKey.release = () => controllableObject.stopGoRight()

    attachMouse(controllableObject)
}

