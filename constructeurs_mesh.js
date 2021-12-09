"use strict";

function meshGrille(subdivisions, positionID, estEtendu = false, tailleEtendu = 2) {
	let nb_w_grille = subdivisions;
	let nb_l_grille = subdivisions;

    // VBO : génération des coordonnées des sommets des triangles
	let vertices_list = [];
	for(let i = 0; i <= nb_w_grille; i++)
		for(let j = 0; j <= nb_l_grille; j++) {
            let x = i/nb_w_grille - .5;
            let y = j/nb_l_grille - .5;
            if(estEtendu) {
                if(i === 0) x = -tailleEtendu;
                if(i === nb_w_grille) x = tailleEtendu;
                if(j === 0) y = -tailleEtendu;
                if(j === nb_l_grille) y = tailleEtendu;
            }
			vertices_list.push(x, 0, y);
        }
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

function meshHerbes(vertical_subdivisions, number, positionID) {
    let width = 1., height = 1;
    
    // VBO : génération des coordonnées des sommets des triangles
	let vertices_list = [];
    let v_step = height/vertical_subdivisions;
    for(let y = 0; y <= vertical_subdivisions; y++) {
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
            let n = Uniforms.u_number = Math.floor(fact*number);

            gl.bindVertexArray(vao.id);

            gl.disable(gl.CULL_FACE);
            gl.drawElementsInstanced(draw_type, nb_sommets, gl.UNSIGNED_INT, 0, n*n);
            gl.enable(gl.CULL_FACE);
        }
    };
}

function meshParticules(number, positionID) {
    let width = 1., height = 1;

    // VBO : génération des coordonnées des sommets des triangles
    let vertices_list = [
        -width*.5, -width*.5, 0.,
        width*.5, -width*.5, 0.,
        -width*.5, width*.5, 0.,
        width*.5, width*.5, 0.
    ];
    let vbo_positions = VBO(new Float32Array(vertices_list), 3);

    // EBO : génération du tableau d'indices des sommets des triangles
    let indices_list = [0, 2, 1, 1, 2, 3];
    let ebo = EBO(new Uint32Array(indices_list));
    let nb_sommets = indices_list.length;
	
    // VAO : association EBO et VBO dans un seul VAO
    let vao = VAO([positionID, vbo_positions]);

    gl.bindVertexArray(vao.id);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo.id);

    gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return {
        draw: (draw_type) => {
            let n = number;

            Uniforms.u_number = n;

            gl.bindVertexArray(vao.id);

            gl.enable(gl.BLEND);
            gl.drawElementsInstanced(draw_type, nb_sommets, gl.UNSIGNED_INT, 0, n*n);
            gl.disable(gl.BLEND);
        }
    }
}