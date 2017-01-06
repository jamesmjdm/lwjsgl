// game.js

import { mat4, vec3, vec4 } from 'gl-matrix'
import Input, { ord } from 'input'
import Camera from 'camera'
import Shader from 'engine/shader'
import Mesh from 'engine/mesh'
import Sprite, { SpriteFont } from 'engine/sprite'

export class Gui
{
	static None = 0;
	static Map = 1;
	static Inventory = 2;
	static Mission = 3;

	constructor(gl)
	{
		this.state = Gui.None
		
		this.gl = gl
		this.sprite = new Sprite(gl)
		this.font = new SpriteFont(gl, "'Poiret One'", 32)
		this.shader = new Shader(gl, "shaders/spritevs.glsl", "shaders/spriteps.glsl")

		this.view = mat4.create()
		this.proj = mat4.create()
	}

	update()
	{
		if (Input.keyPressed(ord('M')))
		{
			this.state = Gui.Map
		}
		if (Input.keyPressed(ord('I')))
		{
			this.state = Gui.Inventory
		}
		if (Input.keyPressed(ord('N')))
		{
			this.state = Gui.Mission
		}
		if (Input.keyPressed(27))
		{
			this.state = Gui.None
		}
	}

	renderMap()
	{
		console.log("renderMap")
		this.sprite.beginText(this.shader, this.font, this.view, this.proj)
		this.sprite.addText("Map", 0, 0)
		this.sprite.end()
	}
	renderMission()
	{
		console.log("renderMission")
		this.sprite.beginText(this.shader, this.font, this.view, this.proj)
		this.sprite.addText("Mission", 0, 0)
		this.sprite.end()
	}
	renderInventory()
	{
		console.log("renderInv")
		this.sprite.beginText(this.shader, this.font, this.view, this.proj)
		this.sprite.addText("Inventory", 0, 0)
		this.sprite.end()
	}
	render()
	{
		mat4.ortho(this.proj, 0, window.innerWidth, window.innerHeight, 0, -1, 1)

		switch (this.state)
		{
			case Gui.None:
				break
			case Gui.Map: 
				this.renderMap()
				break
			case Gui.Inventory: 
				this.renderInventory()
				break
			case Gui.Mission: 
				this.renderMission()
				break
		}
	}
}

export class Asteroid
{
	constructor()
	{
		this.transform = mat4.create()
		this.destroy = false
	}
}
export class Bullet
{
	static SPEED = 2;
	static MAX_AGE = 100;

	constructor(pos, angle)
	{
		this.transform = mat4.create()
		this.angle = angle
		this.position = pos.slice()
		this.velocity = [ Bullet.SPEED * Math.sin(angle), 0, Bullet.SPEED * Math.cos(angle) ]
		this.age = 1
		this.destroy = false
	}
	update(game)
	{
		this.position[0] += this.velocity[0]
		this.position[2] += this.velocity[2]

		let collision = false
		for (let i = 0; i < game.asteroids.length; i++)
		{
			let a = game.asteroids[i]
			let dx = a.transform[12] - this.position[0]
			let dy = a.transform[14] - this.position[2]
			if (dx*dx + dy*dy < 9)
			{
				collision = true
				a.destroy = true
				this.destroy = true
				break
			}
		}
		
		this.age += 1
		if (this.age > Bullet.MAX_AGE)
		{
			this.destroy = true
		}
		
		mat4.fromTranslation(this.transform, this.position)
		mat4.rotateY(this.transform, this.transform, this.angle)
	}
}
export class Spaceship
{
	static FRICTION = 0.985;
	static ACCELERATION = 0.02;

	constructor()
	{
		this.position = [0,0,0]
		this.angle = 0
		this.roll = 0
		this.velocity = [0,0,0]
		this.transform = mat4.create()
	}

