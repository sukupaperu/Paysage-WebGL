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
uniform sampler2D u_color_texture_0;
uniform sampler2D u_color_texture_1;
uniform sampler2D u_color_texture_2;

uniform sampler2D u_normal_texture_0;
uniform sampler2D u_normal_texture_1;
uniform sampler2D u_normal_texture_2;

uniform bool u_under_zero_rendering;

float rand(in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

vec2 randOrientation(vec2 p, float r) {
    float s = sign(mod(r, .5) - .25);
    if(s == 0.) s = 1.;
    return mix(p, p.yx, step(.5, r))*s;
}

vec3 phongModel(vec3 n, float ks, float kn) {
    vec3 nd = n;
	vec3 ld = normalize(u_light_world_pos - world_pos);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka;
    vec3 id = u_kd*max(0., dot(nd, ld));
    vec3 is = vec3(ks)*pow(max(0., dot(nd, hrd)), kn);

    return ia + id + is;
}

void main() {
    if(model_pos.y < 0. && !u_under_zero_rendering)
        discard;

    float sz = 4.;
    float texId = rand(floor(model_pos.xz*sz));
    vec2 texCoord = model_pos.xz*sz;
    //randOrientation(fract(model_pos.xz*sz), texId);
    //color *= texture(u_color_texture_0, texCoord).xyz;
    /*color = mix(color, vec3(

        1. - clamp(abs(model_pos.y)*50., 0., 1.)

    ), .9);*/

    vec3 c0 = texture(u_color_texture_0, texCoord).xyz;
    vec3 c1 = texture(u_color_texture_1, texCoord).xyz;
    vec3 c2 = texture(u_color_texture_2, texCoord).xyz;

    //vec3 n0 = texture(u_normal_texture_0, texCoord).xyz;
    vec3 n1 = texture(u_normal_texture_1, texCoord).xyz;
    //vec3 n2 = texture(u_normal_texture_2, texCoord).xyz;

    float isGravier = 1. - clamp(abs(pow((model_pos.y + .02)*20., 3.)), 0., 1.);

    /*vec3 n = mix(
        mix(n0, n2, step(model_pos.y, 0.)),
        n1,
        isGravier
    );*/
    vec3 n = n1;

    vec3 normal = normalize((world_normal + normalize(n.xzy - .5))*.5);
    vec3 color = phongModel(normal, isGravier, 200.);

    color *= mix(
        mix(c0, c2, step(model_pos.y, 0.)),
        c1,
        isGravier
    );

    oFragmentColor = vec4(color, 1.);
}`;