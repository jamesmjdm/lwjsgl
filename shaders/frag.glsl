// frag.glsl
precision mediump float;

varying lowp vec4 oCol;
varying highp vec2 oTex;

uniform sampler2D Sampler;
uniform lowp vec4 Ambient;
uniform lowp vec4 Diffuse;
uniform lowp vec4 Emissive;

void main(void)
{
    gl_FragColor = //texture2D(Sampler, vec2(oTex.x, oTex.y)) * 
        (Ambient + oCol) * Diffuse
        + Emissive
        ;
    // gl_FragColor = oCol;
}