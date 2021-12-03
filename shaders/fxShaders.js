"use strict";

fx.vs_src = `#version 300 es
void main() {
	float y = -1. + float((gl_VertexID&1) << 2);
	float x = -1. + float((gl_VertexID&2) << 1);
	gl_Position = vec4(x, y, 0.0, 1.0 );
}`;

fx.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

uniform vec2 u_resolution;
uniform sampler2D u_render_pass;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 aa = vec3(1./u_resolution, 0.);

    float k = length(st - .5);
    
    vec3 color = vec3(
        texture(u_render_pass, st + aa.xz).r,
        texture(u_render_pass, st).g,
        texture(u_render_pass, st + aa.zx).b
    );

    const float maxB = 3.;
    vec3 blurColor = vec3(0.);
    for(float i = -maxB*.5; i < maxB*.5; i++) {
        for(float j = -maxB*.5; j < maxB*.5; j++) {
            vec2 sh = vec2(i,j)*aa.xy*3.;
            vec3 c = texture(u_render_pass,st + sh).rgb;
            blurColor += c*smoothstep(.2, .6, length(c));
        }
    }
    blurColor /= maxB*maxB;
    vec3 glow = blurColor;

    color += glow*.5;

    oFragmentColor = vec4(color - k*k*k*.75*vec3(0.5,1.,1.), 1.);
}`;