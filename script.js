document.addEventListener("DOMContentLoaded", () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const domicilioInput = document.getElementById("domicilio");
    const formulario = document.getElementById("formulario");
    const fileInput = document.getElementById("foto");
    

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
            const response = await fetch("https://testoficinavirtual.aysam.com.ar/test/Derroche/get_departamentos");
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
            const response = await fetch("https://testoficinavirtual.aysam.com.ar/test/Derroche/get_tpf_derroche");
            
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
        const archivo = inputFile.files[0]; // Obtener el archivo cargado
        const tiposPermitidos = ["image/jpeg", "image/png"];
        const tamanioMaximo = 10 * 1024 * 1024; // 10 MB
    
        // Si no se seleccionó un archivo, no es un error
        if (!archivo) {
            return true; // Archivo no es obligatorio, continuar
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
    
        return true; // Todo está bien
    }
    

    // Validación para el campo de domicilio (sin caracteres especiales)
    // Validación para el campo de domicilio (sin caracteres especiales)
    function validarDomicilio(inputDomicilio) {
        const domicilio = inputDomicilio.value;
        const regexDomicilio = /^[a-zA-Z0-9\s,.-]*$/;  // Permite solo letras, números, espacio, coma, punto y guion.
    
        // Validación de caracteres permitidos
        if (!regexDomicilio.test(domicilio)) {
            alert("El domicilio no puede contener caracteres especiales.");
            return false;
        }
    
        // Validación de longitud máxima de 150 caracteres
        if (domicilio.length > 150) {
            alert("El domicilio no puede superar los 150 caracteres.");
            return false;
        }
    
        return true;
    }

    formulario.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    
        // Validar el formulario antes de enviar
        const archivoInput = document.getElementById("foto");
        if (!validarArchivo(archivoInput)) {
            return; // Detener el envío si no es válido
        }

        
    const domicilioInput = document.getElementById("domicilio");
        if (!validarDomicilio(domicilioInput)) {
        return; // Detener el envío si el domicilio no es válido
    }

    
        // Crear un objeto FormData
        const formData = new FormData();
    
        // Agregar los demás campos al FormData
        formData.append("p_dep_codigo", document.getElementById("departamento").value); // Número
        formData.append("p_tpf_id", document.getElementById("tipificacion").value); // Número
        formData.append("p_hora", document.getElementById("hora").value.replace(":", "") || null); // String (o null)
        formData.append("p_domicilio", document.getElementById("domicilio").value); // String
    
        // Si hay un archivo, primero lo subimos y luego enviamos solo el nombre del archivo a la base de datos
        const fotoInput = document.getElementById('foto');
        if (fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
    
            // Crear un objeto FormData para enviar el archivo (puedes ajustarlo según la ruta que te devuelva la API)
            const fileFormData = new FormData();
            fileFormData.append("file", file);  // Aquí envías el archivo completo
    
            // Enviar el archivo a la API para obtener el nombre del archivo
            const fileResponse = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: fileFormData
            });
    
            if (fileResponse.ok) {
                const fileData = await fileResponse.json(); // Respuesta de la API
                const filename = fileData.filename; // Obtener el nombre del archivo
                formData.append("p_foto", filename);  // Enviar solo el nombre del archivo a la base de datos
            } else {
                alert("Error al subir el archivo");
                return;
            }
        }
    
        try {
            // Enviar el formulario con el nombre del archivo
            const response = await fetch("https://testoficinavirtual.aysam.com.ar/test/Derroche/post_derroche", {
                method: "POST",
                body: formData,
            });
    
            if (response.ok) {
                const result = await response.text(); 
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
