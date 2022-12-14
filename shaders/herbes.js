"use strict";

herbes.vs_src = `#version 300 es

layout(location = 1) in vec3 position_in;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

uniform float u_number;
uniform float u_time;

uniform sampler2D u_height_texture;

out vec3 world_pos;
out vec3 world_normal;

out float tex_height;
out float instance_random;

float rand(in vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.585); }
vec4 mod289(vec4 g){return g-floor(g*(1./289.))*289.;}vec4 permute(vec4 g){return mod289((g*34.+1.)*g);}vec4 taylorInvSqrt(vec4 g){return 1.79284-.853735*g;}vec2 fade(vec2 g){return g*g*g*(g*(g*6.-15.)+10.);}float cnoise(vec2 g){vec4 v=floor(g.rgrg)+vec4(0.,0.,1.,1.),d=fract(g.rgrg)-vec4(0.,0.,1.,1.);v=mod289(v);vec4 r=v.rbrb,a=v.ggaa,p=d.rbrb,e=d.ggaa,c=permute(permute(r)+a),f=fract(c*(1./41.))*2.-1.,t=abs(f)-.5,b=floor(f+.5);f=f-b;vec2 m=vec2(f.r,t.r),o=vec2(f.g,t.g),l=vec2(f.b,t.b),u=vec2(f.a,t.a);vec4 n=taylorInvSqrt(vec4(dot(m,m),dot(l,l),dot(o,o),dot(u,u)));m*=n.r;l*=n.g;o*=n.b;u*=n.a;float i=dot(m,vec2(p.r,e.r)),x=dot(o,vec2(p.g,e.g)),s=dot(l,vec2(p.b,e.b)),S=dot(u,vec2(p.a,e.a));vec2 I=fade(d.rg),y=mix(vec2(i,s),vec2(x,S),I.r);float q=mix(y.r,y.g,I.g);return 2.3*q;}

vec3 hauteur(in vec3 p) {
    float h = (texture(u_height_texture, clamp(p.xz,-.5,.5) - .5).r - .5)*.5;
    return p + vec3(0., h, 0.);
}

mat2 rot(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }

void main() {
    const float f = 1.;
    const vec2 minMaxHeight = vec2(1.5, 2.7)*f;
    const float scale = .035*f;

    tex_height = position_in.y;

    vec2 distribution = vec2(
        mod(float(gl_InstanceID), u_number),
        float(gl_InstanceID/int(u_number))
    )/u_number - .5;

    vec2 rd = vec2(rand(distribution), rand(distribution*-.678));

    instance_random = rd.x;


    float yScale = minMaxHeight.x + rd.y*(minMaxHeight.y - minMaxHeight.x);

    vec3 p_in = position_in;
    p_in.z += cos(p_in.y*3.)*.3;

    mat2 randomRot = rot(rd.x*rd.y*6.28);
    p_in.xz *= randomRot;

    float windStrenght = 
        cnoise(distribution*2. + u_time*.5)
        *cnoise(distribution*10. + u_time*.5)
        *p_in.y*p_in.y*3.;
    mat2 windRot = rot(windStrenght);
    p_in.xy *= windRot;

    p_in.y *= yScale;

    vec3 normal = vec3(0.,0.,-1.);
    normal.xz *= randomRot;
    normal.xy *= windRot;
    world_normal = normal;
    
    vec3 rawModelPos = vec3(distribution, 0.).xzy;
    vec3 hauteurTerrain = hauteur(rawModelPos);
    float ht = hauteurTerrain.y;
    vec3 modelPos = p_in*(scale*clamp((ht - 0.03)*130., 0., 1.)) + hauteurTerrain;
    vec4 worldPos = u_model*vec4(modelPos, 1.);

    world_pos = worldPos.xyz;

    gl_Position = u_projection*u_view*worldPos;
}`;

herbes.fs_src = `#version 300 es
precision highp float;

out vec4 oFragmentColor;

in float tex_height;
in vec3 world_pos;
in vec3 world_normal;
in float instance_random;

uniform vec3 u_camera_world_pos;
uniform vec3 u_light_dir;
uniform vec3 u_ka;
uniform vec3 u_kd;

vec3 phongModel(vec3 n, float ks, float kn) {
    vec3 nd = n;
	vec3 ld = normalize(u_light_dir);
    vec3 vd = normalize(world_pos - u_camera_world_pos);
    vec3 hrd = normalize(ld - vd);

    vec3 ia = u_ka;
    vec3 id = u_kd*max(0., dot(nd, ld));
    vec3 is = vec3(ks)*pow(max(0., dot(nd, hrd)), kn);

    return (ia*1.5 + id*.75) + is;
}

void main() {
    const vec3 coul1 = vec3(0.208,0.825,0.289);
    const vec3 coul2 = vec3(0.962,1.000,0.410);

    // variation de teinte d'un brin ?? un autre
    vec3 coul3 = mix(coul1, coul2, instance_random);

    // variation de luminosit?? en fonction de la hauteur sur le brin
    vec3 color = mix(
        coul3*vec3(.23,.25,.13),
        coul3,
        tex_height
    );

    color *= phongModel(world_normal, 1., 1.);

    oFragmentColor = vec4(color, 1.);
}`;