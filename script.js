document.addEventListener("DOMContentLoaded", async () => {
    const departamentoSelect = document.getElementById("departamento");
    const tipificacionSelect = document.getElementById("tipificacion");
    const formulario = document.getElementById("formulario");
    const fileInput = document.getElementById("foto");
    const overlay = document.getElementById("overlay");
    
    let appConfig = {};

    async function fetchConfig() {
        try {
            //const response = await fetch("http://localhost:8000/config");
            const response = await fetch("https://api.aysam.com.ar/config");
            if (!response.ok) throw new Error("Error al obtener configuración");
            const data = await response.json();
            console.log("Configuración recibida:", data);
            return data; // Devuelve la configuración obtenida
        } catch (error) {
            console.error("No se pudo cargar la configuración:", error);
            return null;
        }
    }
    
    async function initializeConfig() {
        const config = await fetchConfig();
        if (config) {
            appConfig = {
                API_GET_DEPARTAMENTOS: config.API_GET_DEPARTAMENTOS,
                API_GET_TIPIFICACIONES: config.API_GET_TIPIFICACIONES,
                API_POST_FORMULARIO: config.API_POST_FORMULARIO,
                API_UPLOAD_FOTO: config.API_UPLOAD_FOTO,
                RECAPTCHA_SITE_KEY: config.RECAPTCHA_SITE_KEY,
            };
            console.log("Variables de entorno cargadas:", appConfig);

            // Configurar reCAPTCHA
            loadRecaptchaScript();

            // Cargar datos
            await loadDepartamentos();
            await loadTipificaciones();
        } else {
            //console.error("No se pudo inicializar la configuración");
        }
    }
    

    function loadRecaptchaScript() {
        if (appConfig.RECAPTCHA_SITE_KEY) {
            // Cargar el script de reCAPTCHA v3 de forma dinámica
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${appConfig.RECAPTCHA_SITE_KEY}`;
            //script.async = true;
            //script.defer = true;
    
            script.onload = () => {
                //console.log("Script de reCAPTCHA cargado exitosamente");
                setupCaptcha();
            };
    
            document.head.appendChild(script);
        } else {
            //console.error("Site key no disponible");
        }
    }
    function setupCaptcha() {
        if (appConfig.RECAPTCHA_SITE_KEY) {
            // Espera a que reCAPTCHA esté listo
            grecaptcha.ready(() => {
                //console.log("reCAPTCHA está listo");
    
                // Ejecuta la acción sin necesidad de obtener el token
                grecaptcha.execute(appConfig.RECAPTCHA_SITE_KEY, { action: 'submit' }).then(() => {
                    //console.log("Acción reCAPTCHA ejecutada");
                    // Ya no se necesita hacer nada con el token
                });
            });
        } else {
            //console.error("Site key no disponible");
        }
    }

    
    // Inicializar la configuración al cargar el documento
   initializeConfig();
    
    // Simula obtener datos desde una API
    async function fetchFromAPI(endpoint) {
        const response = await fetch(endpoint);
        if (response.ok) {
            return await response.json();
        } else {
            //console.error(`Error al cargar ${endpoint}`);
            return [];
        }
    }

    async function loadDepartamentos() {
        try {
            const response = await fetch(appConfig.API_GET_DEPARTAMENTOS);
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
            //console.error("Error al cargar los departamentos:", error);
        }
    }


    // Carga datos en el select de tipificación
    async function loadTipificaciones() {
        try {
            const response = await fetch(appConfig.API_GET_TIPIFICACIONES);
            
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
            //console.error("Error al cargar las tipificaciones:", error);
        }
    }
    

        function openModal(message, autoClose = true, closeAfter = 4000, showCheck = false, showCross = false) {
            const modalMessage = document.getElementById("modalMessage");
            const messageModal = document.getElementById("messageModal");
            const checkIcon = document.getElementById("checkIcon");
            const crossIcon = document.getElementById("crossIcon");

            // Configurar el mensaje
            modalMessage.textContent = message;

            // Mostrar u ocultar los íconos según los parámetros
            checkIcon.style.display = showCheck ? "inline-block" : "none";
            crossIcon.style.display = showCross ? "inline-block" : "none";

            // Mostrar el modal
            messageModal.style.display = "block";

            // Cerrar automáticamente el modal si está habilitado
            if (autoClose) {
                setTimeout(() => {
                    messageModal.style.display = "none";
                }, closeAfter);
            }
        }


        // Función para cerrar el modal manualmente
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
        
        
    

// Función principal para validar el formulario antes de enviarlo
function validarFormulario() {
    // Validar archivo
    const archivoInput = document.getElementById("foto");
    if (!validarArchivo(archivoInput)) {
        return; // Detener el envío si no es válido
    }

    // Validar domicilio
   /* const domicilioInput = document.getElementById("domicilio");
    if (!validarDomicilio(domicilioInput)) {
        return; // Detener el envío si el domicilio no es válido
    }*/

    // Validar número
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

    // Aquí puedes agregar cualquier otra validación que necesites
}

// Función para validar campos sin caracteres especiales
function validarSinCaracteresEspeciales(input) {
    const regex = /^[a-zA-Z0-9\s]*$/;  // Permite letras, números y espacios
    if (!regex.test(input.value)) {
        
        openModal("Ningún campo puede contener caracteres especiales.", true, 4000, false, true);

        return false;
    }
    return true; // Retorna true si pasa la validación
}

// Función para validar que el campo contenga solo números
function validarNumero(input) {
    //console.log("Elemento input recibido:", input); // Verificar el objeto input
    const valor = input.trim(); // Usar directamente el input si es un string
    const regex = /^[0-9]*$/; // Permite números vacíos o números

    if (valor && !regex.test(valor)) { // Validar el contenido
        
        openModal("El número solo puede contener dígitos.", true, 4000, false, true);
        return false;
    }
    return true; // Retorna true si pasa la validación
}

function validarManzana(input) {
    const valor = input.trim(); // Elimina espacios
    const regex = /^[a-zA-Z0-9]{1,2}$/; // Permite entre 1 y 2 letras o números
    if (valor && !regex.test(valor)) {
        openModal("La manzana debe contener entre 1 y 2 letras o números.", true, 4000, false, true);
        
        return false;
    }
    return true; // Retorna true si pasa la validación o está vacío
}


// Función para validar el archivo cargado
/*function validarArchivo(inputFile) {
    const archivo = inputFile.files[0]; // Obtener el archivo cargado
    const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg"];
    const tamanioMaximo = 10 * 1024 * 1024; // 10 MB
    
    // Si no se seleccionó un archivo, no es un error
    if (!archivo) {
        return true; // Archivo no es obligatorio, continuar
    }

    // Validar tipo de archivo
    if (!tiposPermitidos.includes(archivo.type)) {
        // Detener el envío del formulario
        openModal("El archivo debe ser JPG, JPEG o PNG.");
        return false;
    }

    // Validar tamaño de archivo
    if (archivo.size > tamanioMaximo) {
        openModal("El archivo no puede superar los 10MB.");
        return false;
    }

    return true; // Todo está bien
}*/

function validarArchivo(inputFile) {
    const archivo = inputFile.files[0]; // Obtener el archivo cargado
    const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg"];
    const tamanioMaximo = 10 * 1024 * 1024; // 10 MB

    // Si no se seleccionó un archivo, no es un error
    if (!archivo) {
        return true; // Permitir continuar si no es obligatorio
    }

    // Validar tipo de archivo
    if (!tiposPermitidos.includes(archivo.type)) {
        //openModal("El archivo debe ser JPG, JPEG o PNG.");
        openModal("El archivo debe ser JPG, JPEG o PNG.", true, 4000, false, true);

        return false;
    }

    // Validar tamaño de archivo
    if (archivo.size > tamanioMaximo) {
        openModal("El archivo no puede superar los 10MB.", true, 4000, false, true);
        return false;
    }

    return true; // Todo está bien
}


// Función para validar el domicilio
function validarDomicilio() {
    const calle = document.getElementById("calle").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const manzana = document.getElementById("mza").value.trim();
    const casa = document.getElementById("ca").value.trim();
    const barrio = document.getElementById("barrio").value.trim();

    //console.log("Entra a las validaciones")

    function cantidadDeCaracteres(cadena){
        if (cadena.length > 150){
            openModal("No puede ingresar más de 150 caracteres.", true, 4000, false, true);
            return false
        }
        return true;
    }

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

      // Verificar si se cumple la primera combinación (calle y número)
      const tieneCalleYNumero = calle && numero;

      // Verificar si se cumple la segunda combinación (barrio, manzana y casa)
      const tieneBarrioManzanaCasa = barrio && manzana && casa;
  
      // Validar que se cumpla al menos una combinación
    
    // Validación: Si se ingresa número, debe haber calle
    if (numero && !calle) {
        openModal("Si se ingresa un número, debe ingresar una calle.", true, 3000, false, true);

        //openModal("Si se ingresa un número, debe ingresar una calle.");
        return false;
    }

    // Validación: Si se ingresa manzana, debe haber casa
    if (manzana && !casa) {
        openModal("Si se ingresa una manzana, debe ingresar una casa.", true, 4000, false, true);
        return false;
    }

    // Validación: Si se ingresa casa, debe haber manzana
    if (casa && !manzana) {
        openModal("Si se ingresa una casa, debe ingresar una manzana.", true, 4000, false, true);
        return false;
    }

    // Validación: Si se ingresa manzana o casa, debe haber barrio
    if ((manzana || casa) && !barrio) {
        openModal("Si se ingresa una manzana o una casa, debe ingresar un barrio.", true, 4000, false, true);
        return false;
    }

    // Validación: Si se ingresa calle, se requiere número, pero solo si no hay manzana ni casa
    if (calle && !numero && !manzana && !casa) {
        openModal("Si se ingresa una calle, debe ingresar un número.", true, 4000, false, true);
        return false;
    }

    if (!tieneCalleYNumero && !tieneBarrioManzanaCasa) {
        openModal("Debe completar Calle y Número o Barrio, Manzana y Casa.", true, 4000, false, true);
        return false;
    }


    // Si pasa todas las validaciones, retornamos true
    return true;
}

    formulario.addEventListener("submit", async (e) => {
        e.preventDefault();
        validarDomicilio()

        
        if (!validarDomicilio()) {
            return; // Detener el envío si el domicilio no es válido
        }

       // Validar el formulario antes de enviar
       const archivoInput = document.getElementById("foto");
       if (!validarArchivo(archivoInput)) {
           return; // Detener el envío si el archivo no es válido
       }


        /*const fechaInput = document.getElementById("fecha_infraccion").value;

        if (!fechaInput) {
            openModal("Debe seleccionar una fecha válida.");
            return;
        }

        // Dividir la fecha manualmente (suponiendo formato 'YYYY-MM-DD' en el input)
        const [anio, mes, dia] = fechaInput.split('-');

        // Formatear la fecha como DD/MM/YY
        const fechaFormateada = `${dia}/${mes}/${anio}`;
        //console.log("Fecha formateada para enviar:", fechaFormateada);*/

          // Obtener la fecha máxima (hoy)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Mes con 2 dígitos
    const dd = String(today.getDate()).padStart(2, '0');      // Día con 2 dígitos
    const maxDate = `${yyyy}-${mm}-${dd}`;

    // Obtener el input de fecha
    const fechaInput = document.getElementById("fecha_infraccion");
    if (!fechaInput) {
        //console.error("No se encontró el input con ID 'fecha_infraccion'.");
        return;
    }

    // Establecer el atributo 'max'
    fechaInput.setAttribute('max', maxDate);

    // Validar la fecha seleccionada
    const fechaSeleccionada = fechaInput.value;

    // Si no hay fecha seleccionada
    if (!fechaSeleccionada) {
        openModal("Debe seleccionar una fecha válida.", true, 4000, false, true);
        return;
    }

    // Verificar si la fecha seleccionada es posterior a la actual
    if (fechaSeleccionada > maxDate) {
        openModal("La fecha seleccionada no puede ser posterior a la actual.", true, 4000, false, true);
        return;
    }

    // Validar el formato de la fecha y reformatarla
    const [anio, mes, dia] = fechaSeleccionada.split('-');
    const fechaFormateada = `${dia}/${mes}/${anio}`;
    //console.log("Fecha formateada para enviar:", fechaFormateada);
    
    
    // Validar la hora
    const currentHour = today.getHours();
    const horaInput = document.getElementById("hora");

    // Asegúrate de que exista el campo de hora
    if (!horaInput) {
        //console.error("No se encontró el input con ID 'hora'.");
        return;
    }

    // Obtener el valor ingresado
    const horaSeleccionada = parseInt(horaInput.value, 10);

    // Validar si el valor ingresado no es un número
    if (isNaN(horaSeleccionada)) {
        openModal("Por favor, ingrese una hora válida.", true, 4000, false, true);
        return;
    }

    // Validar que la hora seleccionada no sea mayor que la hora actual
    if (horaSeleccionada > currentHour) {
        openModal("La hora de infracción no puede ser posterior a la hora actual.", true, 4000, false, true);
        return;
    }

// Si todo es válido
    //console.log("Formulario válido. Fecha:", fechaFormateada, "Hora:", horaSeleccionada);
        const numeroInput = document.getElementById("numero").value;
        //console.log("antes",numeroInput)
        const manzanaInput = document.getElementById("mza").value.trim();
        const calleInput = document.getElementById("calle").value.trim();
        const barrioInput = document.getElementById("barrio").value.trim();
        


        if (!validarNumero(numeroInput)) return;
        if (!validarManzana(manzanaInput)) return;
        if (!validarSinCaracteresEspeciales(calleInput)) return;
        if (!validarSinCaracteresEspeciales(barrioInput)) return;
         // Validar que se haya seleccionado una fecha
     
        
        const formData = new FormData();
        overlay.classList.remove("hidden");
        // Agregar los demás campos al FormData
        formData.append("p_dep_codigo", document.getElementById("departamento").value); // Número
        formData.append("p_tpf_id", document.getElementById("tipificacion").value); // Número
        formData.append("p_hora", document.getElementById("hora").value.replace(":", "") || null); // String (o null)
        formData.append("p_fecha", document.getElementById("fecha_infraccion").value);
        formData.append("p_fecha", fechaFormateada); 
        formData.append("p_calle",document.getElementById("calle").value);
        formData.append("p_numero",document.getElementById("numero").value);
        formData.append("p_barrio",document.getElementById("barrio").value);
        formData.append("p_casa",document.getElementById("ca").value);
        formData.append("p_manzana",document.getElementById("mza").value);
        //formData.append("recaptcha_response", captchaResponse);
    
        // Si hay un archivo, primero lo subimos y luego enviamos solo el nombre del archivo a la base de datos
        const fotoInput = document.getElementById('foto');
        if (fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
    
            // Crear un objeto FormData para enviar el archivo (puedes ajustarlo según la ruta que te devuelva la API)
            const fileFormData = new FormData();
            fileFormData.append("file", file);  // Aquí envías el archivo completo
    
            // Enviar el archivo a la API para obtener el nombre del archivo
            const fileResponse = await fetch(appConfig.API_UPLOAD_FOTO, {
                method: "POST",
                body: fileFormData,
            });
    
            if (fileResponse.ok) {
                const fileData = await fileResponse.json(); // Respuesta de la API
                const filename = fileData.filename; // Obtener el nombre del archivo
                formData.append("p_foto", filename);  // Enviar solo el nombre del archivo a la base de datos
            } else {
                openModal("Error al subir el archivo", true, 4000, false, true);
                return;
            }
        }
    
        try {
            // Enviar el formulario con el nombre del archivo
            const response = await fetch(appConfig.API_POST_FORMULARIO, {   
                method: "POST",
                body: formData,
            });
            //for (let pair of formData.entries()) {
            //    console.log(`${pair[0]}: ${pair[1]}`);
            //}

    
            if (response.ok) {
                const result = await response.text(); 
                //console.log("Respuesta de la API:", result);
                //openModal("Gracias. Su denuncia ha sido registrada.");
                openModal("Gracias. Su denuncia ha sido registrada.", true, 4000, true, false);

                formulario.reset();
            } else {
                const error = await response.text();
                //console.error("Error en la respuesta:", error);
                openModal("Hubo un problema al enviar los datos. Verifica tu información.", true, 4000, false, true);
            }
        } catch (error) {
            //console.error("Error al enviar los datos:", error);
            openModal("Ocurrió un error inesperado al enviar el formulario.", true, 4000, false, true);
         } finally {
            // Oculta el overlay
            overlay.classList.add("hidden");
        }
    })
});