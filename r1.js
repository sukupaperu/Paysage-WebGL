"use strict";

var vertexShader =
`#version 300 es

layout(location = 1) in vec3 position_in;

out vec3 modelPos;
out vec3 worldPos;
out vec3 normal;

uniform float uTime;
uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform int gridSize;

mat2 rot(in float a) {
	return mat2(cos(a),sin(a),-sin(a),cos(a));
}

vec4 mod289(vec4 g){return g-floor(g*(1./289.))*289.;}vec4 permute(vec4 g){return mod289((g*34.+1.)*g);}vec4 taylorInvSqrt(vec4 g){return 1.79284-.853735*g;}vec2 fade(vec2 g){return g*g*g*(g*(g*6.-15.)+10.);}float cnoise(vec2 g){vec4 v=floor(g.rgrg)+vec4(0.,0.,1.,1.),d=fract(g.rgrg)-vec4(0.,0.,1.,1.);v=mod289(v);vec4 r=v.rbrb,a=v.ggaa,p=d.rbrb,e=d.ggaa,c=permute(permute(r)+a),f=fract(c*(1./41.))*2.-1.,t=abs(f)-.5,b=floor(f+.5);f=f-b;vec2 m=vec2(f.r,t.r),o=vec2(f.g,t.g),l=vec2(f.b,t.b),u=vec2(f.a,t.a);vec4 n=taylorInvSqrt(vec4(dot(m,m),dot(l,l),dot(o,o),dot(u,u)));m*=n.r;l*=n.g;o*=n.b;u*=n.a;float i=dot(m,vec2(p.r,e.r)),x=dot(o,vec2(p.g,e.g)),s=dot(l,vec2(p.b,e.b)),S=dot(u,vec2(p.a,e.a));vec2 I=fade(d.rg),y=mix(vec2(i,s),vec2(x,S),I.r);float q=mix(y.r,y.g,I.g);return 2.3*q;}

vec3 newCoord(in vec3 p) {
	float t = uTime*0.;
    p.y += (cnoise(p.xz*2. + t*.1)*.21 + cnoise(p.xz*8. + t*.01)*.02 + cnoise(p.xz*20. - t*.01)*.01);
    // p.y += fract(length(min(p.z,p.x))*8.)/80.;
    return p;
}
// MAIN PROGRAM
out float j;
void main() {
    j = uTime;

	vec3 stu = position_in;

    vec3 p = newCoord(stu);
	vec4 worldPosition = M*vec4(p, 1.);

	modelPos = p; //(inverse(M)*worldPosition).xyz
    worldPos = (worldPosition).xyz;

    vec2 sh = vec2(1./float(gridSize), 0.);
	vec3 A = newCoord(stu + sh.xyy);
	vec3 B = newCoord(stu - sh.yyx);

	vec3 C = newCoord(stu - sh.xyy);
	vec3 D = newCoord(stu + sh.yyx);

	vec3 e = cross(A - p, B - p)
		+ cross(B - p, C - p)
		+ cross(C - p, D - p)
		+ cross(D - p, A - p);

    normal = normalize(mat3(V*M)*cross(A - p, B - p));
	if(p.x < cos(uTime*4.)*.25)
    	normal = normalize(mat3(V*M)*e);

	gl_Position = P*V*worldPosition;
}
`;

var fragmentShader =
`#version 300 es
precision highp float;

out vec4 oFragmentColor;
in vec3 modelPos;
in vec3 worldPos;
in vec3 normal;

uniform vec3 uCameraPosition;

mat2 rot(in float a) {
	return mat2(cos(a),sin(a),-sin(a),cos(a));
}

// MAIN PROGRAM
void main() {
	vec3 c = vec3(0.);

    vec3 n = normal;
    vec3 view = normalize(worldPos - uCameraPosition);
    vec3 lightPos = vec3(-2.,0.,2.0);
    vec3 ld = normalize(lightPos - worldPos);
    vec3 c1 = vec3(0.315,0.419,0.870);

    vec3 lightPos2 = vec3(2.,0.,2.0);
    vec3 ld2 = normalize(lightPos2 - worldPos);
    vec3 c2 = vec3(1.8);

    float d = distance(worldPos, lightPos);
    float d2 = distance(worldPos, lightPos2);
    c = vec3(
        max(0., dot(ld, n))/d
        + pow(max(0., dot(n, -normalize(view - ld))), 160.)
    )*c1 + vec3(
        max(0., dot(ld2, n))/d2
        + pow(max(0., dot(n, -normalize(view - ld2))), 500.)
    )*c2;
    c = mix(fract(view*10.), n, .999);
	oFragmentColor = vec4(c, 1);
}
`;

//--------------------------------------------------------------------------------------------------------
// Global variables
//--------------------------------------------------------------------------------------------------------
var shaderProgram = null;
var vao = null;
// GUI (graphical user interface)
// - mesh color

let nbTriangles;
let gridSize;

