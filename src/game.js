// game.js

import { mat4, vec3, vec4 } from 'gl-matrix'
import Shader from 'engine/shader'
import Mesh from 'engine/mesh'
import Sprite, { SpriteFont } from 'engine/sprite'
import CollisionManager, { CollisionNode } from 'engine/collision'
import SceneManager, { SceneNode } from 'engine/scene'

import Input, { ord } from 'input'
import Gui from 'gui'
import Camera from 'camera'

import Packet from 'packet'

export class Asteroid {
    constructor() {
        this.transform = mat4.create()
        this.destroy = false
    }
}
export class Bullet {
    static SPEED = 2;
    static MAX_AGE = 100;

    constructor(pos, angle) {
        this.transform = mat4.create()
        this.angle = angle
        this.position = pos.slice()
        this.velocity = [ Bullet.SPEED * Math.sin(angle), 0, Bullet.SPEED * Math.cos(angle) ]
        this.age = 1
        this.destroy = false
    }
    update(game) {
        this.position[0] += this.velocity[0]
        this.position[2] += this.velocity[2]

        let collision = false
        for (let i = 0; i < game.asteroids.length; i++) {
            let a = game.asteroids[i]
            let dx = a.transform[12] - this.position[0]
            let dy = a.transform[14] - this.position[2]
            if (dx*dx + dy*dy < 9) {
                collision = true
                a.destroy = true
                this.destroy = true
                break
            }
        }
        
        this.age += 1
        if (this.age > Bullet.MAX_AGE) {
            this.destroy = true
        }
        
        mat4.fromTranslation(this.transform, this.position)
        mat4.rotateY(this.transform, this.transform, this.angle)
    }
}
export class Player {
    id = 0
    
    acceleration = 0.02
    turnspeed = 0.04
    rollspeed = 0.06
    friction = 0.985
    rollfriction = 0.9
    brake = 0.9

    position = [0, 0, 0]
    velocity = [0, 0, 0]
    angle = 0
    roll = 0
    transform = mat4.create()
    
    hullStrength = 100
    shieldStrength = 100
    reactorEnergy = 100
    weapons = [{
        name : "Blaster T0",
    },{
        name : "SR Missile",
    }]

    constructor(id) {
        this.id = id
    }

    update() {
        this.velocity[0] *= this.friction
        this.velocity[2] *= this.friction
        
        this.position[0] += this.velocity[0]
        this.position[2] += this.velocity[2]

        mat4.fromTranslation(this.transform, this.position)
        mat4.rotateY(this.transform, this.transform, this.angle)
        mat4.rotateZ(this.transform, this.transform, this.roll)
    }
}
export class NetPlayer extends Player {
    constructor(game, id) {
        super(id)
        this.game = game
    }
}
export class LocalPlayer extends Player {
    constructor(game, id) {
        super(id)
        this.game = game
        this.canshoot = 0
    }
    update() {
        this.roll *= this.rollfriction
        let speed = 0

        if (Input.keyDown(65)) {
            // left
            this.angle += this.turnspeed
            this.roll -= this.rollspeed
        }
        if (Input.keyDown(68)) {
            // right
            this.angle -= this.turnspeed
            this.roll += this.rollspeed
        }
        if (Input.keyDown(87)) {
            // forward
            this.velocity[0] += this.acceleration * Math.sin(this.angle)
            this.velocity[2] += this.acceleration * Math.cos(this.angle)
        }
        if (Input.keyDown(83)) {
            // brake
            this.velocity[0] *= this.brake
            this.velocity[2] *= this.brake
        }

        if (Input.keyDown(32) && this.canshoot < 1) {
            let bullet = new Bullet(this.position, this.angle)
            this.game.bullets.push(bullet)
            this.canshoot = 20
        }
        this.canshoot -= 1

        super.update()

        this.game.camera.target[0] = this.position[0]
        this.game.camera.target[2] = this.position[2]
        this.game.camera.position[0] = this.position[0] - 35
        this.game.camera.position[2] = this.position[2] - 35

    }
}



export default class Game {
    connected = false
    socket = null
    player = null
    enemies = []
    asteroids = []
    bullets = []

