// spriteps.glsl

varying lowp vec4 oCol;
varying highp vec2 oTex;

uniform sampler2D DiffuseMap;
uniform lowp vec4 Ambient;
uniform lowp vec4 Diffuse;
uniform lowp vec4 Emissive;

void main(void)
{
    float d = 0.00390625;
    // float d = 0.0078125;
	vec4 c = texture2D(DiffuseMap, vec2(oTex.x, oTex.y)) * oCol;
    // vec4 cxm = texture2D(DiffuseMap, vec2(oTex.x-d, oTex.y));
    // vec4 cxp = texture2D(DiffuseMap, vec2(oTex.x+d, oTex.y));
    // vec4 cym = texture2D(DiffuseMap, vec2(oTex.x, oTex.y-d));
    // vec4 cyp = texture2D(DiffuseMap, vec2(oTex.x, oTex.y+d));

    gl_FragColor = c;// + vec4(0,0,0,cxm.a+cxp.a+cym.a+cyp.a);
}