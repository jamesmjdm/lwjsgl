// texture.js

class Texture
{
	static onLoadImg(gl, img, tex)
	{
		gl.bindTexture(gl.TEXTURE_2D, tex)
		Texture.initBoundTex(gl)
		gl.bindTexture(gl.TEXTURE_2D, null)
	}
	static initBoundTex(gl)
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.generateMipMap(gl.TEXTURE_2D)
	}
	constructor(gl, src, isCanv)
	{
		this.gl = gl
		this.texture = gl.createTexture()

		if (isCanvas)
		{
			this.width = src.width
			this.height = src.height
			
			this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
			this.gl.bindTexture(gl.TEXTURE_2D, this.texture)
			Texture.initBoundTex(this.gl)
			this.gl.bindTexture(gl.TEXTURE_2D, null)
		}
		else
		{
			let img = document.createElement("img")
			img.onload = () => {
				this.width = img.naturalWidth
				this.height = img.naturalHeight
				Texture.onLoadImg(this.gl, img, this.texture)
			}
		}
	}
}