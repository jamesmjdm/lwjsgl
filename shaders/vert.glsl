// vert.glsl

attribute vec3 iPos;
attribute vec3 iNorm;
attribute vec2 iTex;

uniform mat4 World;
uniform mat4 View;
uniform mat4 Proj;
uniform vec3 LightDir;

varying lowp vec4 oCol;
varying highp vec2 oTex;

void main(void)
{
	gl_Position = Proj * View * World * vec4(iPos, 1);

	mat3 basis = mat3(World);
	vec3 worldNorm = basis * iNorm;
	float diffuse = clamp(
		dot(normalize(-LightDir), normalize(worldNorm)),
		0.0, 1.0);

	oCol = vec4(diffuse, diffuse, diffuse, 1);
	oTex = iTex;
}