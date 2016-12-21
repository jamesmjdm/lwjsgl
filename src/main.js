import { initGl } from 'engine/engine'
import Mesh from 'engine/mesh'
import Shader from 'engine/shader'
import Camera from 'camera'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
var gl = null
var canvas = null

var shader = null
var camera = null
var mesh = null

const resize = () => 
{
	canvas.style.position = "relative"
	canvas.style.left = "5px"
	canvas.style.top = "5px"

	canvas.width = window.innerWidth - 10
	canvas.height = window.innerHeight - 10
	canvas.style.width = canvas.width
	canvas.style.height = canvas.height

	gl.viewport(0, 0, canvas.width, canvas.height)
}
const main = () => 
{
	canvas = document.getElementById("main-canvas")
	gl = initGl(canvas)
	if (gl)
	{
		gl.clearColor(0.4, 0.4, 0.8, 1)
		gl.enable(gl.DEPTH_TEST)
		gl.disable(gl.CULL_FACE)
		gl.depthFunc(gl.LEQUAL)
	}

	mesh = new Mesh(gl)
	mesh.begin()
	mesh.addCube([-1,-1,-1], [1,1,1], [0,0],[1,1])
	mesh.end()
	mesh.computeNormals()

	camera = new Camera()
	camera.position = [ 5, 4, 3 ]
	camera.target = [ 0, 0, 0 ]
	camera.update()

	shader = new Shader(gl, "resources/shaders/vert.glsl", "resources/shaders/frag.glsl")

	window.addEventListener("resize", resize)
	resize();
	window.requestAnimationFrame(loop)

	var request = window.requestAnimationFrame(loop)
}
const loop = () => 
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	let world = mat4.create()
	shader.bind()
	shader.setVec3("LightDir", [-1,-3,2])
	shader.setVec4("Ambient", [0.1,0.1,0.1,0])
	shader.setVec4("Color", [1,1,1,1])

	shader.setMat4("World", world)
	shader.setMat4("View", camera.view)
	shader.setMat4("Proj", camera.proj)

	mesh.draw(shader)

	window.requestAnimationFrame(loop)
}

document.addEventListener("DOMContentLoaded", main)