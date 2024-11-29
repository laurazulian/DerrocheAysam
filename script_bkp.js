document.addEventListener("DOMContentLoaded", () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const formulario = document.getElementById("formulario");
    const fileInput = document.getElementById("foto");
    const overlay = document.getElementById("overlay");
    

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
            const response = await fetch("https://api.aysam.com.ar/test/Derroche/v1/get_departamentos");
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

    // Carga datos en el select de tipificaciÃ³n
    async function loadTipificaciones() {
        try {
            const response = await fetch("https://api.aysam.com.ar/test/Derroche/v1/get_tpf_derroche");
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
    
            const data = await response.json();
            const tipificaciones = data.items;
    
            tipificacionSelect.innerHTML = '<option value="">Seleccione un motivo</option>';
    
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

    // FunciÃ³n para abrir el modal con un mensaje y cerrarlo automÃ¡ticamente
        function openModal(message, autoClose = true, closeAfter = 3000) { // Por defecto, cierra tras 3 segundos
            const modalMessage = document.getElementById("modalMessage");
            const messageModal = document.getElementById("messageModal");
            
            modalMessage.textContent = message;
            messageModal.style.display = "block";

            // Cerrar automÃ¡ticamente el modal si estÃ¡ habilitado
            if (autoClose) {
                setTimeout(() => {
                    messageModal.style.display = "none";
                }, closeAfter);
            }
        }

        // FunciÃ³n para cerrar el modal manualmente
        const modalClose = document.getElementById("modalClose");
        modalClose.onclick = function () {
            const messageModal = document.getElementById("messageModal");
            messageModal.style.display = "none";
        };

        // Cierra el modal si se hace clic fuera de la ventana
        window.onclick = function (event) {
            const messageModal = document.getElementById("messageModal");
            if (event.target == messageModal) {
                messageModal.style.display = "none";
            }
        };    
        
// FunciÃ³n principal para validar el formulario antes de enviarlo
function validarFormulario() {
    // Validar archivo
    const archivoInput = document.getElementById("foto");
    if (!validarArchivo(archivoInput)) {
        return; // Detener el envÃ­o si no es vÃ¡lido
    }

    // Validar domicilio
    const domicilioInput = document.getElementById("domicilio");
    if (!validarDomicilio(domicilioInput)) {
        return; // Detener el envÃ­o si el domicilio no es vÃ¡lido
    }

    // Validar nÃºmero
    const numeroInput = document.getElementById("numero");
    if (!validarNumero(numeroInput)) return;

    // Validar manzana
    const manzanaInput = document.getElementById("mza");
    if (!validarManzana(manzanaInput)) return;

    // Validar calle (sin caracteres especiales)
    const calleInput = document.getElementById("calle");
    if (!validarSinCaracteresEspeciales(calleInput)) return;

    // Validar barrio (sin caracteres especiales)
    const barrioInput = document.getElementById("barrio");
    if (!validarSinCaracteresEspeciales(barrioInput)) return;

    // AquÃ­ puedes agregar cualquier otra validaciÃ³n que necesites
}

// FunciÃ³n para validar campos sin caracteres especiales

function cantidadDeCaracteres(cadena){
    if (cadena.length > 150){
        openModal("No puede ingresar más de 150 caracteres.");
        return false
    }
    return true;
}

function validarSinCaracteresEspeciales(input) {
    const regex = /^[a-zA-Z0-9\s]*$/;  // Permite letras, nÃºmeros y espacios
    if (!regex.test(input.value)) {
        openModal("Ningún campo puede contener caracteres especiales.");
        return false;
    }
    return true; // Retorna true si pasa la validaciÃ³n
}

// FunciÃ³n para validar que el campo contenga solo nÃºmeros
function validarNumero(input) {
    console.log("Elemento input recibido:", input); // Verificar el objeto input
    const valor = input.trim(); // Usar directamente el input si es un string
    const regex = /^[0-9]*$/; // Permite nÃºmeros vacÃ­os o nÃºmeros

    if (valor && !regex.test(valor)) { // Validar el contenido
        openModal("El número solo puede contener dí­gitos.");
        return false;
    }
    return true; // Retorna true si pasa la validaciÃ³n
}

function validarManzana(input) {
    const valor = input.trim(); // Elimina espacios
    const regex = /^[a-zA-Z0-9]{1,2}$/; // Permite entre 1 y 2 letras o nÃºmeros
    if (valor && !regex.test(valor)) {
        openModal("La manzana debe contener entre 1 y 2 letras o números.");
        return false;
    }
    return true; // Retorna true si pasa la validaciÃ³n o estÃ¡ vacÃ­o
}


// FunciÃ³n para validar el archivo cargado
function validarArchivo(inputFile) {
    const archivo = inputFile.files[0]; // Obtener el archivo cargado
    const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg"];
    const tamanioMaximo = 10 * 1024 * 1024; // 10 MB
    
    // Si no se seleccionÃ³ un archivo, no es un error
    if (!archivo) {
        return true; // Archivo no es obligatorio, continuar
    }

    // Validar tipo de archivo
    if (!tiposPermitidos.includes(archivo.type)) {
        openModal("El archivo debe ser JPG, JPEG o PNG.");
        return false;
    }

    // Validar tamaÃ±o de archivo
    if (archivo.size > tamanioMaximo) {
        openModal("El archivo no puede superar los 10MB.");
        return false;
    }

    return true; // Todo estÃ¡ bien
}

// FunciÃ³n para validar el domicilio
function validarDomicilio() {
    const calle = document.getElementById("calle").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const manzana = document.getElementById("mza").value.trim();
    const casa = document.getElementById("ca").value.trim();
    const barrio = document.getElementById("barrio").value.trim();


      // Verificar si se cumple la primera combinaciÃ³n (calle y nÃºmero)
      const tieneCalleYNumero = calle && numero;

      // Verificar si se cumple la segunda combinaciÃ³n (barrio, manzana y casa)
      const tieneBarrioManzanaCasa = barrio && manzana && casa;
  
      // Validar que se cumpla al menos una combinaciÃ³n

    if (!cantidadDeCaracteres(calle)){
        return false
    }

    if (!cantidadDeCaracteres(numero)){
        return false
    }
    if (!cantidadDeCaracteres(casa)){
        return false
    }
    if (!cantidadDeCaracteres(barrio)){
        return false
    }
    if (!cantidadDeCaracteres(manzana)){
        return false
    }
    
    // ValidaciÃ³n: Si se ingresa nÃºmero, debe haber calle
    if (numero && !calle) {
        openModal("Si se ingresa un número, debe ingresar una calle.");
        return false;
    }

    // ValidaciÃ³n: Si se ingresa manzana, debe haber casa
    if (manzana && !casa) {
        openModal("Si se ingresa una manzana, debe ingresar una casa.");
        return false;
    }

    // ValidaciÃ³n: Si se ingresa casa, debe haber manzana
    if (casa && !manzana) {
        openModal("Si se ingresa una casa, debe ingresar una manzana.");
        return false;
    }

    // ValidaciÃ³n: Si se ingresa manzana o casa, debe haber barrio
    if ((manzana || casa) && !barrio) {
        openModal("Si se ingresa una manzana o una casa, debe ingresar un barrio.");
        return false;
    }

    // ValidaciÃ³n: Si se ingresa calle, se requiere nÃºmero, pero solo si no hay manzana ni casa
    if (calle && !numero && !manzana && !casa) {
        openModal("Si se ingresa una calle, debe ingresar un número.");
        return false;
    }

    if (!tieneCalleYNumero && !tieneBarrioManzanaCasa) {
        openModal("Debe completar Calle y Número o Barrio, Manzana y Casa.");
        return false;
    }


    // Si pasa todas las validaciones, retornamos true
    return true;
}
   
    
    formulario.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
	

       // Validar el formulario antes de enviar
        /*const archivoInput = document.getElementById("foto");
        if (!validarArchivo(archivoInput)) {
            return; // Detener el envÃ­o si no es vÃ¡lido
        }*/

        const domicilioInput = document.getElementById("domicilio");
        if (!validarDomicilio(domicilioInput)) {
            return; // Detener el envÃ­o si el domicilio no es vÃ¡lido
        }

        const fechaInput = document.getElementById("fecha_infraccion").value;

        if (!fechaInput) {
            openModal("Debe seleccionar una fecha válida.");
            return;
        }

        // Dividir la fecha manualmente (suponiendo formato 'YYYY-MM-DD' en el input)
        const [anio, mes, dia] = fechaInput.split('-');

        // Formatear la fecha como DD/MM/YY
        const fechaFormateada = `${dia}/${mes}/${anio}`;
        //console.log("Fecha formateada para enviar:", fechaFormateada);

        const numeroInput = document.getElementById("numero").value;
        console.log("antes",numeroInput)
        const manzanaInput = document.getElementById("mza").value.trim();
        const calleInput = document.getElementById("calle").value.trim();
        const barrioInput = document.getElementById("barrio").value.trim();

        if (!validarNumero(numeroInput)) return;
        if (!validarManzana(manzanaInput)) return;
        if (!validarSinCaracteresEspeciales(calleInput)) return;
        if (!validarSinCaracteresEspeciales(barrioInput)) return;

	overlay.classList.remove("hidden");
        
        const formData = new FormData();
    
        // Agregar los demÃ¡s campos al FormData
        formData.append("p_dep_codigo", document.getElementById("departamento").value); // NÃºmero
        formData.append("p_tpf_id", document.getElementById("tipificacion").value); // NÃºmero
        formData.append("p_hora", document.getElementById("hora").value.replace(":", "") || null); // String (o null)
        //formData.append("p_fecha", document.getElementById("fecha_infraccion").value);
        formData.append("p_fecha", fechaFormateada); 
        formData.append("p_calle",document.getElementById("calle").value);
        formData.append("p_numero",document.getElementById("numero").value);
        formData.append("p_barrio",document.getElementById("barrio").value);
        formData.append("p_casa",document.getElementById("ca").value);
        formData.append("p_manzana",document.getElementById("mza").value);
    
        // Si hay un archivo, primero lo subimos y luego enviamos solo el nombre del archivo a la base de datos
        const fotoInput = document.getElementById('foto');
        if (fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
    
            // Crear un objeto FormData para enviar el archivo (puedes ajustarlo segÃºn la ruta que te devuelva la API)
            const fileFormData = new FormData();
            fileFormData.append("file", file);  // AquÃ­ envÃ­as el archivo completo
    
            // Enviar el archivo a la API para obtener el nombre del archivo
            const fileResponse = await fetch("https://api.aysam.com.ar/upload", {
                method: "POST",
                body: fileFormData,
            });
    
            if (fileResponse.ok) {
                const fileData = await fileResponse.json(); // Respuesta de la API
                const filename = fileData.filename; // Obtener el nombre del archivo
                formData.append("p_foto", filename);  // Enviar solo el nombre del archivo a la base de datos
            } else {
                openModal("Error al subir el archivo");
                return;
            }
        }
    
        try {

            //overlay.classList.remove("hidden");
            // Enviar el formulario con el nombre del archivo
            const response = await fetch("https://api.aysam.com.ar/test/Derroche/v1/post_derroche", {   
                method: "POST",
                body: formData,
            });
            for (let pair of formData.entries()) {
                console.log(`${pair[0]}: ${pair[1]}`);
            }

    
            if (response.ok) {
                const result = await response.text(); 
                //console.log("Respuesta de la API:", result);
                openModal("Gracias. Su denuncia ha sido registrada.");
                formulario.reset();
            } else {
                const error = await response.text();
                //console.error("Error en la respuesta:", error);
                openModal("Hubo un problema al enviar los datos. Verifica tu información.");
            }
        } catch (error) {
            //console.error("Error al enviar los datos:", error);
            openModal("Ocurrió un error inesperado al enviar el formulario.");
         } finally {
            // Oculta el overlay
            overlay.classList.add("hidden");
        }
    });
});
