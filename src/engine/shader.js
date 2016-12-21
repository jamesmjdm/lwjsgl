// shader.js

export default class Shader
{
	static onLoad(gl, shader, vsrc, fsrc)
	{
		shader.vertShader = Shader.compile(gl, vsrc, gl.VERTEX_SHADER)
		shader.fragShader = Shader.compile(gl, fsrc, gl.FRAGMENT_SHADER)

		console.log(shader.vertShader)
		console.log(shader.fragShader)

		shader.program = gl.createProgram()
		gl.attachShader(shader.program, shader.vertShader)
		gl.attachShader(shader.program, shader.fragShader)
		gl.linkProgram(shader.program)

		if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS))
		{
			return;
		}

		gl.useProgram(shader.program)
		shader.posAttr = gl.getAttribLocation(shader.program, "iPos")
		shader.normAttr = gl.getAttribLocation(shader.program, "iNorm")
		shader.texAttr = gl.getAttribLocation(shader.program, "iTex")
	}

	static compile(gl, src, type)
	{
		let shader = gl.createShader(type)

		gl.shaderSource(shader, src)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			return null;
		}
		return shader;
	}

	constructor(gl, vs, fs)
	{
		this.gl = gl
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
		this.gl.enableVertexAttribArray(this.texAttr)
		this.gl.enableVertexAttribArray(this.posAttr)
		this.gl.enableVertexAttribArray(this.normAttr)
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
}