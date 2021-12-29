"use strict";

croix.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;
layout(location = 2) in vec3 normal_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 world_pos;
out vec3 world_normal;

float rand(in vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }
mat2 rot(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }

void main() {
    vec3 p_in = position_in;
    vec3 n_in = normal_in;

    float i_ID = float(gl_InstanceID);

    float dist = mix(.1, 6., rand(vec2(i_ID*vec2(-1.151,2.15))));
    float inclin = (rand(vec2(i_ID*vec2(8.5,1.15))) - .5)*.4;
    float angle = mix(0., 6.28, rand(vec2(i_ID*vec2(6.255,-.48815))));
    float size = mix(.75, 1., rand(vec2(i_ID*vec2(2.37,5.89))));
    float hauteur = rand(vec2(i_ID*vec2(6.151,412.2)))*.1;

    p_in.y -= hauteur + .01;
    p_in *= size*sqrt((dist - 1.));
    p_in.xy *= rot(inclin);
    p_in.z += dist*dist*.5;
    p_in.xz *= rot(angle);

    n_in.xy *= rot(inclin);
    n_in.xz *= rot(angle);

    vec3 rawModelPos = p_in;
    vec3 modelPos = rawModelPos;
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    world_pos = worldPos.xyz;
    world_normal = normalize(n_in);

    gl_Position = u_projection*u_view*worldPos;
}`;

croix.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in vec3 world_pos;
in vec3 world_normal;

uniform vec3 u_camera_world_pos;
uniform vec3 u_light_dir;
uniform vec3 u_ka;
uniform vec3 u_kd;

uniform bool u_under_water_only;
uniform bool u_above_water_only;

vec3 phongModel(vec3 n, float ks, float kn) {
    vec3 nd = n;
	vec3 ld = normalize(-u_light_dir);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka;
    vec3 id = u_kd*max(0., dot(nd, ld));
    vec3 is = vec3(ks)*pow(max(0., dot(nd, hrd)), kn);

    return (ia*1.5 + id*.75) + is;
}

void main() {
    if(u_under_water_only && world_pos.y > 0.)
        discard;
    if(u_above_water_only && world_pos.y < 0.)
        discard;

    vec3 c = phongModel(world_normal, 0., 0.);
    c = mix(.5*c, c, smoothstep(-.2,.2,world_pos.y));

    oFragmentColor = vec4(c, 1.);
}`;