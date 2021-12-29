"use strict";

fx[0].vs_src = `#version 300 es
void main() {
	gl_Position = vec4(vec2((gl_VertexID&2) << 1, (gl_VertexID&1) << 2) - 1., 0., 1.);
}`;


fx[0].fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

uniform sampler2D u_render_pass;

void main() {
    ivec2 tex_coords = ivec2(gl_FragCoord.xy);

    vec4 color_a = texelFetch(u_render_pass, tex_coords, 0).bgra;

    float brightness = dot(color_a.rgb, vec3(.2126, .7152, .0722));
    color_a.rgb *= smoothstep(.5, .9, brightness);

    oFragmentColor = color_a;
}`;


const fx_fs_src_temp = `#version 300 es

precision highp float;

#define IS_FIRST_FX_PASS

out vec4 oFragmentColor;

uniform vec2 u_resolution;
uniform sampler2D u_render_pass;
uniform sampler2D u_render_pass_2;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 aa = vec3(1./u_resolution, 0.);

    ivec2 tex_coords = ivec2(gl_FragCoord.xy);
    float k = length(st - .5);

    vec3 blur_color = vec3(0.);
    const int BLUR_SIZE = 5;
    const float WEIGHT[5] = float[] (.227027, .1945946, .1216216, .054054, .016216);
    for(int i = -BLUR_SIZE; i <= BLUR_SIZE; i++) {
    
#ifdef IS_FIRST_FX_PASS
        ivec2 offset = ivec2(0, i);
#else
        ivec2 offset = ivec2(i, 0);
#endif

        blur_color += texelFetch(u_render_pass, tex_coords + offset*3, 0).rgb*WEIGHT[abs(i)];
    }

    vec3 scene_color = texelFetch(u_render_pass_2, tex_coords, 0).rgb;

    vec3 result = clamp(max(
        scene_color,
        blur_color
    ), vec3(0.), vec3(1.));

#ifndef IS_FIRST_FX_PASS
    result -= k*k*k*.75*vec3(1.,1.,1.);
#endif

    oFragmentColor = vec4(result, 1.);
}`;


fx[1].fs_src = fx_fs_src_temp;
fx[2].fs_src = fx_fs_src_temp.replace("#define IS_FIRST_FX_PASS", "");