// shader.js

export default class Shader
{
	static onLoad(gl, shader, vsrc, fsrc)
	{
		shader.vertShader = Shader.compile(gl, vsrc, gl.VERTEX_SHADER, shader.fnames[0])
		shader.fragShader = Shader.compile(gl, fsrc, gl.FRAGMENT_SHADER, shader.fnames[1])

		console.log(shader.vertShader)
		console.log(shader.fragShader)

		shader.program = gl.createProgram()
		gl.attachShader(shader.program, shader.vertShader)
		gl.attachShader(shader.program, shader.fragShader)
		gl.linkProgram(shader.program)

		if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS))
		{
			console.log("failed to link shader")
			return;
		}

		gl.useProgram(shader.program)

		shader.posAttr = gl.getAttribLocation(shader.program, "iPos")
		shader.normAttr = gl.getAttribLocation(shader.program, "iNorm")
		shader.texAttr = gl.getAttribLocation(shader.program, "iTex")
		shader.colAttr = gl.getAttribLocation(shader.program, "iCol")
	}

	static compile(gl, src, type, fname)
	{
		let shader = gl.createShader(type)

		gl.shaderSource(shader, src)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log("failed to compile shader: ", fname)
			return null;
		}
		return shader;
	}

	constructor(gl, vs, fs)
	{
		this.gl = gl
		this.fnames = [vs, fs]
		var that = this

		let vsp = new Promise((resolve, reject) => {
			let vshr = new XMLHttpRequest()
			vshr.onload = () => resolve(vshr.responseText)
			vshr.open("GET", vs)
			vshr.setRequestHeader("Content-Type", "text/plain")
			vshr.send()
		})
		let fsp = new Promise((resolve, reject) => {
			let fshr = new XMLHttpRequest()
			fshr.onload = () => resolve(fshr.responseText)
			fshr.open("GET", fs)
			fshr.setRequestHeader("Content-Type", "text/plain")
			fshr.send()
		})

		Promise.all([ vsp, fsp ])
			.then(resp => {
				Shader.onLoad(gl, that, resp[0], resp[1])
			}, err => {

			})
			.catch(() => {

			})

	}

	bind()
	{
		this.gl.useProgram(this.program)
		if (this.texAttr > -1) this.gl.enableVertexAttribArray(this.texAttr)
		if (this.posAttr > -1) this.gl.enableVertexAttribArray(this.posAttr)
		if (this.normAttr > -1) this.gl.enableVertexAttribArray(this.normAttr)
		if (this.colAttr > -1) this.gl.enableVertexAttribArray(this.colAttr)
	}

	setMat4(name, val)
	{
		this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name), false, val)
	}

	setVec4(name, val)
	{
		this.gl.uniform4fv(this.gl.getUniformLocation(this.program, name), val)
	}

	setVec3(name, val)
	{
		this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), val)
	}
	setTexture(name, tex)
	{
		this.gl.activeTexture(this.gl.TEXTURE0)
		this.gl.bindTexture(this.gl.TEXTURE_2D, tex.texture)
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), 0)
	}
}