document.addEventListener("DOMContentLoaded", () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const domicilioInput = document.getElementById("domicilio");
    const formulario = document.getElementById("formulario");

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
        
            departamentoSelect.innerHTML = '<option value="">Seleccione un departamento</option>';
        
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

    // Función de validación para el campo de archivo
    function validarArchivo(inputFile) {
        const archivo = inputFile.files[0];
        const tiposPermitidos = ['image/jpeg', 'image/png'];
        const tamanioMaximo = 10 * 1024 * 1024; // 10MB

        if (!archivo) {
            alert("Por favor, selecciona un archivo.");
            return false;
        }

        // Validar tipo de archivo
        if (!tiposPermitidos.includes(archivo.type)) {
            alert("El archivo debe ser JPG, JPEG o PNG.");
            return false;
        }

        // Validar tamaño de archivo
        if (archivo.size > tamanioMaximo) {
            alert("El archivo no puede superar los 10MB.");
            return false;
        }

        return true;
    }

    // Validación para el campo de domicilio (sin caracteres especiales)
    function validarDomicilio(inputDomicilio) {
        const domicilio = inputDomicilio.value;
        const regexDomicilio = /^[a-zA-Z0-9\s,.-]*$/;  // Permite solo letras, números, espacio, coma, punto y guion.

        if (!regexDomicilio.test(domicilio)) {
            alert("El domicilio no puede contener caracteres especiales.");
            return false;
        }

        return true;
    }

    // Función principal de validación al enviar el formulario
    function validarFormulario() {
        const archivoInput = document.getElementById('foto');
        const domicilioInput = document.getElementById('domicilio');

        if (!validarArchivo(archivoInput)) {
            return false;
        }

        if (!validarDomicilio(domicilioInput)) {
            return false;
        }

        return true;
    }

    // Manejo del envío del formulario
    formulario.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        // Validar el formulario antes de enviar
        if (!validarFormulario()) {
            return; // Si la validación falla, no enviar el formulario
        }

        // Obtener los datos directamente desde los elementos del formulario
        const departamento = document.getElementById("departamento").value;
        const tipificacion = document.getElementById("tipificacion").value;
        const hora = document.getElementById("hora").value ? document.getElementById("hora").value.replace(":", "") : null; // Convertir HH:MM a HHMM
        const domicilio = document.getElementById("domicilio").value;
        const foto = document.getElementById("foto").files[0]; // Seleccionar el archivo cargado (opcional)

        // Crear un objeto para enviar los datos
        const dataToPost = {
            p_dep_codigo: departamento,
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
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToPost)
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Respuesta de la API:", result);
                alert("Formulario enviado con éxito");
            } else {
                const error = await response.text();
                console.error("Error en la respuesta:", error);
                alert("Hubo un problema al enviar los datos. Verifica tu información.");
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            alert("Ocurrió un error inesperado al enviar el formulario.");
        }
    });
});
