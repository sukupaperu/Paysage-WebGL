"use strict";

function init_wgl(action_fin_chargement) {

    // L'intérêt de l'objet de chargement est de ne pouvoir lancer le rendu qu'une fois seulement que tous les éléments de la scène sont chargés
    const obj_chargement = new Chargement(action_fin_chargement);


    // Skybox
    skybox.shaderProgram = ShaderProgram(skybox.vs_src, skybox.fs_src, 'Shader skybox');
    skybox.mesh = Mesh.Cube().renderer(1);
    skybox.textures[0] = obj_chargement.loadCubeMap(["textures/skybox/skybox1/right.webp", "textures/skybox/skybox1/left.webp", "textures/skybox/skybox1/top.webp", "textures/skybox/skybox1/bottom.webp", "textures/skybox/skybox1/front.webp", "textures/skybox/skybox1/back.webp"]);
    skybox.textures[1] = obj_chargement.loadCubeMap(["textures/skybox/skybox2/right.webp", "textures/skybox/skybox2/left.webp", "textures/skybox/skybox2/top.webp", "textures/skybox/skybox2/bottom.webp", "textures/skybox/skybox2/back.webp", "textures/skybox/skybox2/front.webp"]);


    // Terrain/sol
    terrain.shaderProgram = ShaderProgram(terrain.vs_src, terrain.fs_src, 'Shader terrain');
    terrain.mesh = meshGrille(40, terrain.shaderProgram.in.position_in, true, 50);
    terrain.textures[0] = obj_chargement.loadTexture("textures/terrain_hm.webp", gl.R8);
    terrain.textures[1] = obj_chargement.loadTexture("textures/material/terre_albedo.webp");
    terrain.textures[2] = obj_chargement.loadTexture("textures/material/gravier_albedo.webp");
    terrain.textures[3] = obj_chargement.loadTexture("textures/material/sable_albedo.webp");
    terrain.textures[4] = obj_chargement.loadTexture("textures/material/gravier_normal.webp");


    // Herbes sur l'île
    herbes.shaderProgram = ShaderProgram(herbes.vs_src, herbes.fs_src, 'Shader herbes');
    herbes.mesh = meshHerbes(8, nb_herbes, herbes.shaderProgram.in.position_in);


    // Plan de l'eau
    plan_eau.shaderProgram = ShaderProgram(plan_eau.vs_src, plan_eau.fs_src, 'Shader eau');
    plan_eau.model = Matrix.scale(100);
    plan_eau.mesh = meshGrille(1, plan_eau.shaderProgram.in.position_in);
    plan_eau.textures[0] = obj_chargement.loadTexture("textures/distortion_map.webp", gl.RG8);
    // plan_eau.textures[1] = obj_chargement.loadTexture("textures/normal_map.png");
    plan_eau.textures[1] = initTextureForFBO();
    plan_eau.textures[2] = initTextureForFBO();
    plan_eau.fbos = initFBOs_Depth([1,2].map(i => plan_eau.textures[i]));


    // Particules au-dessus de l'île
    particules.shaderProgram = ShaderProgram(particules.vs_src, particules.fs_src, 'Shader particules');
    particules.mesh = meshParticules(nb_particules, particules.shaderProgram.in.position_in);
    particules.model = Matrix.translate(0,.15,0);


    // Croix autour de l'île
    croix.shaderProgram = ShaderProgram(croix.vs_src, croix.fs_src);
    obj_chargement.loadMesh("modeles/croix.obj", (m) => {
        croix.mesh = m[0].instanced_renderer([], 1, 2);
    });


    // Effets de post-processing
    fx[0].shaderProgram = ShaderProgram(fx[0].vs_src, fx[0].fs_src, 'Shader fx 0');
    fx[0].texture = initTextureForFBO();
    fx[0].fbos = initFBOs_Depth([fx[0].texture]);

    fx[1].shaderProgram = ShaderProgram(fx[0].vs_src, fx[1].fs_src, 'Shader fx 2');
    fx[1].texture = initTextureForFBO();
    fx[1].fbos = initFBOs([fx[1].texture]);

    fx[2].shaderProgram = ShaderProgram(fx[0].vs_src, fx[2].fs_src, 'Shader fx 3');
    fx[2].texture = initTextureForFBO();
    fx[2].fbos = initFBOs([fx[2].texture]);


    // paramètres WebGL
    gl.clearColor(0, 0, 0, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.cullFace(gl.FRONT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    // paramètre de scène et de caméra
    ewgl.scene_camera.set_scene_radius(100);
    ewgl.continuous_update = true;
    ewgl.scene_camera.set_fov(90);
    ewgl.scene_camera.look(Vec3(0.,.5,-1.25), Vec3(0.,-.5,1.25), Vec3(0.,1.,0.));

    
    // On indique à l'objet de chargement que tous les éléments à charger ont été déclarés et qu'il n'y en aura donc pas d'autre
    obj_chargement.setReady();
}