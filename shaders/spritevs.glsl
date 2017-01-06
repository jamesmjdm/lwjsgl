// spritevs.glsl

attribute vec3 iPos;
attribute vec4 iCol;
attribute vec2 iTex;

uniform mat4 View;
uniform mat4 Proj;

varying lowp vec4 oCol;
varying highp vec2 oTex;

void main(void)
{
	gl_Position = Proj * View * vec4(iPos, 1);
	oCol = iCol;
	oTex = iTex;
}