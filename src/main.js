import { initGl } from 'engine/engine'
import Mesh from 'engine/mesh'
import Shader from 'engine/shader'
import Texture from 'engine/texture'
import Camera from 'camera'
import Input from 'input'
import Game from 'game'
import Sprite, { SpriteFont } from 'engine/sprite'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
let gl = null
let canvas = null
let game = null

const resize = function()
{
	canvas.width = window.innerWidth * window.devicePixelRatio
	canvas.height = window.innerHeight * window.devicePixelRatio
	canvas.style.width = "" + window.innerWidth + "px"
	canvas.style.height = "" + window.innerHeight + "px"
	gl.viewport(0, 0, canvas.width, canvas.height)
	game.resize()
}
const main = function()
{
	canvas = document.getElementById("main-canvas")

	canvas.width = window.innerWidth * window.devicePixelRatio
	canvas.height = window.innerHeight * window.devicePixelRatio
	canvas.style.width = "" + window.innerWidth + "px"
	canvas.style.height = "" + window.innerHeight + "px"

	gl = initGl(canvas)
	Input.init()
	if (gl)
	{
		gl.clearColor(0.4, 0.4, 0.8, 1)
		gl.depthFunc(gl.LEQUAL)
	}
	game = new Game()
	game.init(gl)

	resize();
	window.addEventListener("resize", resize)

	let af = window.requestAnimationFrame(loop)
}
const loop = function(t)
{
	try {
		game.update()
		game.render()
		Input.update()
	}
	catch (e) {
		console.log("caught: ", e, "in loop")
	}
	
	let af = window.requestAnimationFrame(loop)
}

document.addEventListener("DOMContentLoaded", main)
