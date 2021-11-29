"use strict";

skyBox.vs_src = `#version 300 es

layout(location=1) in vec3 position_in;

uniform mat4 u_view_projection;

out vec3 tex_coord;

void main() {
	gl_Position = u_view_projection*vec4(tex_coord = position_in, 1.0);
}`;

skyBox.fs_src = `#version 300 es
precision highp float;

in vec3 tex_coord;

out vec4 oFragmentColor;

uniform samplerCube u_texture_skybox_0;
uniform samplerCube u_texture_skybox_1;

uniform float u_time;

mat2 rot(float a) { return mat2(cos(a),sin(a),-sin(a),cos(a)); }
float anim1(float x, float sm){ float xmd = mod(x,2.) - .5; return smoothstep(-sm,sm,xmd) - smoothstep(-sm,sm,xmd - 1.); }

void main() {
	vec3 st = tex_coord;
	st.xz *= rot(u_time*.01);

	vec3 c0 = texture(u_texture_skybox_0, st).rgb;
	vec3 c1 = texture(u_texture_skybox_1, st).rgb;

	float a = abs(atan(st.x, st.z))*.5;
	vec3 c = mix(c0, c1, anim1(u_time*.1 + a, .2));

	oFragmentColor = vec4(c, 1.);
}`;