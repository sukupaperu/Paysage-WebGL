"use strict";

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
	        gl.drawElements(draw_type, nb_triangles*3, gl.UNSIGNED_INT, 0);
        }
    };
}