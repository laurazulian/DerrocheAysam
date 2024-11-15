document.addEventListener("DOMContentLoaded", () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const domicilioInput = document.getElementById("domicilio");
    const captchaInput = document.getElementById("captcha");
    const captchaError = document.getElementById("captchaError");

    // Simula obtener datos desde una API
    async function fetchFromAPI(endpoint) {
        const response = await fetch(endpoint);
        if (response.ok) {
            return await response.json();
        } else {
            console.error(`Error al cargar ${endpoint}`);
            return [];
        }
    }

    // Carga datos en el select de departamento
    async function loadDepartamentos() {
        const departamentos = await fetchFromAPI("https://api.ejemplo.com/departamentos");
        departamentos.forEach(dep => {
            const option = document.createElement("option");
            option.value = dep.id;
            option.textContent = dep.nombre;
            departamentoSelect.appendChild(option);
        });
    }

    // Carga datos en el select de tipificación
    async function loadTipificaciones() {
        const tipificaciones = await fetchFromAPI("https://api.ejemplo.com/tipificaciones");
        tipificaciones.forEach(tip => {
            const option = document.createElement("option");
            option.value = tip.id;
            option.textContent = tip.nombre;
            tipificacionSelect.appendChild(option);
        });
    }

    // Inicializa la carga de datos
    loadDepartamentos();
    loadTipificaciones();

    // Evento de envío de formulario
    document.getElementById("formulario").addEventListener("submit", (e) => {
        e.preventDefault(); // Evita que se recargue la página

        // Validar captcha
        const captchaCorrecto = captchaInput.value.trim() === "7"; // Captcha correcto es "7"
        if (!captchaCorrecto) {
            captchaError.style.display = "block";
            return;
        } else {
            captchaError.style.display = "none";
        }

        // Validar domicilio
        if (domicilioInput.value.length > 150) {
            alert("El domicilio no puede superar los 150 caracteres.");
            return;
        }

        // Obtener los datos del formulario
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        console.log(data);

        // Agregar lógica para enviar los datos al servidor
        alert("Formulario enviado con éxito");
    });
});
