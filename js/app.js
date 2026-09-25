const URL_BASE = 'https://back-semprivado-umg-h6fkf2bng2avgrgw.westus3-01.azurewebsites.net';

let videos = [];
let videosCategoria = [];
let categoriaActual = 'Todas';
let videoActual = null;

async function obtenerVideos() {
    const contenedor = document.getElementById('contenedorVideos');
    const mensaje = document.getElementById('mensajeCatalogo');

    try {
        const respuesta = await fetch(`${URL_BASE}/api/videos`);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener los videos: ${respuesta.status}`);
        }

        videos = await respuesta.json();
        videosCategoria = videos;
        mostrarVideos(videosCategoria);
    } catch (error) {
        console.error(error);
        mensaje.innerHTML = '<div class="alert alert-danger">No se pudieron cargar los videos.</div>';
        contenedor.innerHTML = '';
    }
}

async function obtenerCategorias() {
    const lista = document.getElementById('listaCategorias');

    try {
        const respuesta = await fetch(`${URL_BASE}/api/videos/categorias`);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener las categorías: ${respuesta.status}`);
        }

        const categorias = await respuesta.json();

        categorias.forEach(categoria => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'list-group-item list-group-item-action';
            boton.dataset.categoria = categoria;
            boton.innerHTML = `<i class="bi ${obtenerIconoCategoria(categoria)}"></i><span>${escaparHTML(categoria)}</span>`;
            lista.appendChild(boton);
        });
    } catch (error) {
        console.error(error);
    }
}

function obtenerIconoCategoria(categoria) {
    const iconos = {
        'Desarrollo Web': 'bi-code-slash',
        'Diseño Web': 'bi-palette',
        'Bases de Datos': 'bi-database',
        'Arquitectura': 'bi-diagram-3',
        'Seguridad': 'bi-shield-lock',
        'Programación': 'bi-braces',
        'Algoritmos': 'bi-list-ol',
        'DevOps': 'bi-cloud-arrow-up',
        'Herramientas': 'bi-tools',
        'Lógica': 'bi-lightbulb'
    };

    return iconos[categoria] || 'bi-play-circle';
}

function mostrarVideos(listaVideos) {
    const contenedor = document.getElementById('contenedorVideos');
    const mensaje = document.getElementById('mensajeCatalogo');

    contenedor.innerHTML = '';
    mensaje.innerHTML = '';

    if (listaVideos.length === 0) {
        mensaje.innerHTML = '<div class="alert alert-info">No se encontraron videos.</div>';
        return;
    }

    listaVideos.forEach(video => {
        const columna = document.createElement('div');
        columna.className = 'col-sm-6 col-lg-4 mb-4';

        columna.innerHTML = `
            <div class="card h-100 shadow-sm video-card">
                <img src="${escaparHTML(video.poster)}" class="card-img-top" alt="${escaparHTML(video.titulo)}">
                <div class="card-body d-flex flex-column">
                    <span class="badge bg-secondary align-self-start mb-2">${escaparHTML(video.categoria)}</span>
                    <h3 class="card-title h6 fw-bold">${escaparHTML(video.titulo)}</h3>
                    <p class="card-text text-muted small video-description flex-grow-1">${escaparHTML(video.descripcion)}</p>
                    <div class="d-flex justify-content-between align-items-center small text-muted mb-3">
                        <span>Duración: ${escaparHTML(video.duracion)}</span>
                        <span>♡ ${Number(video.likes) || 0} · 💬 ${contarComentarios(video)}</span>
                    </div>
                    <button class="btn btn-primary btn-sm w-100 boton-ver" type="button" data-id="${Number(video.id)}">
                        <i class="bi bi-play-fill me-1"></i>Ver video
                    </button>
                </div>
            </div>
        `;

        contenedor.appendChild(columna);
    });
}

function filtrarVideos() {
    const texto = document.getElementById('buscador').value.trim().toLowerCase();

    const resultado = videosCategoria.filter(video => video.titulo.toLowerCase().includes(texto));

    mostrarVideos(resultado);
}

async function seleccionarCategoria(evento) {
    const boton = evento.target.closest('[data-categoria]');

    if (!boton) {
        return;
    }

    document.querySelectorAll('[data-categoria]').forEach(elemento => {
        elemento.classList.remove('active');
    });

    boton.classList.add('active');
    categoriaActual = boton.dataset.categoria;

    const contenedor = document.getElementById('contenedorVideos');
    contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const ruta = categoriaActual === 'Todas'
            ? `${URL_BASE}/api/videos`
            : `${URL_BASE}/api/videos/categoria/${encodeURIComponent(categoriaActual)}`;
        const respuesta = await fetch(ruta);

        if (!respuesta.ok) {
            throw new Error(`Error al filtrar los videos: ${respuesta.status}`);
        }

        videosCategoria = await respuesta.json();
        filtrarVideos();
    } catch (error) {
        console.error(error);
        document.getElementById('mensajeCatalogo').innerHTML = '<div class="alert alert-danger">No se pudo aplicar el filtro.</div>';
        contenedor.innerHTML = '';
    }
}

