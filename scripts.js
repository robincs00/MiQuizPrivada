// VARIABLES GLOBALES
let preguntas = JSON.parse(localStorage.getItem('misPreguntas')) || [];
let puntajeActual = 0;
let indicePreguntaActual = 0;
let historialSesion = []; 
let respuestasUsuario = []; // Guardar qué marcó el usuario en cada pregunta

// --- SECCIÓN NAVEGACIÓN Y ACCESO ---

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hide');
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId);
    target.classList.remove('hide');
    target.classList.add('active');
}

const CLAVE_ACCESO = "MiQuizPrivado2026"; 

function checkAccess() {
    const passIngresada = document.getElementById('admin-pass').value;
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if (passIngresada === CLAVE_ACCESO) {
        sessionStorage.setItem('accesoPermitido', 'true');
        loginScreen.style.display = 'none';
        mainApp.classList.remove('hide');
        mainApp.style.display = 'flex';
        iniciarQuiz();
    } else {
        alert("Contraseña incorrecta. Acceso denegado.");
    }
}

function logout() {
    sessionStorage.removeItem('accesoPermitido');
    location.reload();
}

// --- SECCIÓN ADMINISTRACIÓN (AÑADIR PREGUNTAS) ---

function saveQuestion() {
    const textoPregunta = document.getElementById('new-question').value;
    const inputsOpciones = document.querySelectorAll('.opt');
    const rbs = document.querySelectorAll('input[name="correct-check"]');
    
    let indiceCorrecto;
    rbs.forEach(rb => { if (rb.checked) indiceCorrecto = parseInt(rb.value); });

    const opciones = Array.from(inputsOpciones).map(input => input.value).filter(v => v !== "");

    if (textoPregunta === "" || opciones.length < 4) {
        alert("Por favor, rellena la pregunta y las 4 opciones.");
        return;
    }

    const nuevaPregunta = { pregunta: textoPregunta, opciones: opciones, correcta: indiceCorrecto };
    preguntas.push(nuevaPregunta);
    localStorage.setItem('misPreguntas', JSON.stringify(preguntas));

    document.getElementById('new-question').value = "";
    inputsOpciones.forEach(input => input.value = "");
    alert("¡Pregunta guardada con éxito!");
    location.reload(); 
}

function clearAllQuestions() {
    if (confirm("¿Estás seguro? Se borrará todo.")) {
        localStorage.removeItem('misPreguntas');
        preguntas = [];
        location.reload();
    }
}

// --- SECCIÓN QUIZ ---

function iniciarQuiz() {
    if (preguntas.length === 0) {
        document.getElementById('question').innerText = "No hay preguntas. Ve a 'Añadir Preguntas'.";
        document.getElementById('total-questions').innerText = "0";
        return;
    }
    indicePreguntaActual = 0;
    respuestasUsuario = new Array(preguntas.length).fill(null);
    mostrarPregunta();
}

function mostrarPregunta() {
    const data = preguntas[indicePreguntaActual];
    const questionElement = document.getElementById('question');
    const answerButtonsElement = document.getElementById('answer-buttons');
    
    questionElement.innerText = data.pregunta;
    answerButtonsElement.innerHTML = ''; 

    data.opciones.forEach((opcion, index) => {
        const button = document.createElement('button');
        button.innerText = opcion;
        button.classList.add('btn');
        
        // Estilo si ya está seleccionada
        if (respuestasUsuario[indicePreguntaActual] === index) {
            button.style.backgroundColor = "var(--primary-color)";
            button.style.color = "white";
        }

        button.onclick = () => {
            respuestasUsuario[indicePreguntaActual] = index;
            mostrarPregunta(); // Refrescar para marcar visualmente la opción
        };
        answerButtonsElement.appendChild(button);
    });

    actualizarControlesNavegacion();
    actualizarContador(); // Llamada al contador cada vez que cambia la pregunta
}

function actualizarContador() {
    const currentNumElem = document.getElementById('current-number');
    const totalQuestionsElem = document.getElementById('total-questions');

    if (currentNumElem && totalQuestionsElem) {
        currentNumElem.innerText = indicePreguntaActual + 1;
        totalQuestionsElem.innerText = preguntas.length;
    }
}

