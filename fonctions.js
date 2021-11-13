"use strict";

function initFBOs(textures) {
    let fbos = [];
    for(let i = 0; i < textures.length; i++) 
        fbos.push(FBO(textures[i]));
    return fbos;
}

function loadTexture(path) {
    let t = Texture2d();
    t.simple_params(gl.LINEAR, gl.REPEAT);
    t.load(path);
    return t;
}

function loadTextureWA(path) {
    let t = Texture2d();
    t.simple_params(gl.LINEAR, gl.REPEAT);
    t.load(path, gl.RGBA8);
    return t;
}

function initTextureForFBO(w, h) {
    let t = Texture2d();
    t.simple_params(gl.LINEAR, gl.REPEAT);
    t.alloc(w, h, gl.RGBA8);
    return t;
}

function setMvpUniforms(u, m, v, p, c) {
    u.u_model = m;
    u.u_view = v;
    u.u_projection = p;
    u.u_camera_world_pos = c;
}

function lightFeeder(position, ambiant, diffuse) {
    return (u) => {
        u.u_light_world_pos = position
        u.u_ka = ambiant,
        u.u_kd = diffuse
    };
}

function meshGrille(subdivisions, positionID) {
	let nb_w_grille = subdivisions;
	let nb_l_grille = subdivisions;
	let nb_triangles = nb_w_grille*nb_l_grille*2;

    // VBO : génération des coordonnées des sommets des triangles
	let vertices_list = [];
	for(let i = 0; i <= nb_w_grille; i++)
		for(let j = 0; j <= nb_l_grille; j++)
			vertices_list.push(i/nb_w_grille - .5, 0., j/nb_l_grille - .5);
    let vbo_positions = VBO(new Float32Array(vertices_list), 3);
    
    // EBO : génération du tableau d'indices des sommets des triangles
	let indices_list = [];
	for(let i = 0; i < (nb_w_grille + 1)*nb_l_grille; i += i%(nb_w_grille + 1) < (nb_w_grille - 1) ? 1 : 2)
		indices_list.push(
			i + (nb_w_grille + 1), i + 1, i,
			i + 1, i + (nb_w_grille + 1), i + (nb_w_grille + 2)
		);
	let ebo = EBO(new Uint32Array(indices_list));
    let nb_sommets = indices_list.length;
	
    // VAO : association EBO et VBO dans un seul VAO
    let vao = VAO([positionID, vbo_positions]);

    gl.bindVertexArray(vao.id);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo.id);

    gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // retourne de quoi pouvoir dessiner ladite grille
    return {
        draw: (draw_type) => {
            gl.bindVertexArray(vao.id);
	        gl.drawElements(draw_type, nb_sommets, gl.UNSIGNED_INT, 0);
        }
    };
}

function meshHerbes(vertical_subdivisions, positionID, number) {
    let width = 1. /*(512/2)/512*/, height = 1;
    
    // VBO : génération des coordonnées des sommets des triangles
	let vertices_list = [];
    let v_step = height/vertical_subdivisions;
    for(let y = 0; y <= vertical_subdivisions; y++) {
        let ypos = y*v_step;
        let w = (1 - Math.pow(ypos, .8))*(width/(4*7));
        //let w = width/2;
        vertices_list.push(
            -w, ypos, 0,
            w, ypos, 0
        );
    }
    vertices_list.push(0, height - .5, 0);
    let vbo_positions = VBO(new Float32Array(vertices_list), 3);

    // EBO : génération du tableau d'indices des sommets des triangles
	let indices_list = [], i = 0;
    for(let y = 0; y < vertical_subdivisions; y++) {
        indices_list.push(
            i, i + 3, i + 1,
            i, i + 2, i + 3
        );
        i += 2;
    }
    indices_list.push(i, i + 2, i + 1);
	let ebo = EBO(new Uint32Array(indices_list));
    let nb_sommets = indices_list.length;
	
    // VAO : association EBO et VBO dans un seul VAO
    let vao = VAO([positionID, vbo_positions]);

    gl.bindVertexArray(vao.id);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo.id);

    gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // retourne de quoi pouvoir dessiner ladite grille
    return {
        draw: (draw_type, fact) => {
            let n = Math.floor(fact*number);

            Uniforms.u_number = n;
            Uniforms.u_time = ewgl.current_time;

            gl.bindVertexArray(vao.id);

            gl.disable(gl.CULL_FACE);
            //gl.enable(gl.BLEND);
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawElementsInstanced(draw_type, nb_sommets, gl.UNSIGNED_INT, 0, n*n);
	        // gl.drawElements(draw_type, nb_sommets, gl.UNSIGNED_INT, 0);
            //gl.disable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
        }
    };
}