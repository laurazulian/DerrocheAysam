from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from smb.SMBConnection import SMBConnection
from io import BytesIO
import os
from pathlib import Path
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

# Cargar variables .env
load_dotenv()

# Configuración FastAPI
app = FastAPI()

# Configuración de CORS (opcional, si se necesita habilitar el acceso desde diferentes orígenes)
origins = ["*"]
methods = ["POST"]
headers = ["*"]

origins = ["http://127.0.0.1:5501"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5501"],
    allow_credentials=True,
    allow_methods=methods,
    allow_headers=headers,
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


@app.get("/config")
async def get_config():
    return JSONResponse(content={
        "API_GET_DEPARTAMENTOS": os.getenv("API_GET_DEPARTAMENTOS"),
        "API_GET_TIPIFICACIONES": os.getenv("API_GET_TIPIFICACIONES"),
        "API_POST_FORMULARIO": os.getenv("API_POST_FORMULARIO"),
        "API_UPLOAD_FOTO": os.getenv("API_UPLOAD_FOTO"),
        "RECAPTCHA_SITE_KEY": os.getenv("RECAPTCHA_SITE_KEY"),  # Incluyendo la clave de reCAPTCHA
        "RECAPTCHA_SECRET_KEY": os.getenv("RECAPTCHA_SECRET_KEY")
    })


@app.get("/")
async def get_index():
    site_key = os.getenv("RECAPTCHA_SITE_KEY")  # Leer desde .env
    if not site_key:
        raise HTTPException(status_code=500, detail="RECAPTCHA_SITE_KEY no configurado en .env")

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Denuncias derroche</title>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    </head>
    <body>
        <form id="formulario" enctype="multipart/form-data">
            <h1>DERROCHE DE AGUA POTABLE</h1>

            <!-- Aquí se asigna dinámicamente el site_key -->
            <div class="g-recaptcha" data-sitekey="{site_key}"></div>
            <button type="submit">Confirmar</button>
        </form>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


# Configuración de SMB
UPLOAD_FOLDER = Path("//10.10.0.239/Fotos")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

def connect_to_smb_server(server, username, password):
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
        conn = connect_to_smb_server(server, username, password)

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

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    
    # Extraer el nombre base del archivo y su extensión
    filename = os.path.basename(file.filename)
    base_name, extension = os.path.splitext(filename)

    # Obtener la fecha y hora actuales
    current_datetime = datetime.now().strftime("%d%m%Y%H%M")
    new_filename = f"{base_name}_{current_datetime}{extension}"

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

# Inicia el servidor FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
