from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse
from smb.SMBConnection import SMBConnection
from fastapi.responses import FileResponse
from typing import Dict, Union
import os
import smbclient
from pathlib import Path
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from io import BytesIO



# Configuración FastAPI
app = FastAPI()

# Cargar variables .env
load_dotenv()

# Configuración de CORS (opcional, si se necesita habilitar el acceso desde diferentes orígenes)
origins = ["*"]
methods = ["*"]
headers = ["*"]
credentials = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas las solicitudes de origen cruzado. Cámbialo a una lista específica de dominios en producción.
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, etc.).
    allow_headers=["*"],  # Permite todos los encabezados.
)
# Configuración SlowAPI
limiter = Limiter(key_func=get_remote_address)

# Aplica el middleware de SlowAPI
app.state.limiter = limiter

# Ruta con limitación de peticiones
@app.get("/limiter")
@limiter.limit("5/minute")  # Limitar a 5 peticiones por minuto
async def index(request: Request):
    return {"message": "Welcome to the index page!"}

@app.get("/formulario")
@limiter.limit("5/minute")  # Limitar a 5 peticiones por minuto
async def formulario(request: Request):
    return {"message": "Formulario recibido"}

# Manejo de error en caso de superar el límite
@app.exception_handler(429)
async def ratelimit_error(request, exc):
    return JSONResponse(
        status_code=429,
        content={"message": "Rate limit exceeded"}
    )


"""@app.get("/config")
async def get_config():
    return JSONResponse(content={
        "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS"),
        "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES"),
        "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO"),
        "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO"),
        "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY"),  # Incluyendo la clave de reCAPTCHA
        "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY")
    })"""

@app.get("/config")
async def get_config():
            environment = os.getenv("ENVIRONMENT", "PROD")  # Default to "prod" if not set
            
            if environment == "PROD":
                return JSONResponse(content={
                    "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS_PROD"),
                    "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES_PROD"),
                    "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO_PROD"),
                    "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO_PROD"),
                    "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY_PROD"),
                    "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY_PROD"),
                })
            else:
                return JSONResponse(content={
                    "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS_TEST"),
                    "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES_TEST"),
                    "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO_TEST"),
                    "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO_TEST"),
                    "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY_TEST"),
                    "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY_TEST"),
                })



# Configuración de SMB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}
# Configuración
server = "10.10.0.239"  # Dirección del servidor SMB
#share_name = "fotosTEST"    # Nombre del recurso compartido
#username = "derrochetest"   # Nombre de usuario
#password = "Q929IjRfMg6p"  # Contraseña
#read_username = "leederrochetest"
#read_password = "57LXz7q2g2BJ"

share_name = "fotosPROD"    # Nombre del recurso compartido
username = "derrocheprod"   # Nombre de usuario
password = "Q929IjRfMg6p"  # Contraseña
read_username = "p0fsWh253JJq"
read_password = "ycu776IjSt79"

class Config:
    # Leer el entorno (por defecto "TEST")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "PROD")
    
    # Configuración de SMB por entorno
    SMB_CONFIG = {
        "TEST": {
            "SMB_SERVER": os.getenv('SMB_SERVER'),
            "SHARE_NAME_ESCRITURA": os.getenv('SMB_SHARE_NAME_ESCRITURA_TEST'),
            "USERNAME_ESCRITURA": os.getenv('SMB_USERNAME_ESCRITURA_TEST'),
            "PASSWORD_ESCRITURA": os.getenv('SMB_PASSWORD_ESCRITURA_TEST'),
        },
        "PROD": {
            "SMB_SERVER": os.getenv('SMB_SERVER'),
            "SHARE_NAME_ESCRITURA": os.getenv('SMB_SHARE_NAME_ESCRITURA'),
            "USERNAME_ESCRITURA": os.getenv('SMB_USERNAME_ESCRITURA'),
            "PASSWORD_ESCRITURA": os.getenv('SMB_PASSWORD_ESCRITURA'),
        }
    }

def get_smb_config():
    # Obtener la configuración según el entorno
    environment = Config.ENVIRONMENT
    smb_config = Config.SMB_CONFIG.get(environment)
    
    if not smb_config:
        raise ValueError(f"Configuración SMB no encontrada para el entorno '{environment}'")
    
    # Verificar que todas las variables de entorno necesarias están presentes
    if not all(smb_config.values()):
        raise ValueError(f"Faltan variables de entorno necesarias para la configuración SMB en el entorno '{environment}'")
    
    return smb_config

#print("SMB_SERVER:", os.getenv('SMB_SERVER'))
#print("SMB_SHARE_NAME_ESCRITURA:", os.getenv('SMB_SHARE_NAME_ESCRITURA'))
#print("SMB_USERNAME_ESCRITURA:", os.getenv('SMB_USERNAME_ESCRITURA'))
#print("SMB_PASSWORD_ESCRITURA:", os.getenv('SMB_PASSWORD_ESCRITURA'))

