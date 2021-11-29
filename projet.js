"use strict";

function initMeshObject() {
    return {
        vs_src: "",
        fs_src: "",
        shaderProgram: null,
        mesh: null,
        textures: [],
        texture: null,
        renderBuffer: null,
        fbos: []
    };
}

const nb_herbes = 300;
const nb_particules = 5;

const skyBox = initMeshObject();
const terrain = initMeshObject();
const herbes = initMeshObject();
const planEau = initMeshObject();
const particules = initMeshObject();
const fx = initMeshObject();

const lights = {
    direction: Vec3(10, 8, 0),
    ambiant: Vec3(.5),
    diffuse: Vec3(1)
};
const model_matrix = Mat4();

function init_wgl() {

    skyBox.shaderProgram = ShaderProgram(skyBox.vs_src, skyBox.fs_src, 'Shader skybox');
    skyBox.mesh = Mesh.Cube().renderer(1);
    skyBox.textures[0] = TextureCubeMap();
    skyBox.textures[0].load(["textures/skybox/skybox1/right.bmp", "textures/skybox/skybox1/left.bmp", "textures/skybox/skybox1/top.bmp", "textures/skybox/skybox1/bottom.bmp", "textures/skybox/skybox1/front.bmp", "textures/skybox/skybox1/back.bmp"]);
    skyBox.textures[1] = TextureCubeMap();
    //skyBox.textures[1].load([ "textures/skybox/skybox3/px.webp", "textures/skybox/skybox3/nx.webp", "textures/skybox/skybox3/py.webp", "textures/skybox/skybox3/ny.webp", "textures/skybox/skybox3/pz.webp", "textures/skybox/skybox3/nz.webp"]);
    skyBox.textures[1].load([ "textures/skybox/skybox2/right.png", "textures/skybox/skybox2/left.png", "textures/skybox/skybox2/top.png", "textures/skybox/skybox2/bottom.png", "textures/skybox/skybox2/back.png", "textures/skybox/skybox2/front.png"]);

    terrain.shaderProgram = ShaderProgram(terrain.vs_src, terrain.fs_src, 'Shader terrain');
    terrain.mesh = meshGrille(30, terrain.shaderProgram.in.position_in, true, 50);
    terrain.textures[0] = loadTexture("textures/terrain_hm.png", gl.R8);
    terrain.textures[1] = loadTexture("textures/material/terre_albedo.png");
    terrain.textures[2] = loadTexture("textures/material/gravier_albedo.png");
    terrain.textures[3] = loadTexture("textures/material/sable_albedo.png");
    //terrain.textures[5] = loadTexture("textures/material/terre_normal.png");
    terrain.textures[6] = loadTexture("textures/material/gravier_normal.png");
    //terrain.textures[7] = loadTexture("textures/material/sable_normal.png");

    herbes.shaderProgram = ShaderProgram(herbes.vs_src, herbes.fs_src, 'Shader herbes');
    herbes.mesh = meshHerbes(4, nb_herbes, herbes.shaderProgram.in.position_in);
    // herbes.texture = loadTextureWA("textures/material/herbes.png");

    planEau.shaderProgram = ShaderProgram(planEau.vs_src, planEau.fs_src, 'Shader eau');
    planEau.mesh = meshGrille(1, planEau.shaderProgram.in.position_in);
    planEau.textures[0] = loadTexture("textures/distortion_map.png", gl.RG8);
    // planEau.textures[1] = loadTexture("textures/normal_map.png");
    planEau.textures[1] = initTextureForFBO();
    planEau.textures[2] = initTextureForFBO();
    planEau.fbos = initFBOs([1,2].map(i => planEau.textures[i]));
    planEau.renderBuffer = initRenderbufferForFBO(planEau.fbos[0].id);
    
    particules.shaderProgram = ShaderProgram(particules.vs_src, particules.fs_src, 'Shader particules');
    particules.mesh = meshParticules(nb_particules, particules.shaderProgram.in.position_in);

    fx.shaderProgram = ShaderProgram(fx.vs_src, fx.fs_src, 'Shader fx');
    fx.texture = initTextureForFBO();
    fx.fbos = initFBOs([fx.texture]);
    fx.renderBuffer = initRenderbufferForFBO(fx.fbos[0].id);

    // paramètres WebGL
    gl.clearColor(0, 0, 0, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.cullFace(gl.FRONT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // paramètre de scène et de caméra
    ewgl.scene_camera.set_scene_radius(100);
    ewgl.continuous_update = true;
    ewgl.scene_camera.look(Vec3(0.,.5,-2.), Vec3(0.,-.5,2.), Vec3(0.,1.,0.));
}

function resize_wgl(w, h) {
    [0,1].map(i => planEau.fbos[i].resize(w, h));
	gl.bindRenderbuffer(gl.RENDERBUFFER, planEau.renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);

    fx.texture.resize(w, h);
	gl.bindRenderbuffer(gl.RENDERBUFFER, fx.renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
}

function draw_wgl() {
    let view_matrix, skybox_matrix, projection_matrix;
        
    /*view_matrix = ewgl.scene_camera.get_view_matrix();
    projection_matrix = ewgl.scene_camera.get_projection_matrix();*/

    /*
        pass 0 : rendu reflexion
        pass 1 : rendu refraction
        pass 2 : rendu fx
    */
   for(let pass = 0; pass <= 2; pass++) {
        
        view_matrix = ewgl.scene_camera.get_view_matrix();
        skybox_matrix = ewgl.scene_camera.get_matrix_for_skybox();
        projection_matrix = ewgl.scene_camera.get_projection_matrix();

        switch(pass) {
            case 0:
                planEau.fbos[0].bind();
                const invYmat = Matrix.scale(1., -1., 1.);
                view_matrix = Matrix.mult(view_matrix, invYmat);
                skybox_matrix = Matrix.mult(skybox_matrix, invYmat);
                gl.disable(gl.CULL_FACE);
                break;
            case 1:
                planEau.fbos[1].bind();
                gl.enable(gl.CULL_FACE);
                break;
            case 2:
                // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                fx.fbos[0].bind();
                break;
        }
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        skyBox.shaderProgram.bind();
            setTimeUniform(Uniforms);
            Uniforms.u_view_projection = skybox_matrix;
            Uniforms.u_texture_skybox_0 = skyBox.textures[0].bind(0);
            Uniforms.u_texture_skybox_1 = skyBox.textures[1].bind(1);
        skyBox.mesh.draw(gl.TRIANGLES);

        terrain.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
            setCameraPosUniform(Uniforms, view_matrix);
            setLightUniforms(Uniforms, lights);
            Uniforms.u_height_texture = terrain.textures[0].bind(0);
            Uniforms.u_color_texture_0 = terrain.textures[1].bind(1);
            Uniforms.u_color_texture_1 = terrain.textures[2].bind(2);
            Uniforms.u_color_texture_2 = terrain.textures[3].bind(3);
            //Uniforms.u_normal_texture_0 = terrain.textures[5].bind(5);
            Uniforms.u_normal_texture_1 = terrain.textures[6].bind(6);
            // Uniforms.u_normal_texture_2 = terrain.textures[7].bind(7);
            Uniforms.u_under_zero_rendering = pass >= 1;
        terrain.mesh.draw(gl.TRIANGLES);
        
        if(pass !== 1) {
            herbes.shaderProgram.bind();
                setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
                setCameraPosUniform(Uniforms, view_matrix);
                setLightUniforms(Uniforms, lights);
                setTimeUniform(Uniforms);
                Uniforms.u_height_texture = terrain.textures[0].bind(0);
                // Uniforms.u_color_texture = herbes.texture.bind(1);
            herbes.mesh.draw(gl.TRIANGLES, pass === 2 ? 1 : .5);
        }
    }

    planEau.shaderProgram.bind();
        setMvpUniforms(Uniforms, Matrix.scale(100), view_matrix, projection_matrix);
        setCameraPosUniform(Uniforms, view_matrix);
        // setLightUniforms(Uniforms, lights);
        setTimeUniform(Uniforms);
        setResolutionUniform(Uniforms, gl);
        Uniforms.u_distortion = planEau.textures[0].bind(0);
        Uniforms.u_reflexion = planEau.textures[1].bind(1);
        Uniforms.u_refraction = planEau.textures[2].bind(2);
        Uniforms.u_height_texture = terrain.textures[0].bind(3);
    planEau.mesh.draw(gl.TRIANGLES);

    particules.shaderProgram.bind();
    setMvpUniforms(Uniforms, Matrix.translate(0,.15,0), view_matrix, projection_matrix);
    setTimeUniform(Uniforms);
    particules.mesh.draw(gl.TRIANGLES);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    fx.shaderProgram.bind();
        setResolutionUniform(Uniforms, gl);
        Uniforms.u_render_pass = fx.texture.bind(0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
	unbind_shader();
}

ewgl.loadRequiredFiles([
    "terrainShader.js",
    "herbesShader.js",
    "skyBoxShader.js",
    "planEauShader.js",
    "particulesShader.js",
    "fxShaders.js",
    "fonctions.js"
], ewgl.launch_3d);