//--------------------------------------------------------------------------------------------------------
// Initialize graphics objects and GL states
//
// Here, we want to display a square/rectangle on screen
// Uniforms are used to be able edit GPU data with a customized GUI (graphical user interface)
//--------------------------------------------------------------------------------------------------------
function init_wgl()
{
	// ANIMATIONS // [=> Sylvain's API]
	// - if animations, set this internal variable (it will refresh the window everytime)
	ewgl.continuous_update = true;
	
	// CUSTOM USER INTERFACE
	// - used with "uniform" variables to be able to edit GPU constant variables
	UserInterface.begin("",true,true); // name of html id
		// MESH COLOR
	    // - container (H: horizontal)
		//UserInterface.use_field_set('H', "Mesh Color");
		// - sliders (name, min, max, default value, callback called when value is modified)
		// - update_wgl() is caleld to refresh screen
		UserInterface.end_use();
	UserInterface.end();
	
	// Create and initialize a shader program // [=> Sylvain's API - wrapper of GL code]
	shaderProgram = ShaderProgram(vertexShader, fragmentShader, 'basic shader');


	let sz = gridSize = 150;
	let nb_w_grille = sz;
	let nb_l_grille = sz;
	let vertices_list = [];
	for(let i = 0; i <= nb_w_grille; i++)
		for(let j = 0; j <= nb_l_grille; j++)
			vertices_list.push(i/nb_w_grille - .5, 0., j/nb_l_grille - .5);
	let data_vertices = new Float32Array(vertices_list);

	let indices_list = [];
	nbTriangles = nb_w_grille*nb_l_grille*2;
	for(let i = 0; i < (nb_w_grille + 1)*nb_l_grille; i += i%(nb_w_grille + 1) < (nb_w_grille - 1) ? 1 : 2)
		indices_list.push(
			i + (nb_w_grille + 1), i + 1, i,
			i + 1, i + (nb_w_grille + 1), i + (nb_w_grille + 2)
		);
	let data_indices = new Uint32Array(indices_list);

	// - create a VBO (kind of memory pointer or handle on GPU)
	let vbo_vertices = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vertices); 
	gl.bufferData(gl.ARRAY_BUFFER, data_vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	let ebo_indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo_indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data_indices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// Create ande initialize a vertex array object (VAO) [it is a "container" of vertex buffer objects (VBO)]
	// - create a VAO (kind of memory pointer or handle on GPU)
	vao = gl.createVertexArray();
	// - bind "current" VAO
	gl.bindVertexArray(vao);
	// - bind "current" VBO
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vertices);
	// - attach VBO to VAO
	// - tell how data is stored in "current" VBO in terms of size and format.
	// - it specifies the "location" and data format of the array of generic vertex attributes at "index" ID to use when rendering
	let vertexAttributeID = 1; // specifies the "index" of the generic vertex attribute to be modified
	let dataSize = 3; // 2 for 2D positions. Specifies the number of components per generic vertex attribute. Must be 1, 2, 3, 4.
	let dataType = gl.FLOAT; // data type
	gl.vertexAttribPointer(vertexAttributeID, dataSize, dataType,
	                        false, 0, 0); // unused parameters for the moment (normalized, stride, pointer)
	// - enable the use of VBO. It enable or disable a generic vertex attribute array
	gl.enableVertexAttribArray(vertexAttributeID);
	//gl.bindBuffer(enum_target, WebGLBuffer_buffer)
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo_indices);

	// Reset GL states
	gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // BEWARE: only unbind the VBO after unbinding the VAO !
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// Set default GL states
	// - color to use when refreshing screen
	gl.clearColor(0, 0, 0,1); // black opaque [values are between 0.0 and 1.0]
	// - no depth buffer
	// gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.DEPTH_TEST);

	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.FRONT);
}

//--------------------------------------------------------------------------------------------------------
// Render scene
//--------------------------------------------------------------------------------------------------------
function draw_wgl() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	shaderProgram.bind();

	Uniforms.uTime = ewgl.current_time;
    Uniforms.gridSize = gridSize;
	Uniforms.M = Matrix.rotateX(Math.cos(ewgl.current_time*2.*0+Math.PI)*20. + 90);

    /*Uniforms.V = ewgl.scene_camera.get_view_matrix();
    Uniforms.uCameraPosition = ewgl.scene_camera.get_view_matrix().inverse().position();
	Uniforms.P = ewgl.scene_camera.get_projection_matrix();*/

	let camPos = Vec3(0.,0.,1.);
	Uniforms.V = Matrix.look_dir(camPos, Vec3(0.,0.,-1.), Vec3(0.,1.,0.));
    Uniforms.uCameraPosition = camPos;
	Uniforms.P = Matrix.perspective(Math.PI/2., canvas.width/canvas.height, .1, 10.);
	//Uniforms.P = Matrix.ortho(canvas.width/canvas.height, .01, 10.);

	gl.bindVertexArray(vao);
	

	gl.drawElements(gl.TRIANGLES, nbTriangles*3, gl.UNSIGNED_INT, 0);

	gl.bindVertexArray(null);
	gl.useProgram(null);
}

ewgl.launch_3d();