def connect_to_smb_server_wr(server, username, password):
    """Configura la conexión SMB utilizando pysmb"""
    try:
        conn = SMBConnection(username, password, "client_machine", server, use_ntlm_v2=True)
        connected = conn.connect(server, 445)
        if not connected:
            raise HTTPException(status_code=500, detail="No se pudo conectar al servidor SMB")
        print("Conexión establecida al servidor SMB.")
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar con el servidor SMB: {e}")

def upload_to_smb(file_data, filename, server, share_name, username, password):
    conn = None
    try:
        # Conectar al servidor SMB
        conn = connect_to_smb_server_wr(server, username, password)

        # Transformar file_data en un objeto de flujo binario
        file_like = BytesIO(file_data)

        # Subir archivo al recurso compartido SMB
        conn.storeFile(share_name, filename, file_like)
        print(f"Archivo '{filename}' subido exitosamente al servidor SMB.")
    except Exception as e:
        if "C0000022" in str(e):
            raise HTTPException(status_code=403, detail="Permiso denegado para escribir en el recurso compartido SMB.")
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {e}")
    finally:
        if conn:
            conn.close()

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def connect_to_smb_server_rd(server, read_username, read_password):
    """Configura la conexión SMB utilizando pysmb"""
    try:
        conn = SMBConnection(read_username, read_password, "client_machine", server, use_ntlm_v2=True)
        connected = conn.connect(server, 445)
        if not connected:
            raise HTTPException(status_code=500, detail="No se pudo conectar al servidor SMB")
        print("Conexión establecida al servidor SMB.")
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar con el servidor SMB: {e}")
    
def read_from_smb(filename: str, server: str, share_name: str, username: str, password: str):
    """Lee un archivo desde el servidor SMB y lo retorna como un generador"""
    conn = None
    try:
        # Conectar al servidor SMB
        conn = connect_to_smb_server_rd(server, username, password)
        
        # Crear un objeto BytesIO para almacenar el contenido del archivo
        file_like = BytesIO()
        
        # Recuperar el archivo desde el recurso compartido SMB
        conn.retrieveFile(share_name, filename, file_like)
        
        # Asegurar que el puntero esté al principio del archivo
        file_like.seek(0)
        
        return file_like
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error al leer el archivo {filename}: {e}")
    finally:
        if conn:
            conn.close()



def get_file_from_smb(filename: str, server: str, share_name: str, username: str, password: str) -> Dict[str, Union[BytesIO, str]]:
    """
    Función para obtener un archivo desde el servidor SMB y la ruta del archivo.
    """
    conn = None
    try:
        # Conexión al servidor SMB
        conn = SMBConnection(username, password, "client_machine", server, use_ntlm_v2=True)
        connected = conn.connect(server, 445)
        if not connected:
            raise HTTPException(status_code=500, detail="No se pudo conectar al servidor SMB")
        
        # Definir el path lógico del archivo
        file_path = f"{share_name}/{filename}"

        # Recuperar el archivo como BytesIO
        file_like = BytesIO()
        conn.retrieveFile(share_name, filename, file_like)
        file_like.seek(0)  # Aseguramos que el puntero esté al inicio del archivo

        return {"file": file_like, "path": file_path}

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error al leer el archivo {filename}: {e}")

    finally:
        if conn:
            conn.close()


