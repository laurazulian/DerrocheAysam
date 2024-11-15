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
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/get_departamentos");
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
        
            const data = await response.json();
            const departamentos = data.items;
        
            // Limpia las opciones existentes (si hay)
            departamentoSelect.innerHTML = '<option value="">Seleccione un departamento</option>';
        
            // Pobla el select con los valores de dep_descripcion
            departamentos.forEach(dep => {
                const option = document.createElement("option");
                option.value = dep.dep_codigo;
                option.textContent = dep.dep_descripcion;
                departamentoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar los departamentos:", error);
        }
    }

    loadDepartamentos();

    // Carga datos en el select de tipificación
    async function loadTipificaciones() {
        try {
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/get_tpf_derroche");
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
    
            const data = await response.json();
            const tipificaciones = data.items;
    
            const tipificacionSelect = document.getElementById("tipificacion");
    
            tipificacionSelect.innerHTML = '<option value="">Seleccione una tipificación</option>';
    
            tipificaciones.forEach(tip => {
                const option = document.createElement("option");
                option.value = tip.tpf_id;
                option.textContent = tip.tpf_descripcion;
                tipificacionSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar las tipificaciones:", error);
        }
    }
    
    loadTipificaciones();
    
    document.getElementById("formulario").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validar captcha
        /*const captchaCorrecto = captchaInput.value.trim() === "7"; 
        if (!captchaCorrecto) {
            captchaError.style.display = "block";
            return;
        } else {
            captchaError.style.display = "none";
        }*/

        // Validar domicilio
        if (domicilioInput.value.length > 150) {
            alert("El domicilio no puede superar los 150 caracteres.");
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        console.log(data);

        try {
            // Enviar los datos al servidor usando POST
            const response = await fetch("http://10.10.0.238:8080/tu_endpoint_aqui", {
                method: "POST",
                body: formData,  // Se envían los datos del formulario, incluidos los archivos
            });

            if (response.ok) {
                // Verificamos que la respuesta sea correcta
                const result = await response.json();  // Si la respuesta es JSON
                console.log(result);
                alert("Formulario enviado con éxito: " + result.message); // Alerta en caso de éxito
            } else {
                // Si la respuesta no es exitosa, mostramos un error
                const error = await response.text();  // Puede ser texto si el servidor no responde en formato JSON
                console.error(error);
                alert("Hubo un problema al enviar los datos.");
            }
        } catch (error) {
            // Manejo de errores si ocurre un fallo en el envío
            console.error("Error al enviar los datos:", error);
            alert("Hubo un problema al enviar los datos.");
        }
    });
});
