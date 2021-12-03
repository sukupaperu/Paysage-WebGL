"use strict";

planEau.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_time;

out vec2 tex_coord;
out vec2 tex_coord_world;
out vec3 model_pos;
out vec3 world_pos;

void main() {
    vec3 rawModelPos = position_in + cos(u_time)*10e-6;
    vec3 modelPos = rawModelPos;
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = modelPos.xz - .5;
    tex_coord_world = worldPos.xz;
    model_pos = modelPos;
    world_pos = worldPos.xyz;

    gl_Position = u_projection*u_view*worldPos;
}`;

planEau.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in vec2 tex_coord;
in vec2 tex_coord_world;
in vec3 model_pos;
in vec3 world_pos;

uniform vec3 u_camera_world_pos;
uniform vec3 u_light_dir;
uniform vec3 u_ka;
uniform vec3 u_kd;

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler2D u_distortion;
uniform sampler2D u_height_texture;

uniform sampler2D u_reflexion;
uniform sampler2D u_refraction;

vec2 getDistortion(sampler2D s) {
    return (texture(s, tex_coord_world*5. + u_time*.06).xy + texture(s, tex_coord_world - u_time*.04).xy)/2. - .5;
}

void main() {
    // calcul de la distortion
    vec2 distortion = getDistortion(u_distortion)*.01;
    float dist = smoothstep(.1, -.1, (texture(u_height_texture, clamp(tex_coord_world,-.5,.5) - .5).r - .5) + .01);
    dist = (1. - dist)*cos(dist*10. + u_time*4.);
    distortion -= dist*.01;

    // Informations de géométrie
    vec2 screen_pos = gl_FragCoord.xy/u_resolution.xy;
    vec3 normal = normalize(vec3(0.,1.,0.) + vec3(distortion, 1.).xzy);
    vec3 view_dir = normalize(world_pos - u_camera_world_pos);

    // application de la distortion sur la normale
    vec2 d_screen_pos = screen_pos + distortion;

    vec3 refraction = texture(u_refraction, d_screen_pos).rgb*vec3(.6,.1,.1); //vec3(.6,.6,.8)
    vec3 reflexion = texture(u_reflexion, d_screen_pos).rgb*.99;
    
    // Angle pour calculer le coef de fresnel
    float a = dot(view_dir, normal)*.5 + .5;
    vec3 color = mix(refraction, reflexion, clamp(pow(a*2.,1.5), .05, 1.));

    vec3 light_dir = normalize(vec3(10., 8., 0));
    vec3 hrd = normalize(light_dir - view_dir);
    float cc = pow(max(dot(normal, hrd),0.),10e3)*.2;
    //color = mix(color, vec3(cc), .99);
    color += cc;

    float d = distance(u_camera_world_pos, world_pos);
    

    oFragmentColor = vec4(color, 1.);
}`;