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
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    
        // Obtener los datos directamente desde los elementos del formulario
        const departamento = document.getElementById("departamento").value;
        const tipificacion = document.getElementById("tipificacion").value;
        const hora = document.getElementById("hora").value ? document.getElementById("hora").value.replace(":", "") : null; // Convertir HH:MM a HHMM
        const domicilio = document.getElementById("domicilio").value;
        const foto = document.getElementById("foto").files[0]; // Seleccionar el archivo cargado (opcional)
    
        // Crear un objeto para enviar los datos
        const dataToPost = {
            p_dep_codigo: departamento, // Cambiar los nombres de las claves al esperado
            p_tpf_id: tipificacion,
            p_hora: hora,
            p_domicilio: domicilio,
            p_foto: foto ? foto.name : null
        };
    
        console.log("Datos enviados:", dataToPost); // Verifica que los datos sean correctos
    
        try {
            const response = await fetch("http://10.10.0.238:8080/ords/manantial/Derroche/post_derroche", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Indicar que se envía un JSON
                },
                body: JSON.stringify(dataToPost) // Convertir el objeto a JSON
            });
    
            if (response.ok) {
                const result = await response.json(); // Procesar la respuesta como JSON
                console.log("Respuesta de la API:", result);
                alert("Formulario enviado con éxito" ); // Mostrar mensaje de éxito
            } else {
                const error = await response.text(); // Leer el mensaje de error
                console.error("Error en la respuesta:", error);
                alert("Hubo un problema al enviar los datos. Verifica tu información.");
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error); // Mostrar errores en la consola
            alert("Ocurrió un error inesperado al enviar el formulario.");
        }
    });
    
    

     // Validar captcha
        /*const captchaCorrecto = captchaInput.value.trim() === "7"; 
        if (!captchaCorrecto) {
            captchaError.style.display = "block";
            return;
        } else {
            captchaError.style.display = "none";
        }*/
});