"use strict";

fx[0].vs_src = `#version 300 es
void main() {
	float y = -1. + float((gl_VertexID&1) << 2);
	float x = -1. + float((gl_VertexID&2) << 1);
	gl_Position = vec4(x, y, 0.0, 1.0 );
}`;


fx[0].fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

uniform sampler2D u_render_pass;

void main() {
    ivec2 tex_coords = ivec2(gl_FragCoord.xy);

    vec4 color_a = texelFetch(u_render_pass, tex_coords, 0).bgra;

    float brightness = dot(color_a.rgb, vec3(.2126, .7152, .0722));

    color_a.rgb *= step(.65, brightness);

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

    /*float k = length(st - .5);
    
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

    oFragmentColor = vec4(color - k*k*k*.75*vec3(0.5,1.,1.), 1.);*/

    vec3 blur_color = vec3(0.);
    const int BLUR_SIZE = 5;
    const float WEIGHT[5] = float[] (.227027, .1945946, .1216216, .054054, .016216);
    for(int i = -BLUR_SIZE; i <= BLUR_SIZE; i++) {
    
#ifdef IS_FIRST_FX_PASS
        ivec2 offset = ivec2(0, i);
#else
        ivec2 offset = ivec2(i, 0);
#endif

        blur_color += texelFetch(u_render_pass, tex_coords + offset*4, 0).rgb*WEIGHT[abs(i)];
    }

    vec3 scene_color = texelFetch(u_render_pass_2, tex_coords, 0).rgb;

    vec3 result = max(
        scene_color,
        blur_color
    );

#ifndef IS_FIRST_FX_PASS
    result -= k*k*k*.75*vec3(0.5,1.,1.);
#endif

    oFragmentColor = vec4(result, 1.);
}`;


fx[1].fs_src = fx_fs_src_temp;
fx[2].fs_src = fx_fs_src_temp.replace("#define IS_FIRST_FX_PASS", "");