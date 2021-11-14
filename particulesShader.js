"use strict";

particules.vs_src = `#version 300 es

layout(location=1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

uniform float u_number;
uniform float u_time;

out vec2 tex_coord;
out vec3 model_pos;
out vec3 world_pos;

float rand(in vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }

vec4 mod289(vec4 g){return g-floor(g*(1./289.))*289.;}vec4 permute(vec4 g){return mod289((g*34.+1.)*g);}vec4 taylorInvSqrt(vec4 g){return 1.79284-.853735*g;}vec2 fade(vec2 g){return g*g*g*(g*(g*6.-15.)+10.);}float cnoise(vec2 g){vec4 v=floor(g.rgrg)+vec4(0.,0.,1.,1.),d=fract(g.rgrg)-vec4(0.,0.,1.,1.);v=mod289(v);vec4 r=v.rbrb,a=v.ggaa,p=d.rbrb,e=d.ggaa,c=permute(permute(r)+a),f=fract(c*(1./41.))*2.-1.,t=abs(f)-.5,b=floor(f+.5);f=f-b;vec2 m=vec2(f.r,t.r),o=vec2(f.g,t.g),l=vec2(f.b,t.b),u=vec2(f.a,t.a);vec4 n=taylorInvSqrt(vec4(dot(m,m),dot(l,l),dot(o,o),dot(u,u)));m*=n.r;l*=n.g;o*=n.b;u*=n.a;float i=dot(m,vec2(p.r,e.r)),x=dot(o,vec2(p.g,e.g)),s=dot(l,vec2(p.b,e.b)),S=dot(u,vec2(p.a,e.a));vec2 I=fade(d.rg),y=mix(vec2(i,s),vec2(x,S),I.r);float q=mix(y.r,y.g,I.g);return 2.3*q;}

float speedVar(vec2 x, float f) {
  return (x.x*4. + cnoise(vec2(x*.8)))*f;
}

mat2 rot(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }

void main() {
    vec2 distribution = vec2(
        mod(float(gl_InstanceID), u_number),
        float(gl_InstanceID/int(u_number))
    )/u_number - .5;

    vec2 rd = vec2(rand(distribution), rand(distribution*-.678));

    vec3 world_camera_right = vec3(u_view[0][0], u_view[1][0], u_view[2][0]);
    vec3 world_camera_up = vec3(u_view[0][1], u_view[1][1], u_view[2][1]);

    const float wind_speed = .01;

    float rd2 = cnoise(vec2(u_time*.2 + rd.y*80.));

    vec3 instance_position = vec3(
        (distribution + .5/u_number + rd/u_number + rd2*.1)*vec2(1., .3),
        speedVar(vec2(u_time + rd.x*200., 0.), wind_speed)
    ).zyx;
    instance_position.x = fract(instance_position.x) - .5;
    instance_position.xz *= rot(-3.14);

	vec3 rawModelPos = position_in*.005;
    vec3 modelPos = instance_position
        + world_camera_right*rawModelPos.x
        + world_camera_up*rawModelPos.y;
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    tex_coord = position_in.xy;
    model_pos = modelPos;
    world_pos = worldPos.xyz;

    gl_Position = u_projection*u_view*worldPos;
}`;

particules.fs_src = `#version 300 es
precision highp float;

in vec2 tex_coord;
in vec3 model_pos;
in vec3 world_pos;

out vec4 oFragmentColor;

mat2 rot(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }

void main() {
    vec2 st = tex_coord;

    float d = length(st) - .5;
    d = 1. - smoothstep(-.5, 0., d);

	oFragmentColor = vec4(vec3(1.), d*d*d);
}`;