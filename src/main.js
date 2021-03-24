import { initGl } from 'engine/engine'
import Input from 'input'
import Game from 'game'

let gl = null
let canvas = null
let game = null
let dialogs = {}

const initDialogs = function() {
    let dialogNames = ["dialog-main", "dialog-respawn"]
    dialogNames.forEach(n => {
        dialogs[n] = document.getElementById(n)
    })
}
const showDialog = function(d) {
    let name = "dialog-" + d
    let dlg = dialogs[name]
    if (!dlg) {
        return;
    }

    if (dlg.classList.contains("dialog-hide")) {
        // show the dialog
        dlg.classList.remove("dialog-hide", "dialog-hide-tr")
    } else {
        // hide the dialog
        dlg.classList.add("dialog-hide-tr")
        setTimeout(() => dlg.classList.add("dialog-hide"), 250)
    }
}

const resize = function() {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = "" + window.innerWidth + "px"
    canvas.style.height = "" + window.innerHeight + "px"
    gl.viewport(0, 0, canvas.width, canvas.height)
    game.resize()
}
const main = function() {
    initDialogs();

    canvas = document.getElementById("main-canvas")
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = "" + window.innerWidth + "px"
    canvas.style.height = "" + window.innerHeight + "px"

    gl = initGl(canvas)
    Input.init()
    if (gl) {
        gl.clearColor(0.4, 0.4, 0.8, 1)
        gl.depthFunc(gl.LEQUAL)
    }
    game = new Game()
    game.init(gl)

    resize();
    window.addEventListener("resize", resize)

    let af = window.requestAnimationFrame(loop)
}
const loop = function(t) {
    try {
        game.update()
        game.render()
        Input.update()
    }
    catch (e) {
        console.log("caught: ", e, "in main loop")
    }
    
    let af = window.requestAnimationFrame(loop)
}

const keydown = function(evt) {
    switch (evt.keyCode) {
        case 27: {
            showDialog("respawn")
        }
    }
}

document.addEventListener("DOMContentLoaded", main)

const respawn = document.getElementById("")
document.addEventListener("keydown", keydown)