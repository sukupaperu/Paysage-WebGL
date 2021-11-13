"use strict";

let skyBox = { };
let terrain = { };
let herbes = { };
let planEau = { };
let sunPosition = Vec3(0,1,0);
let ambiantLight = Vec3(.5); // Vec3(.69*.5, .85*.5, .99*.5);
let sunLight = Vec3(1.); // Vec3(.39, .6, .92);

let model_matrix = Mat4();

function init_wgl() {

    skyBox.shaderProgram = ShaderProgram(skyBox.vs_src, skyBox.fs_src, 'Shader skybox');
    skyBox.mesh = Mesh.Cube().renderer(1);
    skyBox.texture = TextureCubeMap();
    skyBox.texture.load([
		"textures/skybox/skybox1/right.bmp",//droite
		"textures/skybox/skybox1/left.bmp",//gauche
		"textures/skybox/skybox1/top.bmp",//haut
		"textures/skybox/skybox1/bottom.bmp",//bas
		"textures/skybox/skybox1/front.bmp",//avant
		"textures/skybox/skybox1/back.bmp",//arrière
	]);
    // skyBox.texture.load([
	// 	"textures/skybox/skybox2/right.png",//droite
	// 	"textures/skybox/skybox2/left.png",//gauche
	// 	"textures/skybox/skybox2/top.png",//haut
	// 	"textures/skybox/skybox2/bottom.png",//bas
	// 	"textures/skybox/skybox2/back.png",//arrière
	// 	"textures/skybox/skybox2/front.png",//avant
	// ]);
    // skyBox.texture.load([
	// 	"textures/skybox/skybox3/px.webp",//droite
	// 	"textures/skybox/skybox3/nx.webp",//gauche
	// 	"textures/skybox/skybox3/py.webp",//haut
	// 	"textures/skybox/skybox3/ny.webp",//bas
	// 	"textures/skybox/skybox3/pz.webp",//avant
	// 	"textures/skybox/skybox3/nz.webp",//arrière
	// ]);


    terrain.shaderProgram = ShaderProgram(terrain.vs_src, terrain.fs_src, 'Shader grille');
    terrain.mesh = meshGrille(20, terrain.shaderProgram.in.position_in);
        terrain.textures = [];
        terrain.textures[0] = loadTexture("textures/terrain_hm.png");
        terrain.textures[1] = loadTexture("textures/terrain_normal.png");
        terrain.textures[2] = loadTexture("textures/material/terre_albedo.png");
        terrain.textures[3] = loadTexture("textures/material/gravier_albedo.png");
        terrain.textures[4] = loadTexture("textures/material/sable_albedo.png");

        // terrain.textures[5] = loadTexture("textures/material/terre_normal.png");
        terrain.textures[6] = loadTexture("textures/material/gravier_normal.png");
        // terrain.textures[7] = loadTexture("textures/material/sable_normal.png");
    terrain.lightUniforms = lightFeeder(sunPosition, ambiantLight, sunLight);

    herbes.shaderProgram = ShaderProgram(herbes.vs_src, herbes.fs_src, 'Shader herbes');
    herbes.mesh = meshHerbes(8, herbes.shaderProgram.in.position_in, 300);
    herbes.lightUniforms = lightFeeder(sunPosition, ambiantLight, sunLight);
    // herbes.texture = loadTextureWA("textures/material/herbes.png");

    planEau.shaderProgram = ShaderProgram(planEau.vs_src, planEau.fs_src, 'Shader eau');
    planEau.mesh = meshGrille(1, planEau.shaderProgram.in.position_in);
        planEau.textures = [];
        planEau.textures[0] = loadTexture("textures/distortion_map.png");
    planEau.lightUniforms = lightFeeder(sunPosition, ambiantLight, sunLight);
    planEau.textures[1] = initTextureForFBO(0,0);
    planEau.textures[2] = initTextureForFBO(0,0);
    planEau.fbos = initFBOs([planEau.textures[1], planEau.textures[2]]);

    // paramètres WebGL
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);

    // paramètre de scène et de caméra
    ewgl.scene_camera.set_scene_radius(1);
    ewgl.continuous_update = true;
}

function resize_wgl(w, h) { 
    planEau.textures[1].resize(gl.canvas.width, gl.canvas.height);
    planEau.textures[2].resize(gl.canvas.width, gl.canvas.height);
}