function contarComentarios(video) {
    const comentarios = Array.isArray(video.comentarios) ? video.comentarios : [];
    return comentarios.reduce((total, comentario) => {
        const respuestas = Array.isArray(comentario.respuestas) ? comentario.respuestas.length : 0;
        return total + 1 + respuestas;
    }, 0);
}

async function abrirVideo(id) {
    try {
        const respuesta = await fetch(`${URL_BASE}/api/videos/${id}`);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener el video: ${respuesta.status}`);
        }

        const video = await respuesta.json();
        const reproductor = document.getElementById('reproductorVideo');

        videoActual = video;

        document.getElementById('tituloVideo').textContent = video.titulo;
        document.getElementById('descripcionVideo').textContent = video.descripcion;
        reproductor.src = video.urlVideo;
        reproductor.poster = video.poster;

        mostrarInteracciones();

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVideo')).show();
    } catch (error) {
        console.error(error);
        alert('No se pudo abrir el video.');
    }
}

function obtenerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuarioVideos'));
    } catch (error) {
        return null;
    }
}

function solicitarLogin() {
    const usuario = obtenerUsuario();

    if (usuario && usuario.carne) {
        return usuario;
    }

    const elementoVideo = document.getElementById('modalVideo');
    const elementoLogin = document.getElementById('modalLogin');
    const modalLogin = bootstrap.Modal.getOrCreateInstance(elementoLogin);

    if (elementoVideo.classList.contains('show')) {
        elementoVideo.addEventListener('hidden.bs.modal', () => {
            modalLogin.show();
        }, { once: true });

        bootstrap.Modal.getOrCreateInstance(elementoVideo).hide();
    } else {
        modalLogin.show();
    }

    return null;
}

function mostrarInteracciones() {
    const usuario = obtenerUsuario();
    const usuariosLikes = Array.isArray(videoActual.usuariosLikes) ? videoActual.usuariosLikes : [];
    const dioLike = usuario && usuariosLikes.includes(usuario.carne);

    document.getElementById('cantidadLikes').textContent = videoActual.likes || 0;
    document.getElementById('iconoLike').textContent = dioLike ? '♥' : '♡';
    document.getElementById('botonLike').classList.toggle('btn-danger', Boolean(dioLike));
    document.getElementById('botonLike').classList.toggle('btn-outline-danger', !dioLike);
    document.getElementById('avisoComentario').classList.toggle('d-none', Boolean(usuario && usuario.carne));

    mostrarComentarios(videoActual.comentarios || []);
}

function mostrarComentarios(comentarios) {
    const contenedor = document.getElementById('listaComentarios');

    if (comentarios.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">Todavía no hay comentarios.</p>';
        return;
    }

    contenedor.innerHTML = comentarios.map(comentario => crearComentarioHTML(comentario, true)).join('');
}

function crearComentarioHTML(comentario, permitirRespuesta) {
    const usuario = obtenerUsuario();
    const comentarioPropio = usuario && usuario.carne === comentario.carne;
    const respuestas = Array.isArray(comentario.respuestas) ? comentario.respuestas : [];

    return `
        <div class="comentario">
            <div class="fw-bold">${escaparHTML(comentario.estudiante || comentario.carne || 'Estudiante')}</div>
            <div class="comentario-info">${escaparHTML(comentario.fecha || '')}</div>
            <p class="comentario-texto">${escaparHTML(comentario.texto)}</p>
            <div class="d-flex gap-3">
                ${permitirRespuesta ? `<button class="btn btn-link btn-sm p-0 boton-responder" type="button" data-id="${Number(comentario.id)}">Responder</button>` : ''}
                ${comentarioPropio ? `<button class="btn btn-link btn-sm text-danger p-0 boton-eliminar" type="button" data-id="${Number(comentario.id)}">Eliminar</button>` : ''}
            </div>
            ${respuestas.length > 0 ? `<div class="respuestas">${respuestas.map(respuesta => crearComentarioHTML(respuesta, false)).join('')}</div>` : ''}
            <div id="respuesta-${Number(comentario.id)}"></div>
        </div>
    `;
}

async function darLike() {
    const usuario = solicitarLogin();

    if (!usuario || !videoActual) {
        return;
    }

    const boton = document.getElementById('botonLike');
    boton.disabled = true;

    try {
        const respuesta = await fetch(`${URL_BASE}/api/interaccionvideo/${videoActual.id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carne: usuario.carne })
        });

        if (!respuesta.ok) {
            const resultado = await leerRespuesta(respuesta);
            throw new Error(obtenerMensaje(resultado, 'No se pudo actualizar el like.'));
        }

        await actualizarVideoActual();
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        boton.disabled = false;
    }
}

