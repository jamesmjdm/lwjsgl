// input.js

export const ord = x => x.charCodeAt(0)

export default class Input {
    static init() {
        Input.pressedKeys = []
        Input.releasedKeys = []
        Input.downKeys = []
        document.addEventListener("keydown", Input.onKeyDown)
        document.addEventListener("keyup", Input.onKeyUp)
    }

    static onKeyDown(e) {
        Input.pressedKeys[e.keyCode] = true
        Input.releasedKeys[e.keyCode] = false
        Input.downKeys[e.keyCode] = true
    }
    static onKeyUp(e) {
        Input.pressedKeys[e.keyCode] = false
        Input.releasedKeys[e.keyCode] = true
        Input.downKeys[e.keyCode] = false
    }

    static update() {
        Input.pressedKeys = []
        Input.releasedKeys = []
    }

    static keyDown(k) {
        return Input.downKeys[k]
    }
    static keyPressed(k) {
        return Input.pressedKeys[k]
    }
    static keyReleased(k) {
        return Input.releasedKeys[k]
    }
}

