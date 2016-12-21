// buffer.js

export default class Buffer
{
	constructor(gl, array, index)
	{
		this.gl = gl
		this.buffer = gl.createBuffer()
		this.write(array, index)
	}

	write(array, index)
	{
		this.gl.bindBuffer(index ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.bufferData(index ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER, array, this.gl.STATIC_DRAW)
	}

	bind(attr, format, pervertex)
	{
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
		this.gl.vertexAttribPointer(attr, pervertex, format, false, 0, 0)
	}
	bindIndex()
	{
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffer)
	}
}