	update()
	{
		mat4.fromTranslation(this.transform, this.position)
		mat4.rotateY(this.transform, this.transform, this.angle)
		mat4.rotateZ(this.transform, this.transform, this.roll)
	}
}
export class Player extends Spaceship
{
	constructor(game)
	{
		super()
		this.game = game
		this.canshoot = 0
	}
	update()
	{
		this.roll *= 0.9
		let speed = 0

		if (Input.keyDown(37))
		{
			this.angle += 0.04
			this.roll -= 0.06
		}
		if (Input.keyDown(39))
		{
			this.angle -= 0.04
			this.roll += 0.06
		}
		if (Input.keyDown(38))
		{
			speed += Spaceship.ACCELERATION
		}
		if (Input.keyDown(40))
		{
			speed -= Spaceship.ACCELERATION
		}

		if (Input.keyDown(32) && this.canshoot < 1)
		{
			let bullet = new Bullet(this.position, this.angle)
			this.game.bullets.push(bullet)
			console.log("push bullet")
			this.canshoot = 20
		}
		this.canshoot -= 1

		this.velocity[0] += speed * Math.sin(this.angle)
		this.velocity[2] += speed * Math.cos(this.angle)

		this.velocity[0] *= Spaceship.FRICTION
		this.velocity[2] *= Spaceship.FRICTION
		
		this.position[0] += this.velocity[0]
		this.position[2] += this.velocity[2]

		this.game.camera.target[0] = this.position[0]
		this.game.camera.target[2] = this.position[2]
		this.game.camera.position[0] = this.position[0] - 35
		this.game.camera.position[2] = this.position[2] - 35

		super.update()
	}
}



export default class Game
{
	init(gl)
	{
		this.gl = gl
		window.game = this

		this.asteroidMesh = new Mesh(gl)
		this.asteroidMesh.begin()
		this.asteroidMesh.addSphere([0,0,0], 1, 7, 6, [0,0], [1,1], 
			(p) => [
				p[0]*2 + (Math.random()-0.5) * p[1] * p[1],
				p[1]*2 + (Math.random()-0.5) * p[1] * p[1],
				p[2]*2 + (Math.random()-0.5) * p[1] * p[1],
			])
		this.asteroidMesh.end()

		this.shipMesh = new Mesh(gl)
		this.shipMesh.begin()
		this.shipMesh.addCube([-1,-0.6,-2], [1,0.6,2], [0,0], [1,1])
		this.shipMesh.addCube([-2,-0.1,-2], [2, 0.1, 0], [0,0], [1,1])
		this.shipMesh.end()

		this.bulletMesh = new Mesh(gl)
		this.bulletMesh.begin()
		this.bulletMesh.addCube([-0.2, -0.2, -1], [0.2, 0.2, 1], [0, 0], [1,1])
		this.bulletMesh.end()

		this.shader = new Shader(gl, "shaders/vert.glsl", "shaders/frag.glsl")
		this.camera = new Camera()

		this.camera.position = [ 35, 100, 35 ]
		this.camera.target = [ 0, 0, 0 ]
		this.camera.up = [ 0, 1, 0 ]
		this.camera.angle = Math.PI / 4
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.znear = 1
		this.camera.zfar = 1024

		this.bullets = []
		this.ships = []
		this.asteroids = []

		for (let i = 0; i < 50; i++)
		{
			let x = (Math.random() - 0.5) * 400
			let y = 0
			let z = (Math.random() - 0.5) * 400
			let a = new Asteroid()
			mat4.fromTranslation(a.transform, [x,y,z])
			this.asteroids.push(a)
		}

		this.ships.push(new Player(this))
		this.gui = new Gui(gl)
	}

	resize()
	{
		this.camera.aspect = window.innerWidth / window.innerHeight
	}

	update()
	{
		this.gui.update()
		this.ships[0].update()

		this.bullets.forEach(b => {
			b.update(this)
		})

		this.bullets = this.bullets.filter(b => !b.destroy)
		this.asteroids = this.asteroids.filter(a => !a.destroy)
	}

	render()
	{
		let gl = this.gl
		// render 3d
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.enable(gl.DEPTH_TEST)
		gl.disable(gl.CULL_FACE)

		let world = mat4.create()

		this.camera.update()
		this.shader.bind()
		this.shader.setVec3("LightDir", [1,-3,-2])
		this.shader.setVec4("Ambient", [0,0,0,0])
		this.shader.setVec4("Diffuse", [1,1,1,1])
		this.shader.setVec4("Emissive", [0,0,0,0])
		this.shader.setMat4("View", this.camera.view)
		this.shader.setMat4("Proj", this.camera.proj)
		this.shader.setMat4("World", world)


		this.asteroids.forEach(a => {
			this.shader.setMat4("World", a.transform)
			this.asteroidMesh.draw(this.shader)
		})

		this.ships.forEach(s => {
			this.shader.setMat4("World", s.transform)
			this.shipMesh.draw(this.shader)
		})

		this.bullets.forEach(b => {
			this.shader.setMat4("World", b.transform)
			this.shader.setVec4("Diffuse", [0,0,0,0])
			this.shader.setVec4("Emissive", [1,0,0,1])
			this.bulletMesh.draw(this.shader)
		})

		// render 2D
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		this.gui.render()
	}
}