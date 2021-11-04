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
    vec3 modelPos = (rawModelPos);
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = rawModelPos.xz - .5;
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
uniform vec3 u_light_world_pos;
uniform vec3 u_ka;
uniform vec3 u_kd;
uniform vec3 u_ks;
uniform float u_kn;
uniform float u_time;
uniform sampler2D u_distortion;
uniform samplerCube u_texture_skybox;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

vec2 randOrientation(vec2 p, float r) {
    float s = sign(mod(r, .5) - .25);
    if(s == 0.) s = 1.;
    return mix(p, p.yx, step(.5, r))*s;
}

vec3 phongModel(vec3 lc, vec3 nd) {
	vec3 ld = normalize(u_light_world_pos - world_pos);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka*lc;
    vec3 id = u_kd*lc*max(0., dot(nd, ld));
    vec3 is = u_ks*lc*pow(max(0., dot(nd, hrd)), u_kn);

    return ia + id + is;
}

void main() {
    vec2 distortion = texture(u_distortion, tex_coord + u_time*.02).xy;

    vec3 normal = normalize(vec3(0., 1., 0.) + vec3(distortion, 1.).xzy*.1);
    //vec3 color = phongModel(vec3(1.), normal);


    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 skyboxReflectColor = texture(
        u_texture_skybox, reflect(vd, normal)
    ).rgb;

    vec3 color = skyboxReflectColor;
    //color = mix(color, vec3(distortion, 1.), .9);
    /*float sz = 20.;
    float texId = rand(floor(model_pos.xz*sz));
    vec2 texCoord = randOrientation(fract(model_pos.xz*sz), texId);
    color *= texture(u_color_texture, (texCoord)).xyz;*/

    oFragmentColor = vec4(color, 1.);
}`;