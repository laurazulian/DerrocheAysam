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
        try {
            // Llama a la API de departamentos
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/get_departamentos");
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
    
            const data = await response.json();
            console.log(data); 
    
            // Accede al arreglo en data.items
            const departamentos = data.items;
            console.log(departamentos);
    
            // Selecciona el select de departamentos
            const departamentoSelect = document.getElementById("departamento");
    
            // Limpia las opciones existentes (si hay)
            departamentoSelect.innerHTML = '<option value="">Seleccione un departamento</option>';
    
            // Pobla el select con los valores de dep_descripcion
            departamentos.forEach(dep => {
                const option = document.createElement("option");
                option.value = dep.dep_codigo; // Usa dep_codigo como valor
                option.textContent = dep.dep_descripcion; // Usa dep_descripcion como texto
                departamentoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar los departamentos:", error);
        }
    }
    
    // Llama a la función cuando cargue la página
    document.addEventListener("DOMContentLoaded", loadDepartamentos);
    
    
    // Llama a la función al cargar la página
    document.addEventListener("DOMContentLoaded", () => {
        loadDepartamentos();
    });
    

    // Carga datos en el select de tipificación
    async function loadTipificaciones() {
        const tipificaciones = await fetchFromAPI("http://10.10.0.238:8080/ords/manantial/Derroche/get_tpf_derroche");
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
