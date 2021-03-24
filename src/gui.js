// gui.js
import Sprite, { SpriteFont } from 'engine/sprite'
import Texture from 'engine/texture'
import Shader from 'engine/shader'
import { mat4, vec3, vec4 } from 'gl-matrix'
import Input, { ord } from 'input'


export default class Gui {
    static None = 0;
    static Map = 1;
    static Inventory = 2;
    static Mission = 3;

    static createMapTex(gl) {
        let canvas = document.createElement("canvas")
        let context = canvas.getContext("2d")
        let R = 1024
        canvas.width = R
        canvas.height = R

        context.strokeStyle = "white"
        context.fillStyle = "black"
        context.fillRect(0, 0, 1024, 1024)
        context.strokeRect(0, 0, 1024, 1024)

        context.strokeStyle = "#606060"
        let numSquares = 20
        context.beginPath()
        for (let i = 0; i < numSquares; i++) {
            let ni = (i/numSquares) * R
            context.moveTo(ni, 0)
            context.lineTo(ni, R)
            context.moveTo(0, ni)
            context.lineTo(R, ni)
        }
        context.stroke()

        return new Texture(gl, canvas, true)
    }

    static createRadarDot(gl) {
        let canvas = document.createElement("canvas")
        let context = canvas.getContext("2d")
        canvas.width = 8
        canvas.height = 8

        context.fillStyle = "white"
        context.beginPath()
        context.arc(4, 4, 4, 0, Math.PI*2)
        context.fill()

        return new Texture(gl, canvas, true)
    }
    static createRadarTex(gl) {
        let canvas = document.createElement("canvas")
        canvas.width = 256
        canvas.height = 256
        let context = canvas.getContext("2d")

        context.fillStyle = "black"
        context.strokeStyle = "white"
        context.strokeWidth = 4

        let R = 120
        let C = 128 // same for x and y
        let sectors = 12
        let rings = 5
        context.beginPath()
        context.arc(C, C, R, 0, Math.PI*2)
        context.fill()
        context.stroke()

        context.strokeStyle = "#606060"
        for (let i = 1; i < rings; i++) {
            context.beginPath()
            context.arc(C, C, i*(R/rings), 0, Math.PI*2)
            context.stroke()
        }
        context.beginPath()
        for (let i = 0; i < sectors; i++) {
            let s = Math.sin(Math.PI*2 * i/sectors)
            let c = Math.cos(Math.PI*2 * i/sectors)
            context.moveTo(C, C)
            context.lineTo(R*s+C, R*c+C)
        }
        context.stroke()

        return new Texture(gl, canvas, true)
    }

    constructor(gl) {
        this.state = Gui.None
        
        this.gl = gl
        this.sprite = new Sprite(gl)
        this.font = new SpriteFont(gl, "Courier New", 32)
        this.smallFont = new SpriteFont(gl, "Courier New", 14)
        this.shader = new Shader(gl, "shaders/spritevs.glsl", "shaders/spriteps.glsl")

        this.radarTex = Gui.createRadarTex(this.gl)
        this.radarDot = Gui.createRadarDot(this.gl)
        this.mapTex = Gui.createMapTex(this.gl)

        this.view = mat4.create()
        this.proj = mat4.create()
    }

    update() {
        if (Input.keyPressed(ord('M'))) {
            this.state = (this.state !== Gui.Map) ? Gui.Map : Gui.None
        }
        if (Input.keyPressed(ord('I'))) {
            this.state = (this.state !== Gui.Inventory) ? Gui.Inventory : Gui.None
        }
        if (Input.keyPressed(ord('N'))) {
            this.state = (this.state !== Gui.Mission) ? Gui.Mission : Gui.None
        }
        if (Input.keyPressed(27)) {
            this.state = Gui.None
        }
    }

    renderHud(player) {
        this.sprite.beginText(this.shader, this.smallFont, this.view, this.proj)
        this.sprite.addText("hull integrity: ", 20, 20)
        this.sprite.addText("shields: ", 20, 40)
        this.sprite.addText("weapons: ", 20, 60)
        this.sprite.addText("reactor: ", 20, 80)
        this.sprite.addText(""+player.hullStrength, 200, 20)
        this.sprite.addText(""+player.shieldStrength + "%", 200, 40)
        this.sprite.addText(""+player.weapons[0].name, 200, 60)
        this.sprite.addText(""+player.reactorEnergy, 200, 80)
        this.sprite.end()


        this.sprite.begin(this.shader, this.radarTex, this.view, this.proj)
        this.sprite.addQuad([0,window.innerHeight-200,0], [200,200])
        this.sprite.end()

    }
    renderMap(player, game) {
        let mapview = mat4.create()
        let cx = window.innerWidth / 2
        let cy = window.innerHeight / 2
        mat4.fromTranslation(mapview, [cx,cy,0])

        this.sprite.beginText(this.shader, this.font, this.view, this.proj)
        this.sprite.addText("MAP", 0, 0)
        this.sprite.end()

        this.sprite.begin(this.shader, this.mapTex, this.view, this.proj)
        this.sprite.addQuad([cx-400, cy-400, 0], [800, 800])
        this.sprite.end()

        this.sprite.begin(this.shader, this.radarDot, mapview, this.proj)
        for (let i = 0; i < game.asteroids.length; i++) {
            let p = game.asteroids[i].transform
            this.sprite.addQuad([p[12]-2, p[14]-2, 0], [4,4], [0.4,0.4,0.4,1])
        }
        this.sprite.addQuad([player.position[0]-20, player.position[2]-20, 0], [40,40])
        this.sprite.addQuad([-60, -60, 0], [120,120], [0.7,0.7,0.7,1])
        this.sprite.end()
    }
    renderMission(player) {
        this.sprite.beginText(this.shader, this.font, this.view, this.proj)
        this.sprite.addText("MISSION", 0, 0)
        this.sprite.end()
    }
    renderInventory(player) {
        this.sprite.beginText(this.shader, this.font, this.view, this.proj)
        this.sprite.addText("INVENTORY", 0, 0)
        this.sprite.end()

    }
    render(player, game) {
        mat4.ortho(this.proj, 0, window.innerWidth, window.innerHeight, 0, -1, 1)

        switch (this.state) {
            case Gui.None:
                this.renderHud(player, game)
                break
            case Gui.Map: 
                this.renderMap(player, game)
                break
            case Gui.Inventory: 
                this.renderInventory(player, game)
                break
            case Gui.Mission: 
                this.renderMission(player, game)
                break
        }
    }
}