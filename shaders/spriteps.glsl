// spriteps.glsl

varying lowp vec4 oCol;
varying highp vec2 oTex;

uniform sampler2D DiffuseMap;
uniform lowp vec4 Ambient;
uniform lowp vec4 Diffuse;
uniform lowp vec4 Emissive;

void main(void)
{
	gl_FragColor = texture2D(DiffuseMap, vec2(oTex.x, oTex.y));
}