def allowed_file(filename: str) -> bool:
    """Verifica si el archivo tiene una extensión permitida"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    
    # Extraer el nombre base del archivo y su extensión
    filename = os.path.basename(file.filename)
    base_name, extension = os.path.splitext(filename)

    # Obtener la fecha y hora actuales
    current_datetime = datetime.now().strftime("%d%m%Y%H%M")
    new_filename = f"{current_datetime}_{base_name}{extension}"

    # Parámetros para la conexión SMB
    server = "10.10.0.239"  # Dirección del servidor SMB
    #share_name = "fotosTEST"    # Nombre del recurso compartido
    #username = "derrochetest"   # Nombre de usuario
    #password = "Q929IjRfMg6p"  # Contraseña
    share_name = "fotosPROD"    # Nombre del recurso compartido
    username = "derrocheprod"   # Nombre de usuario
    password = "p0fsWh253JJq"  # Contraseña

    try:
        # Leer el contenido del archivo
        file_data = await file.read()

        # Subir archivo al servidor SMB
        upload_to_smb(file_data, new_filename, server, share_name, username, password)

        return JSONResponse(content={
            "filename": new_filename,
            "message": "Archivo subido exitosamente"
        }, status_code=200)
    
    except Exception as e:
        error_message = f"{type(e).__name__}: {str(e)}"  # Captura el tipo de excepción y el mensaje
    raise HTTPException(status_code=500, detail=f"Error en el procesamiento del archivo: {error_message}")


@app.get("/file/{new_filename}")
async def get_file(new_filename: str):
    config = get_smb_config()
    if not config:
        raise HTTPException(status_code=500, detail="Configuración SMB no encontrada")
    """
    Endpoint para obtener la ruta del archivo en el servidor SMB y devolverla como JSON.
    """
    # Parámetros para la conexión SMB
    server = config.get('SMB_SERVER')       # Dirección del servidor SMB
    share_name = config.get('SMB_SHARE_NAME_ESCRITURA')         # Nombre del recurso compartido
    username = config.get('SMB_USERNAME_ESCRITURA')     # Nombre de usuario para la conexión SMB
    password = config.get('SMB_PASSWORD_ESCRITURA')         # Contraseña para la conexión SMB

    try:
        # Configurar smbclient con las credenciales
        smbclient.ClientConfig(username=username, password=password)

        # Ruta completa del archivo en el servidor SMB
        file_path = f"\\\\{server}\\{share_name}\\{new_filename}"

        # Verificar si el archivo existe usando smbclient
        if not smbclient.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Archivo no encontrado")

        # Retornar el JSON con la ruta del archivo
        return {"file_path": file_path}

    except HTTPException as e:
        # Relanzar errores HTTP definidos
        raise e
    except Exception as e:
        # Manejar errores inesperados
        raise HTTPException(status_code=500, detail=f"Error inesperado: {e}")



@app.get("/image/{filename}")
async def get_image_from_smb(filename: str):
    config = get_smb_config()
    if not config:
        raise HTTPException(status_code=500, detail="Configuración SMB no encontrada")
    """
    Endpoint para leer una imagen desde el servidor SMB y devolverla directamente.
    """
   # Parámetros para la conexión SMB
   # server = config.get('SMB_SERVER')       # Dirección del servidor SMB
   # share_name = config.get('SMB_SHARE_NAME_ESCRITURA')         # Nombre del recurso compartido
   # username = config.get('SMB_USERNAME_ESCRITURA')     # Nombre de usuario para la conexión SMB
   # password = config.get('SMB_PASSWORD_ESCRITURA')         # Contraseña para la conexión SMB

    server = "10.10.0.239"  # Dirección del servidor SMB
    #share_name = "fotosTEST"    # Nombre del recurso compartido
    #username = "derrochetest"   # Nombre de usuario
    #password = "Q929IjRfMg6p"  # Contraseña
    share_name = "fotosPROD"    # Nombre del recurso compartido
    username = "p0fsWh253JJq"
    password = "ycu776IjSt79"

    try:
        # Obtener el archivo desde el servidor SMB
        file_like = read_from_smb(filename, server, share_name, username, password)

        # Retornar la imagen directamente desde la memoria
        file_like.seek(0)  # Asegurar que el puntero esté al principio del archivo
        return StreamingResponse(file_like, headers={
            "Content-Disposition": f"inline; filename={filename}"  # Mostrar en el navegador
        })

    except HTTPException as e:
        # Relanzar errores HTTP definidos
        raise e
    except Exception as e:
        # Manejar errores inesperados
        raise HTTPException(status_code=500, detail=f"Error inesperado: {e}")
    
@app.get("/html/{filename}", response_class=HTMLResponse)
async def get_html_with_image(filename: str):
    config = get_smb_config()
    if not config:
        raise HTTPException(status_code=500, detail="Configuración SMB no encontrada")
    """
    Genera un HTML que incluye una imagen obtenida desde el servidor SMB.
    """
    server = config.get('SMB_SERVER')       # Dirección del servidor SMB
    share_name = config.get('SMB_SHARE_NAME_ESCRITURA')         # Nombre del recurso compartido
    username = config.get('SMB_USERNAME_ESCRITURA')     # Nombre de usuario para la conexión SMB
    password = config.get('SMB_PASSWORD_ESCRITURA')         # Contraseña para la conexión SMB

    try:
        # Obtener el archivo desde el servidor SMB
        file_like = read_from_smb(filename, server, share_name, username, password)

        # Codificar la imagen como un objeto BytesIO
        file_like.seek(0)  # Asegurar que el puntero esté al principio del archivo
        
        # Generar un HTML con la imagen incrustada
        html_content = f"""
        <html>
            <head>
                <title>Foto Derroche</title>
            </head>
            <body>
                <img src="http://127.0.0.1:8000/image/{filename}" alt="Imagen desde SMB" style="max-width: 100%; height: auto;" />
            </body>
        </html>
        """

        return HTMLResponse(content=html_content)

    except HTTPException as e:
        # Relanzar errores HTTP definidos
        raise e
    except Exception as e:
        # Manejar errores inesperados
        raise HTTPException(status_code=500, detail=f"Error al generar el HTML: {e}")


# Inicia el servidor FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)