    init(gl) {
        this.gl = gl
        window.game = this

        this.socket = new WebSocket("ws://localhost:9001")
        this.socket.binaryType = "arraybuffer"
        this.socket.onopen = () => {
            this.connected = true
        }
        this.socket.onclose = (evt) => {
            this.connected = false
        }
        this.socket.onmessage = (evt) => {
            let view = new DataView(evt.data)
            let msg = view.getUint16(0)
            switch (msg) {
                case Packet.PlayerJoined: {
                    let id = view.getUint16(2)
                    console.log("PLAYER JOINED", id)
                    let enemy = new NetPlayer(this, id)
                    this.enemies.push(enemy)
                    break;
                }
                case Packet.PlayerExisting: {
                    let id = view.getUint16(2)
                    console.log("EXISTING PLAYER", id)
                    let enemy = new NetPlayer(this, id)
                    this.enemies.push(enemy)
                    break;
                }
                case Packet.PlayerLeft: {
                    let id = view.getUint16(2)
                    console.log("PLAYER LEFT", id)
                    // remove the affected enemy
                    this.enemies = this.enemies.filter((e) => e.id !== id)
                    break;
                }
                case Packet.PlayerPosition: {
                    let id = view.getUint16(2)
                    let enemy = this.enemies.find((e) => e.id === id)
                    if (enemy !== undefined) {
                        enemy.position[0] = view.getFloat32(6)
                        enemy.position[2] = view.getFloat32(10)
                        enemy.velocity[0] = view.getFloat32(14)
                        enemy.velocity[2] = view.getFloat32(18)
                        enemy.angle = view.getFloat32(22)
                    }
                    break;
                }
                case Packet.Handshake: {
                    let id = view.getUint16(2)
                    console.log("HANDSHAKE", id)
                    this.player.id = id
                }
            }
        }

        this.writeBuf = new ArrayBuffer(128)
        this.writeView = new DataView(this.writeBuf)


        this.asteroidMesh = new Mesh(gl)
        this.asteroidMesh.begin()
        this.asteroidMesh.addSphere([0,0,0], 1, 7, 6, [0,0], [1,1], 
            (p) => [
                p[0]*2 + (Math.random()-0.5) * (1-p[1] * p[1]),
                p[1]*2 + (Math.random()-0.5) * (1-p[1] * p[1]),
                p[2]*2 + (Math.random()-0.5) * (1-p[1] * p[1]),
            ])
        this.asteroidMesh.end()

        this.stationMesh = new Mesh(gl)
        this.stationMesh.begin()
        for (let i = 0; i < 8; i++) {
            let t = Math.PI * 2 * i / 8
            let r = 30
            let px = Math.sin(t) * r
            let pz = Math.cos(t) * r
            this.stationMesh.addCube([px-10, -5, pz-10], [px+10, 5, pz+10], [0,0], [1,1])
        }
        this.stationMesh.end()

        this.shipMesh = new Mesh(gl)
        this.shipMesh.begin()
        this.shipMesh.addCube([-1,-0.6,-2], [1,0.6,2], [0,0], [1,1])
        this.shipMesh.addCube([-2,-0.1,-2], [2, 0.1, 0], [0,0], [1,1])
        this.shipMesh.end()

        this.capitalMesh = new Mesh(gl)
        this.capitalMesh.begin()
        this.capitalMesh.addCube([-3,-1,-8], [3,2,8], [0,0], [1,1])
        // this.capitalMesh.addCube([], [], [0,0], [1,1])
        this.capitalMesh.end()

        this.backMesh = new Mesh(gl)
        this.backMesh.begin()
        this.backMesh.end()

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

        for (let i = 0; i < 50; i++) {
            let x = (Math.random() - 0.5) * 400
            let y = 0
            let z = (Math.random() - 0.5) * 400
            let a = new Asteroid()
            mat4.fromTranslation(a.transform, [x,y,z])
            this.asteroids.push(a)
        }

        this.bigAsteroids = []
        for (let i = 0; i < 20; i++) {
            let x = (Math.random() - 0.5) * 1000
            let y = -250
            let z = (Math.random() - 0.5) * 1000
            let a = new Asteroid()
            mat4.fromTranslation(a.transform, [x,y,z])
            mat4.scale(a.transform, a.transform, [5,5,5])
            
            mat4.fromTranslation(a.transform, [x,y,z])
            mat4.scale(a.transform, a.transform, [20,20,20])
            
            this.bigAsteroids.push(a)
        }

        this.player = new LocalPlayer(this)
        this.gui = new Gui(gl)
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
    }

    update() {
        this.gui.update()
        this.player.update()

        // send player update
        this.writeView.setUint16(0, Packet.ClientPosition)
        this.writeView.setFloat32(2, this.player.position[0])
        this.writeView.setFloat32(6, this.player.position[2])
        this.writeView.setFloat32(10, this.player.velocity[0])
        this.writeView.setFloat32(14, this.player.velocity[2])
        this.writeView.setFloat32(18, this.player.angle)
        this.socket.send(this.writeBuf)


        this.enemies.forEach((e) => {
            // increment position by velocity
            e.update(this)
        })

        this.bullets.forEach((b) => {
            b.update(this)
        })

        this.asteroids.forEach((a) => {
            
        })

        this.bullets = this.bullets.filter((b) => !b.destroy)
        this.asteroids = this.asteroids.filter((a) => !a.destroy)
    }

    render() {
        let gl = this.gl
        // render 3d
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)

        this.camera.update()
        let world = mat4.create()


        this.shader.bind()
        this.shader.setVec3("LightDir", [1,-3,-2])
        this.shader.setVec4("Ambient", [0,0,0,0])
        this.shader.setVec4("Diffuse", [1,1,1,1])
        this.shader.setVec4("Emissive", [0,0,0,0])
        this.shader.setMat4("Proj", this.camera.proj)
        this.shader.setMat4("View", this.camera.view)
        this.shader.setMat4("World", world)

        this.stationMesh.draw(this.shader)

        this.bigAsteroids.forEach((a) => {
            this.shader.setMat4("World", a.transform)
            this.asteroidMesh.draw(this.shader)
        })

        this.asteroids.forEach((a) => {
            this.shader.setMat4("World", a.transform)
            this.asteroidMesh.draw(this.shader)
        })

        this.enemies.forEach((s) => {
            this.shader.setMat4("World", s.transform)
            this.shipMesh.draw(this.shader)
        })

        this.shader.setMat4("World", this.player.transform)
        this.shipMesh.draw(this.shader)

        this.bullets.forEach((b) => {
            this.shader.setMat4("World", b.transform)
            this.shader.setVec4("Diffuse", [0,0,0,0])
            this.shader.setVec4("Emissive", [1,0,0,1])
            this.bulletMesh.draw(this.shader)
        })

        // render 2D
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        // this.gui.render(this.player, this)
    }
}