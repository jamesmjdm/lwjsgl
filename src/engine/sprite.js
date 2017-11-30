// sprite.js
import Buffer from 'engine/buffer'
import Texture from 'engine/texture'

export default class Sprite
{
    static MAX_QUADS = 1024;

    constructor(gl)
    {
        this.gl = gl

        console.log("made sprite")

        this.positions = []
        this.colours = []
        this.texcoords = []
        this.indices = []


        try
        {
            this.posBuf = new Buffer(this.gl, new Float32Array(this.positions), false)
            this.colBuf = new Buffer(this.gl, new Float32Array(this.colours), false)
            this.texBuf = new Buffer(this.gl, new Float32Array(this.texcoords), false)
            this.indexBuf = new Buffer(this.gl, new Uint16Array(this.indices), true)
        } catch(e) {}

        console.log("done sprite")

        this.numQuads = 0

        this.shader = null
        this.texture = null
        this.font = null
        this.view = null
        this.proj = null
    }

    begin(shader, tex, view, proj)
    {
        this.numQuads = 0
        this.positions = []
        this.colours = []
        this.texcoords = []
        this.indices = []
        this.numQuads = 0

        this.texture = tex
        this.view = view
        this.proj = proj
        this.shader = shader
        this.font = null
    }
    beginText(shader, font, view, proj)
    {
        this.begin(shader, font.texture, view, proj)
        this.font = font
    }
    addText(text, x, y)
    {
        let curX = x
        let curY = y

        for (let i = 0; i < text.length; i++)
        {
            let r = this.font.charRects[text.charCodeAt(i)]
            this.addQuad([curX, curY, 0], [r.width, r.height+2], [1,1,1,1], 
                [r.left/this.texture.width*2, (r.top)/this.texture.height*2],
                [r.width/this.texture.width*2, (r.height)/this.texture.height*2])

            curX += r.width
        }
    }
    addQuad(pos, size, col, tex, texsize)
    {
        tex = tex || [0,0]
        texsize = texsize || [1,1]
        col = col ? col : [1,1,1,1]

        this.positions.push(
            pos[0], pos[1], pos[2],
            pos[0]+size[0], pos[1], pos[2],
            pos[0], pos[1]+size[1], pos[2],
            pos[0]+size[0], pos[1]+size[1], pos[2])
        this.texcoords.push(tex[0],             tex[1],
                            tex[0]+texsize[0],  tex[1],
                            tex[0],             tex[1]+texsize[1],
                            tex[0]+texsize[0],  tex[1]+texsize[1])
        this.colours.push(col[0], col[1], col[2], col[3],
                          col[0], col[1], col[2], col[3],
                          col[0], col[1], col[2], col[3],
                          col[0], col[1], col[2], col[3])
        let c = this.numQuads*4
        this.indices.push(c, c+1, c+2, c+1, c+3, c+2)
        this.numQuads++
    }
    end()
    {
        this.posBuf.write(new Float32Array(this.positions), false)
        this.colBuf.write(new Float32Array(this.colours), false)
        this.texBuf.write(new Float32Array(this.texcoords), false)
        this.indexBuf.write(new Uint16Array(this.indices), true)

        this.shader.bind()

        this.shader.setMat4("View", this.view)
        this.shader.setMat4("Proj", this.proj)
        this.shader.setTexture("DiffuseMap", this.texture)

        this.posBuf.bind(this.shader.posAttr, this.gl.FLOAT, 3)
        this.texBuf.bind(this.shader.texAttr, this.gl.FLOAT, 2)
        this.colBuf.bind(this.shader.colAttr, this.gl.FLOAT, 4)
        this.indexBuf.bindIndex()

        this.gl.drawElements(this.gl.TRIANGLES, this.numQuads * 6, this.gl.UNSIGNED_SHORT, 0)
    }
}

export class SpriteFont
{
    constructor(gl, family, size)
    {
        this.gl = gl
        this.texture = new Texture(this.gl)
        this.charRects = Array.from(Array(256).keys()).map(n => ({
            left:0,right:0,width:1,height:1,top:0,bottom:0
        }))


        let fontWidth = 512
        let ffamily = "'" + family + "'"

        let div = document.createElement("div")
        div.style.wordWrap = "break-word"
        div.style.width = "" + fontWidth + "px"
        div.style.height = div.style.width
        div.style.fontFamily = ffamily
        div.style.fontSize = "" + size + "px"
        div.style.lineHeight = "" + (size*1.5) + "px"
        document.body.appendChild(div)

        let spans = []
        for (let i = 0; i < 256; i++)
        {
            let text = String.fromCharCode(i).replace(/[^\x1F-\x7E]+/g, '')
            let span = document.createElement("span")
            span.style.verticalAlign = "inherit"
            span.style.display="inline-block"
            span.style.padding="1px"
            span.textContent = text
            div.appendChild(span)
            spans.push(span)
        }

        // create a canvas
        let canvas = document.createElement("canvas")
        let context = canvas.getContext("2d")
        let ratio = window.devicePixelRatio

        canvas.width = fontWidth * ratio
        canvas.height = canvas.width
        canvas.style.width = "" + fontWidth + "px"
        canvas.style.height = canvas.style.width
        document.body.appendChild(canvas)

        setTimeout(() => {
        
            // draw the characters to the canvas
            context.clearRect(0, 0, canvas.width, canvas.height)
            context.scale(ratio, ratio)
            context.font = "" + size + "px " + ffamily
            
            context.fillStyle = "white"
            context.strokeStyle = "black"
            context.shadowBlur = 1
            context.shadowColor = "black"
            
            context.textAlign = "left"
            context.textBaseline = "bottom"
            let dr = div.getBoundingClientRect()
            for (let i = 0; i < spans.length; i++)
            {
                let r = spans[i].getBoundingClientRect()
                let t = spans[i].textContent
                this.charRects[i] = { 
                    left : r.left - dr.left, 
                    top : r.top - dr.top, 
                    width : r.width,
                    height : r.height
                }
                // context.strokeText(t, r.left, r.bottom - dr.top)
                context.fillText(t, r.left+1, (r.bottom-dr.top)+1)
                // context.text(t, r.left, r.bottom-dr.top)
                
                // context.beginPath()
                // context.rect(r.left-dr.left, r.top-dr.top, r.width, r.height)
                // context.strokeStyle = "red"
                // context.stroke()
            }
            
            this.texture.load(canvas, true)

            document.body.removeChild(div)
            document.body.removeChild(canvas)
            console.log("set source")

        }, 100)

    }
}