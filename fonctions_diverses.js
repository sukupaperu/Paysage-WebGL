"use strict";

class Chargement {
    pret = false;
    nb_obj_restant_a_charger = 0;
    action_fin_chargement = null;

    constructor(action_fin_chargement) {
        this.action_fin_chargement = action_fin_chargement;
    }

    actionOnNewObj() {
        this.nb_obj_restant_a_charger++;
    }

    actionOnAllObjReady() {
        if(this.pret && this.nb_obj_restant_a_charger === 0)
            this.action_fin_chargement();
    }

    actionOnObjReady() {
        this.nb_obj_restant_a_charger--;
        this.actionOnAllObjReady();
    }

    setReady() {
        this.pret = true;
        this.actionOnAllObjReady();
    }

    loadTexture(path, type = gl.RGB8) {
        this.actionOnNewObj();
        let t = Texture2d();
        t.simple_params(gl.LINEAR, gl.REPEAT);
        t.load(path, type).then(() => { this.actionOnObjReady(); });
        return t;
    }

    loadCubeMap(path_list) {
        this.actionOnNewObj();
        let t = TextureCubeMap();
        t.load(path_list).then(() => { this.actionOnObjReady(); });
        return t;
    }

    loadMesh(path, action) {
        this.actionOnNewObj();
        Mesh.loadObjFile(path).then((m) => {
            action(m);
            this.actionOnObjReady();
        });
    }

};

function initTextureForFBO(w = 0, h = 0, type = gl.RGB8) {
    let t = Texture2d();
    t.simple_params(gl.LINEAR, gl.REPEAT);
    t.alloc(w, h, type);
    return t;
}

function initFBOs(textures) {
    let fbos = [];
    for(let i = 0; i < textures.length; i++)
        fbos.push(FBO(textures[i]));
    return fbos;
}

function initFBOs_Depth(textures) {
    let fbos = [];
    for(let i = 0; i < textures.length; i++)
        fbos.push(FBO_Depth(textures[i]));
    return fbos;
}

function setMvpUniforms(u, m, v, p) {
    u.u_model = m;
    u.u_view = v;
    u.u_projection = p;
}

function setCameraPosUniform(u, v) {
    u.u_camera_world_pos = v.inverse().position();
}

function setLightUniforms(u, o) {
    u.u_light_dir = o.direction;
    u.u_ka = o.ambiant;
    u.u_kd = o.diffuse;
}

function setTimeUniform(u) {
    u.u_time = ewgl.current_time;
}

function setResolutionUniform(u, g) {
    u.u_resolution = Vec2(g.canvas.width, g.canvas.height);
}