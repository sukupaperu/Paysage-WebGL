"use strict";

planEau.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 tex_coord;
out vec2 tex_coord_world;
out vec3 model_pos;
out vec3 world_pos;

void main() {
    vec3 rawModelPos = position_in;
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
/*uniform vec3 u_light_world_pos;
uniform vec3 u_ka;
uniform vec3 u_kd;*/

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_distortion;
uniform sampler2D u_reflexion;
uniform sampler2D u_refraction;
uniform sampler2D u_height_texture;

void main() {
    vec2 distortion = ((texture(u_distortion, tex_coord_world*5. + u_time*.016).xy - .5)*(texture(u_distortion, tex_coord_world*1. - u_time*.04).xy - .5)*(texture(u_distortion, tex_coord_world*.5 + u_time*.02).xy - .5)*.8);

    float dist = (texture(u_height_texture, clamp(tex_coord_world,-.5,.5) - .5).r - .5);
    dist = smoothstep(.1, -.1, dist + .01);
    dist = (1. - dist)*cos(dist*20. + u_time*4.);
    distortion -= dist*.01;
    distortion *= .8;

    vec2 screen_pos = gl_FragCoord.xy/u_resolution.xy;

    float lgt = clamp(length(max(abs(screen_pos - .5) - .49, 0.)) - .01,0.,1.); // pour réduire distortions sur les bords de l'écran

    vec3 normal = normalize(vec3(0., 1., 0.) + vec3(distortion, 1.).xzy);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    float a = clamp(dot(vd, normal)*.5 + .5, 0., 1.);

    vec2 d_screen_pos = screen_pos + distortion*(1. - lgt);
    vec3 refraction = texture(u_refraction, d_screen_pos).rgb - vec3(.1,.1,.025);
    vec3 reflexion = texture(u_reflexion, d_screen_pos).rgb - .01;
    vec3 color = mix(refraction, reflexion, clamp(a*a*6., .05, 1.));

    //color = mix(color, vec3(step(-0.5, tex_coord_world), 1.), .99);

    oFragmentColor = vec4(color, 1.);
}`;