function actualizarControlesNavegacion() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');

    // Manejo de visibilidad del botón Anterior
    if(prevBtn) prevBtn.style.visibility = indicePreguntaActual === 0 ? 'hidden' : 'visible';
    
    // Si estamos en la última pregunta, mostramos "Finalizar" y ocultamos "Siguiente"
    if (indicePreguntaActual === preguntas.length - 1) {
        if(nextBtn) nextBtn.classList.add('hide');
        if(finishBtn) finishBtn.classList.remove('hide');
    } else {
        if(nextBtn) nextBtn.classList.remove('hide');
        if(finishBtn) finishBtn.classList.add('hide');
    }
}

function siguientePregunta() {
    if (indicePreguntaActual < preguntas.length - 1) {
        indicePreguntaActual++;
        mostrarPregunta();
    }
}

function anteriorPregunta() {
    if (indicePreguntaActual > 0) {
        indicePreguntaActual--;
        mostrarPregunta();
    }
}

function finalizarQuiz() {
    puntajeActual = 0;
    historialSesion = [];

    preguntas.forEach((pregunta, i) => {
        const seleccion = respuestasUsuario[i];
        const esCorrecta = seleccion === pregunta.correcta;
        if (esCorrecta) puntajeActual += 10;

        historialSesion.push({
            pregunta: pregunta.pregunta,
            respuestaUsuario: seleccion !== null ? pregunta.opciones[seleccion] : "Sin responder",
            respuestaCorrecta: pregunta.opciones[pregunta.correcta],
            esCorrecta: esCorrecta
        });
    });

    document.getElementById('quiz-container').classList.add('hide');
    document.getElementById('review-container').classList.remove('hide');
    
    renderizarRevision();
    guardarPuntajeFinal(puntajeActual);
}

function renderizarRevision() {
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = ""; 

    historialSesion.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('review-item');
        const color = item.esCorrecta ? "#2ecc71" : "#e74c3c";
        
        div.innerHTML = `
            <p><strong>${index + 1}. ${item.pregunta}</strong></p>
            <p style="color: ${color}">Tu respuesta: ${item.respuestaUsuario}</p>
            ${!item.esCorrecta ? `<p style="color: #2ecc71">Correcta: ${item.respuestaCorrecta}</p>` : ''}
            <hr>
        `;
        reviewList.appendChild(div);
    });
}

// --- SECCIÓN PUNTUACIONES ---

function guardarPuntajeFinal(puntos) {
    let historial = JSON.parse(localStorage.getItem('historialPuntajes')) || [];
    const nuevoRegistro = {
        puntos: puntos,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    historial.unshift(nuevoRegistro);
    if (historial.length > 10) historial.pop();
    localStorage.setItem('historialPuntajes', JSON.stringify(historial));
    actualizarTablaPuntuaciones();
}

function actualizarTablaPuntuaciones() {
    const lista = document.getElementById('high-scores-list');
    let historial = JSON.parse(localStorage.getItem('historialPuntajes')) || [];
    if (historial.length === 0) {
        lista.innerHTML = "<p>Aún no hay récords.</p>";
        return;
    }
    let tablaHTML = `<table><thead><tr><th>Fecha</th><th>Hora</th><th>Puntaje</th></tr></thead><tbody>`;
    historial.forEach(reg => {
        tablaHTML += `<tr><td>${reg.fecha}</td><td>${reg.hora}</td><td><strong>${reg.puntos} pts</strong></td></tr>`;
    });
    tablaHTML += "</tbody></table>";
    lista.innerHTML = tablaHTML;
}

// EVENTOS DE CARGA
window.addEventListener('load', () => {
    actualizarTablaPuntuaciones();
    if (sessionStorage.getItem('accesoPermitido') === 'true') {
        const ls = document.getElementById('login-screen');
        const ma = document.getElementById('main-app');
        if(ls) ls.style.display = 'none';
        if(ma) {
            ma.classList.remove('hide');
            ma.style.display = 'flex';
        }
        iniciarQuiz();
    }
});