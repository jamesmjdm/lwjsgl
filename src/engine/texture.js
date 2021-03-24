// texture.js

export default class Texture {
    initBoundTexture(img) {
        let gl = this.gl
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            console.log("initting bound texture")
        } catch(e) {
            console.log(e)
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.generateMipmap(gl.TEXTURE_2D)
    }
    constructor(gl, src, isCanvas) {
        this.gl = gl
        this.texture = gl.createTexture()

        if (src !== undefined) {
            this.load(src, isCanvas)
        }
    }

    load(src, isCanvas) {
        let gl = this.gl

        if (isCanvas) {
            this.width = src.width
            this.height = src.height
            
            // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.bindTexture(gl.TEXTURE_2D, this.texture)
            // Texture.initBoundTex(gl)
            this.initBoundTexture(src)
            gl.bindTexture(gl.TEXTURE_2D, null)
        }
        else {
            let img = document.createElement("img")
            img.crossOrigin = "anonymous"
            img.onload = () => {
                console.log("loaded image", img)
                this.width = img.naturalWidth
                this.height = img.naturalHeight

                gl.bindTexture(gl.TEXTURE_2D, this.texture)
                this.initBoundTexture(img)
                gl.bindTexture(gl.TEXTURE_2D, null)
            }
            img.src = src
        }
    }
}