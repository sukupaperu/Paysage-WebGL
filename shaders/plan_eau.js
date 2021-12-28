"use strict";

plan_eau.vs_src = `#version 300 es

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

plan_eau.fs_src = `#version 300 es
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
    return (texture(s, tex_coord_world*5. + u_time*.1).xy + texture(s, tex_coord_world*.5 - u_time*.04).xy)/2. - .5;
}

float carre_dist(vec2 p) {
    p = abs(p);
    return max(p.x, p.y)-.5;
}

void main() {
    // calcul de la distance (aproximative) par rapport à l'île
    float dist_ile = smoothstep(.1, -.1, (texture(u_height_texture, clamp(tex_coord_world,-.5,.5) - .5).r - .5) + .01);
    dist_ile = (1. - dist_ile)*cos(dist_ile*30. + u_time*4.);

    // calcul de la distortion avec la distortion map
    vec2 distortion = getDistortion(u_distortion)*.01;
    distortion -= dist_ile*.01;

    // informations de géométrie/coordonnées
    vec2 screen_pos = gl_FragCoord.xy/u_resolution.xy;
    vec3 normal = normalize(vec3(0.,1.,0.) + vec3(distortion, 1.).xzy);
    vec3 view_dir = normalize(world_pos - u_camera_world_pos);

    // calcul d'une distance (approximative) par rapport aux bords de l'écran
    float distance_bords_ecran = smoothstep(0., -.01, carre_dist(screen_pos - .5));
    // application de la distortion sur la normale
    vec2 d_screen_pos = screen_pos + distortion*distance_bords_ecran;

    vec3 refraction = texture(u_refraction, d_screen_pos).rgb*vec3(.6,.6,.8); //vec3(.6,.1,.1)
    vec3 reflexion = texture(u_reflexion, d_screen_pos).rgb*.99;
    
    // calcul coef de fresnel
    float a = dot(view_dir, normal)*.5 + .5;
    vec3 color = mix(refraction, reflexion, 
        clamp(pow(a*2.,1.5), .05, .98) // réflectivité max à 98% et min à 5%
    );

    // spéculaire
    vec3 light_dir = normalize(u_light_dir);
    vec3 hrd = normalize(light_dir - view_dir);
    float spec = pow(max(dot(normal, hrd), 0.), 10e3)*.5;
    color += spec;

    oFragmentColor = vec4(color, 1.);
}`;