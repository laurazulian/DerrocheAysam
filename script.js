document.addEventListener("DOMContentLoaded", () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const domicilioInput = document.getElementById("domicilio");
    //const captchaInput = document.getElementById("captcha");
    //const captchaError = document.getElementById("captchaError");

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
        const dataToPost = {
            departamento: formData.get("departamento"),
            tipificacion: formData.get("tipificacion"),
            hora: formData.get("hora"),  // Formato HH:MM
            domicilio: formData.get("domicilio"),
            foto: formData.get("foto") // Suponiendo que la URL de la foto ya está generada
        };

        try {
            // Enviar los datos al servidor usando POST
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/post_derroche", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToPost) // Enviar el objeto como JSON
            });

            if (response.ok) {
                const result = await response.json();
                alert("Formulario enviado con éxito: " + result.message);
            } else {
                const error = await response.text();
                console.error("Error en la respuesta:", error);
                alert("Hubo un problema al enviar los datos.");
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            alert("Ocurrió un error inesperado al enviar el formulario.");
        }
    });
});
