"use strict";

planEau.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 tex_coord;
out vec3 model_pos;
out vec3 world_pos;

void main() {
    vec3 rawModelPos = position_in;
    vec3 modelPos = rawModelPos;
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = worldPos.xz - .5;
    model_pos = modelPos;
    world_pos = worldPos.xyz;

    gl_Position = u_projection*u_view*worldPos;
}`;

planEau.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in vec2 tex_coord;
in vec3 model_pos;
in vec3 world_pos;

uniform vec3 u_camera_world_pos;
/*uniform vec3 u_light_world_pos;
uniform vec3 u_ka;
uniform vec3 u_kd;*/

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_distortion;
uniform sampler2D u_reflexion;
uniform sampler2D u_refraction;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

vec2 randOrientation(vec2 p, float r) {
    float s = sign(mod(r, .5) - .25);
    if(s == 0.) s = 1.;
    return mix(p, p.yx, step(.5, r))*s;
}

/*vec3 phongModel(vec3 lc, vec3 nd) {
	vec3 ld = normalize(u_light_world_pos - world_pos);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka*lc;
    vec3 id = u_kd*lc*max(0., dot(nd, ld));
    vec3 is = u_ks*lc*pow(max(0., dot(nd, hrd)), u_kn);

    return ia + id + is;
}*/

void main() {
    vec2 distortion = ((texture(u_distortion, tex_coord*5. + u_time*.016).xy - .5)*(texture(u_distortion, tex_coord*1. - u_time*.04).xy - .5)*(texture(u_distortion, tex_coord*.5 + u_time*.02).xy - .5)*.8);

    vec2 screen_pos = gl_FragCoord.xy/u_resolution.xy;

    float lgt = clamp(length(max(abs(screen_pos - .5) - .49, 0.)) - .01,0.,1.); // pour réduire distortions sur les bords de l'écran

    vec3 normal = normalize(vec3(0., 1., 0.) + vec3(distortion, 1.).xzy);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    float a = clamp(dot(vd, normal)*.5 + .5, 0., 1.);

    vec2 d_screen_pos = screen_pos + distortion*(1. - lgt);
    vec3 refraction = texture(u_refraction, d_screen_pos).rgb;
    vec3 reflexion = texture(u_reflexion, d_screen_pos).rgb;
    vec3 color = mix(refraction, reflexion, clamp(a*a*4.5,0.,1.));
    //color = mix(color, reflexion, .999);

    oFragmentColor = vec4(color, 1.);
}`;