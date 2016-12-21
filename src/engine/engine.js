// engine.js

export const initGl = canvas => {
	let gl = null

	try
	{
		console.log("CREATED GL CONTEXT")
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	}
	catch (e) {}

	if (!gl)
	{
		return null;
	}

	return gl;
}

export const resizeGl = (gl, w, h) =>
{
	gl.viewport(0, 0, w, h)
}