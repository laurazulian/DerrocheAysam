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

    async function loadDepartamentos() {
        try {
            // Usando un proxy para hacer la solicitud
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/get_departamentos");
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
        
            const data = await response.json();
            console.log(data); // Para ver el JSON en consola
        
            // Accede al arreglo en data.items
            const departamentos = data.items;
            console.log(departamentos);
        
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
    loadDepartamentos();

    // Carga datos en el select de tipificación
    async function loadTipificaciones() {
        try {
            // Llama a la API de tipificaciones
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/get_tpf_derroche");
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
    
            // Convierte la respuesta a JSON
            const data = await response.json();
            const tipificaciones = data.items; // Accede al arreglo 'items'
    
            // Selecciona el select de tipificaciones
            const tipificacionSelect = document.getElementById("tipificacion");
    
            // Limpia las opciones existentes (si hay)
            tipificacionSelect.innerHTML = '<option value="">Seleccione una tipificación</option>';
    
            // Recorre el arreglo de tipificaciones y agrega las opciones
            tipificaciones.forEach(tip => {
                const option = document.createElement("option");
                option.value = tip.tpf_id; // Usa tpf_id como valor
                option.textContent = tip.tpf_descripcion; // Usa tpf_descripcion como texto
                tipificacionSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar las tipificaciones:", error);
        }
    }
    
    // Llama a la función cuando cargue la página
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
