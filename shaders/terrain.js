"use strict";

terrain.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform sampler2D u_height_texture;

out vec2 tex_coord;
out vec3 model_pos;
out vec3 world_pos;
out vec3 world_normal;

vec3 hauteur(in vec3 p) {
    float h = (texture(u_height_texture, clamp(p.xz,-.5,.5) - .5).r - .5)*.5;
    return p + vec3(0., h, 0.);
}

vec3 worldNormal(vec3 rawModelPos, vec3 p) {
    vec2 sh = vec2(0., 1./80.); // on s'assure d'avoir une valeur assez petite pour déterminer les points voisins
    vec3 a = hauteur(rawModelPos + sh.yxx);
    vec3 b = hauteur(rawModelPos - sh.xxy);
    return normalize(mat3(u_model)*cross(a - p, b - p));
}

void main() {
    vec3 rawModelPos = position_in;
    vec3 modelPos = hauteur(rawModelPos);
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = rawModelPos.xz;
    model_pos = modelPos;
    world_pos = worldPos.xyz;
    world_normal = worldNormal(rawModelPos, modelPos);

    gl_Position = u_projection*u_view*worldPos;
}`;

terrain.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in vec2 tex_coord;
in vec3 model_pos;
in vec3 world_pos;
in vec3 world_normal;

uniform vec3 u_camera_world_pos;
uniform vec3 u_light_dir;
uniform vec3 u_ka;
uniform vec3 u_kd;

uniform sampler2D u_color_texture_0;
uniform sampler2D u_color_texture_1;
uniform sampler2D u_color_texture_2;
uniform sampler2D u_normal_texture_1;

// uniform bool u_under_water_rendering;
uniform bool u_under_water_only;
uniform bool u_above_water_only;

vec3 phongModel(vec3 n, float ks, float kn) {
    vec3 nd = n;
	vec3 ld = normalize(u_light_dir);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka;
    vec3 id = u_kd*max(0., dot(nd, ld));
    vec3 is = vec3(ks)*pow(max(0., dot(nd, hrd)), kn);

    return ia + id + is;
}

void main() {
    /*if(!u_under_water_rendering && world_pos.y < 0.)
        discard;*/
    if(u_under_water_only && world_pos.y > 0.)
        discard;
    if(u_above_water_only && world_pos.y < 0.)
        discard;

    const float sz = 20.;
    vec2 texCoord = tex_coord*sz;
    float isGravier = 1. - clamp(abs(pow((model_pos.y + .02)*20., 3.)), 0., 1.);

    vec3 n = texture(u_normal_texture_1, texCoord).xyz;
    vec3 normal = normalize((world_normal + normalize(n.xzy - .5))*.5);

    vec3 c0 = texture(u_color_texture_0, texCoord).xyz;
    vec3 c1 = texture(u_color_texture_1, texCoord).xyz;
    vec3 c2 = texture(u_color_texture_2, texCoord).xyz;

    vec3 color = phongModel(normal, isGravier, 10.)
        *mix(mix(c0, c2, step(model_pos.y, 0.)), c1, isGravier);

    color += min(0., -model_pos.y*model_pos.y*10.)*vec3(1.,1.,.6);

    oFragmentColor = vec4(color, 1.);
}`;