"use strict";

let skyBox = { };
let terrain = { };
let herbes = { };
let planEau = { };
let sunPosition = Vec3(0, 1, 0);
let ambiantLight = Vec3(.39, .6, .92);

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


    terrain.shaderProgram = ShaderProgram(terrain.vs_src, terrain.fs_src, 'Shader grille');
    terrain.mesh = meshGrille(50, terrain.shaderProgram.in.position_in);
        terrain.textures = [];
        terrain.textures[0] = Texture2d();
        terrain.textures[0].simple_params(gl.LINEAR, gl.REPEAT);
        terrain.textures[0].load("textures/grass.png");
            terrain.textures[1] = Texture2d();
            terrain.textures[1].simple_params(gl.LINEAR, gl.REPEAT);
            terrain.textures[1].load("textures/terrain_hm.png");
                terrain.textures[2] = Texture2d();
                terrain.textures[2].simple_params(gl.LINEAR, gl.REPEAT);
                terrain.textures[2].load("textures/terrain_normal.png");
    terrain.lightUniforms = lightFeeder(
        sunPosition,
        ambiantLight, Vec3(.8), Vec3(.2), 8
    );

    herbes.shaderProgram = ShaderProgram(herbes.vs_src, herbes.fs_src, 'Shader herbes');
    herbes.mesh = meshHerbes(5, herbes.shaderProgram.in.position_in, 200);
    herbes.lightUniforms = lightFeeder(
        sunPosition,
        ambiantLight, Vec3(1.), Vec3(.5), 2
    );

    planEau.shaderProgram = ShaderProgram(planEau.vs_src, planEau.fs_src, 'Shader eau');
    planEau.mesh = meshGrille(1, planEau.shaderProgram.in.position_in);
        planEau.textures = [];
        planEau.textures[0] = Texture2d();
        planEau.textures[0].simple_params(gl.LINEAR, gl.REPEAT);
        planEau.textures[0].load("textures/distortion_map.png");
            planEau.lightUniforms = lightFeeder(
                sunPosition,
                Vec3(0.), Vec3(0.), Vec3(.8), 800
            );
    planEau.textures[1] = fboTexture(canvas);
    planEau.textures[2] = fboTexture(canvas);
    planEau.fbos = fbo(
        [planEau.textures[1], planEau.textures[2]]
    );

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);

    ewgl.scene_camera.set_scene_radius(2);
    ewgl.continuous_update = true;
}

function draw_wgl() {
    for(let pass = 0; pass <= 2; pass++) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    
        switch(pass) {
            case 0:
                gl.bindFramebuffer(gl.FRAMEBUFFER, planEau.fbos[0]);
                gl.viewport(0, 0, canvas.width, canvas.height);
                break;
            case 1:
                gl.bindFramebuffer(gl.FRAMEBUFFER, planEau.fbos[1]);
                gl.viewport(0, 0, canvas.width, canvas.height);
                break;
            default:
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, canvas.width, canvas.height);
                break;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        skyBox.shaderProgram.bind();
            Uniforms.u_view_projection = ewgl.scene_camera.get_matrix_for_skybox();
            Uniforms.u_texture_skybox = skyBox.texture.bind(1);
        skyBox.mesh.draw(gl.TRIANGLES);
    
        terrain.shaderProgram.bind();
            Uniforms.u_model = model_matrix;
            Uniforms.u_view = ewgl.scene_camera.get_view_matrix();
            Uniforms.u_projection = ewgl.scene_camera.get_projection_matrix();
            Uniforms.u_camera_world_pos = ewgl.scene_camera.get_view_matrix().inverse().position();
            
            Uniforms.u_color_texture = terrain.textures[0].bind(0);
            Uniforms.u_height_texture = terrain.textures[1].bind(1);
            Uniforms.u_normal_texture = terrain.textures[2].bind(2);
            terrain.lightUniforms(Uniforms);
        terrain.mesh.draw(gl.TRIANGLES);
    
        herbes.shaderProgram.bind();
            Uniforms.u_model = model_matrix;
            Uniforms.u_view = ewgl.scene_camera.get_view_matrix();
            Uniforms.u_projection = ewgl.scene_camera.get_projection_matrix();
            Uniforms.u_camera_world_pos = ewgl.scene_camera.get_view_matrix().inverse().position();
    
            Uniforms.u_height_texture = terrain.textures[1].bind(1);
            herbes.lightUniforms(Uniforms);
        herbes.mesh.draw(gl.TRIANGLES);
    }

    planEau.shaderProgram.bind();
        Uniforms.u_model = Matrix.mult(model_matrix, Matrix.scale(2), Matrix.translate(0, .01, 0));
        Uniforms.u_view = ewgl.scene_camera.get_view_matrix();
        Uniforms.u_projection = ewgl.scene_camera.get_projection_matrix();
        Uniforms.u_camera_world_pos = ewgl.scene_camera.get_view_matrix().inverse().position();
        Uniforms.u_time = ewgl.current_time;

        Uniforms.u_distortion = planEau.textures[0].bind(0);
        // Uniforms.u_texture_skybox = skyBox.texture.bind(1);
        // planEau.lightUniforms(Uniforms);
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