async function publicarComentario(evento) {
    evento.preventDefault();

    const usuario = solicitarLogin();
    const input = document.getElementById('textoComentario');
    const texto = input.value.trim();

    if (!usuario || !videoActual || texto === '') {
        return;
    }

    try {
        const respuesta = await fetch(`${URL_BASE}/api/interaccionvideo/${videoActual.id}/comentario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carne: usuario.carne, texto })
        });

        if (!respuesta.ok) {
            const resultado = await leerRespuesta(respuesta);
            throw new Error(obtenerMensaje(resultado, 'No se pudo publicar el comentario.'));
        }

        input.value = '';
        await actualizarVideoActual();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function mostrarFormularioRespuesta(idComentario) {
    const usuario = solicitarLogin();

    if (!usuario) {
        return;
    }

    document.querySelectorAll('.respuesta-formulario').forEach(formulario => formulario.remove());

    const contenedor = document.getElementById(`respuesta-${idComentario}`);
    contenedor.innerHTML = `
        <form class="input-group input-group-sm respuesta-formulario" data-id="${idComentario}">
            <input class="form-control" type="text" maxlength="500" placeholder="Escribe una respuesta..." required>
            <button class="btn btn-outline-primary" type="submit">Enviar</button>
        </form>
    `;
    contenedor.querySelector('input').focus();
}

async function publicarRespuesta(formulario) {
    const usuario = solicitarLogin();
    const texto = formulario.querySelector('input').value.trim();
    const idComentario = formulario.dataset.id;

    if (!usuario || texto === '') {
        return;
    }

    try {
        const respuesta = await fetch(`${URL_BASE}/api/interaccionvideo/comentario/${idComentario}/responder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carne: usuario.carne, texto })
        });

        if (!respuesta.ok) {
            const resultado = await leerRespuesta(respuesta);
            throw new Error(obtenerMensaje(resultado, 'No se pudo publicar la respuesta.'));
        }

        await actualizarVideoActual();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function eliminarComentario(idComentario) {
    const usuario = solicitarLogin();

    if (!usuario || !confirm('¿Deseas eliminar este comentario?')) {
        return;
    }

    try {
        const respuesta = await fetch(`${URL_BASE}/api/interaccionvideo/comentario/${idComentario}?carne=${encodeURIComponent(usuario.carne)}`, {
            method: 'DELETE'
        });

        if (!respuesta.ok) {
            const resultado = await leerRespuesta(respuesta);
            throw new Error(obtenerMensaje(resultado, 'No se pudo eliminar el comentario.'));
        }

        await actualizarVideoActual();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function actualizarVideoActual() {
    const respuesta = await fetch(`${URL_BASE}/api/videos/${videoActual.id}`);

    if (!respuesta.ok) {
        throw new Error('No se pudo actualizar el video.');
    }

    videoActual = await respuesta.json();
    mostrarInteracciones();

    const posicion = videos.findIndex(video => video.id === videoActual.id);
    if (posicion !== -1) {
        videos[posicion] = videoActual;
    }

    const posicionCategoria = videosCategoria.findIndex(video => video.id === videoActual.id);
    if (posicionCategoria !== -1) {
        videosCategoria[posicionCategoria] = videoActual;
    }

    filtrarVideos();
}

async function registrarEstudiante(evento) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const boton = document.getElementById('botonRegistro');
    const mensaje = document.getElementById('mensajeRegistro');
    const datos = new FormData(formulario);

    const estudiante = {
        carne: datos.get('carne').trim(),
        estudiante: datos.get('estudiante').trim().toUpperCase(),
        correo: datos.get('correo').trim(),
        password: datos.get('password').trim()
    };

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    mensaje.innerHTML = '';

    try {
        const respuesta = await fetch(`${URL_BASE}/api/estudiantes/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estudiante)
        });

        const resultado = await leerRespuesta(respuesta);

        if (!respuesta.ok) {
            throw new Error(obtenerMensaje(resultado, 'No se pudo completar el registro.'));
        }

        mensaje.innerHTML = '<div class="alert alert-success">Estudiante registrado correctamente.</div>';
        formulario.reset();
    } catch (error) {
        console.error(error);
        mensaje.innerHTML = `<div class="alert alert-danger">${escaparHTML(error.message)}</div>`;
    } finally {
        boton.disabled = false;
        boton.textContent = 'Crear cuenta';
    }
}

async function iniciarSesion(evento) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const boton = document.getElementById('botonLogin');
    const mensaje = document.getElementById('mensajeLogin');
    const datos = new FormData(formulario);

    const credenciales = {
        usuario: datos.get('usuario').trim(),
        password: datos.get('password').trim()
    };

    boton.disabled = true;
    boton.textContent = 'Ingresando...';
    mensaje.innerHTML = '';

    try {
        const respuesta = await fetch(`${URL_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const resultado = await leerRespuesta(respuesta);

        if (!respuesta.ok) {
            throw new Error(obtenerMensaje(resultado, 'Usuario o PIN incorrectos.'));
        }

        const datosUsuario = resultado.estudiante && typeof resultado.estudiante === 'object'
            ? resultado.estudiante
            : resultado.usuario && typeof resultado.usuario === 'object'
                ? resultado.usuario
                : resultado.data && typeof resultado.data === 'object'
                    ? resultado.data
                    : resultado;
        const nombre = datosUsuario.estudiante || datosUsuario.nombre || credenciales.usuario;
        const carne = datosUsuario.carne || (/^\d{4}-\d{2}-\d{5}$/.test(credenciales.usuario) ? credenciales.usuario : '');

        if (!carne) {
            throw new Error('El servidor no devolvió el carné del estudiante. Ingresa utilizando tu carné.');
        }

        localStorage.setItem('usuarioVideos', JSON.stringify({ nombre, carne }));
        actualizarUsuario();
        formulario.reset();
        bootstrap.Modal.getInstance(document.getElementById('modalLogin')).hide();
    } catch (error) {
        console.error(error);
        mensaje.innerHTML = `<div class="alert alert-danger">${escaparHTML(error.message)}</div>`;
    } finally {
        boton.disabled = false;
        boton.textContent = 'Ingresar';
    }
}

function actualizarUsuario() {
    const usuarioGuardado = localStorage.getItem('usuarioVideos');
    const botonesInvitado = document.getElementById('botonesInvitado');
    const datosUsuario = document.getElementById('datosUsuario');

    if (usuarioGuardado && JSON.parse(usuarioGuardado).carne) {
        const usuario = JSON.parse(usuarioGuardado);
        document.getElementById('nombreUsuario').textContent = `Hola, ${usuario.nombre}`;
        botonesInvitado.classList.add('d-none');
        datosUsuario.classList.remove('d-none');
        datosUsuario.classList.add('d-flex');
    } else {
        localStorage.removeItem('usuarioVideos');
        botonesInvitado.classList.remove('d-none');
        datosUsuario.classList.add('d-none');
        datosUsuario.classList.remove('d-flex');
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioVideos');
    actualizarUsuario();
}

async function leerRespuesta(respuesta) {
    const tipo = respuesta.headers.get('content-type') || '';
    return tipo.includes('application/json') ? respuesta.json() : respuesta.text();
}

function obtenerMensaje(resultado, mensajePredeterminado) {
    if (typeof resultado === 'string') {
        return resultado || mensajePredeterminado;
    }

    return resultado.mensaje || resultado.message || resultado.error || mensajePredeterminado;
}

function escaparHTML(texto = '') {
    const elemento = document.createElement('div');
    elemento.textContent = texto;
    return elemento.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    obtenerVideos();
    obtenerCategorias();
    actualizarUsuario();

    document.getElementById('formularioRegistro').addEventListener('submit', registrarEstudiante);
    document.getElementById('formularioLogin').addEventListener('submit', iniciarSesion);
    document.getElementById('formularioComentario').addEventListener('submit', publicarComentario);
    document.getElementById('botonLike').addEventListener('click', darLike);
    document.getElementById('listaCategorias').addEventListener('click', seleccionarCategoria);
    document.getElementById('buscador').addEventListener('input', filtrarVideos);
    document.getElementById('botonSalir').addEventListener('click', cerrarSesion);
    document.getElementById('botonLimpiar').addEventListener('click', () => {
        document.getElementById('buscador').value = '';
        filtrarVideos();
    });

    document.getElementById('contenedorVideos').addEventListener('click', evento => {
        const boton = evento.target.closest('.boton-ver');
        if (boton) {
            abrirVideo(boton.dataset.id);
        }
    });

    document.getElementById('listaComentarios').addEventListener('click', evento => {
        const botonResponder = evento.target.closest('.boton-responder');
        const botonEliminar = evento.target.closest('.boton-eliminar');

        if (botonResponder) {
            mostrarFormularioRespuesta(botonResponder.dataset.id);
        }

        if (botonEliminar) {
            eliminarComentario(botonEliminar.dataset.id);
        }
    });

    document.getElementById('listaComentarios').addEventListener('submit', evento => {
        if (evento.target.matches('.respuesta-formulario')) {
            evento.preventDefault();
            publicarRespuesta(evento.target);
        }
    });

    document.getElementById('modalVideo').addEventListener('hidden.bs.modal', () => {
        const reproductor = document.getElementById('reproductorVideo');
        reproductor.pause();
        reproductor.removeAttribute('src');
        reproductor.load();
    });
});
