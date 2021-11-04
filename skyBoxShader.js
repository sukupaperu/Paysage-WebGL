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

uniform vec3 uMeshColor;
uniform samplerCube u_texture_skybox;

void main() {
	oFragmentColor = vec4(texture(u_texture_skybox, tex_coord).rgb, 1.);
}`;