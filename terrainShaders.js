"use strict";

terrain.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform sampler2D u_height_texture;
uniform sampler2D u_normal_texture;

out vec2 tex_coord;
out vec3 model_pos;
out vec3 world_pos;
out vec3 world_normal;

vec3 hauteur(in vec3 p) {
    float h = length(texture(u_height_texture, p.xz - .5).xyz)*.25 - .25;
    return p + vec3(0., h, 0.);
}

vec3 worldNormal(vec3 rawModelPos) {
    vec2 sh = vec2(0., 10./200.);
    vec3 p = hauteur(rawModelPos);
    vec3 a = hauteur(rawModelPos + sh.yxx);
    vec3 b = hauteur(rawModelPos - sh.xxy);
    return normalize(mat3(u_view*u_model)*cross(a - p, b - p));
}

void main() {
    vec3 rawModelPos = position_in;
    vec3 modelPos = hauteur(rawModelPos);
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = rawModelPos.xz - .5;
    model_pos = modelPos;
    world_pos = worldPos.xyz;
    world_normal = normalize(mat3(u_model)*((texture(u_normal_texture, tex_coord).rgb - .5)*2.));
    /*if(worldPos.x > 0.)
        world_normal = worldNormal(rawModelPos);*/

    gl_Position = u_projection*u_view*worldPos;
}`;

terrain.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in vec3 model_pos;
in vec3 world_pos;
in vec3 world_normal;

uniform vec3 u_camera_world_pos;
uniform vec3 u_light_world_pos;
uniform vec3 u_ka;
uniform vec3 u_kd;
uniform vec3 u_ks;
uniform float u_kn;
uniform sampler2D u_color_texture;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

vec2 randOrientation(vec2 p, float r) {
    float s = sign(mod(r, .5) - .25);
    if(s == 0.) s = 1.;
    return mix(p, p.yx, step(.5, r))*s;
}

vec3 phongModel(vec3 lc) {
    vec3 nd = world_normal;
	vec3 ld = normalize(u_light_world_pos - world_pos);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka*lc;
    vec3 id = u_kd*lc*max(0., dot(nd, ld));
    vec3 is = u_ks*lc*pow(max(0., dot(nd, hrd)), u_kn);

    return ia + id + is;
}

void main() {
    vec3 color = phongModel(vec3(1.));

    float sz = 4.;
    float texId = rand(floor(model_pos.xz*sz));
    vec2 texCoord = randOrientation(fract(model_pos.xz*sz), texId);
    color *= texture(u_color_texture, texCoord).xyz*.8;

    oFragmentColor = vec4(color, 1.);
}`;