function draw_wgl() {
    let view_matrix, skybox_matrix, projection_matrix, camera_world_position;

    for(let pass = 0; pass <= 2; pass++) {
        
        view_matrix = ewgl.scene_camera.get_view_matrix();
        skybox_matrix = ewgl.scene_camera.get_matrix_for_skybox();
        projection_matrix = ewgl.scene_camera.get_projection_matrix();

        switch(pass) {
            case 0:
                planEau.fbos[0].bind();

                let invYmat = Matrix.scale(1.,-1.,1.);
                view_matrix = Matrix.mult(view_matrix, invYmat);
                skybox_matrix = Matrix.mult(skybox_matrix, invYmat);

                gl.disable(gl.CULL_FACE);
                break;
            case 1:
                planEau.fbos[1].bind();

                gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
                break;
            default:
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                break;
        }

        camera_world_position = view_matrix.inverse().position();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        skyBox.shaderProgram.bind();
            Uniforms.u_view_projection = skybox_matrix;
            Uniforms.u_texture_skybox = skyBox.texture.bind(0);
            Uniforms.u_time = ewgl.current_time;
        skyBox.mesh.draw(gl.TRIANGLES);

        terrain.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix, camera_world_position);
            Uniforms.u_height_texture = terrain.textures[0].bind(0);
            Uniforms.u_normal_texture = terrain.textures[1].bind(1);
            Uniforms.u_color_texture_0 = terrain.textures[2].bind(2);
            Uniforms.u_color_texture_1 = terrain.textures[3].bind(3);
            Uniforms.u_color_texture_2 = terrain.textures[4].bind(4);
            
            //Uniforms.u_normal_texture_0 = terrain.textures[5].bind(5);
            Uniforms.u_normal_texture_1 = terrain.textures[6].bind(6);
            //Uniforms.u_normal_texture_2 = terrain.textures[7].bind(7);

            Uniforms.u_under_zero_rendering = pass == 1;
            terrain.lightUniforms(Uniforms);
        terrain.mesh.draw(gl.TRIANGLES);
    
        herbes.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix, camera_world_position);
            Uniforms.u_height_texture = terrain.textures[0].bind(0);
            // Uniforms.u_color_texture = herbes.texture.bind(1);
            herbes.lightUniforms(Uniforms);
        herbes.mesh.draw(gl.TRIANGLES, pass == 2 ? 1 : .75);
    }

    planEau.shaderProgram.bind();
        setMvpUniforms(Uniforms, Matrix.scale(1), view_matrix, projection_matrix, camera_world_position);
        Uniforms.u_time = ewgl.current_time;
        Uniforms.u_resolution = Vec2(gl.canvas.width, gl.canvas.height);

        Uniforms.u_distortion = planEau.textures[0].bind(0);
        Uniforms.u_reflexion = planEau.textures[1].bind(1);
        Uniforms.u_refraction = planEau.textures[2].bind(2);
    planEau.mesh.draw(gl.TRIANGLES);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
	gl.useProgram(null);
}

ewgl.loadRequiredFiles([
    "terrainShaders.js",
    "herbesShader.js",
    "skyBoxShader.js",
    "planEauShader.js",
    "fonctions.js",
], ewgl.launch_3d);

// function hauteur(hc, hw) {
//     return hc - 2*(hc - hw);
// }
/*vm = Matrix.mult(Matrix.translate(0,
    -2.*ewgl.scene_camera.get_view_matrix().inverse().position().y,
0), ewgl.scene_camera.get_view_matrix().inverse()).inverse();*/
/*let infos = ewgl.scene_camera.get_look_info();
let eye = infos[0];
let at = infos[2];
let up = infos[3];
//console.log(eye.y, hauteur(eye.y, 0));
vm = Matrix.look_at(
    Vec3(eye.x, hauteur(eye.y, 0), eye.z),
    at,
    Vec3(up.x, -up.y, up.z)
);*/
//console.log(ewgl.scene_camera.get_view_matrix().inverse().position().y, vm.inverse().position().y);
/*Matrix.mult(Matrix.translate(0,
    -2.*ewgl.scene_camera.get_view_matrix().inverse().position().y,
0), ewgl.scene_camera.get_view_matrix().inverse()).inverse().inverse().position().y*/