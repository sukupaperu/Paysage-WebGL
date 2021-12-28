"use strict";

function initMeshObject() {
    return {
        vs_src: "",
        fs_src: "",
        shaderProgram: null,
        mesh: null,
        textures: [],
        texture: null,
        fbos: [],
        model: null
    };
}

// Paramètres de la scène
const nb_herbes = 200;
const nb_particules = 5;

// Objets que l'on va rendre à l'écrans
const skybox = initMeshObject();
const terrain = initMeshObject();
const herbes = initMeshObject();
const plan_eau = initMeshObject();
const particules = initMeshObject();
const croix = initMeshObject();
const fx = [
    initMeshObject(),
    initMeshObject(),
    initMeshObject()
];

// Lumière de la scène
const lights = {
    direction: Vec3(0, 8, 0),
    ambiant: Vec3(.5),
    diffuse: Vec3(.75)
};

// Des matrices que l'on va réutiliser dans le rendu
const model_matrix = Mat4();
const invYmat = Matrix.scale(1., -1., 1.);

// Au redimensionnement de l'écran
function resize_wgl(w, h) {
    [0,1].map(i => plan_eau.fbos[i].resize(w, h));
    fx[0].fbos[0].resize(w, h);
    fx[1].fbos[0].resize(w, h);
    fx[2].fbos[0].resize(w, h);
}

// Rendu
function draw_wgl() {

    let view_matrix, skybox_matrix, projection_matrix;

    /* 
        Rendu en trois passes successives pour les reflets sur l'eau
        pass 0 : rendu -> texture reflexion
        pass 1 : rendu -> texture refraction
        pass 2 : rendu -> texture fx
    */
   for(let pass = 0; pass <= 2; pass++) {

        let under_water_only = pass === 1;
        let above_water_only = pass === 0;
        
        view_matrix = ewgl.scene_camera.get_view_matrix();
        skybox_matrix = ewgl.scene_camera.get_matrix_for_skybox();
        projection_matrix = ewgl.scene_camera.get_projection_matrix();
        
        // En fonction de la passe de rendu on bind le FBO qui nous intéresse
        switch(pass) {

            case 0:
                plan_eau.fbos[0].bind();
                view_matrix = Matrix.mult(view_matrix, invYmat);
                skybox_matrix = Matrix.mult(skybox_matrix, invYmat);
                gl.disable(gl.CULL_FACE);
                break;

            case 1:
                plan_eau.fbos[1].bind();
                gl.enable(gl.CULL_FACE);
                break;

            case 2:
                fx[0].fbos[0].bind();
                break;

        }
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        

        // Rendu de la skybox
        skybox.shaderProgram.bind();
            setTimeUniform(Uniforms);
            Uniforms.u_view_projection = skybox_matrix;
            Uniforms.u_texture_skybox_0 = skybox.textures[0].bind(0);
            Uniforms.u_texture_skybox_1 = skybox.textures[1].bind(1);
        skybox.mesh.draw(gl.TRIANGLES);


        // Rendu du terrain
        terrain.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
            setCameraPosUniform(Uniforms, view_matrix);
            setLightUniforms(Uniforms, lights);
            Uniforms.u_height_texture = terrain.textures[0].bind(0);
            Uniforms.u_color_texture_0 = terrain.textures[1].bind(1);
            Uniforms.u_color_texture_1 = terrain.textures[2].bind(2);
            Uniforms.u_color_texture_2 = terrain.textures[3].bind(3);
            Uniforms.u_normal_texture_1 = terrain.textures[4].bind(4);
            Uniforms.u_under_water_only = under_water_only;
            Uniforms.u_above_water_only = above_water_only;
        terrain.mesh.draw(gl.TRIANGLES);


        // Rendu des croix
        croix.shaderProgram.bind();
            setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
            setLightUniforms(Uniforms, lights);
            Uniforms.u_under_water_only = under_water_only;
            Uniforms.u_above_water_only = above_water_only;
        croix.mesh.draw(gl.TRIANGLES, 150);
        

        if(!under_water_only) {

            // Rendu des herbes
            herbes.shaderProgram.bind();
                setMvpUniforms(Uniforms, model_matrix, view_matrix, projection_matrix);
                setCameraPosUniform(Uniforms, view_matrix);
                setLightUniforms(Uniforms, lights);
                setTimeUniform(Uniforms);
                Uniforms.u_height_texture = terrain.textures[0].bind(0);
            herbes.mesh.draw(gl.TRIANGLES, 1);

        }
    }


    // Rendu du plan de l'eau
    plan_eau.shaderProgram.bind();
        setMvpUniforms(Uniforms, plan_eau.model, view_matrix, projection_matrix);
        setCameraPosUniform(Uniforms, view_matrix);
        // setLightUniforms(Uniforms, lights);
        setTimeUniform(Uniforms);
        Uniforms.u_light_dir = lights.direction;
        setResolutionUniform(Uniforms, gl);
        Uniforms.u_distortion = plan_eau.textures[0].bind(0);
        Uniforms.u_reflexion = plan_eau.textures[1].bind(1);
        Uniforms.u_refraction = plan_eau.textures[2].bind(2);
        Uniforms.u_height_texture = terrain.textures[0].bind(3);
    plan_eau.mesh.draw(gl.TRIANGLES);


    // Rendu des particules (elles ne seront pas rendu dans le reflet)
    particules.shaderProgram.bind();
        setMvpUniforms(Uniforms, particules.model, view_matrix, projection_matrix);
        setTimeUniform(Uniforms);
    particules.mesh.draw(gl.TRIANGLES);


    // Rendu post-processing
    fx[1].fbos[0].bind();
    fx[0].shaderProgram.bind();
        Uniforms.u_render_pass = fx[0].texture.bind(0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

    fx[2].fbos[0].bind();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    fx[1].shaderProgram.bind();
        Uniforms.u_render_pass = fx[1].texture.bind(0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fx[2].shaderProgram.bind();
        setResolutionUniform(Uniforms, gl);
        Uniforms.u_render_pass = fx[2].texture.bind(0);
        Uniforms.u_render_pass_2 = fx[0].texture.bind(1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Fin du rendu
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
	unbind_shader();

}

ewgl.loadRequiredFiles([
    "shaders/terrain.js",
    "shaders/herbes.js",
    "shaders/skybox.js",
    "shaders/plan_eau.js",
    "shaders/particules.js",
    "shaders/croix.js",
    "shaders/fx.js",
    "constructeurs_mesh.js",
    "fonctions_diverses.js",
    "initialisation_scene.js"
], ewgl.launch_3d);