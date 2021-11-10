"use strict";

function fboTexture(canvas) {
    let tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
}

function fbo(textures) {
    let fbos = [], ca = [];
    for(let i = 0; i < textures.length; i++)
        ca.push(gl.COLOR_ATTACHMENT0 + i);
    for(let i = 0; i < textures.length; i++) {
        let fbo = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, textures[i], 0);
        gl.drawBuffers(ca);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        fbos.push(fbo);
    }
    return fbos;
}


function lightFeeder(position, ambiant, diffuse, specular, specular_size) {
    return (u) => {
        u.u_light_world_pos = position
        u.u_ka = ambiant,
        u.u_kd = diffuse,
        u.u_ks = specular,
        u.u_kn = specular_size
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
    let width = 1, height = 1;
    
    // VBO : génération des coordonnées des sommets des triangles
	let vertices_list = [];
    let v_step = height/vertical_subdivisions;
    for(let y = 0; y < vertical_subdivisions; y++) {
        let ypos = y*v_step;
        let w = (1 - Math.pow(ypos, .8))*(width/(4*7));
        vertices_list.push(
            -w, ypos, 0,
            w, ypos, 0
        );
    }
    vertices_list.push(0, height - .5, 0);
    let vbo_positions = VBO(new Float32Array(vertices_list), 3);

    // EBO : génération du tableau d'indices des sommets des triangles
	let indices_list = [], i = 0;
    for(let y = 0; y < vertical_subdivisions - 1; y++) {
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
        draw: (draw_type) => {
            gl.disable(gl.CULL_FACE);
            Uniforms.u_number = number;
            Uniforms.u_time = ewgl.current_time;
            gl.bindVertexArray(vao.id);
	        // gl.drawElements(draw_type, nb_sommets, gl.UNSIGNED_INT, 0);
            gl.drawElementsInstanced(draw_type, nb_sommets, gl.UNSIGNED_INT, 0, number*number);
            gl.enable(gl.CULL_FACE);
        }
    };
}