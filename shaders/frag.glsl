// frag.glsl

varying lowp vec4 oCol;
varying highp vec2 oTex;

uniform sampler2D Sampler;
uniform lowp vec4 Color;
uniform lowp vec4 Ambient;

void main(void)
{
	gl_FragColor = //texture2D(Sampler, vec2(oTex.x, oTex.y)) * 
		(Ambient + oCol) * 
		Color;
	// gl_FragColor = oCol;
}