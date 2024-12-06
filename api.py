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
            environment = os.getenv("ENVIRONMENT", "TEST")  # Default to "prod" if not set
            
            if environment == "PROD":
                return JSONResponse(content={
                    "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS_PROD"),
                    "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES_PROD"),
                    "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO_PROD"),
                    "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO_PROD"),
                    "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY_PROD"),
                    "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY_PROD")
                })
            else:
                return JSONResponse(content={
                    "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS_TEST"),
                    "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES_TEST"),
                    "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO_TEST"),
                    "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO_TEST"),
                    "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY_TEST"),
                    "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY_TEST")
                })



# Configuración de SMB
UPLOAD_FOLDER = Path("//10.10.0.239/fotos")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

# Configuración
server = "10.10.0.239"  # Dirección del servidor SMB
share_name = "fotos"    # Nombre del recurso compartido
username = "derroche"   # Nombre de usuario
password = "nKVHB4m1S3"  # Contraseña
read_username = "leederroche"
read_password = "56gybwbAy0Yg"


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
    share_name = "fotos"    # Nombre del recurso compartido
    username = "derroche"   # Nombre de usuario
    password = "nKVHB4m1S3"  # Contraseña

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
        raise HTTPException(status_code=500, detail=f"Error en el procesamiento del archivo: {e}")


@app.get("/file/{new_filename}")
async def get_file(new_filename: str):
    """
    Endpoint para obtener la ruta del archivo en el servidor SMB y devolverla como JSON.
    """
    server = "10.10.0.239"       # Dirección del servidor SMB
    share_name = "fotos"         # Nombre del recurso compartido
    username = "leederroche"     # Nombre de usuario para la conexión SMB
    password = "56gybwbAy0Yg"         # Contraseña para la conexión SMB

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
    """
    Endpoint para leer una imagen desde el servidor SMB y devolverla directamente.
    """
    server = "10.10.0.239"       # Dirección del servidor SMB
    share_name = "fotos"         # Nombre del recurso compartido
    username = "leederroche"     # Nombre de usuario para la conexión SMB
    password = "56gybwbAy0Yg"         # Contraseña para la conexión SMB

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


# Inicia el servidor FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)