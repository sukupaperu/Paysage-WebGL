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

const nb_herbes = 200;
const nb_particules = 10;

const skyBox = initMeshObject();
const terrain = initMeshObject();
const herbes = initMeshObject();
const planEau = initMeshObject();
const particules = initMeshObject();

const lights = {
    direction: Vec3(10, 8, 0),
    ambiant: Vec3(.5),
    diffuse: Vec3(1)
};
const model_matrix = Mat4();

function init_wgl() {

    skyBox.shaderProgram = ShaderProgram(skyBox.vs_src, skyBox.fs_src, 'Shader skybox');
    skyBox.mesh = Mesh.Cube().renderer(1);
    skyBox.texture = TextureCubeMap();
    skyBox.texture.load(["textures/skybox/skybox1/right.bmp", "textures/skybox/skybox1/left.bmp", "textures/skybox/skybox1/top.bmp", "textures/skybox/skybox1/bottom.bmp", "textures/skybox/skybox1/front.bmp", "textures/skybox/skybox1/back.bmp"]);
    //skyBox.texture.load([ "textures/skybox/skybox2/right.png", "textures/skybox/skybox2/left.png", "textures/skybox/skybox2/top.png", "textures/skybox/skybox2/bottom.png", "textures/skybox/skybox2/back.png", "textures/skybox/skybox2/front.png"]);
    //skyBox.texture.load([ "textures/skybox/skybox3/px.webp", "textures/skybox/skybox3/nx.webp", "textures/skybox/skybox3/py.webp", "textures/skybox/skybox3/ny.webp", "textures/skybox/skybox3/pz.webp", "textures/skybox/skybox3/nz.webp"]);

    terrain.shaderProgram = ShaderProgram(terrain.vs_src, terrain.fs_src, 'Shader grille');
    terrain.mesh = meshGrille(30, terrain.shaderProgram.in.position_in);
        terrain.textures = [];
        terrain.textures[0] = loadTexture("textures/terrain_hm.png", gl.R8);
        terrain.textures[1] = loadTexture("textures/terrain_normal.png");
        terrain.textures[2] = loadTexture("textures/material/terre_albedo.png");
        terrain.textures[3] = loadTexture("textures/material/gravier_albedo.png");
        terrain.textures[4] = loadTexture("textures/material/sable_albedo.png");

        //terrain.textures[5] = loadTexture("textures/material/terre_normal.png");
        terrain.textures[6] = loadTexture("textures/material/gravier_normal.png");
        //terrain.textures[7] = loadTexture("textures/material/sable_normal.png");

    herbes.shaderProgram = ShaderProgram(herbes.vs_src, herbes.fs_src, 'Shader herbes');
    herbes.mesh = meshHerbes(6, nb_herbes, herbes.shaderProgram.in.position_in);
    // herbes.texture = loadTextureWA("textures/material/herbes.png");

    planEau.shaderProgram = ShaderProgram(planEau.vs_src, planEau.fs_src, 'Shader eau');
    planEau.mesh = meshGrille(1, planEau.shaderProgram.in.position_in);
    planEau.textures = [];
    planEau.textures[0] = loadTexture("textures/distortion_map.png", gl.RG8);
    planEau.textures[1] = initTextureForFBO();
    planEau.textures[2] = initTextureForFBO();
    planEau.fbos = initFBOs([1,2].map(i => planEau.textures[i]));
    planEau.renderBuffer = initRenderbufferForFBO(planEau.fbos[0].id);
    
    particules.shaderProgram = ShaderProgram(particules.vs_src, particules.fs_src, 'Shader particules');
    particules.mesh = meshParticules(nb_particules, particules.shaderProgram.in.position_in);

    // paramètres WebGL
    gl.clearColor(0, 0, 0, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.cullFace(gl.FRONT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // paramètre de scène et de caméra
    ewgl.scene_camera.set_scene_radius(1);
    ewgl.continuous_update = true;
}

function resize_wgl(w, h) {
    [0,1].map(i => planEau.fbos[i].resize(w, h));

	gl.bindRenderbuffer(gl.RENDERBUFFER, planEau.renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
}

function draw_wgl() {
    let view_matrix, skybox_matrix, projection_matrix;
        
    /*view_matrix = ewgl.scene_camera.get_view_matrix();
    projection_matrix = ewgl.scene_camera.get_projection_matrix();*/

    /*
        pass 0 : rendu reflexion
        pass 1 : rendu refraction
        pass 2 : rendu framebuffer par défaut
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
            default:
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                break;
        }
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        skyBox.shaderProgram.bind();
            setTimeUniform(Uniforms);
            Uniforms.u_view_projection = skybox_matrix;
            Uniforms.u_texture_skybox = skyBox.texture.bind(0);
        skyBox.mesh.draw(gl.TRIANGLES);

        terrain.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
            setCameraPosUniform(Uniforms, view_matrix);
            setLightUniforms(Uniforms, lights);
            Uniforms.u_height_texture = terrain.textures[0].bind(0);
            Uniforms.u_normal_texture = terrain.textures[1].bind(1);
            Uniforms.u_color_texture_0 = terrain.textures[2].bind(2);
            Uniforms.u_color_texture_1 = terrain.textures[3].bind(3);
            Uniforms.u_color_texture_2 = terrain.textures[4].bind(4);

            //Uniforms.u_normal_texture_0 = terrain.textures[5].bind(5);
            Uniforms.u_normal_texture_1 = terrain.textures[6].bind(6);
            //Uniforms.u_normal_texture_2 = terrain.textures[7].bind(7);

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
            herbes.mesh.draw(gl.TRIANGLES, pass === 2 ? 1 : .85);
        }
    }

    planEau.shaderProgram.bind();
        setMvpUniforms(Uniforms, Matrix.scale(1), view_matrix, projection_matrix);
        setCameraPosUniform(Uniforms, view_matrix);
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

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
	gl.useProgram(null);
}

ewgl.loadRequiredFiles([
    "terrainShader.js",
    "herbesShader.js",
    "skyBoxShader.js",
    "planEauShader.js",
    "particulesShader.js",
    "fonctions.js"
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